"""Routes for job posting management in employer dashboard."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer
from datetime import datetime
from bson import ObjectId

# Database and auth imports
from app.core.database import get_database
from app.core.auth import get_current_user, require_company_access
from app.models.users.user_model import UserModel

# Schema imports
from app.schemas.employer import (
    JobPostingCreate,
    JobPostingUpdate,
    JobPostingResponse,
    JobPostingList,
    JobPostingFilters,
    JobApplicationResponse,
    ApplicationStatusUpdate,
    JobPipelineResponse,
    JobPipelineUpdate,
    JobAnalytics
)

# Model imports
from app.models.employer import (
    JobPosting,
    JobApplication,
    JobPipeline,
    JobStatus
)

router = APIRouter(prefix="/jobs", tags=["Job Postings"])
security = HTTPBearer()

@router.post("/", response_model=JobPostingResponse, status_code=status.HTTP_201_CREATED)
async def create_job_posting(
    job_data: JobPostingCreate,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a new job posting."""
    # Verify user has company access
    company_id = await require_company_access(current_user, db)
    
    # Create job posting
    job_posting = JobPosting(
        company_id=company_id,
        recruiter_id=current_user.id,
        **job_data.dict()
    )
    
    # Save to database
    result = await db.job_postings.insert_one(job_posting.dict())
    job_posting.id = str(result.inserted_id)
    
    # Track usage for billing
    await _track_job_posting_usage(company_id, db)
    
    return JobPostingResponse(**job_posting.dict())

@router.get("/", response_model=JobPostingList)
async def list_job_postings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    filters: JobPostingFilters = Depends(),
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """List job postings with filtering and pagination."""
    company_id = await require_company_access(current_user, db)
    
    # Build query
    query = {"company_id": company_id}
    
    # Apply filters
    if filters.status:
        query["status"] = {"$in": [s.value for s in filters.status]}
    if filters.job_type:
        query["job_type"] = {"$in": [jt.value for jt in filters.job_type]}
    if filters.experience_level:
        query["experience_level"] = {"$in": [el.value for el in filters.experience_level]}
    if filters.department:
        query["department"] = {"$in": filters.department}
    if filters.location:
        query["location"] = {"$regex": filters.location, "$options": "i"}
    if filters.remote_allowed is not None:
        query["remote_allowed"] = filters.remote_allowed
    if filters.salary_min is not None:
        query["salary_min"] = {"$gte": filters.salary_min}
    if filters.salary_max is not None:
        query["salary_max"] = {"$lte": filters.salary_max}
    if filters.created_after:
        query["created_at"] = {"$gte": filters.created_after}
    if filters.created_before:
        query.setdefault("created_at", {})["$lte"] = filters.created_before
    if filters.priority_min:
        query["priority"] = {"$gte": filters.priority_min}
    if filters.search_query:
        query["$text"] = {"$search": filters.search_query}
    
    # Get total count
    total_count = await db.job_postings.count_documents(query)
    
    # Get paginated results
    skip = (page - 1) * page_size
    cursor = db.job_postings.find(query).sort("created_at", -1).skip(skip).limit(page_size)
    jobs = await cursor.to_list(length=page_size)
    
    # Convert to response models
    job_responses = [JobPostingResponse(**job) for job in jobs]
    
    return JobPostingList(
        jobs=job_responses,
        total_count=total_count,
        page=page,
        page_size=page_size,
        has_next=(skip + page_size) < total_count,
        has_previous=page > 1
    )

@router.get("/{job_id}", response_model=JobPostingResponse)
async def get_job_posting(
    job_id: str,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get a specific job posting."""
    company_id = await require_company_access(current_user, db)
    
    job = await db.job_postings.find_one({
        "id": job_id,
        "company_id": company_id
    })
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )
    
    return JobPostingResponse(**job)

@router.put("/{job_id}", response_model=JobPostingResponse)
async def update_job_posting(
    job_id: str,
    job_update: JobPostingUpdate,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update a job posting."""
    company_id = await require_company_access(current_user, db)
    
    # Check if job exists
    existing_job = await db.job_postings.find_one({
        "id": job_id,
        "company_id": company_id
    })
    
    if not existing_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )
    
    # Prepare update data
    update_data = job_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    # Handle status changes
    if "status" in update_data:
        if update_data["status"] == JobStatus.ACTIVE and not existing_job.get("published_at"):
            update_data["published_at"] = datetime.utcnow()
        elif update_data["status"] in [JobStatus.CLOSED, JobStatus.FILLED]:
            update_data["closed_at"] = datetime.utcnow()
    
    # Update in database
    await db.job_postings.update_one(
        {"id": job_id, "company_id": company_id},
        {"$set": update_data}
    )
    
    # Get updated job
    updated_job = await db.job_postings.find_one({
        "id": job_id,
        "company_id": company_id
    })
    
    return JobPostingResponse(**updated_job)

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job_posting(
    job_id: str,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Delete a job posting."""
    company_id = await require_company_access(current_user, db)
    
    result = await db.job_postings.delete_one({
        "id": job_id,
        "company_id": company_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )

@router.get("/{job_id}/applications", response_model=List[JobApplicationResponse])
async def get_job_applications(
    job_id: str,
    status_filter: Optional[str] = Query(None),
    stage_filter: Optional[str] = Query(None),
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get applications for a specific job."""
    company_id = await require_company_access(current_user, db)
    
    # Verify job exists and belongs to company
    job = await db.job_postings.find_one({
        "id": job_id,
        "company_id": company_id
    })
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )
    
    # Build query for applications
    query = {"job_id": job_id, "company_id": company_id}
    
    if status_filter:
        query["status"] = status_filter
    if stage_filter:
        query["stage"] = stage_filter
    
    # Get applications
    applications = await db.job_applications.find(query).sort("submitted_at", -1).to_list(length=None)
    
    return [JobApplicationResponse(**app) for app in applications]

@router.put("/{job_id}/applications/{application_id}", response_model=JobApplicationResponse)
async def update_application_status(
    job_id: str,
    application_id: str,
    status_update: ApplicationStatusUpdate,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update application status and stage."""
    company_id = await require_company_access(current_user, db)
    
    # Verify application exists
    application = await db.job_applications.find_one({
        "id": application_id,
        "job_id": job_id,
        "company_id": company_id
    })
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Update application
    update_data = status_update.dict(exclude_unset=True)
    update_data["last_updated"] = datetime.utcnow()
    
    if "status" in update_data and update_data["status"] != application.get("status"):
        update_data["reviewed_at"] = datetime.utcnow()
    
    await db.job_applications.update_one(
        {"id": application_id},
        {"$set": update_data}
    )
    
    # Get updated application
    updated_application = await db.job_applications.find_one({"id": application_id})
    
    return JobApplicationResponse(**updated_application)

@router.get("/{job_id}/analytics", response_model=JobAnalytics)
async def get_job_analytics(
    job_id: str,
    period_days: int = Query(30, ge=1, le=365),
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get analytics for a specific job posting."""
    company_id = await require_company_access(current_user, db)
    
    # Verify job exists
    job = await db.job_postings.find_one({
        "id": job_id,
        "company_id": company_id
    })
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )
    
    # Calculate period
    period_end = datetime.utcnow()
    period_start = period_end - timedelta(days=period_days)
    
    # Get analytics data
    analytics = await _calculate_job_analytics(job_id, period_start, period_end, db)
    
    return JobAnalytics(
        job_id=job_id,
        period_start=period_start,
        period_end=period_end,
        **analytics
    )

# Helper functions
async def _track_job_posting_usage(company_id: str, db):
    """Track job posting usage for billing."""
    from app.models.employer import UsageRecord
    
    # Get current billing period
    current_period = datetime.utcnow().strftime("%Y-%m")
    
    # Create usage record
    usage_record = UsageRecord(
        company_id=company_id,
        resource_type="job_posting",
        quantity=1,
        unit_cost=49.0,  # Default per-job cost
        billing_period=current_period
    )
    
    await db.usage_records.insert_one(usage_record.dict())
    
    # Update company billing usage count
    await db.company_billing.update_one(
        {"company_id": company_id},
        {"$inc": {"job_postings_used": 1}}
    )

async def _calculate_job_analytics(job_id: str, period_start: datetime, period_end: datetime, db):
    """Calculate analytics for a job posting."""
    from datetime import timedelta
    
    # Get applications in period
    applications = await db.job_applications.find({
        "job_id": job_id,
        "submitted_at": {"$gte": period_start, "$lte": period_end}
    }).to_list(length=None)
    
    # Get job views (if tracked)
    job_views = await db.job_views.count_documents({
        "job_id": job_id,
        "viewed_at": {"$gte": period_start, "$lte": period_end}
    })
    
    # Calculate metrics
    applications_count = len(applications)
    interviews_count = len([app for app in applications if app.get("stage") in ["interview", "offer", "hired"]])
    offers_count = len([app for app in applications if app.get("stage") in ["offer", "hired"]])
    hires_count = len([app for app in applications if app.get("status") == "hired"])
    
    # Calculate conversion rates
    view_to_application_rate = (applications_count / job_views) if job_views > 0 else 0
    application_to_interview_rate = (interviews_count / applications_count) if applications_count > 0 else 0
    interview_to_offer_rate = (offers_count / interviews_count) if interviews_count > 0 else 0
    offer_to_hire_rate = (hires_count / offers_count) if offers_count > 0 else 0
    
    # Calculate time metrics
    avg_time_to_first_application = None
    if applications:
        job = await db.job_postings.find_one({"id": job_id})
        if job and job.get("published_at"):
            first_app_time = min(app["submitted_at"] for app in applications)
            time_diff = first_app_time - job["published_at"]
            avg_time_to_first_application = time_diff.total_seconds() / 3600  # in hours
    
    # Calculate average match score
    match_scores = [app.get("ai_match_score") for app in applications if app.get("ai_match_score")]
    avg_candidate_match_score = sum(match_scores) / len(match_scores) if match_scores else None
    
    return {
        "views_count": job_views,
        "applications_count": applications_count,
        "matches_generated": applications_count,  # Simplified
        "interviews_scheduled": interviews_count,
        "offers_sent": offers_count,
        "hires_made": hires_count,
        "view_to_application_rate": view_to_application_rate,
        "application_to_interview_rate": application_to_interview_rate,
        "interview_to_offer_rate": interview_to_offer_rate,
        "offer_to_hire_rate": offer_to_hire_rate,
        "avg_time_to_first_application": avg_time_to_first_application,
        "avg_time_to_hire": None,  # TODO: Calculate based on hired applications
        "avg_candidate_match_score": avg_candidate_match_score,
        "top_candidate_sources": []  # TODO: Implement source tracking
    }
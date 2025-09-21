"""Routes for employer dashboard overview and metrics."""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer
from datetime import datetime, timedelta
from bson import ObjectId

# Database and auth imports
from app.core.database import get_database
from app.core.auth import get_current_user, require_company_access
from app.models.users.user_model import UserModel

# Schema imports
from pydantic import BaseModel, Field

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
security = HTTPBearer()

class DashboardOverview(BaseModel):
    """Dashboard overview metrics."""
    # Job posting metrics
    active_jobs: int
    total_jobs: int
    jobs_this_month: int
    
    # Application metrics
    total_applications: int
    new_applications: int
    applications_this_week: int
    
    # Pipeline metrics
    candidates_in_pipeline: int
    interviews_scheduled: int
    offers_pending: int
    
    # Hiring metrics
    hires_this_month: int
    total_hires: int
    avg_time_to_hire: Optional[float]  # in days
    
    # Performance metrics
    avg_match_score: Optional[float]
    top_performing_jobs: List[Dict[str, Any]]
    
    # Financial metrics
    current_plan: str
    usage_percentage: float
    next_billing_date: Optional[datetime]
    
    # Recent activity
    recent_applications: List[Dict[str, Any]]
    recent_matches: List[Dict[str, Any]]
    
    # Generated timestamp
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class TeamMember(BaseModel):
    """Team member information."""
    id: str
    name: str
    email: str
    role: str
    department: Optional[str]
    active_jobs: int
    total_applications: int
    last_active: Optional[datetime]
    joined_at: datetime

class CompanyProfile(BaseModel):
    """Company profile information."""
    id: str
    name: str
    description: Optional[str]
    industry: Optional[str]
    size: Optional[str]
    location: Optional[str]
    website: Optional[str]
    logo_url: Optional[str]
    
    # Team information
    team_size: int
    departments: List[str]
    
    # Hiring information
    total_jobs_posted: int
    total_hires: int
    avg_time_to_hire: Optional[float]
    
    # Settings
    timezone: str
    currency: str
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class ActivityFeed(BaseModel):
    """Activity feed item."""
    id: str
    type: str  # "application", "match", "interview", "offer", "hire"
    title: str
    description: str
    job_id: Optional[str]
    candidate_id: Optional[str]
    user_id: Optional[str]
    timestamp: datetime
    metadata: Dict[str, Any] = {}

@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(
    period_days: int = Query(30, ge=1, le=365),
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get dashboard overview with key metrics."""
    company_id = await require_company_access(current_user, db)
    
    # Calculate time periods
    now = datetime.utcnow()
    period_start = now - timedelta(days=period_days)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=now.weekday())
    
    # Job posting metrics
    active_jobs = await db.job_postings.count_documents({
        "company_id": company_id,
        "status": "active"
    })
    
    total_jobs = await db.job_postings.count_documents({
        "company_id": company_id
    })
    
    jobs_this_month = await db.job_postings.count_documents({
        "company_id": company_id,
        "created_at": {"$gte": month_start}
    })
    
    # Application metrics
    total_applications = await db.job_applications.count_documents({
        "company_id": company_id
    })
    
    new_applications = await db.job_applications.count_documents({
        "company_id": company_id,
        "status": "submitted"
    })
    
    applications_this_week = await db.job_applications.count_documents({
        "company_id": company_id,
        "submitted_at": {"$gte": week_start}
    })
    
    # Pipeline metrics
    candidates_in_pipeline = await db.job_applications.count_documents({
        "company_id": company_id,
        "status": {"$in": ["reviewed", "shortlisted"]}
    })
    
    interviews_scheduled = await db.job_applications.count_documents({
        "company_id": company_id,
        "stage": "interview"
    })
    
    offers_pending = await db.job_offers.count_documents({
        "company_id": company_id,
        "status": {"$in": ["sent", "viewed"]}
    })
    
    # Hiring metrics
    hires_this_month = await db.job_applications.count_documents({
        "company_id": company_id,
        "status": "hired",
        "last_updated": {"$gte": month_start}
    })
    
    total_hires = await db.job_applications.count_documents({
        "company_id": company_id,
        "status": "hired"
    })
    
    # Calculate average time to hire
    avg_time_to_hire = await _calculate_avg_time_to_hire(company_id, db)
    
    # Performance metrics
    avg_match_score = await _calculate_avg_match_score(company_id, period_start, db)
    top_performing_jobs = await _get_top_performing_jobs(company_id, period_start, db)
    
    # Financial metrics
    billing_info = await db.company_billing.find_one({"company_id": company_id})
    current_plan = billing_info.get("plan", "starter") if billing_info else "starter"
    usage_percentage = await _calculate_usage_percentage(company_id, db)
    next_billing_date = billing_info.get("next_billing_date") if billing_info else None
    
    # Recent activity
    recent_applications = await _get_recent_applications(company_id, db)
    recent_matches = await _get_recent_matches(company_id, db)
    
    return DashboardOverview(
        active_jobs=active_jobs,
        total_jobs=total_jobs,
        jobs_this_month=jobs_this_month,
        total_applications=total_applications,
        new_applications=new_applications,
        applications_this_week=applications_this_week,
        candidates_in_pipeline=candidates_in_pipeline,
        interviews_scheduled=interviews_scheduled,
        offers_pending=offers_pending,
        hires_this_month=hires_this_month,
        total_hires=total_hires,
        avg_time_to_hire=avg_time_to_hire,
        avg_match_score=avg_match_score,
        top_performing_jobs=top_performing_jobs,
        current_plan=current_plan,
        usage_percentage=usage_percentage,
        next_billing_date=next_billing_date,
        recent_applications=recent_applications,
        recent_matches=recent_matches
    )

@router.get("/team", response_model=List[TeamMember])
async def get_team_members(
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get team members for the company."""
    company_id = await require_company_access(current_user, db)
    
    # Get all users associated with the company
    team_members = await db.users.find({
        "company_id": company_id,
        "role": {"$in": ["recruiter", "hiring_manager", "admin"]}
    }).to_list(length=None)
    
    result = []
    for member in team_members:
        # Get member's job posting count
        active_jobs = await db.job_postings.count_documents({
            "recruiter_id": member["id"],
            "status": "active"
        })
        
        # Get member's application count
        total_applications = await db.job_applications.count_documents({
            "company_id": company_id,
            "job_id": {"$in": await _get_user_job_ids(member["id"], db)}
        })
        
        result.append(TeamMember(
            id=member["id"],
            name=member.get("full_name", member.get("email", "Unknown")),
            email=member["email"],
            role=member.get("role", "recruiter"),
            department=member.get("department"),
            active_jobs=active_jobs,
            total_applications=total_applications,
            last_active=member.get("last_active"),
            joined_at=member.get("created_at", datetime.utcnow())
        ))
    
    return result

@router.get("/profile", response_model=CompanyProfile)
async def get_company_profile(
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get company profile information."""
    company_id = await require_company_access(current_user, db)
    
    # Get company information
    company = await db.companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Get team size
    team_size = await db.users.count_documents({
        "company_id": company_id,
        "role": {"$in": ["recruiter", "hiring_manager", "admin"]}
    })
    
    # Get departments
    departments_cursor = db.job_postings.distinct("department", {"company_id": company_id})
    departments = [dept for dept in await departments_cursor if dept]
    
    # Get hiring metrics
    total_jobs_posted = await db.job_postings.count_documents({"company_id": company_id})
    total_hires = await db.job_applications.count_documents({
        "company_id": company_id,
        "status": "hired"
    })
    avg_time_to_hire = await _calculate_avg_time_to_hire(company_id, db)
    
    return CompanyProfile(
        id=company["id"],
        name=company.get("name", "Unknown Company"),
        description=company.get("description"),
        industry=company.get("industry"),
        size=company.get("size"),
        location=company.get("location"),
        website=company.get("website"),
        logo_url=company.get("logo_url"),
        team_size=team_size,
        departments=departments,
        total_jobs_posted=total_jobs_posted,
        total_hires=total_hires,
        avg_time_to_hire=avg_time_to_hire,
        timezone=company.get("timezone", "UTC"),
        currency=company.get("currency", "USD"),
        created_at=company.get("created_at", datetime.utcnow()),
        updated_at=company.get("updated_at", datetime.utcnow())
    )

@router.get("/activity", response_model=List[ActivityFeed])
async def get_activity_feed(
    limit: int = Query(20, ge=1, le=100),
    activity_type: Optional[str] = Query(None),
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get recent activity feed for the company."""
    company_id = await require_company_access(current_user, db)
    
    # Build activity feed from various sources
    activities = []
    
    # Recent applications
    recent_apps = await db.job_applications.find({
        "company_id": company_id
    }).sort("submitted_at", -1).limit(limit // 2).to_list(length=None)
    
    for app in recent_apps:
        job = await db.job_postings.find_one({"id": app["job_id"]})
        candidate = await db.users.find_one({"id": app["candidate_id"]})
        
        activities.append(ActivityFeed(
            id=f"app_{app['id']}",
            type="application",
            title="New Application",
            description=f"{candidate.get('full_name', 'Candidate')} applied to {job.get('title', 'Job')}",
            job_id=app["job_id"],
            candidate_id=app["candidate_id"],
            timestamp=app["submitted_at"],
            metadata={"status": app.get("status")}
        ))
    
    # Recent offers
    recent_offers = await db.job_offers.find({
        "company_id": company_id
    }).sort("created_at", -1).limit(limit // 4).to_list(length=None)
    
    for offer in recent_offers:
        job = await db.job_postings.find_one({"id": offer["job_id"]})
        candidate = await db.users.find_one({"id": offer["candidate_id"]})
        
        activities.append(ActivityFeed(
            id=f"offer_{offer['id']}",
            type="offer",
            title="Offer Sent",
            description=f"Offer sent to {candidate.get('full_name', 'Candidate')} for {job.get('title', 'Job')}",
            job_id=offer["job_id"],
            candidate_id=offer["candidate_id"],
            timestamp=offer["created_at"],
            metadata={"status": offer.get("status"), "amount": offer.get("base_salary")}
        ))
    
    # Sort all activities by timestamp
    activities.sort(key=lambda x: x.timestamp, reverse=True)
    
    # Filter by type if specified
    if activity_type:
        activities = [a for a in activities if a.type == activity_type]
    
    return activities[:limit]

# Helper functions
async def _calculate_avg_time_to_hire(company_id: str, db) -> Optional[float]:
    """Calculate average time to hire in days."""
    pipeline = [
        {"$match": {"company_id": company_id, "status": "hired"}},
        {"$lookup": {
            "from": "job_postings",
            "localField": "job_id",
            "foreignField": "id",
            "as": "job"
        }},
        {"$unwind": "$job"},
        {"$project": {
            "time_to_hire": {
                "$divide": [
                    {"$subtract": ["$last_updated", "$job.published_at"]},
                    86400000  # Convert to days
                ]
            }
        }},
        {"$group": {
            "_id": None,
            "avg_time": {"$avg": "$time_to_hire"}
        }}
    ]
    
    result = await db.job_applications.aggregate(pipeline).to_list(length=1)
    return result[0]["avg_time"] if result else None

async def _calculate_avg_match_score(company_id: str, period_start: datetime, db) -> Optional[float]:
    """Calculate average match score for recent applications."""
    pipeline = [
        {
            "$match": {
                "company_id": company_id,
                "submitted_at": {"$gte": period_start},
                "ai_match_score": {"$exists": True, "$ne": None}
            }
        },
        {
            "$group": {
                "_id": None,
                "avg_score": {"$avg": "$ai_match_score"}
            }
        }
    ]
    
    result = await db.job_applications.aggregate(pipeline).to_list(length=1)
    return result[0]["avg_score"] if result else None

async def _get_top_performing_jobs(company_id: str, period_start: datetime, db) -> List[Dict[str, Any]]:
    """Get top performing jobs by application count."""
    pipeline = [
        {
            "$match": {
                "company_id": company_id,
                "submitted_at": {"$gte": period_start}
            }
        },
        {
            "$group": {
                "_id": "$job_id",
                "application_count": {"$sum": 1},
                "avg_match_score": {"$avg": "$ai_match_score"}
            }
        },
        {"$sort": {"application_count": -1}},
        {"$limit": 5}
    ]
    
    results = await db.job_applications.aggregate(pipeline).to_list(length=5)
    
    # Enrich with job details
    top_jobs = []
    for result in results:
        job = await db.job_postings.find_one({"id": result["_id"]})
        if job:
            top_jobs.append({
                "job_id": result["_id"],
                "title": job.get("title"),
                "application_count": result["application_count"],
                "avg_match_score": result.get("avg_match_score")
            })
    
    return top_jobs

async def _calculate_usage_percentage(company_id: str, db) -> float:
    """Calculate current usage percentage of plan limits."""
    billing = await db.company_billing.find_one({"company_id": company_id})
    if not billing:
        return 0.0
    
    job_usage = (billing.get("job_postings_used", 0) / billing.get("job_postings_limit", 1)) * 100
    view_usage = (billing.get("candidate_views_used", 0) / billing.get("candidate_views_limit", 1)) * 100
    
    return max(job_usage, view_usage)

async def _get_recent_applications(company_id: str, db) -> List[Dict[str, Any]]:
    """Get recent applications with basic details."""
    applications = await db.job_applications.find({
        "company_id": company_id
    }).sort("submitted_at", -1).limit(5).to_list(length=5)
    
    result = []
    for app in applications:
        job = await db.job_postings.find_one({"id": app["job_id"]})
        candidate = await db.users.find_one({"id": app["candidate_id"]})
        
        result.append({
            "id": app["id"],
            "job_title": job.get("title") if job else "Unknown Job",
            "candidate_name": candidate.get("full_name") if candidate else "Unknown Candidate",
            "status": app.get("status"),
            "match_score": app.get("ai_match_score"),
            "submitted_at": app["submitted_at"]
        })
    
    return result

async def _get_recent_matches(company_id: str, db) -> List[Dict[str, Any]]:
    """Get recent AI matches."""
    # This would integrate with the matching system
    # For now, return recent high-scoring applications
    matches = await db.job_applications.find({
        "company_id": company_id,
        "ai_match_score": {"$gte": 0.8}
    }).sort("submitted_at", -1).limit(5).to_list(length=5)
    
    result = []
    for match in matches:
        job = await db.job_postings.find_one({"id": match["job_id"]})
        candidate = await db.users.find_one({"id": match["candidate_id"]})
        
        result.append({
            "id": match["id"],
            "job_title": job.get("title") if job else "Unknown Job",
            "candidate_name": candidate.get("full_name") if candidate else "Unknown Candidate",
            "match_score": match.get("ai_match_score"),
            "matched_at": match["submitted_at"]
        })
    
    return result

async def _get_user_job_ids(user_id: str, db) -> List[str]:
    """Get job IDs created by a specific user."""
    jobs = await db.job_postings.find(
        {"recruiter_id": user_id},
        {"id": 1}
    ).to_list(length=None)
    
    return [job["id"] for job in jobs]
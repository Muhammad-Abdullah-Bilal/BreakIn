"""Routes for reports and data exports."""
from typing import List, Optional, Dict, Any, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from fastapi.security import HTTPBearer
from datetime import datetime, timedelta
from bson import ObjectId
import csv
import io
from enum import Enum

# Database and auth imports
from app.core.database import get_database
from app.core.auth import get_current_user, require_company_access
from app.models.users.user_model import UserModel

# Pydantic models
from pydantic import BaseModel, Field

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])
security = HTTPBearer()

class ReportType(str, Enum):
    HIRING_FUNNEL = "hiring_funnel"
    CANDIDATE_PIPELINE = "candidate_pipeline"
    JOB_PERFORMANCE = "job_performance"
    RECRUITER_ACTIVITY = "recruiter_activity"
    DIVERSITY_METRICS = "diversity_metrics"
    TIME_TO_HIRE = "time_to_hire"
    COST_PER_HIRE = "cost_per_hire"
    SOURCE_EFFECTIVENESS = "source_effectiveness"

class ExportFormat(str, Enum):
    CSV = "csv"
    PDF = "pdf"
    EXCEL = "excel"
    JSON = "json"

class DateRange(BaseModel):
    """Date range for reports."""
    start_date: datetime
    end_date: datetime

class ReportFilters(BaseModel):
    """Common filters for reports."""
    date_range: DateRange
    job_ids: List[str] = []
    recruiter_ids: List[str] = []
    departments: List[str] = []
    locations: List[str] = []
    job_status: List[str] = []
    candidate_sources: List[str] = []

class HiringFunnelReport(BaseModel):
    """Hiring funnel analytics report."""
    total_applications: int
    applications_reviewed: int
    candidates_screened: int
    interviews_conducted: int
    offers_made: int
    offers_accepted: int
    hires_completed: int
    
    # Conversion rates
    review_rate: float
    screen_rate: float
    interview_rate: float
    offer_rate: float
    acceptance_rate: float
    hire_rate: float
    
    # Time metrics
    avg_time_to_review: Optional[float]  # days
    avg_time_to_screen: Optional[float]
    avg_time_to_interview: Optional[float]
    avg_time_to_offer: Optional[float]
    avg_time_to_hire: Optional[float]
    
    # Breakdown by job/department
    job_breakdown: List[Dict[str, Any]] = []
    department_breakdown: List[Dict[str, Any]] = []
    
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class JobPerformanceReport(BaseModel):
    """Job posting performance report."""
    job_id: str
    job_title: str
    department: Optional[str]
    posted_date: datetime
    status: str
    
    # Application metrics
    total_applications: int
    qualified_applications: int
    application_rate_per_day: float
    
    # Quality metrics
    avg_match_score: Optional[float]
    top_candidate_score: Optional[float]
    
    # Pipeline metrics
    candidates_in_review: int
    candidates_in_interview: int
    offers_pending: int
    
    # Outcome metrics
    hires_made: int
    time_to_first_hire: Optional[float]
    cost_per_application: Optional[float]
    
    # Top skills and sources
    top_skills: List[Dict[str, Any]] = []
    top_sources: List[Dict[str, Any]] = []
    
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class RecruiterActivityReport(BaseModel):
    """Recruiter activity and performance report."""
    recruiter_id: str
    recruiter_name: str
    
    # Activity metrics
    jobs_managed: int
    applications_reviewed: int
    interviews_conducted: int
    offers_sent: int
    
    # Performance metrics
    hires_made: int
    avg_time_to_hire: Optional[float]
    hire_success_rate: float
    
    # Efficiency metrics
    applications_per_day: float
    interviews_per_week: float
    response_time_hours: Optional[float]
    
    # Job breakdown
    active_jobs: List[Dict[str, Any]] = []
    completed_jobs: List[Dict[str, Any]] = []
    
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class DiversityMetricsReport(BaseModel):
    """Diversity and inclusion metrics report."""
    # Application diversity
    total_applications: int
    diversity_breakdown: Dict[str, Dict[str, int]] = {}
    
    # Hiring diversity
    total_hires: int
    hire_diversity_breakdown: Dict[str, Dict[str, int]] = {}
    
    # Pipeline diversity
    pipeline_diversity: Dict[str, Dict[str, int]] = {}
    
    # Diversity ratios
    application_to_hire_ratios: Dict[str, float] = {}
    
    # Trends over time
    monthly_trends: List[Dict[str, Any]] = []
    
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class ExportRequest(BaseModel):
    """Request for data export."""
    report_type: ReportType
    format: ExportFormat
    filters: ReportFilters
    include_raw_data: bool = False
    email_delivery: bool = False
    recipient_emails: List[str] = []

@router.get("/hiring-funnel", response_model=HiringFunnelReport)
async def get_hiring_funnel_report(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    job_ids: List[str] = Query([]),
    departments: List[str] = Query([]),
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Generate hiring funnel analytics report."""
    company_id = await require_company_access(current_user, db)
    
    # Build base query
    base_query = {
        "company_id": company_id,
        "submitted_at": {"$gte": start_date, "$lte": end_date}
    }
    
    # Add filters
    if job_ids:
        base_query["job_id"] = {"$in": job_ids}
    
    if departments:
        # Get jobs in specified departments
        dept_jobs = await db.job_postings.find(
            {"company_id": company_id, "department": {"$in": departments}},
            {"id": 1}
        ).to_list(length=None)
        dept_job_ids = [job["id"] for job in dept_jobs]
        
        if "job_id" in base_query:
            # Intersect with existing job filter
            base_query["job_id"]["$in"] = list(set(base_query["job_id"]["$in"]) & set(dept_job_ids))
        else:
            base_query["job_id"] = {"$in": dept_job_ids}
    
    # Calculate funnel metrics
    total_applications = await db.job_applications.count_documents(base_query)
    
    applications_reviewed = await db.job_applications.count_documents({
        **base_query,
        "status": {"$ne": "submitted"}
    })
    
    candidates_screened = await db.job_applications.count_documents({
        **base_query,
        "stage": {"$in": ["phone_screen", "technical_screen", "interview"]}
    })
    
    interviews_conducted = await db.job_applications.count_documents({
        **base_query,
        "stage": {"$in": ["interview", "final_interview"]}
    })
    
    # Get offers data
    offers_made = await db.job_offers.count_documents({
        "company_id": company_id,
        "created_at": {"$gte": start_date, "$lte": end_date}
    })
    
    offers_accepted = await db.job_offers.count_documents({
        "company_id": company_id,
        "created_at": {"$gte": start_date, "$lte": end_date},
        "status": "accepted"
    })
    
    hires_completed = await db.job_applications.count_documents({
        **base_query,
        "status": "hired"
    })
    
    # Calculate conversion rates
    review_rate = (applications_reviewed / total_applications * 100) if total_applications > 0 else 0
    screen_rate = (candidates_screened / applications_reviewed * 100) if applications_reviewed > 0 else 0
    interview_rate = (interviews_conducted / candidates_screened * 100) if candidates_screened > 0 else 0
    offer_rate = (offers_made / interviews_conducted * 100) if interviews_conducted > 0 else 0
    acceptance_rate = (offers_accepted / offers_made * 100) if offers_made > 0 else 0
    hire_rate = (hires_completed / total_applications * 100) if total_applications > 0 else 0
    
    # Calculate time metrics
    time_metrics = await _calculate_time_metrics(base_query, db)
    
    # Get breakdown by job and department
    job_breakdown = await _get_job_breakdown(base_query, db)
    department_breakdown = await _get_department_breakdown(company_id, start_date, end_date, db)
    
    return HiringFunnelReport(
        total_applications=total_applications,
        applications_reviewed=applications_reviewed,
        candidates_screened=candidates_screened,
        interviews_conducted=interviews_conducted,
        offers_made=offers_made,
        offers_accepted=offers_accepted,
        hires_completed=hires_completed,
        review_rate=review_rate,
        screen_rate=screen_rate,
        interview_rate=interview_rate,
        offer_rate=offer_rate,
        acceptance_rate=acceptance_rate,
        hire_rate=hire_rate,
        avg_time_to_review=time_metrics.get("avg_time_to_review"),
        avg_time_to_screen=time_metrics.get("avg_time_to_screen"),
        avg_time_to_interview=time_metrics.get("avg_time_to_interview"),
        avg_time_to_offer=time_metrics.get("avg_time_to_offer"),
        avg_time_to_hire=time_metrics.get("avg_time_to_hire"),
        job_breakdown=job_breakdown,
        department_breakdown=department_breakdown
    )

@router.get("/job-performance", response_model=List[JobPerformanceReport])
async def get_job_performance_report(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    job_ids: List[str] = Query([]),
    limit: int = Query(50, ge=1, le=200),
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Generate job performance report."""
    company_id = await require_company_access(current_user, db)
    
    # Get jobs to analyze
    job_query = {
        "company_id": company_id,
        "published_at": {"$gte": start_date, "$lte": end_date}
    }
    
    if job_ids:
        job_query["id"] = {"$in": job_ids}
    
    jobs = await db.job_postings.find(job_query).limit(limit).to_list(length=limit)
    
    reports = []
    for job in jobs:
        # Get application metrics
        app_query = {"job_id": job["id"]}
        total_applications = await db.job_applications.count_documents(app_query)
        qualified_applications = await db.job_applications.count_documents({
            **app_query,
            "ai_match_score": {"$gte": 0.7}
        })
        
        # Calculate application rate
        days_active = (datetime.utcnow() - job["published_at"]).days or 1
        application_rate_per_day = total_applications / days_active
        
        # Get match scores
        match_scores = await db.job_applications.find(
            {**app_query, "ai_match_score": {"$exists": True}},
            {"ai_match_score": 1}
        ).to_list(length=None)
        
        avg_match_score = None
        top_candidate_score = None
        if match_scores:
            scores = [app["ai_match_score"] for app in match_scores]
            avg_match_score = sum(scores) / len(scores)
            top_candidate_score = max(scores)
        
        # Get pipeline metrics
        candidates_in_review = await db.job_applications.count_documents({
            **app_query,
            "status": "reviewed"
        })
        
        candidates_in_interview = await db.job_applications.count_documents({
            **app_query,
            "stage": {"$in": ["interview", "final_interview"]}
        })
        
        offers_pending = await db.job_offers.count_documents({
            "job_id": job["id"],
            "status": {"$in": ["sent", "viewed"]}
        })
        
        # Get outcome metrics
        hires_made = await db.job_applications.count_documents({
            **app_query,
            "status": "hired"
        })
        
        # Calculate time to first hire
        first_hire = await db.job_applications.find_one(
            {**app_query, "status": "hired"},
            sort=[("last_updated", 1)]
        )
        
        time_to_first_hire = None
        if first_hire:
            time_to_first_hire = (first_hire["last_updated"] - job["published_at"]).days
        
        # Get top skills and sources
        top_skills = await _get_top_skills_for_job(job["id"], db)
        top_sources = await _get_top_sources_for_job(job["id"], db)
        
        reports.append(JobPerformanceReport(
            job_id=job["id"],
            job_title=job["title"],
            department=job.get("department"),
            posted_date=job["published_at"],
            status=job["status"],
            total_applications=total_applications,
            qualified_applications=qualified_applications,
            application_rate_per_day=application_rate_per_day,
            avg_match_score=avg_match_score,
            top_candidate_score=top_candidate_score,
            candidates_in_review=candidates_in_review,
            candidates_in_interview=candidates_in_interview,
            offers_pending=offers_pending,
            hires_made=hires_made,
            time_to_first_hire=time_to_first_hire,
            top_skills=top_skills,
            top_sources=top_sources
        ))
    
    return reports

@router.get("/recruiter-activity", response_model=List[RecruiterActivityReport])
async def get_recruiter_activity_report(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    recruiter_ids: List[str] = Query([]),
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Generate recruiter activity report."""
    company_id = await require_company_access(current_user, db)
    
    # Get recruiters to analyze
    recruiter_query = {
        "company_id": company_id,
        "role": {"$in": ["recruiter", "hiring_manager"]}
    }
    
    if recruiter_ids:
        recruiter_query["id"] = {"$in": recruiter_ids}
    
    recruiters = await db.users.find(recruiter_query).to_list(length=None)
    
    reports = []
    for recruiter in recruiters:
        # Get jobs managed
        jobs_managed = await db.job_postings.count_documents({
            "recruiter_id": recruiter["id"],
            "published_at": {"$gte": start_date, "$lte": end_date}
        })
        
        # Get job IDs for this recruiter
        recruiter_jobs = await db.job_postings.find(
            {"recruiter_id": recruiter["id"]},
            {"id": 1}
        ).to_list(length=None)
        job_ids = [job["id"] for job in recruiter_jobs]
        
        if not job_ids:
            continue
        
        # Get activity metrics
        applications_reviewed = await db.job_applications.count_documents({
            "job_id": {"$in": job_ids},
            "last_updated": {"$gte": start_date, "$lte": end_date},
            "status": {"$ne": "submitted"}
        })
        
        interviews_conducted = await db.job_applications.count_documents({
            "job_id": {"$in": job_ids},
            "stage": {"$in": ["interview", "final_interview"]},
            "last_updated": {"$gte": start_date, "$lte": end_date}
        })
        
        offers_sent = await db.job_offers.count_documents({
            "job_id": {"$in": job_ids},
            "created_at": {"$gte": start_date, "$lte": end_date}
        })
        
        hires_made = await db.job_applications.count_documents({
            "job_id": {"$in": job_ids},
            "status": "hired",
            "last_updated": {"$gte": start_date, "$lte": end_date}
        })
        
        # Calculate performance metrics
        total_applications = await db.job_applications.count_documents({
            "job_id": {"$in": job_ids}
        })
        
        hire_success_rate = (hires_made / total_applications * 100) if total_applications > 0 else 0
        
        # Calculate efficiency metrics
        days_in_period = (end_date - start_date).days or 1
        applications_per_day = applications_reviewed / days_in_period
        interviews_per_week = interviews_conducted / (days_in_period / 7)
        
        # Get job breakdowns
        active_jobs = await _get_recruiter_active_jobs(recruiter["id"], db)
        completed_jobs = await _get_recruiter_completed_jobs(recruiter["id"], start_date, end_date, db)
        
        reports.append(RecruiterActivityReport(
            recruiter_id=recruiter["id"],
            recruiter_name=recruiter.get("full_name", recruiter["email"]),
            jobs_managed=jobs_managed,
            applications_reviewed=applications_reviewed,
            interviews_conducted=interviews_conducted,
            offers_sent=offers_sent,
            hires_made=hires_made,
            hire_success_rate=hire_success_rate,
            applications_per_day=applications_per_day,
            interviews_per_week=interviews_per_week,
            active_jobs=active_jobs,
            completed_jobs=completed_jobs
        ))
    
    return reports

@router.post("/export")
async def export_report(
    export_request: ExportRequest,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Export report data in specified format."""
    company_id = await require_company_access(current_user, db)
    
    # Generate report data based on type
    if export_request.report_type == ReportType.HIRING_FUNNEL:
        report_data = await get_hiring_funnel_report(
            export_request.filters.date_range.start_date,
            export_request.filters.date_range.end_date,
            export_request.filters.job_ids,
            export_request.filters.departments,
            current_user,
            db
        )
    elif export_request.report_type == ReportType.JOB_PERFORMANCE:
        report_data = await get_job_performance_report(
            export_request.filters.date_range.start_date,
            export_request.filters.date_range.end_date,
            export_request.filters.job_ids,
            50,
            current_user,
            db
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Export not implemented for {export_request.report_type}"
        )
    
    # Generate export based on format
    if export_request.format == ExportFormat.CSV:
        return await _generate_csv_export(report_data, export_request.report_type)
    elif export_request.format == ExportFormat.JSON:
        return report_data
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Export format {export_request.format} not yet implemented"
        )

# Helper functions
async def _calculate_time_metrics(base_query: dict, db) -> Dict[str, Optional[float]]:
    """Calculate time-based metrics for hiring funnel."""
    # This would calculate average times between stages
    # For MVP, return mock data
    return {
        "avg_time_to_review": 2.5,
        "avg_time_to_screen": 5.0,
        "avg_time_to_interview": 10.0,
        "avg_time_to_offer": 15.0,
        "avg_time_to_hire": 25.0
    }

async def _get_job_breakdown(base_query: dict, db) -> List[Dict[str, Any]]:
    """Get hiring funnel breakdown by job."""
    # Aggregate applications by job
    pipeline = [
        {"$match": base_query},
        {
            "$group": {
                "_id": "$job_id",
                "applications": {"$sum": 1},
                "hires": {
                    "$sum": {"$cond": [{"$eq": ["$status", "hired"]}, 1, 0]}
                }
            }
        },
        {"$limit": 10}
    ]
    
    results = await db.job_applications.aggregate(pipeline).to_list(length=10)
    
    # Enrich with job details
    breakdown = []
    for result in results:
        job = await db.job_postings.find_one({"id": result["_id"]})
        if job:
            breakdown.append({
                "job_id": result["_id"],
                "job_title": job.get("title"),
                "applications": result["applications"],
                "hires": result["hires"],
                "hire_rate": (result["hires"] / result["applications"] * 100) if result["applications"] > 0 else 0
            })
    
    return breakdown

async def _get_department_breakdown(company_id: str, start_date: datetime, end_date: datetime, db) -> List[Dict[str, Any]]:
    """Get hiring funnel breakdown by department."""
    # Get applications grouped by department
    pipeline = [
        {
            "$lookup": {
                "from": "job_postings",
                "localField": "job_id",
                "foreignField": "id",
                "as": "job"
            }
        },
        {"$unwind": "$job"},
        {
            "$match": {
                "job.company_id": company_id,
                "submitted_at": {"$gte": start_date, "$lte": end_date}
            }
        },
        {
            "$group": {
                "_id": "$job.department",
                "applications": {"$sum": 1},
                "hires": {
                    "$sum": {"$cond": [{"$eq": ["$status", "hired"]}, 1, 0]}
                }
            }
        }
    ]
    
    results = await db.job_applications.aggregate(pipeline).to_list(length=None)
    
    return [
        {
            "department": result["_id"] or "Unspecified",
            "applications": result["applications"],
            "hires": result["hires"],
            "hire_rate": (result["hires"] / result["applications"] * 100) if result["applications"] > 0 else 0
        }
        for result in results
    ]

async def _get_top_skills_for_job(job_id: str, db) -> List[Dict[str, Any]]:
    """Get top skills from applications for a job."""
    # This would analyze candidate skills from applications
    # For MVP, return mock data
    return [
        {"skill": "Python", "count": 15, "avg_match_score": 0.9},
        {"skill": "React", "count": 12, "avg_match_score": 0.85},
        {"skill": "Node.js", "count": 10, "avg_match_score": 0.8}
    ]

async def _get_top_sources_for_job(job_id: str, db) -> List[Dict[str, Any]]:
    """Get top application sources for a job."""
    # This would analyze application sources
    # For MVP, return mock data
    return [
        {"source": "LinkedIn", "count": 25, "quality_score": 0.8},
        {"source": "Company Website", "count": 15, "quality_score": 0.9},
        {"source": "Referral", "count": 10, "quality_score": 0.95}
    ]

async def _get_recruiter_active_jobs(recruiter_id: str, db) -> List[Dict[str, Any]]:
    """Get active jobs for a recruiter."""
    jobs = await db.job_postings.find({
        "recruiter_id": recruiter_id,
        "status": "active"
    }).to_list(length=10)
    
    result = []
    for job in jobs:
        app_count = await db.job_applications.count_documents({"job_id": job["id"]})
        result.append({
            "job_id": job["id"],
            "title": job["title"],
            "applications": app_count,
            "posted_date": job["published_at"]
        })
    
    return result

async def _get_recruiter_completed_jobs(recruiter_id: str, start_date: datetime, end_date: datetime, db) -> List[Dict[str, Any]]:
    """Get completed jobs for a recruiter in date range."""
    jobs = await db.job_postings.find({
        "recruiter_id": recruiter_id,
        "status": {"$in": ["closed", "filled"]},
        "updated_at": {"$gte": start_date, "$lte": end_date}
    }).to_list(length=10)
    
    result = []
    for job in jobs:
        hires = await db.job_applications.count_documents({
            "job_id": job["id"],
            "status": "hired"
        })
        result.append({
            "job_id": job["id"],
            "title": job["title"],
            "hires_made": hires,
            "closed_date": job["updated_at"]
        })
    
    return result

async def _generate_csv_export(report_data: Union[HiringFunnelReport, List[JobPerformanceReport]], report_type: ReportType) -> Response:
    """Generate CSV export from report data."""
    output = io.StringIO()
    
    if report_type == ReportType.HIRING_FUNNEL:
        writer = csv.writer(output)
        writer.writerow([
            "Metric", "Value", "Percentage"
        ])
        
        data = report_data
        writer.writerow(["Total Applications", data.total_applications, ""])
        writer.writerow(["Applications Reviewed", data.applications_reviewed, f"{data.review_rate:.1f}%"])
        writer.writerow(["Candidates Screened", data.candidates_screened, f"{data.screen_rate:.1f}%"])
        writer.writerow(["Interviews Conducted", data.interviews_conducted, f"{data.interview_rate:.1f}%"])
        writer.writerow(["Offers Made", data.offers_made, f"{data.offer_rate:.1f}%"])
        writer.writerow(["Offers Accepted", data.offers_accepted, f"{data.acceptance_rate:.1f}%"])
        writer.writerow(["Hires Completed", data.hires_completed, f"{data.hire_rate:.1f}%"])
        
    elif report_type == ReportType.JOB_PERFORMANCE:
        writer = csv.writer(output)
        writer.writerow([
            "Job ID", "Job Title", "Department", "Total Applications", 
            "Qualified Applications", "Hires Made", "Avg Match Score"
        ])
        
        for job_report in report_data:
            writer.writerow([
                job_report.job_id,
                job_report.job_title,
                job_report.department or "",
                job_report.total_applications,
                job_report.qualified_applications,
                job_report.hires_made,
                f"{job_report.avg_match_score:.2f}" if job_report.avg_match_score else ""
            ])
    
    output.seek(0)
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={report_type.value}_report.csv"}
    )
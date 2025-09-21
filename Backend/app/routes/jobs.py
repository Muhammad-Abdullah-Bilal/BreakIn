"""Job scraping and search API routes."""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel

from app.config import settings
from app.config import get_database
from app.models.job import Job, JobSearchFilters, JobSearchResponse
from app.services.job_scraper import job_scraper, JobScrapingResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.options("/search")
async def search_jobs_options():
    """Handle CORS preflight for search endpoint."""
    return {}


@router.options("/scraping/status")
async def scraping_status_options():
    """Handle CORS preflight for scraping status endpoint."""
    return {}


class ScrapingStatusResponse(BaseModel):
    """Response model for scraping status."""
    is_enabled: bool
    last_scraping: Optional[datetime] = None
    next_scraping: Optional[datetime] = None
    platforms_status: Dict[str, JobScrapingResult] = {}


class TriggerScrapingRequest(BaseModel):
    """Request model for triggering job scraping."""
    platforms: Optional[List[str]] = None
    company_urls: Optional[List[str]] = None


@router.get("/search", response_model=JobSearchResponse)
async def search_jobs(
    keywords: Optional[str] = Query(None, description="Search keywords"),
    location: Optional[str] = Query(None, description="Job location"),
    company: Optional[str] = Query(None, description="Company name"),
    job_type: Optional[str] = Query(None, description="Job type (full-time, part-time, etc.)"),
    experience_level: Optional[str] = Query(None, description="Experience level"),
    platform: Optional[str] = Query(None, description="Job platform"),
    skills: Optional[str] = Query(None, description="Comma-separated skills"),
    posted_within_days: Optional[int] = Query(30, description="Jobs posted within N days"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page")
):
    """Search for jobs with filters."""
    try:
        db = get_database()
        
        # Build search filters
        filters = {}
        
        if keywords:
            filters["$or"] = [
                {"title": {"$regex": keywords, "$options": "i"}},
                {"description": {"$regex": keywords, "$options": "i"}},
                {"skills": {"$in": [keywords]}}
            ]
        
        if location:
            filters["location"] = {"$regex": location, "$options": "i"}
        
        if company:
            filters["company"] = {"$regex": company, "$options": "i"}
        
        if job_type:
            filters["job_type"] = job_type
        
        if experience_level:
            filters["experience_level"] = experience_level
        
        if platform:
            filters["platform"] = platform
        
        if skills:
            skill_list = [s.strip() for s in skills.split(",")]
            filters["skills"] = {"$in": skill_list}
        
        if posted_within_days:
            cutoff_date = datetime.utcnow() - timedelta(days=posted_within_days)
            filters["scraped_at"] = {"$gte": cutoff_date}
        
        # Only active jobs
        filters["is_active"] = True
        
        # Get total count
        total_count = db.jobs.count_documents(filters)
        
        # Get paginated results
        skip = (page - 1) * page_size
        cursor = db.jobs.find(filters).sort("scraped_at", -1).skip(skip).limit(page_size)
        jobs_data = list(cursor)
        
        # Convert to Job models
        jobs = []
        for job_doc in jobs_data:
            # Convert ObjectId to string
            job_doc["id"] = str(job_doc["_id"])
            # Remove the original _id to avoid conflicts
            job_doc.pop("_id", None)
            # Ensure all required fields have default values
            job_doc.setdefault("requirements", [])
            job_doc.setdefault("skills", [])
            job_doc.setdefault("salary_range", None)
            job_doc.setdefault("url", None)
            job_doc.setdefault("job_type", "full-time")
            job_doc.setdefault("experience_level", "mid")
            job_doc.setdefault("is_active", True)
            try:
                jobs.append(Job(**job_doc))
            except Exception as job_error:
                logger.warning(f"Skipping invalid job document: {job_error}")
                continue
        
        # Build response
        search_filters = JobSearchFilters(
            keywords=keywords,
            location=location,
            company=company,
            job_type=job_type,
            experience_level=experience_level,
            skills=skill_list if skills else [],
            platform=platform,
            posted_within_days=posted_within_days
        )
        
        return JobSearchResponse(
            jobs=jobs,
            total_count=total_count,
            page=page,
            page_size=page_size,
            filters_applied=search_filters
        )
        
    except Exception as e:
        logger.error(f"Error searching jobs: {str(e)}")
        raise HTTPException(status_code=500, detail="Error searching jobs")


@router.get("/scraping/status", response_model=ScrapingStatusResponse)
async def get_scraping_status():
    """Get current job scraping status."""
    try:
        db = get_database()
        
        # Get last scraping info from database
        last_scraping_doc = db.scraping_logs.find_one(
            {},
            sort=[("timestamp", -1)]
        )
        
        last_scraping = None
        platforms_status = {}
        
        if last_scraping_doc:
            last_scraping = last_scraping_doc.get("timestamp")
            platforms_status = last_scraping_doc.get("results", {})
        
        # Calculate next scraping time
        next_scraping = None
        if last_scraping:
            next_scraping = last_scraping + timedelta(hours=settings.SCRAPING_INTERVAL_HOURS)
        
        return ScrapingStatusResponse(
            is_enabled=settings.JOB_SCRAPING_ENABLED,
            last_scraping=last_scraping,
            next_scraping=next_scraping,
            platforms_status=platforms_status
        )
        
    except Exception as e:
        logger.error(f"Error getting scraping status: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting scraping status")


@router.post("/scraping/trigger")
async def trigger_job_scraping(
    request: TriggerScrapingRequest,
    background_tasks: BackgroundTasks
):
    """Manually trigger job scraping."""
    if not settings.JOB_SCRAPING_ENABLED:
        raise HTTPException(status_code=400, detail="Job scraping is disabled")
    
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=400, detail="OpenAI API key not configured")
    
    # Add scraping task to background
    background_tasks.add_task(
        _run_job_scraping,
        request.platforms,
        request.company_urls
    )
    
    return {"message": "Job scraping triggered successfully"}


@router.get("/platforms")
async def get_supported_platforms():
    """Get list of supported job platforms."""
    platforms = [
        {
            "name": "linkedin",
            "display_name": "LinkedIn Jobs",
            "description": "Professional networking platform with extensive job listings"
        },
        {
            "name": "indeed",
            "display_name": "Indeed",
            "description": "One of the largest job search engines"
        },
        {
            "name": "stackoverflow",
            "display_name": "Stack Overflow Jobs",
            "description": "Developer-focused job board"
        },
        {
            "name": "angellist",
            "display_name": "AngelList",
            "description": "Startup and tech company job listings"
        },
        {
            "name": "company_careers",
            "display_name": "Company Career Pages",
            "description": "Direct scraping from company career pages"
        }
    ]
    
    return {"platforms": platforms}


@router.get("/stats")
async def get_job_stats():
    """Get job statistics by platform and other metrics."""
    try:
        db = get_database()
        
        # Jobs by platform
        platform_pipeline = [
            {"$match": {"is_active": True}},
            {"$group": {"_id": "$platform", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        platform_stats = list(db.jobs.aggregate(platform_pipeline))
        
        # Jobs by experience level
        experience_pipeline = [
            {"$match": {"is_active": True}},
            {"$group": {"_id": "$experience_level", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        experience_stats = list(db.jobs.aggregate(experience_pipeline))
        
        # Jobs by type
        type_pipeline = [
            {"$match": {"is_active": True}},
            {"$group": {"_id": "$job_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        type_stats = list(db.jobs.aggregate(type_pipeline))
        
        # Recent jobs (last 7 days)
        recent_cutoff = datetime.utcnow() - timedelta(days=7)
        recent_count = db.jobs.count_documents({
            "is_active": True,
            "scraped_at": {"$gte": recent_cutoff}
        })
        
        # Total active jobs
        total_jobs = db.jobs.count_documents({"is_active": True})
        
        return {
            "total_jobs": total_jobs,
            "recent_jobs": recent_count,
            "by_platform": platform_stats,
            "by_experience_level": experience_stats,
            "by_job_type": type_stats
        }
        
    except Exception as e:
        logger.error(f"Error getting job stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting job statistics")


async def _run_job_scraping(platforms: Optional[List[str]] = None, company_urls: Optional[List[str]] = None):
    """Background task to run job scraping."""
    try:
        db = get_database()
        
        async with job_scraper:
            results = {}
            
            # Scrape specified platforms or all platforms
            if platforms:
                for platform in platforms:
                    if platform in job_scraper.platforms:
                        result = await job_scraper.scrape_platform(platform)
                        results[platform] = result
            else:
                results = await job_scraper.scrape_all_platforms()
            
            # Scrape company career pages if provided
            if company_urls:
                company_result = await job_scraper.scrape_company_careers(company_urls)
                results["company_careers"] = company_result
            
            # Log scraping results
            log_doc = {
                "timestamp": datetime.utcnow(),
                "results": {k: v.dict() for k, v in results.items()},
                "total_jobs_found": sum(r.jobs_found for r in results.values()),
                "total_jobs_saved": sum(r.jobs_saved for r in results.values())
            }
            
            db.scraping_logs.insert_one(log_doc)
            
            logger.info(f"Job scraping completed: {log_doc['total_jobs_saved']} jobs saved")
            
    except Exception as e:
        logger.error(f"Background job scraping failed: {str(e)}")
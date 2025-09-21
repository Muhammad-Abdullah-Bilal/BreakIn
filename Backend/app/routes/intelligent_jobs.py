"""Intelligent Jobs API routes using AI-powered job fetching."""

import logging
from datetime import datetime
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

from ..agents.job_radar_agent import JobRadarAgent
from ..config import get_database
from app.core.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/intelligent-jobs", tags=["intelligent-jobs"])


class JobSearchRequest(BaseModel):
    """Request model for intelligent job search."""
    keywords: List[str] = Field(..., description="Job search keywords")
    location: Optional[str] = Field("United States", description="Job location")
    max_jobs_per_source: Optional[int] = Field(20, description="Maximum jobs per platform")
    include_analysis: Optional[bool] = Field(True, description="Include AI job market analysis")


class JobSearchResponse(BaseModel):
    """Response model for intelligent job search."""
    success: bool
    jobs_found: int
    jobs_saved: int
    platforms_scraped: List[str]
    analysis: Optional[Dict]
    errors: List[str]
    execution_time: float
    timestamp: datetime


class JobTrendsResponse(BaseModel):
    """Response model for job market trends."""
    insights: str
    top_skills: List[str]
    salary_trends: str
    location_trends: str
    recommendations: str
    jobs_analyzed: int
    timestamp: datetime


@router.post("/search", response_model=JobSearchResponse)
async def search_jobs_with_ai(
    request: JobSearchRequest,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """Search for jobs using AI-powered scraping and analysis."""
    start_time = datetime.utcnow()
    
    try:
        # Initialize the JobRadarAgent
        agent = JobRadarAgent()
        
        # Prepare input data
        input_data = {
            "keywords": request.keywords,
            "location": request.location,
            "max_jobs_per_source": request.max_jobs_per_source,
            "include_analysis": request.include_analysis
        }
        
        # Execute the agent
        result = await agent.execute(input_data)
        
        # Calculate execution time
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Prepare response
        response = JobSearchResponse(
            success=result.success,
            jobs_found=result.data.get("total_jobs_found", 0),
            jobs_saved=result.data.get("total_jobs_saved", 0),
            platforms_scraped=result.data.get("platforms_scraped", []),
            analysis=result.data.get("ai_analysis") if request.include_analysis else None,
            errors=result.data.get("errors", []),
            execution_time=execution_time,
            timestamp=datetime.utcnow()
        )
        
        logger.info(f"Job search completed for user {current_user.get('user_id', 'unknown')}: {response.jobs_saved} jobs saved")
        return response
        
    except Exception as e:
        logger.error(f"Failed to search jobs with AI: {str(e)}")
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        
        return JobSearchResponse(
            success=False,
            jobs_found=0,
            jobs_saved=0,
            platforms_scraped=[],
            analysis=None,
            errors=[f"Search failed: {str(e)}"],
            execution_time=execution_time,
            timestamp=datetime.utcnow()
        )


@router.get("/trends", response_model=JobTrendsResponse)
async def get_job_market_trends(
    keywords: List[str] = Query(..., description="Keywords to analyze trends for"),
    days: int = Query(7, description="Number of days to analyze", ge=1, le=30),
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """Get AI-powered job market trends and insights."""
    try:
        # Initialize the JobRadarAgent
        agent = JobRadarAgent()
        
        # Get recent jobs for analysis
        recent_jobs = await agent._get_recent_jobs(limit=50)
        
        if not recent_jobs:
            return JobTrendsResponse(
                insights="No recent job data available for analysis",
                top_skills=[],
                salary_trends="Insufficient data",
                location_trends="Insufficient data",
                recommendations="Please run a job search first to gather data",
                jobs_analyzed=0,
                timestamp=datetime.utcnow()
            )
        
        # Analyze job trends using AI
        analysis = await agent._analyze_job_trends(recent_jobs, keywords)
        
        response = JobTrendsResponse(
            insights=analysis.get("insights", "Analysis completed"),
            top_skills=analysis.get("top_skills", []),
            salary_trends=analysis.get("salary_trends", "No salary data available"),
            location_trends=analysis.get("location_trends", "No location data available"),
            recommendations=analysis.get("recommendations", "Continue monitoring job market"),
            jobs_analyzed=len(recent_jobs),
            timestamp=datetime.utcnow()
        )
        
        logger.info(f"Job trends analysis completed for user {current_user.get('user_id', 'unknown')}: {len(recent_jobs)} jobs analyzed")
        return response
        
    except Exception as e:
        logger.error(f"Failed to analyze job trends: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Trends analysis failed: {str(e)}")


@router.get("/status")
async def get_intelligent_jobs_status(
    current_user=Depends(get_current_user)
):
    """Get the status of the intelligent jobs system."""
    try:
        # Initialize the JobRadarAgent to test connectivity
        agent = JobRadarAgent()
        
        # Check if OpenAI is configured
        openai_configured = hasattr(agent.job_scraper, 'client') and agent.job_scraper.client is not None
        
        # Get recent job count
        recent_jobs = await agent._get_recent_jobs(limit=1)
        has_recent_data = len(recent_jobs) > 0
        
        return {
            "status": "operational",
            "openai_configured": openai_configured,
            "has_recent_data": has_recent_data,
            "supported_platforms": ["linkedin", "indeed"],
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Failed to get intelligent jobs status: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow()
        }
"""Schemas for job posting and application APIs."""
from typing import Dict, List, Optional, Any
from datetime import datetime, date
from pydantic import BaseModel, Field, validator
from enum import Enum

# Import enums from models
from app.models.employer import JobStatus, JobType, ExperienceLevel

class JobPostingCreate(BaseModel):
    """Schema for creating a new job posting."""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10)
    department: Optional[str] = Field(None, max_length=100)
    location: str = Field(..., min_length=1, max_length=200)
    job_type: JobType = JobType.FULL_TIME
    experience_level: ExperienceLevel
    
    # Requirements
    required_skills: List[str] = Field(default=[], max_items=20)
    preferred_skills: List[str] = Field(default=[], max_items=20)
    required_experience_years: Optional[int] = Field(None, ge=0, le=50)
    education_requirements: Optional[str] = Field(None, max_length=500)
    
    # Compensation
    salary_min: Optional[float] = Field(None, ge=0)
    salary_max: Optional[float] = Field(None, ge=0)
    currency: str = Field("USD", max_length=3)
    equity_offered: bool = False
    benefits: List[str] = Field(default=[], max_items=15)
    
    # Matching preferences
    culture_tags: List[str] = Field(default=[], max_items=10)
    timezone_requirements: Optional[str] = Field(None, max_length=100)
    remote_allowed: bool = True
    visa_sponsorship: bool = False
    
    # Workflow settings
    priority: int = Field(1, ge=1, le=5)
    target_hire_date: Optional[date] = None
    positions_available: int = Field(1, ge=1, le=100)
    auto_match_enabled: bool = True
    ai_screening_enabled: bool = False
    
    @validator('salary_max')
    def validate_salary_range(cls, v, values):
        if v is not None and 'salary_min' in values and values['salary_min'] is not None:
            if v < values['salary_min']:
                raise ValueError('salary_max must be greater than or equal to salary_min')
        return v

class JobPostingUpdate(BaseModel):
    """Schema for updating a job posting."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    department: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, min_length=1, max_length=200)
    job_type: Optional[JobType] = None
    experience_level: Optional[ExperienceLevel] = None
    
    # Requirements
    required_skills: Optional[List[str]] = Field(None, max_items=20)
    preferred_skills: Optional[List[str]] = Field(None, max_items=20)
    required_experience_years: Optional[int] = Field(None, ge=0, le=50)
    education_requirements: Optional[str] = Field(None, max_length=500)
    
    # Compensation
    salary_min: Optional[float] = Field(None, ge=0)
    salary_max: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    equity_offered: Optional[bool] = None
    benefits: Optional[List[str]] = Field(None, max_items=15)
    
    # Matching preferences
    culture_tags: Optional[List[str]] = Field(None, max_items=10)
    timezone_requirements: Optional[str] = Field(None, max_length=100)
    remote_allowed: Optional[bool] = None
    visa_sponsorship: Optional[bool] = None
    
    # Workflow settings
    status: Optional[JobStatus] = None
    priority: Optional[int] = Field(None, ge=1, le=5)
    target_hire_date: Optional[date] = None
    positions_available: Optional[int] = Field(None, ge=1, le=100)
    auto_match_enabled: Optional[bool] = None
    ai_screening_enabled: Optional[bool] = None

class JobPostingResponse(BaseModel):
    """Schema for job posting API responses."""
    id: str
    company_id: str
    recruiter_id: str
    
    # Basic information
    title: str
    description: str
    department: Optional[str]
    location: str
    job_type: JobType
    experience_level: ExperienceLevel
    
    # Requirements
    required_skills: List[str]
    preferred_skills: List[str]
    required_experience_years: Optional[int]
    education_requirements: Optional[str]
    
    # Compensation
    salary_min: Optional[float]
    salary_max: Optional[float]
    currency: str
    equity_offered: bool
    benefits: List[str]
    
    # Status and metrics
    status: JobStatus
    priority: int
    positions_available: int
    positions_filled: int
    views_count: int
    applications_count: int
    matches_generated: int
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]
    closed_at: Optional[datetime]

class JobPostingList(BaseModel):
    """Schema for paginated job posting lists."""
    jobs: List[JobPostingResponse]
    total_count: int
    page: int
    page_size: int
    has_next: bool
    has_previous: bool

class JobPostingFilters(BaseModel):
    """Schema for job posting filters."""
    status: Optional[List[JobStatus]] = None
    job_type: Optional[List[JobType]] = None
    experience_level: Optional[List[ExperienceLevel]] = None
    department: Optional[List[str]] = None
    location: Optional[str] = None
    remote_allowed: Optional[bool] = None
    salary_min: Optional[float] = Field(None, ge=0)
    salary_max: Optional[float] = Field(None, ge=0)
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    priority_min: Optional[int] = Field(None, ge=1, le=5)
    search_query: Optional[str] = Field(None, max_length=200)

class JobApplicationResponse(BaseModel):
    """Schema for job application responses."""
    id: str
    job_id: str
    candidate_id: str
    
    # Application details
    cover_letter: Optional[str]
    resume_url: Optional[str]
    portfolio_url: Optional[str]
    
    # Status
    status: str
    stage: str
    
    # Evaluation
    ai_match_score: Optional[float]
    recruiter_rating: Optional[int]
    recruiter_notes: Optional[str]
    
    # Timeline
    submitted_at: datetime
    reviewed_at: Optional[datetime]
    last_updated: datetime
    
    # Communication
    messages_count: int
    last_message_at: Optional[datetime]

class ApplicationStatusUpdate(BaseModel):
    """Schema for updating application status."""
    status: str = Field(..., pattern=r'^(submitted|reviewed|shortlisted|rejected|hired)$')
    stage: str = Field(..., pattern=r'^(application|screening|interview|offer|hired)$')
    recruiter_rating: Optional[int] = Field(None, ge=1, le=5)
    recruiter_notes: Optional[str] = Field(None, max_length=1000)

class JobPipelineResponse(BaseModel):
    """Schema for job pipeline responses."""
    id: str
    company_id: str
    job_id: Optional[str]
    
    stages: List[Dict[str, Any]]
    auto_reject_after_days: Optional[int]
    auto_advance_conditions: Dict[str, Any]
    
    created_at: datetime
    updated_at: datetime

class JobPipelineUpdate(BaseModel):
    """Schema for updating job pipeline."""
    stages: List[Dict[str, Any]] = Field(..., min_items=1, max_items=10)
    auto_reject_after_days: Optional[int] = Field(None, ge=1, le=365)
    auto_advance_conditions: Optional[Dict[str, Any]] = None

class JobAnalytics(BaseModel):
    """Schema for job posting analytics."""
    job_id: str
    
    # Performance metrics
    views_count: int
    applications_count: int
    matches_generated: int
    interviews_scheduled: int
    offers_sent: int
    hires_made: int
    
    # Conversion rates
    view_to_application_rate: float
    application_to_interview_rate: float
    interview_to_offer_rate: float
    offer_to_hire_rate: float
    
    # Time metrics
    avg_time_to_first_application: Optional[float]  # in hours
    avg_time_to_hire: Optional[float]  # in days
    
    # Quality metrics
    avg_candidate_match_score: Optional[float]
    top_candidate_sources: List[Dict[str, Any]]
    
    # Period
    period_start: datetime
    period_end: datetime
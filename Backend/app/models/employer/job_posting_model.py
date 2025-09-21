"""Models for job postings and role management."""
from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

class JobStatus(str, Enum):
    """Job posting status."""
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"
    FILLED = "filled"

class JobType(str, Enum):
    """Job type classification."""
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    FREELANCE = "freelance"

class ExperienceLevel(str, Enum):
    """Experience level requirements."""
    ENTRY = "entry"
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    PRINCIPAL = "principal"

class JobPosting(BaseModel):
    """Job posting model for employer dashboard."""
    id: str = Field(default_factory=lambda: f"job_{ObjectId()}")
    company_id: str
    recruiter_id: str  # User who created the posting
    
    # Basic job information
    title: str
    description: str
    department: Optional[str] = None
    location: str  # "Remote", "New York, NY", "Hybrid - San Francisco"
    job_type: JobType = JobType.FULL_TIME
    experience_level: ExperienceLevel
    
    # Requirements
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    required_experience_years: Optional[int] = None
    education_requirements: Optional[str] = None
    
    # Compensation
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: str = "USD"
    equity_offered: bool = False
    benefits: List[str] = []
    
    # Matching preferences
    culture_tags: List[str] = []
    timezone_requirements: Optional[str] = None
    remote_allowed: bool = True
    visa_sponsorship: bool = False
    
    # Status and workflow
    status: JobStatus = JobStatus.DRAFT
    priority: int = 1  # 1-5, higher is more urgent
    target_hire_date: Optional[datetime] = None
    positions_available: int = 1
    positions_filled: int = 0
    
    # Analytics and tracking
    views_count: int = 0
    applications_count: int = 0
    matches_generated: int = 0
    interviews_scheduled: int = 0
    
    # External integrations
    external_job_board_ids: Dict[str, str] = {}  # platform -> external_id
    source_channel: Optional[str] = None  # "linkedin", "indeed", "direct"
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    
    # AI and automation
    auto_match_enabled: bool = True
    ai_screening_enabled: bool = False
    matching_criteria_override: Optional[Dict] = None
    
    class Config:
        json_encoders = {
            ObjectId: str
        }

class JobApplication(BaseModel):
    """Job application tracking."""
    id: str = Field(default_factory=lambda: f"app_{ObjectId()}")
    job_id: str
    candidate_id: str
    company_id: str
    
    # Application details
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    
    # Status tracking
    status: str = "submitted"  # submitted, reviewed, shortlisted, rejected, hired
    stage: str = "application"  # application, screening, interview, offer, hired
    
    # Scoring and evaluation
    ai_match_score: Optional[float] = None
    recruiter_rating: Optional[int] = None  # 1-5 stars
    recruiter_notes: Optional[str] = None
    
    # Timeline
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    # Communication
    messages_count: int = 0
    last_message_at: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            ObjectId: str
        }

class JobPipeline(BaseModel):
    """Pipeline stage configuration for jobs."""
    id: str = Field(default_factory=lambda: f"pipe_{ObjectId()}")
    company_id: str
    job_id: Optional[str] = None  # None for company-wide default
    
    # Pipeline stages
    stages: List[Dict[str, Any]] = [
        {"name": "Application", "order": 1, "auto_advance": False},
        {"name": "Screening", "order": 2, "auto_advance": False},
        {"name": "Interview", "order": 3, "auto_advance": False},
        {"name": "Offer", "order": 4, "auto_advance": False},
        {"name": "Hired", "order": 5, "auto_advance": False}
    ]
    
    # Automation rules
    auto_reject_after_days: Optional[int] = None
    auto_advance_conditions: Dict[str, Any] = {}
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            ObjectId: str
        }
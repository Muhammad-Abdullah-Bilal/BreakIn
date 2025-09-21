"""Job model for scraped job postings."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from bson import ObjectId


class JobBase(BaseModel):
    """Base job model."""
    title: str
    company: str
    location: str
    description: str
    requirements: List[str] = Field(default_factory=list)
    salary_range: Optional[str] = None
    job_type: str = "full-time"  # full-time, part-time, contract, internship
    experience_level: str = "mid"  # entry, mid, senior, executive
    skills: List[str] = Field(default_factory=list)
    url: Optional[str] = None
    platform: str
    is_active: bool = True


class JobCreate(JobBase):
    """Job creation model."""
    external_id: str  # Unique identifier from the platform


class Job(JobBase):
    """Job model with database fields."""
    id: Optional[str] = Field(alias="_id")
    external_id: str
    scraped_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class JobSearchFilters(BaseModel):
    """Job search and filtering model."""
    keywords: Optional[str] = None
    location: Optional[str] = None
    company: Optional[str] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    platform: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    posted_within_days: Optional[int] = 30


class JobSearchResponse(BaseModel):
    """Job search response model."""
    jobs: List[Job]
    total_count: int
    page: int
    page_size: int
    filters_applied: JobSearchFilters
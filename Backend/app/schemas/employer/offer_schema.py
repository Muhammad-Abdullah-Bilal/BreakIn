"""Schemas for job offers and contract management APIs."""
from typing import Dict, List, Optional
from datetime import datetime, date
from pydantic import BaseModel, Field, validator
from decimal import Decimal

# Import enums from models
from app.models.employer import OfferStatus, ContractType

class JobOfferCreate(BaseModel):
    """Schema for creating a new job offer."""
    job_id: str
    candidate_id: str
    
    # Position details
    position_title: str = Field(..., min_length=1, max_length=200)
    department: Optional[str] = Field(None, max_length=100)
    start_date: Optional[date] = None
    contract_type: ContractType = ContractType.EMPLOYMENT
    
    # Compensation
    base_salary: float = Field(..., gt=0)
    currency: str = Field("USD", max_length=3)
    salary_frequency: str = Field("annual", pattern=r'^(annual|monthly|hourly)$')
    
    # Additional compensation
    signing_bonus: Optional[float] = Field(None, ge=0)
    equity_percentage: Optional[float] = Field(None, ge=0, le=100)
    equity_shares: Optional[int] = Field(None, ge=0)
    annual_bonus_target: Optional[float] = Field(None, ge=0)
    
    # Benefits
    benefits_package: List[str] = Field(default=[], max_items=20)
    vacation_days: Optional[int] = Field(None, ge=0, le=365)
    health_insurance: bool = False
    retirement_plan: bool = False
    
    # Work arrangements
    location: str = Field(..., min_length=1, max_length=200)
    remote_allowed: bool = True
    travel_required: Optional[str] = Field(None, pattern=r'^(None|Occasional|Frequent)$')
    
    # Terms
    offer_expires_at: datetime
    probation_period_months: Optional[int] = Field(None, ge=0, le=24)
    notice_period_weeks: Optional[int] = Field(None, ge=0, le=52)
    
    # Communication
    custom_message: Optional[str] = Field(None, max_length=2000)
    
    @validator('offer_expires_at')
    def validate_expiry_date(cls, v):
        if v <= datetime.utcnow():
            raise ValueError('offer_expires_at must be in the future')
        return v

class JobOfferUpdate(BaseModel):
    """Schema for updating a job offer."""
    position_title: Optional[str] = Field(None, min_length=1, max_length=200)
    department: Optional[str] = Field(None, max_length=100)
    start_date: Optional[date] = None
    
    # Compensation updates
    base_salary: Optional[float] = Field(None, gt=0)
    signing_bonus: Optional[float] = Field(None, ge=0)
    equity_percentage: Optional[float] = Field(None, ge=0, le=100)
    equity_shares: Optional[int] = Field(None, ge=0)
    annual_bonus_target: Optional[float] = Field(None, ge=0)
    
    # Benefits updates
    benefits_package: Optional[List[str]] = Field(None, max_items=20)
    vacation_days: Optional[int] = Field(None, ge=0, le=365)
    health_insurance: Optional[bool] = None
    retirement_plan: Optional[bool] = None
    
    # Work arrangements
    location: Optional[str] = Field(None, min_length=1, max_length=200)
    remote_allowed: Optional[bool] = None
    travel_required: Optional[str] = Field(None, pattern=r'^(None|Occasional|Frequent)$')
    
    # Terms
    offer_expires_at: Optional[datetime] = None
    probation_period_months: Optional[int] = Field(None, ge=0, le=24)
    notice_period_weeks: Optional[int] = Field(None, ge=0, le=52)
    
    # Communication
    custom_message: Optional[str] = Field(None, max_length=2000)
    
    @validator('offer_expires_at')
    def validate_expiry_date(cls, v):
        if v is not None and v <= datetime.utcnow():
            raise ValueError('offer_expires_at must be in the future')
        return v

class JobOfferResponse(BaseModel):
    """Schema for job offer API responses."""
    id: str
    job_id: str
    candidate_id: str
    company_id: str
    recruiter_id: str
    
    # Position details
    position_title: str
    department: Optional[str]
    start_date: Optional[date]
    contract_type: ContractType
    
    # Compensation
    base_salary: float
    currency: str
    salary_frequency: str
    signing_bonus: Optional[float]
    equity_percentage: Optional[float]
    equity_shares: Optional[int]
    annual_bonus_target: Optional[float]
    
    # Benefits
    benefits_package: List[str]
    vacation_days: Optional[int]
    health_insurance: bool
    retirement_plan: bool
    
    # Work arrangements
    location: str
    remote_allowed: bool
    travel_required: Optional[str]
    
    # Terms
    offer_expires_at: datetime
    probation_period_months: Optional[int]
    notice_period_weeks: Optional[int]
    
    # Status
    status: OfferStatus
    version: int
    parent_offer_id: Optional[str]
    
    # Communication
    offer_letter_url: Optional[str]
    custom_message: Optional[str]
    
    # Timeline
    sent_at: Optional[datetime]
    viewed_at: Optional[datetime]
    responded_at: Optional[datetime]
    response_message: Optional[str]
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class OfferStatusUpdate(BaseModel):
    """Schema for updating offer status."""
    status: OfferStatus
    response_message: Optional[str] = Field(None, max_length=1000)

class ContractResponse(BaseModel):
    """Schema for contract API responses."""
    id: str
    offer_id: str
    job_id: str
    candidate_id: str
    company_id: str
    
    # Contract basics
    contract_number: str
    contract_type: ContractType
    title: str
    department: Optional[str]
    
    # Employment terms
    start_date: date
    end_date: Optional[date]
    probation_end_date: Optional[date]
    
    # Compensation
    base_salary: float
    currency: str
    salary_frequency: str
    signing_bonus: Optional[float]
    equity_details: Optional[Dict]
    
    # Work arrangements
    location: str
    remote_policy: str
    working_hours: str
    
    # Documents
    contract_template_id: str
    contract_document_url: Optional[str]
    signed_document_url: Optional[str]
    
    # Signatures
    company_signed_at: Optional[datetime]
    company_signed_by: Optional[str]
    candidate_signed_at: Optional[datetime]
    
    # Status
    is_active: bool
    is_signed: bool
    termination_date: Optional[date]
    termination_reason: Optional[str]
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class ContractCreate(BaseModel):
    """Schema for creating a contract from an accepted offer."""
    offer_id: str
    contract_template_id: str
    contract_number: Optional[str] = None  # Auto-generated if not provided
    
    # Override employment terms if needed
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    probation_end_date: Optional[date] = None
    
    # Work arrangements
    remote_policy: str = Field("hybrid", pattern=r'^(remote|hybrid|onsite)$')
    working_hours: str = Field("40 hours/week", max_length=100)

class OfferTemplateResponse(BaseModel):
    """Schema for offer template responses."""
    id: str
    company_id: str
    name: str
    description: Optional[str]
    contract_type: ContractType
    
    # Default values
    default_benefits: List[str]
    default_vacation_days: int
    default_probation_months: int
    default_notice_weeks: int
    
    # Salary bands
    salary_bands: Dict[str, Dict[str, float]]
    
    # Templates
    offer_letter_template: Optional[str]
    contract_template_id: Optional[str]
    
    # Usage
    usage_count: int
    last_used_at: Optional[datetime]
    
    # Status
    is_active: bool
    created_at: datetime
    updated_at: datetime

class OfferTemplateCreate(BaseModel):
    """Schema for creating offer templates."""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    contract_type: ContractType
    
    # Default values
    default_benefits: List[str] = Field(default=[], max_items=20)
    default_vacation_days: int = Field(20, ge=0, le=365)
    default_probation_months: int = Field(3, ge=0, le=24)
    default_notice_weeks: int = Field(2, ge=0, le=52)
    
    # Salary bands
    salary_bands: Dict[str, Dict[str, float]] = Field(default={})
    
    # Templates
    offer_letter_template: Optional[str] = Field(None, max_length=10000)
    contract_template_id: Optional[str] = None

class OfferNegotiationResponse(BaseModel):
    """Schema for offer negotiation responses."""
    id: str
    offer_id: str
    round_number: int
    initiated_by: str
    
    # Proposed changes
    salary_change: Optional[float]
    equity_change: Optional[float]
    start_date_change: Optional[date]
    benefits_changes: List[str]
    
    # Communication
    message: Optional[str]
    response_message: Optional[str]
    
    # Status
    status: str
    
    # Timeline
    created_at: datetime
    responded_at: Optional[datetime]

class OfferNegotiationCreate(BaseModel):
    """Schema for creating offer negotiations."""
    offer_id: str
    
    # Proposed changes
    salary_change: Optional[float] = None
    equity_change: Optional[float] = Field(None, ge=0, le=100)
    start_date_change: Optional[date] = None
    benefits_changes: List[str] = Field(default=[], max_items=20)
    
    # Communication
    message: Optional[str] = Field(None, max_length=2000)

class OfferList(BaseModel):
    """Schema for paginated offer lists."""
    offers: List[JobOfferResponse]
    total_count: int
    page: int
    page_size: int
    has_next: bool
    has_previous: bool

class OfferFilters(BaseModel):
    """Schema for offer filtering."""
    status: Optional[List[OfferStatus]] = None
    contract_type: Optional[List[ContractType]] = None
    job_id: Optional[str] = None
    candidate_id: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    expires_after: Optional[datetime] = None
    expires_before: Optional[datetime] = None
    salary_min: Optional[float] = Field(None, ge=0)
    salary_max: Optional[float] = Field(None, ge=0)
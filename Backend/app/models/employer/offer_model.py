"""Models for job offers and contract management."""
from typing import Dict, List, Optional
from datetime import datetime, date
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

class OfferStatus(str, Enum):
    """Offer status tracking."""
    DRAFT = "draft"
    PENDING = "pending"
    SENT = "sent"
    VIEWED = "viewed"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    WITHDRAWN = "withdrawn"
    EXPIRED = "expired"
    COUNTERED = "countered"

class ContractType(str, Enum):
    """Contract type classification."""
    EMPLOYMENT = "employment"
    CONTRACTOR = "contractor"
    INTERNSHIP = "internship"
    CONSULTING = "consulting"
    FREELANCE = "freelance"

class JobOffer(BaseModel):
    """Job offer model."""
    id: str = Field(default_factory=lambda: f"offer_{ObjectId()}")
    job_id: str
    candidate_id: str
    company_id: str
    recruiter_id: str
    
    # Offer details
    position_title: str
    department: Optional[str] = None
    start_date: Optional[date] = None
    contract_type: ContractType = ContractType.EMPLOYMENT
    
    # Compensation package
    base_salary: float
    currency: str = "USD"
    salary_frequency: str = "annual"  # annual, monthly, hourly
    
    # Additional compensation
    signing_bonus: Optional[float] = None
    equity_percentage: Optional[float] = None
    equity_shares: Optional[int] = None
    annual_bonus_target: Optional[float] = None
    
    # Benefits
    benefits_package: List[str] = []
    vacation_days: Optional[int] = None
    health_insurance: bool = False
    retirement_plan: bool = False
    
    # Work arrangements
    location: str
    remote_allowed: bool = True
    travel_required: Optional[str] = None  # "None", "Occasional", "Frequent"
    
    # Offer terms
    offer_expires_at: datetime
    probation_period_months: Optional[int] = None
    notice_period_weeks: Optional[int] = None
    
    # Status and workflow
    status: OfferStatus = OfferStatus.DRAFT
    version: int = 1  # For offer revisions
    parent_offer_id: Optional[str] = None  # For counter-offers
    
    # Communication
    offer_letter_url: Optional[str] = None
    custom_message: Optional[str] = None
    
    # Tracking
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    responded_at: Optional[datetime] = None
    response_message: Optional[str] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            ObjectId: str,
            date: lambda v: v.isoformat()
        }

class Contract(BaseModel):
    """Employment contract model."""
    id: str = Field(default_factory=lambda: f"contract_{ObjectId()}")
    offer_id: str
    job_id: str
    candidate_id: str
    company_id: str
    
    # Contract basics
    contract_number: str
    contract_type: ContractType
    title: str
    department: Optional[str] = None
    
    # Employment terms
    start_date: date
    end_date: Optional[date] = None  # None for permanent positions
    probation_end_date: Optional[date] = None
    
    # Compensation (final agreed terms)
    base_salary: float
    currency: str = "USD"
    salary_frequency: str = "annual"
    signing_bonus: Optional[float] = None
    equity_details: Optional[Dict] = None
    
    # Work arrangements
    location: str
    remote_policy: str = "hybrid"  # remote, hybrid, onsite
    working_hours: str = "40 hours/week"
    
    # Legal and compliance
    contract_template_id: str
    contract_document_url: Optional[str] = None
    signed_document_url: Optional[str] = None
    
    # Signatures
    company_signed_at: Optional[datetime] = None
    company_signed_by: Optional[str] = None
    candidate_signed_at: Optional[datetime] = None
    
    # Status
    is_active: bool = True
    is_signed: bool = False
    termination_date: Optional[date] = None
    termination_reason: Optional[str] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            ObjectId: str,
            date: lambda v: v.isoformat()
        }

class OfferTemplate(BaseModel):
    """Template for standardizing offers."""
    id: str = Field(default_factory=lambda: f"template_{ObjectId()}")
    company_id: str
    
    # Template details
    name: str
    description: Optional[str] = None
    contract_type: ContractType
    
    # Default values
    default_benefits: List[str] = []
    default_vacation_days: int = 20
    default_probation_months: int = 3
    default_notice_weeks: int = 2
    
    # Salary bands by experience level
    salary_bands: Dict[str, Dict[str, float]] = {
        "junior": {"min": 60000, "max": 80000},
        "mid": {"min": 80000, "max": 120000},
        "senior": {"min": 120000, "max": 180000}
    }
    
    # Template content
    offer_letter_template: Optional[str] = None
    contract_template_id: Optional[str] = None
    
    # Usage tracking
    usage_count: int = 0
    last_used_at: Optional[datetime] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    
    class Config:
        json_encoders = {
            ObjectId: str
        }

class OfferNegotiation(BaseModel):
    """Track offer negotiation history."""
    id: str = Field(default_factory=lambda: f"nego_{ObjectId()}")
    offer_id: str
    
    # Negotiation details
    round_number: int
    initiated_by: str  # "candidate" or "company"
    
    # Proposed changes
    salary_change: Optional[float] = None
    equity_change: Optional[float] = None
    start_date_change: Optional[date] = None
    benefits_changes: List[str] = []
    
    # Communication
    message: Optional[str] = None
    response_message: Optional[str] = None
    
    # Status
    status: str = "pending"  # pending, accepted, rejected, countered
    
    # Timeline
    created_at: datetime = Field(default_factory=datetime.utcnow)
    responded_at: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            ObjectId: str,
            date: lambda v: v.isoformat()
        }
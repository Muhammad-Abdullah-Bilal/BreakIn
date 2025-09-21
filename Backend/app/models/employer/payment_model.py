"""Models for payments, billing, and financial transactions."""
from typing import Dict, List, Optional, Any
from datetime import datetime, date
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum
from decimal import Decimal

class SubscriptionPlan(str, Enum):
    """Available subscription plans."""
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"
    CUSTOM = "custom"

class PaymentStatus(str, Enum):
    """Payment transaction status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    DISPUTED = "disputed"

class InvoiceStatus(str, Enum):
    """Invoice status tracking."""
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class PaymentMethod(str, Enum):
    """Supported payment methods."""
    CREDIT_CARD = "credit_card"
    BANK_TRANSFER = "bank_transfer"
    PAYPAL = "paypal"
    STRIPE = "stripe"
    WIRE_TRANSFER = "wire_transfer"

class CompanyBilling(BaseModel):
    """Company billing and subscription information."""
    id: str = Field(default_factory=lambda: f"billing_{ObjectId()}")
    company_id: str
    
    # Subscription details
    plan: SubscriptionPlan = SubscriptionPlan.STARTER
    plan_started_at: datetime = Field(default_factory=datetime.utcnow)
    plan_expires_at: Optional[datetime] = None
    
    # Billing cycle
    billing_cycle: str = "monthly"  # monthly, quarterly, annual
    next_billing_date: datetime
    
    # Usage limits and tracking
    job_postings_limit: int = 5
    job_postings_used: int = 0
    candidate_views_limit: int = 100
    candidate_views_used: int = 0
    team_members_limit: int = 3
    team_members_count: int = 1
    
    # Pricing
    monthly_base_cost: float = 99.0
    per_job_cost: float = 49.0
    per_candidate_view_cost: float = 2.0
    per_team_member_cost: float = 25.0
    
    # Payment information
    default_payment_method_id: Optional[str] = None
    currency: str = "USD"
    tax_rate: float = 0.0  # As decimal (0.08 = 8%)
    
    # Billing address
    billing_address: Dict[str, str] = {
        "street": "",
        "city": "",
        "state": "",
        "zip_code": "",
        "country": "US"
    }
    
    # Tax information
    tax_id: Optional[str] = None
    vat_number: Optional[str] = None
    
    # Status
    is_active: bool = True
    is_trial: bool = True
    trial_ends_at: Optional[datetime] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            ObjectId: str
        }

class Invoice(BaseModel):
    """Invoice model for billing."""
    id: str = Field(default_factory=lambda: f"inv_{ObjectId()}")
    company_id: str
    invoice_number: str
    
    # Invoice details
    description: str
    billing_period_start: date
    billing_period_end: date
    
    # Line items
    line_items: List[Dict[str, Any]] = []
    
    # Amounts
    subtotal: float
    tax_amount: float
    discount_amount: float = 0.0
    total_amount: float
    currency: str = "USD"
    
    # Payment
    status: InvoiceStatus = InvoiceStatus.DRAFT
    due_date: date
    paid_at: Optional[datetime] = None
    payment_method: Optional[PaymentMethod] = None
    
    # External references
    stripe_invoice_id: Optional[str] = None
    payment_intent_id: Optional[str] = None
    
    # Documents
    pdf_url: Optional[str] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    sent_at: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            ObjectId: str,
            date: lambda v: v.isoformat()
        }

class Payment(BaseModel):
    """Payment transaction model."""
    id: str = Field(default_factory=lambda: f"pay_{ObjectId()}")
    company_id: str
    invoice_id: Optional[str] = None
    
    # Payment details
    amount: float
    currency: str = "USD"
    description: str
    
    # Payment method
    payment_method: PaymentMethod
    payment_method_details: Dict[str, Any] = {}
    
    # Status and processing
    status: PaymentStatus = PaymentStatus.PENDING
    failure_reason: Optional[str] = None
    
    # External payment processor
    processor: str = "stripe"  # stripe, paypal, etc.
    processor_transaction_id: Optional[str] = None
    processor_fee: Optional[float] = None
    
    # Timeline
    initiated_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Refund information
    refunded_amount: float = 0.0
    refund_reason: Optional[str] = None
    refunded_at: Optional[datetime] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            ObjectId: str
        }

class PaymentMethod(BaseModel):
    """Stored payment method information."""
    id: str = Field(default_factory=lambda: f"pm_{ObjectId()}")
    company_id: str
    
    # Payment method details
    type: str  # "card", "bank_account", "paypal"
    provider: str = "stripe"
    provider_payment_method_id: str
    
    # Card details (if applicable)
    card_last_four: Optional[str] = None
    card_brand: Optional[str] = None  # visa, mastercard, amex
    card_exp_month: Optional[int] = None
    card_exp_year: Optional[int] = None
    
    # Bank details (if applicable)
    bank_name: Optional[str] = None
    account_last_four: Optional[str] = None
    
    # Status
    is_default: bool = False
    is_active: bool = True
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            ObjectId: str
        }

class UsageRecord(BaseModel):
    """Track usage for billing purposes."""
    id: str = Field(default_factory=lambda: f"usage_{ObjectId()}")
    company_id: str
    
    # Usage details
    resource_type: str  # "job_posting", "candidate_view", "team_member"
    resource_id: Optional[str] = None
    quantity: int = 1
    unit_cost: float
    
    # Billing period
    billing_period: str  # "2024-01" for January 2024
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Metadata
    metadata: Dict[str, Any] = {}
    
    class Config:
        json_encoders = {
            ObjectId: str
        }

class Payout(BaseModel):
    """Payout to candidates or contractors."""
    id: str = Field(default_factory=lambda: f"payout_{ObjectId()}")
    company_id: str
    candidate_id: str
    contract_id: Optional[str] = None
    
    # Payout details
    amount: float
    currency: str = "USD"
    description: str
    payout_type: str = "salary"  # salary, bonus, commission, reimbursement
    
    # Processing
    status: PaymentStatus = PaymentStatus.PENDING
    processor: str = "stripe"
    processor_payout_id: Optional[str] = None
    
    # Timeline
    scheduled_for: datetime
    processed_at: Optional[datetime] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            ObjectId: str
        }
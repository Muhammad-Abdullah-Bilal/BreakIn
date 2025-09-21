"""Schemas for payment, billing, and financial management APIs."""
from typing import Dict, List, Optional, Any
from datetime import datetime, date
from pydantic import BaseModel, Field, validator
from decimal import Decimal

# Import enums from models
from app.models.employer import (
    SubscriptionPlan, PaymentStatus, InvoiceStatus, PaymentMethod as PaymentMethodEnum
)

class CompanyBillingResponse(BaseModel):
    """Schema for company billing information responses."""
    id: str
    company_id: str
    
    # Subscription details
    plan: SubscriptionPlan
    plan_started_at: datetime
    plan_expires_at: Optional[datetime]
    billing_cycle: str
    next_billing_date: datetime
    
    # Usage and limits
    job_postings_limit: int
    job_postings_used: int
    candidate_views_limit: int
    candidate_views_used: int
    team_members_limit: int
    team_members_count: int
    
    # Pricing
    monthly_base_cost: float
    per_job_cost: float
    per_candidate_view_cost: float
    per_team_member_cost: float
    currency: str
    tax_rate: float
    
    # Billing address
    billing_address: Dict[str, str]
    tax_id: Optional[str]
    vat_number: Optional[str]
    
    # Status
    is_active: bool
    is_trial: bool
    trial_ends_at: Optional[datetime]
    
    # Payment method
    default_payment_method_id: Optional[str]
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class BillingPlanUpdate(BaseModel):
    """Schema for updating billing plan."""
    plan: SubscriptionPlan
    billing_cycle: str = Field(..., pattern=r'^(monthly|quarterly|annual)$')
    
class BillingAddressUpdate(BaseModel):
    """Schema for updating billing address."""
    street: str = Field(..., min_length=1, max_length=200)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    zip_code: str = Field(..., min_length=1, max_length=20)
    country: str = Field(..., min_length=2, max_length=2)  # ISO country code
    tax_id: Optional[str] = Field(None, max_length=50)
    vat_number: Optional[str] = Field(None, max_length=50)

class InvoiceResponse(BaseModel):
    """Schema for invoice API responses."""
    id: str
    company_id: str
    invoice_number: str
    
    # Invoice details
    description: str
    billing_period_start: date
    billing_period_end: date
    
    # Line items
    line_items: List[Dict[str, Any]]
    
    # Amounts
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    currency: str
    
    # Payment
    status: InvoiceStatus
    due_date: date
    paid_at: Optional[datetime]
    payment_method: Optional[PaymentMethodEnum]
    
    # External references
    stripe_invoice_id: Optional[str]
    payment_intent_id: Optional[str]
    
    # Documents
    pdf_url: Optional[str]
    
    # Metadata
    created_at: datetime
    updated_at: datetime
    sent_at: Optional[datetime]

class InvoiceCreate(BaseModel):
    """Schema for creating invoices."""
    description: str = Field(..., min_length=1, max_length=500)
    billing_period_start: date
    billing_period_end: date
    line_items: List[Dict[str, Any]] = Field(..., min_items=1)
    due_date: date
    
    @validator('billing_period_end')
    def validate_billing_period(cls, v, values):
        if 'billing_period_start' in values and v <= values['billing_period_start']:
            raise ValueError('billing_period_end must be after billing_period_start')
        return v
    
    @validator('due_date')
    def validate_due_date(cls, v):
        if v < date.today():
            raise ValueError('due_date cannot be in the past')
        return v

class PaymentResponse(BaseModel):
    """Schema for payment API responses."""
    id: str
    company_id: str
    invoice_id: Optional[str]
    
    # Payment details
    amount: float
    currency: str
    description: str
    
    # Payment method
    payment_method: PaymentMethodEnum
    payment_method_details: Dict[str, Any]
    
    # Status
    status: PaymentStatus
    failure_reason: Optional[str]
    
    # External processor
    processor: str
    processor_transaction_id: Optional[str]
    processor_fee: Optional[float]
    
    # Timeline
    initiated_at: datetime
    processed_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    # Refund information
    refunded_amount: float
    refund_reason: Optional[str]
    refunded_at: Optional[datetime]
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class PaymentCreate(BaseModel):
    """Schema for creating payments."""
    invoice_id: Optional[str] = None
    amount: float = Field(..., gt=0)
    currency: str = Field("USD", max_length=3)
    description: str = Field(..., min_length=1, max_length=500)
    payment_method_id: str

class PaymentMethodResponse(BaseModel):
    """Schema for payment method responses."""
    id: str
    company_id: str
    
    # Payment method details
    type: str
    provider: str
    provider_payment_method_id: str
    
    # Card details (if applicable)
    card_last_four: Optional[str]
    card_brand: Optional[str]
    card_exp_month: Optional[int]
    card_exp_year: Optional[int]
    
    # Bank details (if applicable)
    bank_name: Optional[str]
    account_last_four: Optional[str]
    
    # Status
    is_default: bool
    is_active: bool
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class PaymentMethodCreate(BaseModel):
    """Schema for adding payment methods."""
    provider_payment_method_id: str = Field(..., min_length=1)
    type: str = Field(..., pattern=r'^(card|bank_account|paypal)$')
    provider: str = Field("stripe", max_length=50)
    is_default: bool = False

class UsageRecordResponse(BaseModel):
    """Schema for usage record responses."""
    id: str
    company_id: str
    
    # Usage details
    resource_type: str
    resource_id: Optional[str]
    quantity: int
    unit_cost: float
    
    # Billing period
    billing_period: str
    recorded_at: datetime
    
    # Metadata
    metadata: Dict[str, Any]

class UsageRecordCreate(BaseModel):
    """Schema for creating usage records."""
    resource_type: str = Field(..., pattern=r'^(job_posting|candidate_view|team_member)$')
    resource_id: Optional[str] = None
    quantity: int = Field(1, ge=1)
    unit_cost: float = Field(..., ge=0)
    billing_period: str = Field(..., pattern=r'^\d{4}-\d{2}$')  # YYYY-MM format
    metadata: Dict[str, Any] = Field(default={})

class PayoutResponse(BaseModel):
    """Schema for payout responses."""
    id: str
    company_id: str
    candidate_id: str
    contract_id: Optional[str]
    
    # Payout details
    amount: float
    currency: str
    description: str
    payout_type: str
    
    # Processing
    status: PaymentStatus
    processor: str
    processor_payout_id: Optional[str]
    
    # Timeline
    scheduled_for: datetime
    processed_at: Optional[datetime]
    
    # Metadata
    created_at: datetime
    updated_at: datetime

class PayoutCreate(BaseModel):
    """Schema for creating payouts."""
    candidate_id: str
    contract_id: Optional[str] = None
    amount: float = Field(..., gt=0)
    currency: str = Field("USD", max_length=3)
    description: str = Field(..., min_length=1, max_length=500)
    payout_type: str = Field("salary", pattern=r'^(salary|bonus|commission|reimbursement)$')
    scheduled_for: datetime
    
    @validator('scheduled_for')
    def validate_schedule_date(cls, v):
        if v < datetime.utcnow():
            raise ValueError('scheduled_for cannot be in the past')
        return v

class BillingAnalytics(BaseModel):
    """Schema for billing analytics responses."""
    company_id: str
    
    # Current period
    current_period_start: date
    current_period_end: date
    current_period_cost: float
    
    # Usage breakdown
    job_postings_cost: float
    candidate_views_cost: float
    team_members_cost: float
    base_subscription_cost: float
    
    # Historical data
    monthly_costs: List[Dict[str, Any]]  # Last 12 months
    
    # Projections
    projected_monthly_cost: float
    usage_trends: Dict[str, Any]
    
    # Payment history
    total_paid: float
    outstanding_amount: float
    next_payment_due: Optional[datetime]
    
    # Generated at
    generated_at: datetime

class InvoiceList(BaseModel):
    """Schema for paginated invoice lists."""
    invoices: List[InvoiceResponse]
    total_count: int
    page: int
    page_size: int
    has_next: bool
    has_previous: bool

class PaymentList(BaseModel):
    """Schema for paginated payment lists."""
    payments: List[PaymentResponse]
    total_count: int
    page: int
    page_size: int
    has_next: bool
    has_previous: bool

class BillingFilters(BaseModel):
    """Schema for billing and payment filters."""
    status: Optional[List[str]] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    amount_min: Optional[float] = Field(None, ge=0)
    amount_max: Optional[float] = Field(None, ge=0)
    payment_method: Optional[List[str]] = None
    invoice_id: Optional[str] = None
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from enum import Enum
import uuid
from decimal import Decimal

# Import your database session dependency
# from ..database import get_db

router = APIRouter(prefix="/contracts", tags=["contracts"])

# Enums
class OfferStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"
    WITHDRAWN = "withdrawn"

class ContractStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    TERMINATED = "terminated"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class BillingPlan(str, Enum):
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"

# Pydantic Models
class OfferCreate(BaseModel):
    candidate_id: str
    job_id: str
    position_title: str
    salary: Decimal = Field(..., decimal_places=2)
    currency: str = "USD"
    employment_type: str = "full_time"  # full_time, part_time, contract, internship
    start_date: datetime
    benefits: Optional[List[str]] = []
    equity_percentage: Optional[Decimal] = Field(None, decimal_places=4)
    signing_bonus: Optional[Decimal] = Field(None, decimal_places=2)
    vacation_days: Optional[int] = 20
    remote_work_allowed: bool = True
    probation_period_months: Optional[int] = 3
    notice_period_days: Optional[int] = 30
    additional_terms: Optional[str] = None
    expiry_date: Optional[datetime] = None

class OfferUpdate(BaseModel):
    salary: Optional[Decimal] = Field(None, decimal_places=2)
    start_date: Optional[datetime] = None
    benefits: Optional[List[str]] = None
    equity_percentage: Optional[Decimal] = Field(None, decimal_places=4)
    signing_bonus: Optional[Decimal] = Field(None, decimal_places=2)
    vacation_days: Optional[int] = None
    remote_work_allowed: Optional[bool] = None
    additional_terms: Optional[str] = None
    expiry_date: Optional[datetime] = None

class OfferResponse(BaseModel):
    id: str
    candidate_id: str
    candidate_name: str
    job_id: str
    position_title: str
    salary: Decimal
    currency: str
    employment_type: str
    status: OfferStatus
    created_at: datetime
    updated_at: datetime
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    responded_at: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    benefits: List[str]
    equity_percentage: Optional[Decimal] = None
    signing_bonus: Optional[Decimal] = None

class ContractCreate(BaseModel):
    offer_id: str
    contract_template_id: str
    custom_clauses: Optional[List[str]] = []
    effective_date: datetime
    end_date: Optional[datetime] = None
    auto_renewal: bool = False
    renewal_period_months: Optional[int] = 12

class ContractResponse(BaseModel):
    id: str
    offer_id: str
    candidate_id: str
    candidate_name: str
    position_title: str
    status: ContractStatus
    effective_date: datetime
    end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    contract_url: Optional[str] = None
    signed_at: Optional[datetime] = None

class PaymentCreate(BaseModel):
    contract_id: str
    amount: Decimal = Field(..., decimal_places=2)
    currency: str = "USD"
    payment_type: str  # salary, bonus, reimbursement, commission
    description: str
    due_date: datetime
    recurring: bool = False
    recurring_frequency: Optional[str] = None  # monthly, weekly, bi_weekly

class PaymentResponse(BaseModel):
    id: str
    contract_id: str
    candidate_name: str
    amount: Decimal
    currency: str
    payment_type: str
    description: str
    status: PaymentStatus
    due_date: datetime
    paid_at: Optional[datetime] = None
    created_at: datetime

class InvoiceCreate(BaseModel):
    company_id: str
    billing_plan: BillingPlan
    billing_period_start: datetime
    billing_period_end: datetime
    line_items: List[dict]  # [{"description": str, "quantity": int, "unit_price": Decimal}]
    tax_rate: Optional[Decimal] = Field(None, decimal_places=4)
    discount_percentage: Optional[Decimal] = Field(None, decimal_places=2)

class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    company_id: str
    company_name: str
    billing_plan: BillingPlan
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    currency: str
    status: PaymentStatus
    issued_at: datetime
    due_date: datetime
    paid_at: Optional[datetime] = None

class BillingPlanResponse(BaseModel):
    plan: BillingPlan
    monthly_price: Decimal
    annual_price: Decimal
    features: List[str]
    job_posting_limit: int
    candidate_search_limit: int
    ai_agent_access: bool
    priority_support: bool

# Mock database functions (replace with actual database operations)
async def get_offers_from_db(company_id: str, status: Optional[OfferStatus] = None) -> List[dict]:
    """Mock function to get offers from database"""
    mock_offers = [
        {
            "id": "offer_1",
            "candidate_id": "candidate_1",
            "candidate_name": "Alex Chen",
            "job_id": "job_1",
            "position_title": "Senior Frontend Developer",
            "salary": Decimal("140000.00"),
            "currency": "USD",
            "employment_type": "full_time",
            "status": OfferStatus.SENT,
            "created_at": datetime.now() - timedelta(days=2),
            "updated_at": datetime.now() - timedelta(days=2),
            "sent_at": datetime.now() - timedelta(days=2),
            "viewed_at": datetime.now() - timedelta(days=1),
            "responded_at": None,
            "expiry_date": datetime.now() + timedelta(days=5),
            "benefits": ["Health Insurance", "401k", "Flexible PTO"],
            "equity_percentage": Decimal("0.5"),
            "signing_bonus": Decimal("10000.00")
        }
    ]
    
    if status:
        return [offer for offer in mock_offers if offer["status"] == status]
    return mock_offers

async def create_offer_in_db(offer_data: OfferCreate, company_id: str) -> dict:
    """Mock function to create offer in database"""
    offer_id = str(uuid.uuid4())
    return {
        "id": offer_id,
        "candidate_id": offer_data.candidate_id,
        "candidate_name": "John Doe",  # Would fetch from candidate table
        "job_id": offer_data.job_id,
        "position_title": offer_data.position_title,
        "salary": offer_data.salary,
        "currency": offer_data.currency,
        "employment_type": offer_data.employment_type,
        "status": OfferStatus.DRAFT,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "sent_at": None,
        "viewed_at": None,
        "responded_at": None,
        "expiry_date": offer_data.expiry_date,
        "benefits": offer_data.benefits or [],
        "equity_percentage": offer_data.equity_percentage,
        "signing_bonus": offer_data.signing_bonus
    }

async def send_offer_notification(offer_id: str, candidate_email: str):
    """Background task to send offer notification"""
    # Implement email sending logic here
    print(f"Sending offer notification for {offer_id} to {candidate_email}")

# Offer Management Endpoints
@router.get("/offers", response_model=List[OfferResponse])
async def get_offers(
    status: Optional[OfferStatus] = None,
    company_id: str = "company_1"  # Would get from auth
):
    """Get all offers for a company"""
    try:
        offers = await get_offers_from_db(company_id, status)
        return [OfferResponse(**offer) for offer in offers]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch offers: {str(e)}")

@router.post("/offers", response_model=OfferResponse)
async def create_offer(
    offer: OfferCreate,
    background_tasks: BackgroundTasks,
    company_id: str = "company_1"  # Would get from auth
):
    """Create a new job offer"""
    try:
        # Set default expiry date if not provided
        if not offer.expiry_date:
            offer.expiry_date = datetime.now() + timedelta(days=7)
        
        offer_data = await create_offer_in_db(offer, company_id)
        
        # Add background task for notifications
        background_tasks.add_task(
            send_offer_notification, 
            offer_data["id"], 
            "candidate@example.com"  # Would fetch from candidate table
        )
        
        return OfferResponse(**offer_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create offer: {str(e)}")

@router.get("/offers/{offer_id}", response_model=OfferResponse)
async def get_offer(offer_id: str):
    """Get a specific offer by ID"""
    try:
        offers = await get_offers_from_db("company_1")
        offer = next((o for o in offers if o["id"] == offer_id), None)
        if not offer:
            raise HTTPException(status_code=404, detail="Offer not found")
        return OfferResponse(**offer)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch offer: {str(e)}")

@router.put("/offers/{offer_id}", response_model=OfferResponse)
async def update_offer(offer_id: str, offer_update: OfferUpdate):
    """Update an existing offer"""
    try:
        # Mock update logic
        offers = await get_offers_from_db("company_1")
        offer = next((o for o in offers if o["id"] == offer_id), None)
        if not offer:
            raise HTTPException(status_code=404, detail="Offer not found")
        
        # Update fields
        update_data = offer_update.dict(exclude_unset=True)
        offer.update(update_data)
        offer["updated_at"] = datetime.now()
        
        return OfferResponse(**offer)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update offer: {str(e)}")

@router.post("/offers/{offer_id}/send")
async def send_offer(offer_id: str, background_tasks: BackgroundTasks):
    """Send an offer to candidate"""
    try:
        # Update offer status to sent
        offers = await get_offers_from_db("company_1")
        offer = next((o for o in offers if o["id"] == offer_id), None)
        if not offer:
            raise HTTPException(status_code=404, detail="Offer not found")
        
        offer["status"] = OfferStatus.SENT
        offer["sent_at"] = datetime.now()
        offer["updated_at"] = datetime.now()
        
        # Send notification
        background_tasks.add_task(
            send_offer_notification, 
            offer_id, 
            "candidate@example.com"
        )
        
        return {"message": "Offer sent successfully", "offer_id": offer_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send offer: {str(e)}")

@router.post("/offers/{offer_id}/withdraw")
async def withdraw_offer(offer_id: str):
    """Withdraw an offer"""
    try:
        offers = await get_offers_from_db("company_1")
        offer = next((o for o in offers if o["id"] == offer_id), None)
        if not offer:
            raise HTTPException(status_code=404, detail="Offer not found")
        
        if offer["status"] in [OfferStatus.ACCEPTED, OfferStatus.DECLINED]:
            raise HTTPException(status_code=400, detail="Cannot withdraw offer that has been responded to")
        
        offer["status"] = OfferStatus.WITHDRAWN
        offer["updated_at"] = datetime.now()
        
        return {"message": "Offer withdrawn successfully", "offer_id": offer_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to withdraw offer: {str(e)}")

# Contract Management Endpoints
@router.get("/contracts", response_model=List[ContractResponse])
async def get_contracts(
    status: Optional[ContractStatus] = None,
    company_id: str = "company_1"
):
    """Get all contracts for a company"""
    try:
        # Mock contracts data
        contracts = [
            {
                "id": "contract_1",
                "offer_id": "offer_1",
                "candidate_id": "candidate_1",
                "candidate_name": "Alex Chen",
                "position_title": "Senior Frontend Developer",
                "status": ContractStatus.ACTIVE,
                "effective_date": datetime.now() - timedelta(days=30),
                "end_date": None,
                "created_at": datetime.now() - timedelta(days=35),
                "updated_at": datetime.now() - timedelta(days=30),
                "contract_url": "/contracts/contract_1.pdf",
                "signed_at": datetime.now() - timedelta(days=30)
            }
        ]
        
        if status:
            contracts = [c for c in contracts if c["status"] == status]
        
        return [ContractResponse(**contract) for contract in contracts]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch contracts: {str(e)}")

@router.post("/contracts", response_model=ContractResponse)
async def create_contract(contract: ContractCreate):
    """Create a new contract from an accepted offer"""
    try:
        contract_id = str(uuid.uuid4())
        contract_data = {
            "id": contract_id,
            "offer_id": contract.offer_id,
            "candidate_id": "candidate_1",  # Would fetch from offer
            "candidate_name": "Alex Chen",  # Would fetch from candidate table
            "position_title": "Senior Frontend Developer",  # Would fetch from offer
            "status": ContractStatus.PENDING,
            "effective_date": contract.effective_date,
            "end_date": contract.end_date,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "contract_url": None,
            "signed_at": None
        }
        
        return ContractResponse(**contract_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create contract: {str(e)}")

# Payment Management Endpoints
@router.get("/payments", response_model=List[PaymentResponse])
async def get_payments(
    status: Optional[PaymentStatus] = None,
    company_id: str = "company_1"
):
    """Get all payments for a company"""
    try:
        # Mock payments data
        payments = [
            {
                "id": "payment_1",
                "contract_id": "contract_1",
                "candidate_name": "Alex Chen",
                "amount": Decimal("11666.67"),  # Monthly salary
                "currency": "USD",
                "payment_type": "salary",
                "description": "Monthly salary - January 2024",
                "status": PaymentStatus.COMPLETED,
                "due_date": datetime.now() - timedelta(days=5),
                "paid_at": datetime.now() - timedelta(days=3),
                "created_at": datetime.now() - timedelta(days=10)
            }
        ]
        
        if status:
            payments = [p for p in payments if p["status"] == status]
        
        return [PaymentResponse(**payment) for payment in payments]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payments: {str(e)}")

@router.post("/payments", response_model=PaymentResponse)
async def create_payment(payment: PaymentCreate):
    """Create a new payment"""
    try:
        payment_id = str(uuid.uuid4())
        payment_data = {
            "id": payment_id,
            "contract_id": payment.contract_id,
            "candidate_name": "Alex Chen",  # Would fetch from contract
            "amount": payment.amount,
            "currency": payment.currency,
            "payment_type": payment.payment_type,
            "description": payment.description,
            "status": PaymentStatus.PENDING,
            "due_date": payment.due_date,
            "paid_at": None,
            "created_at": datetime.now()
        }
        
        return PaymentResponse(**payment_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create payment: {str(e)}")

@router.post("/payments/{payment_id}/process")
async def process_payment(payment_id: str):
    """Process a pending payment"""
    try:
        # Mock payment processing
        return {
            "message": "Payment processed successfully",
            "payment_id": payment_id,
            "status": PaymentStatus.PROCESSING,
            "processed_at": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process payment: {str(e)}")

# Billing & Invoicing Endpoints
@router.get("/invoices", response_model=List[InvoiceResponse])
async def get_invoices(company_id: str = "company_1"):
    """Get all invoices for a company"""
    try:
        # Mock invoices data
        invoices = [
            {
                "id": "invoice_1",
                "invoice_number": "INV-2024-001",
                "company_id": company_id,
                "company_name": "TechCorp Inc.",
                "billing_plan": BillingPlan.PRO,
                "subtotal": Decimal("299.00"),
                "tax_amount": Decimal("29.90"),
                "discount_amount": Decimal("0.00"),
                "total_amount": Decimal("328.90"),
                "currency": "USD",
                "status": PaymentStatus.COMPLETED,
                "issued_at": datetime.now() - timedelta(days=15),
                "due_date": datetime.now() - timedelta(days=1),
                "paid_at": datetime.now() - timedelta(days=3)
            }
        ]
        
        return [InvoiceResponse(**invoice) for invoice in invoices]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch invoices: {str(e)}")

@router.post("/invoices", response_model=InvoiceResponse)
async def create_invoice(invoice: InvoiceCreate):
    """Create a new invoice"""
    try:
        invoice_id = str(uuid.uuid4())
        invoice_number = f"INV-{datetime.now().year}-{len(await get_invoices()) + 1:03d}"
        
        # Calculate totals
        subtotal = sum(Decimal(str(item["quantity"])) * Decimal(str(item["unit_price"])) 
                      for item in invoice.line_items)
        discount_amount = subtotal * (invoice.discount_percentage or Decimal("0")) / 100
        taxable_amount = subtotal - discount_amount
        tax_amount = taxable_amount * (invoice.tax_rate or Decimal("0"))
        total_amount = taxable_amount + tax_amount
        
        invoice_data = {
            "id": invoice_id,
            "invoice_number": invoice_number,
            "company_id": invoice.company_id,
            "company_name": "TechCorp Inc.",  # Would fetch from company table
            "billing_plan": invoice.billing_plan,
            "subtotal": subtotal,
            "tax_amount": tax_amount,
            "discount_amount": discount_amount,
            "total_amount": total_amount,
            "currency": "USD",
            "status": PaymentStatus.PENDING,
            "issued_at": datetime.now(),
            "due_date": datetime.now() + timedelta(days=30),
            "paid_at": None
        }
        
        return InvoiceResponse(**invoice_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create invoice: {str(e)}")

@router.get("/billing-plans", response_model=List[BillingPlanResponse])
async def get_billing_plans():
    """Get available billing plans"""
    try:
        plans = [
            {
                "plan": BillingPlan.STARTER,
                "monthly_price": Decimal("99.00"),
                "annual_price": Decimal("990.00"),
                "features": ["Up to 5 job postings", "Basic candidate search", "Email support"],
                "job_posting_limit": 5,
                "candidate_search_limit": 50,
                "ai_agent_access": False,
                "priority_support": False
            },
            {
                "plan": BillingPlan.PRO,
                "monthly_price": Decimal("299.00"),
                "annual_price": Decimal("2990.00"),
                "features": ["Up to 50 job postings", "Advanced candidate search", "AI agent access", "Priority support"],
                "job_posting_limit": 50,
                "candidate_search_limit": 500,
                "ai_agent_access": True,
                "priority_support": True
            },
            {
                "plan": BillingPlan.ENTERPRISE,
                "monthly_price": Decimal("999.00"),
                "annual_price": Decimal("9990.00"),
                "features": ["Unlimited job postings", "Full AI suite", "Custom integrations", "Dedicated support"],
                "job_posting_limit": -1,  # Unlimited
                "candidate_search_limit": -1,  # Unlimited
                "ai_agent_access": True,
                "priority_support": True
            }
        ]
        
        return [BillingPlanResponse(**plan) for plan in plans]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch billing plans: {str(e)}")

# Analytics Endpoints
@router.get("/analytics/offers")
async def get_offer_analytics(company_id: str = "company_1"):
    """Get offer analytics for a company"""
    try:
        return {
            "total_offers": 25,
            "offers_sent": 20,
            "offers_accepted": 8,
            "offers_declined": 5,
            "offers_pending": 7,
            "acceptance_rate": 0.4,  # 8/20
            "average_time_to_response": 3.2,  # days
            "average_salary_offered": Decimal("125000.00"),
            "offers_by_month": [
                {"month": "2024-01", "count": 8},
                {"month": "2024-02", "count": 12},
                {"month": "2024-03", "count": 5}
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch offer analytics: {str(e)}")

@router.get("/analytics/contracts")
async def get_contract_analytics(company_id: str = "company_1"):
    """Get contract analytics for a company"""
    try:
        return {
            "total_contracts": 15,
            "active_contracts": 12,
            "completed_contracts": 2,
            "terminated_contracts": 1,
            "average_contract_duration": 18.5,  # months
            "total_contract_value": Decimal("1875000.00"),
            "contracts_by_type": [
                {"type": "full_time", "count": 10},
                {"type": "contract", "count": 3},
                {"type": "part_time", "count": 2}
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch contract analytics: {str(e)}")

@router.get("/analytics/payments")
async def get_payment_analytics(company_id: str = "company_1"):
    """Get payment analytics for a company"""
    try:
        return {
            "total_payments": 156,
            "total_amount_paid": Decimal("2450000.00"),
            "pending_payments": 8,
            "pending_amount": Decimal("95000.00"),
            "average_payment_amount": Decimal("15705.13"),
            "payments_by_type": [
                {"type": "salary", "count": 120, "amount": Decimal("2100000.00")},
                {"type": "bonus", "count": 25, "amount": Decimal("250000.00")},
                {"type": "reimbursement", "count": 11, "amount": Decimal("100000.00")}
            ],
            "monthly_payment_volume": [
                {"month": "2024-01", "amount": Decimal("850000.00")},
                {"month": "2024-02", "amount": Decimal("920000.00")},
                {"month": "2024-03", "amount": Decimal("680000.00")}
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payment analytics: {str(e)}")
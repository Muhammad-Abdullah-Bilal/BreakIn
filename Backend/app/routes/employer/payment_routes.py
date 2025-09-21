"""Routes for payment and billing management."""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer
from datetime import datetime, timedelta
from bson import ObjectId
import calendar

# Database and auth imports
from app.core.database import get_database
from app.core.auth import get_current_user, require_company_access
from app.models.users.user_model import UserModel
from app.models.employer.payment_model import (
    SubscriptionPlan, PaymentStatus, InvoiceStatus, PaymentMethod
)

# Schema imports
from app.schemas.employer.payment_schema import (
    CompanyBillingResponse, InvoiceResponse, PaymentResponse,
    PaymentMethodResponse, UsageRecordResponse, PayoutResponse,
    BillingAnalyticsResponse, PaymentMethodCreate, PaymentMethodUpdate
)

router = APIRouter(prefix="/billing", tags=["Billing & Payments"])
security = HTTPBearer()

@router.get("/overview", response_model=CompanyBillingResponse)
async def get_billing_overview(
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get billing overview for the company."""
    company_id = await require_company_access(current_user, db)
    
    # Get or create billing record
    billing = await db.company_billing.find_one({"company_id": company_id})
    if not billing:
        # Create default billing record
        billing = await _create_default_billing(company_id, db)
    
    return CompanyBillingResponse(**billing)

@router.post("/upgrade")
async def upgrade_subscription(
    plan: SubscriptionPlan,
    payment_method_id: Optional[str] = None,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Upgrade subscription plan."""
    company_id = await require_company_access(current_user, db)
    
    # Get current billing
    billing = await db.company_billing.find_one({"company_id": company_id})
    if not billing:
        billing = await _create_default_billing(company_id, db)
    
    # Validate upgrade
    current_plan = SubscriptionPlan(billing["plan"])
    if not _is_valid_upgrade(current_plan, plan):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan upgrade"
        )
    
    # Get plan details
    plan_details = _get_plan_details(plan)
    
    # Calculate prorated amount if mid-cycle
    prorated_amount = await _calculate_prorated_amount(
        billing, plan_details, db
    )
    
    # Process payment if required
    if prorated_amount > 0:
        if not payment_method_id:
            # Use default payment method
            payment_method = await db.payment_methods.find_one({
                "company_id": company_id,
                "is_default": True
            })
            if not payment_method:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No payment method available"
                )
            payment_method_id = payment_method["id"]
        
        # Process payment
        payment_result = await _process_payment(
            company_id, prorated_amount, payment_method_id, 
            f"Plan upgrade to {plan.value}", db
        )
        
        if not payment_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Payment failed: {payment_result['error']}"
            )
    
    # Update billing plan
    next_billing_date = _calculate_next_billing_date(plan_details["billing_cycle"])
    
    await db.company_billing.update_one(
        {"company_id": company_id},
        {
            "$set": {
                "plan": plan.value,
                "plan_price": plan_details["price"],
                "billing_cycle": plan_details["billing_cycle"],
                "next_billing_date": next_billing_date,
                "job_postings_limit": plan_details["job_postings_limit"],
                "candidate_views_limit": plan_details["candidate_views_limit"],
                "team_members_limit": plan_details["team_members_limit"],
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": f"Successfully upgraded to {plan.value} plan"}

@router.get("/invoices", response_model=List[InvoiceResponse])
async def list_invoices(
    status: Optional[InvoiceStatus] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """List company invoices."""
    company_id = await require_company_access(current_user, db)
    
    # Build query
    query = {"company_id": company_id}
    if status:
        query["status"] = status.value
    
    # Get invoices
    invoices = await db.invoices.find(query)\
        .sort("created_at", -1)\
        .skip(offset)\
        .limit(limit)\
        .to_list(length=limit)
    
    return [InvoiceResponse(**invoice) for invoice in invoices]

@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: str,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get a specific invoice."""
    company_id = await require_company_access(current_user, db)
    
    invoice = await db.invoices.find_one({
        "id": invoice_id,
        "company_id": company_id
    })
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return InvoiceResponse(**invoice)

@router.post("/invoices/{invoice_id}/pay")
async def pay_invoice(
    invoice_id: str,
    payment_method_id: Optional[str] = None,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Pay an outstanding invoice."""
    company_id = await require_company_access(current_user, db)
    
    # Get invoice
    invoice = await db.invoices.find_one({
        "id": invoice_id,
        "company_id": company_id
    })
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Check if invoice can be paid
    if invoice["status"] != InvoiceStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice is not payable"
        )
    
    # Get payment method
    if not payment_method_id:
        payment_method = await db.payment_methods.find_one({
            "company_id": company_id,
            "is_default": True
        })
        if not payment_method:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No payment method available"
            )
        payment_method_id = payment_method["id"]
    
    # Process payment
    payment_result = await _process_payment(
        company_id, invoice["total_amount"], payment_method_id,
        f"Invoice payment - {invoice['invoice_number']}", db
    )
    
    if not payment_result["success"]:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Payment failed: {payment_result['error']}"
        )
    
    # Update invoice status
    await db.invoices.update_one(
        {"id": invoice_id},
        {
            "$set": {
                "status": InvoiceStatus.PAID.value,
                "paid_at": datetime.utcnow(),
                "payment_id": payment_result["payment_id"]
            }
        }
    )
    
    return {"message": "Invoice paid successfully"}

@router.get("/payments", response_model=List[PaymentResponse])
async def list_payments(
    status: Optional[PaymentStatus] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """List company payments."""
    company_id = await require_company_access(current_user, db)
    
    # Build query
    query = {"company_id": company_id}
    if status:
        query["status"] = status.value
    
    # Get payments
    payments = await db.payments.find(query)\
        .sort("created_at", -1)\
        .skip(offset)\
        .limit(limit)\
        .to_list(length=limit)
    
    return [PaymentResponse(**payment) for payment in payments]

@router.get("/payment-methods", response_model=List[PaymentMethodResponse])
async def list_payment_methods(
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """List company payment methods."""
    company_id = await require_company_access(current_user, db)
    
    payment_methods = await db.payment_methods.find(
        {"company_id": company_id}
    ).sort("created_at", -1).to_list(length=None)
    
    return [PaymentMethodResponse(**pm) for pm in payment_methods]

@router.post("/payment-methods", response_model=PaymentMethodResponse)
async def add_payment_method(
    payment_method_data: PaymentMethodCreate,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Add a new payment method."""
    company_id = await require_company_access(current_user, db)
    
    # If this is set as default, unset other defaults
    if payment_method_data.is_default:
        await db.payment_methods.update_many(
            {"company_id": company_id, "is_default": True},
            {"$set": {"is_default": False}}
        )
    
    # Create payment method
    payment_method_id = str(ObjectId())
    payment_method_doc = {
        "id": payment_method_id,
        "company_id": company_id,
        "type": payment_method_data.type.value,
        "provider": payment_method_data.provider,
        "last_four": payment_method_data.last_four,
        "expiry_month": payment_method_data.expiry_month,
        "expiry_year": payment_method_data.expiry_year,
        "cardholder_name": payment_method_data.cardholder_name,
        "billing_address": payment_method_data.billing_address,
        "is_default": payment_method_data.is_default,
        "is_active": True,
        "provider_payment_method_id": payment_method_data.provider_payment_method_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.payment_methods.insert_one(payment_method_doc)
    return PaymentMethodResponse(**payment_method_doc)

@router.put("/payment-methods/{payment_method_id}", response_model=PaymentMethodResponse)
async def update_payment_method(
    payment_method_id: str,
    payment_method_update: PaymentMethodUpdate,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update a payment method."""
    company_id = await require_company_access(current_user, db)
    
    # Get payment method
    payment_method = await db.payment_methods.find_one({
        "id": payment_method_id,
        "company_id": company_id
    })
    if not payment_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    
    # If setting as default, unset other defaults
    update_data = payment_method_update.dict(exclude_unset=True)
    if update_data.get("is_default"):
        await db.payment_methods.update_many(
            {"company_id": company_id, "is_default": True},
            {"$set": {"is_default": False}}
        )
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Update payment method
    await db.payment_methods.update_one(
        {"id": payment_method_id},
        {"$set": update_data}
    )
    
    # Get updated payment method
    updated_pm = await db.payment_methods.find_one({"id": payment_method_id})
    return PaymentMethodResponse(**updated_pm)

@router.delete("/payment-methods/{payment_method_id}")
async def delete_payment_method(
    payment_method_id: str,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Delete a payment method."""
    company_id = await require_company_access(current_user, db)
    
    # Get payment method
    payment_method = await db.payment_methods.find_one({
        "id": payment_method_id,
        "company_id": company_id
    })
    if not payment_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    
    # Check if it's the only payment method
    pm_count = await db.payment_methods.count_documents({
        "company_id": company_id,
        "is_active": True
    })
    
    if pm_count <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the only payment method"
        )
    
    # Soft delete
    await db.payment_methods.update_one(
        {"id": payment_method_id},
        {
            "$set": {
                "is_active": False,
                "deleted_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Payment method deleted successfully"}

@router.get("/usage", response_model=List[UsageRecordResponse])
async def get_usage_records(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get usage records for billing period."""
    company_id = await require_company_access(current_user, db)
    
    # Default to current month if no dates provided
    if not start_date or not end_date:
        now = datetime.utcnow()
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    
    # Build query
    query = {
        "company_id": company_id,
        "timestamp": {"$gte": start_date, "$lte": end_date}
    }
    
    # Get usage records
    usage_records = await db.usage_records.find(query)\
        .sort("timestamp", -1)\
        .limit(limit)\
        .to_list(length=limit)
    
    return [UsageRecordResponse(**record) for record in usage_records]

@router.get("/payouts", response_model=List[PayoutResponse])
async def list_payouts(
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """List payouts (for companies that receive payments)."""
    company_id = await require_company_access(current_user, db)
    
    # Build query
    query = {"company_id": company_id}
    if status:
        query["status"] = status
    
    # Get payouts
    payouts = await db.payouts.find(query)\
        .sort("created_at", -1)\
        .skip(offset)\
        .limit(limit)\
        .to_list(length=limit)
    
    return [PayoutResponse(**payout) for payout in payouts]

@router.get("/analytics", response_model=BillingAnalyticsResponse)
async def get_billing_analytics(
    period_months: int = Query(12, ge=1, le=24),
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get billing analytics and spending trends."""
    company_id = await require_company_access(current_user, db)
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=period_months * 30)
    
    # Get spending by month
    monthly_spending = await _get_monthly_spending(company_id, start_date, end_date, db)
    
    # Get usage trends
    usage_trends = await _get_usage_trends(company_id, start_date, end_date, db)
    
    # Get cost breakdown
    cost_breakdown = await _get_cost_breakdown(company_id, start_date, end_date, db)
    
    # Calculate totals
    total_spent = sum(month["amount"] for month in monthly_spending)
    avg_monthly_spend = total_spent / max(len(monthly_spending), 1)
    
    # Get current billing info
    billing = await db.company_billing.find_one({"company_id": company_id})
    current_plan_cost = billing.get("plan_price", 0) if billing else 0
    
    return BillingAnalyticsResponse(
        total_spent=total_spent,
        avg_monthly_spend=avg_monthly_spend,
        current_plan_cost=current_plan_cost,
        monthly_spending=monthly_spending,
        usage_trends=usage_trends,
        cost_breakdown=cost_breakdown,
        period_start=start_date,
        period_end=end_date
    )

# Helper functions
async def _create_default_billing(company_id: str, db) -> dict:
    """Create default billing record for a company."""
    billing_doc = {
        "id": str(ObjectId()),
        "company_id": company_id,
        "plan": SubscriptionPlan.STARTER.value,
        "plan_price": 0.0,
        "currency": "USD",
        "billing_cycle": "monthly",
        "status": "active",
        "next_billing_date": _calculate_next_billing_date("monthly"),
        
        # Usage limits
        "job_postings_limit": 5,
        "candidate_views_limit": 50,
        "team_members_limit": 2,
        
        # Current usage
        "job_postings_used": 0,
        "candidate_views_used": 0,
        "team_members_used": 1,
        
        # Financial tracking
        "total_spent": 0.0,
        "outstanding_balance": 0.0,
        
        # Timestamps
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_activity": datetime.utcnow()
    }
    
    await db.company_billing.insert_one(billing_doc)
    return billing_doc

def _get_plan_details(plan: SubscriptionPlan) -> dict:
    """Get plan configuration details."""
    plans = {
        SubscriptionPlan.STARTER: {
            "price": 0.0,
            "billing_cycle": "monthly",
            "job_postings_limit": 5,
            "candidate_views_limit": 50,
            "team_members_limit": 2
        },
        SubscriptionPlan.PROFESSIONAL: {
            "price": 99.0,
            "billing_cycle": "monthly",
            "job_postings_limit": 25,
            "candidate_views_limit": 500,
            "team_members_limit": 10
        },
        SubscriptionPlan.ENTERPRISE: {
            "price": 299.0,
            "billing_cycle": "monthly",
            "job_postings_limit": -1,  # Unlimited
            "candidate_views_limit": -1,  # Unlimited
            "team_members_limit": -1  # Unlimited
        }
    }
    return plans.get(plan, plans[SubscriptionPlan.STARTER])

def _is_valid_upgrade(current_plan: SubscriptionPlan, new_plan: SubscriptionPlan) -> bool:
    """Check if plan upgrade is valid."""
    plan_hierarchy = {
        SubscriptionPlan.STARTER: 0,
        SubscriptionPlan.PROFESSIONAL: 1,
        SubscriptionPlan.ENTERPRISE: 2
    }
    
    return plan_hierarchy.get(new_plan, 0) > plan_hierarchy.get(current_plan, 0)

async def _calculate_prorated_amount(billing: dict, plan_details: dict, db) -> float:
    """Calculate prorated amount for plan upgrade."""
    # For MVP, return full plan price
    # In production, calculate based on remaining days in billing cycle
    return plan_details["price"]

def _calculate_next_billing_date(billing_cycle: str) -> datetime:
    """Calculate next billing date based on cycle."""
    now = datetime.utcnow()
    
    if billing_cycle == "monthly":
        # Next month, same day
        if now.month == 12:
            return now.replace(year=now.year + 1, month=1)
        else:
            # Handle month-end dates
            next_month = now.month + 1
            last_day_next_month = calendar.monthrange(now.year, next_month)[1]
            day = min(now.day, last_day_next_month)
            return now.replace(month=next_month, day=day)
    
    elif billing_cycle == "yearly":
        return now.replace(year=now.year + 1)
    
    return now + timedelta(days=30)  # Default fallback

async def _process_payment(company_id: str, amount: float, payment_method_id: str, description: str, db) -> dict:
    """Process a payment (mock implementation)."""
    # In production, integrate with payment processor (Stripe, etc.)
    payment_id = str(ObjectId())
    
    # Create payment record
    payment_doc = {
        "id": payment_id,
        "company_id": company_id,
        "payment_method_id": payment_method_id,
        "amount": amount,
        "currency": "USD",
        "description": description,
        "status": PaymentStatus.COMPLETED.value,
        "processor_payment_id": f"mock_payment_{payment_id}",
        "created_at": datetime.utcnow(),
        "processed_at": datetime.utcnow()
    }
    
    await db.payments.insert_one(payment_doc)
    
    return {
        "success": True,
        "payment_id": payment_id,
        "amount": amount
    }

async def _get_monthly_spending(company_id: str, start_date: datetime, end_date: datetime, db) -> List[Dict[str, Any]]:
    """Get monthly spending breakdown."""
    pipeline = [
        {
            "$match": {
                "company_id": company_id,
                "created_at": {"$gte": start_date, "$lte": end_date},
                "status": PaymentStatus.COMPLETED.value
            }
        },
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"}
                },
                "amount": {"$sum": "$amount"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]
    
    results = await db.payments.aggregate(pipeline).to_list(length=None)
    
    return [
        {
            "month": f"{result['_id']['year']}-{result['_id']['month']:02d}",
            "amount": result["amount"],
            "transaction_count": result["count"]
        }
        for result in results
    ]

async def _get_usage_trends(company_id: str, start_date: datetime, end_date: datetime, db) -> Dict[str, List[Dict[str, Any]]]:
    """Get usage trends over time."""
    # This would aggregate usage records by type and time
    # For MVP, return mock data structure
    return {
        "job_postings": [],
        "candidate_views": [],
        "team_members": []
    }

async def _get_cost_breakdown(company_id: str, start_date: datetime, end_date: datetime, db) -> Dict[str, float]:
    """Get cost breakdown by category."""
    # Aggregate payments by description/category
    pipeline = [
        {
            "$match": {
                "company_id": company_id,
                "created_at": {"$gte": start_date, "$lte": end_date},
                "status": PaymentStatus.COMPLETED.value
            }
        },
        {
            "$group": {
                "_id": "$description",
                "total": {"$sum": "$amount"}
            }
        }
    ]
    
    results = await db.payments.aggregate(pipeline).to_list(length=None)
    
    return {result["_id"]: result["total"] for result in results}
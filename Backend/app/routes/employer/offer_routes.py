"""Routes for offer management and contract lifecycle."""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer
from datetime import datetime, timedelta
from bson import ObjectId

# Database and auth imports
from app.core.database import get_database
from app.core.auth import get_current_user, require_company_access
from app.models.users.user_model import UserModel
from app.models.employer.offer_model import OfferStatus, ContractType

# Schema imports
from app.schemas.employer.offer_schema import (
    JobOfferCreate, JobOfferUpdate, JobOfferResponse,
    OfferStatusUpdate, ContractResponse, ContractUpdate,
    OfferTemplateCreate, OfferTemplateResponse,
    NegotiationCreate, NegotiationResponse
)

router = APIRouter(prefix="/offers", tags=["Offers"])
security = HTTPBearer()

@router.post("/", response_model=JobOfferResponse)
async def create_job_offer(
    offer_data: JobOfferCreate,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a new job offer."""
    company_id = await require_company_access(current_user, db)
    
    # Verify job posting exists and belongs to company
    job = await db.job_postings.find_one({
        "id": offer_data.job_id,
        "company_id": company_id
    })
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )
    
    # Verify candidate exists
    candidate = await db.users.find_one({"id": offer_data.candidate_id})
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Check if offer already exists for this job-candidate combination
    existing_offer = await db.job_offers.find_one({
        "job_id": offer_data.job_id,
        "candidate_id": offer_data.candidate_id,
        "status": {"$nin": ["withdrawn", "rejected", "expired"]}
    })
    if existing_offer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active offer already exists for this candidate"
        )
    
    # Create offer document
    offer_id = str(ObjectId())
    offer_doc = {
        "id": offer_id,
        "job_id": offer_data.job_id,
        "candidate_id": offer_data.candidate_id,
        "company_id": company_id,
        "recruiter_id": current_user.id,
        
        # Compensation details
        "base_salary": offer_data.base_salary,
        "currency": offer_data.currency,
        "bonus": offer_data.bonus,
        "equity": offer_data.equity,
        "benefits": offer_data.benefits,
        
        # Employment details
        "employment_type": offer_data.employment_type,
        "start_date": offer_data.start_date,
        "location": offer_data.location,
        "remote_policy": offer_data.remote_policy,
        
        # Offer terms
        "expiry_date": offer_data.expiry_date,
        "terms_and_conditions": offer_data.terms_and_conditions,
        "additional_notes": offer_data.additional_notes,
        
        # Status and tracking
        "status": OfferStatus.DRAFT.value,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "sent_at": None,
        "viewed_at": None,
        "responded_at": None,
        
        # Metadata
        "version": 1,
        "negotiation_rounds": 0
    }
    
    # Insert offer
    await db.job_offers.insert_one(offer_doc)
    
    # Update application status if exists
    await db.job_applications.update_one(
        {
            "job_id": offer_data.job_id,
            "candidate_id": offer_data.candidate_id
        },
        {
            "$set": {
                "stage": "offer",
                "last_updated": datetime.utcnow()
            }
        }
    )
    
    # Track usage for billing
    await _track_offer_usage(company_id, db)
    
    return JobOfferResponse(**offer_doc)

@router.get("/", response_model=List[JobOfferResponse])
async def list_job_offers(
    job_id: Optional[str] = Query(None),
    candidate_id: Optional[str] = Query(None),
    status: Optional[OfferStatus] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """List job offers with optional filters."""
    company_id = await require_company_access(current_user, db)
    
    # Build query
    query = {"company_id": company_id}
    if job_id:
        query["job_id"] = job_id
    if candidate_id:
        query["candidate_id"] = candidate_id
    if status:
        query["status"] = status.value
    
    # Get offers
    offers = await db.job_offers.find(query)\
        .sort("created_at", -1)\
        .skip(offset)\
        .limit(limit)\
        .to_list(length=limit)
    
    return [JobOfferResponse(**offer) for offer in offers]

@router.get("/{offer_id}", response_model=JobOfferResponse)
async def get_job_offer(
    offer_id: str,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get a specific job offer."""
    company_id = await require_company_access(current_user, db)
    
    offer = await db.job_offers.find_one({
        "id": offer_id,
        "company_id": company_id
    })
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )
    
    return JobOfferResponse(**offer)

@router.put("/{offer_id}", response_model=JobOfferResponse)
async def update_job_offer(
    offer_id: str,
    offer_update: JobOfferUpdate,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update a job offer (only if not yet sent)."""
    company_id = await require_company_access(current_user, db)
    
    # Get existing offer
    offer = await db.job_offers.find_one({
        "id": offer_id,
        "company_id": company_id
    })
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )
    
    # Check if offer can be updated
    if offer["status"] not in [OfferStatus.DRAFT.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update offer that has been sent"
        )
    
    # Prepare update data
    update_data = offer_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    update_data["version"] = offer["version"] + 1
    
    # Update offer
    await db.job_offers.update_one(
        {"id": offer_id},
        {"$set": update_data}
    )
    
    # Get updated offer
    updated_offer = await db.job_offers.find_one({"id": offer_id})
    return JobOfferResponse(**updated_offer)

@router.post("/{offer_id}/send")
async def send_job_offer(
    offer_id: str,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Send a job offer to the candidate."""
    company_id = await require_company_access(current_user, db)
    
    # Get offer
    offer = await db.job_offers.find_one({
        "id": offer_id,
        "company_id": company_id
    })
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )
    
    # Check if offer can be sent
    if offer["status"] != OfferStatus.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Offer has already been sent or is not in draft status"
        )
    
    # Update offer status
    await db.job_offers.update_one(
        {"id": offer_id},
        {
            "$set": {
                "status": OfferStatus.SENT.value,
                "sent_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # TODO: Send notification to candidate
    # await notification_service.send_offer_notification(offer)
    
    return {"message": "Offer sent successfully"}

@router.patch("/{offer_id}/status", response_model=JobOfferResponse)
async def update_offer_status(
    offer_id: str,
    status_update: OfferStatusUpdate,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update offer status (for system/candidate responses)."""
    company_id = await require_company_access(current_user, db)
    
    # Get offer
    offer = await db.job_offers.find_one({
        "id": offer_id,
        "company_id": company_id
    })
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )
    
    # Prepare update
    update_data = {
        "status": status_update.status.value,
        "updated_at": datetime.utcnow()
    }
    
    # Add timestamp based on status
    if status_update.status == OfferStatus.VIEWED:
        update_data["viewed_at"] = datetime.utcnow()
    elif status_update.status in [OfferStatus.ACCEPTED, OfferStatus.REJECTED]:
        update_data["responded_at"] = datetime.utcnow()
    
    if status_update.notes:
        update_data["response_notes"] = status_update.notes
    
    # Update offer
    await db.job_offers.update_one(
        {"id": offer_id},
        {"$set": update_data}
    )
    
    # Update application status if accepted
    if status_update.status == OfferStatus.ACCEPTED:
        await db.job_applications.update_one(
            {
                "job_id": offer["job_id"],
                "candidate_id": offer["candidate_id"]
            },
            {
                "$set": {
                    "status": "hired",
                    "stage": "hired",
                    "last_updated": datetime.utcnow()
                }
            }
        )
    
    # Get updated offer
    updated_offer = await db.job_offers.find_one({"id": offer_id})
    return JobOfferResponse(**updated_offer)

@router.post("/{offer_id}/withdraw")
async def withdraw_offer(
    offer_id: str,
    reason: Optional[str] = None,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Withdraw a job offer."""
    company_id = await require_company_access(current_user, db)
    
    # Get offer
    offer = await db.job_offers.find_one({
        "id": offer_id,
        "company_id": company_id
    })
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )
    
    # Check if offer can be withdrawn
    if offer["status"] in [OfferStatus.ACCEPTED.value, OfferStatus.WITHDRAWN.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot withdraw accepted or already withdrawn offer"
        )
    
    # Update offer
    await db.job_offers.update_one(
        {"id": offer_id},
        {
            "$set": {
                "status": OfferStatus.WITHDRAWN.value,
                "withdrawal_reason": reason,
                "withdrawn_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Offer withdrawn successfully"}

@router.get("/{offer_id}/contract", response_model=ContractResponse)
async def get_contract(
    offer_id: str,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get contract details for an accepted offer."""
    company_id = await require_company_access(current_user, db)
    
    # Get offer
    offer = await db.job_offers.find_one({
        "id": offer_id,
        "company_id": company_id
    })
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )
    
    # Check if offer is accepted
    if offer["status"] != OfferStatus.ACCEPTED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract only available for accepted offers"
        )
    
    # Get or create contract
    contract = await db.contracts.find_one({"offer_id": offer_id})
    if not contract:
        # Generate contract from offer
        contract = await _generate_contract_from_offer(offer, db)
    
    return ContractResponse(**contract)

@router.post("/{offer_id}/negotiate", response_model=NegotiationResponse)
async def create_negotiation(
    offer_id: str,
    negotiation_data: NegotiationCreate,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a negotiation round for an offer."""
    company_id = await require_company_access(current_user, db)
    
    # Get offer
    offer = await db.job_offers.find_one({
        "id": offer_id,
        "company_id": company_id
    })
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )
    
    # Check if negotiation is allowed
    if offer["status"] not in [OfferStatus.SENT.value, OfferStatus.VIEWED.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Negotiation not allowed for current offer status"
        )
    
    # Create negotiation record
    negotiation_id = str(ObjectId())
    negotiation_doc = {
        "id": negotiation_id,
        "offer_id": offer_id,
        "round_number": offer["negotiation_rounds"] + 1,
        "initiated_by": "company",  # Since this is from employer side
        "proposed_changes": negotiation_data.proposed_changes,
        "message": negotiation_data.message,
        "status": "pending",
        "created_at": datetime.utcnow(),
        "expires_at": negotiation_data.expires_at
    }
    
    # Insert negotiation
    await db.offer_negotiations.insert_one(negotiation_doc)
    
    # Update offer negotiation count
    await db.job_offers.update_one(
        {"id": offer_id},
        {
            "$inc": {"negotiation_rounds": 1},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    return NegotiationResponse(**negotiation_doc)

@router.get("/{offer_id}/negotiations", response_model=List[NegotiationResponse])
async def get_negotiations(
    offer_id: str,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all negotiation rounds for an offer."""
    company_id = await require_company_access(current_user, db)
    
    # Verify offer access
    offer = await db.job_offers.find_one({
        "id": offer_id,
        "company_id": company_id
    })
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )
    
    # Get negotiations
    negotiations = await db.offer_negotiations.find(
        {"offer_id": offer_id}
    ).sort("round_number", 1).to_list(length=None)
    
    return [NegotiationResponse(**neg) for neg in negotiations]

# Template management endpoints
@router.post("/templates", response_model=OfferTemplateResponse)
async def create_offer_template(
    template_data: OfferTemplateCreate,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create an offer template."""
    company_id = await require_company_access(current_user, db)
    
    template_id = str(ObjectId())
    template_doc = {
        "id": template_id,
        "company_id": company_id,
        "name": template_data.name,
        "description": template_data.description,
        "template_data": template_data.template_data,
        "is_default": template_data.is_default,
        "created_by": current_user.id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # If this is set as default, unset other defaults
    if template_data.is_default:
        await db.offer_templates.update_many(
            {"company_id": company_id, "is_default": True},
            {"$set": {"is_default": False}}
        )
    
    await db.offer_templates.insert_one(template_doc)
    return OfferTemplateResponse(**template_doc)

@router.get("/templates", response_model=List[OfferTemplateResponse])
async def list_offer_templates(
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """List offer templates for the company."""
    company_id = await require_company_access(current_user, db)
    
    templates = await db.offer_templates.find(
        {"company_id": company_id}
    ).sort("created_at", -1).to_list(length=None)
    
    return [OfferTemplateResponse(**template) for template in templates]

# Helper functions
async def _track_offer_usage(company_id: str, db):
    """Track offer creation for billing purposes."""
    await db.company_billing.update_one(
        {"company_id": company_id},
        {
            "$inc": {"offers_sent": 1},
            "$set": {"last_activity": datetime.utcnow()}
        },
        upsert=True
    )

async def _generate_contract_from_offer(offer: dict, db) -> dict:
    """Generate a contract document from an accepted offer."""
    contract_id = str(ObjectId())
    
    # Get job and candidate details
    job = await db.job_postings.find_one({"id": offer["job_id"]})
    candidate = await db.users.find_one({"id": offer["candidate_id"]})
    company = await db.companies.find_one({"id": offer["company_id"]})
    
    contract_doc = {
        "id": contract_id,
        "offer_id": offer["id"],
        "job_id": offer["job_id"],
        "candidate_id": offer["candidate_id"],
        "company_id": offer["company_id"],
        
        # Contract details
        "contract_type": ContractType.FULL_TIME.value,  # Default, could be derived from offer
        "title": job.get("title") if job else "Position",
        "department": job.get("department") if job else None,
        
        # Compensation from offer
        "base_salary": offer["base_salary"],
        "currency": offer["currency"],
        "bonus": offer.get("bonus"),
        "equity": offer.get("equity"),
        "benefits": offer.get("benefits", []),
        
        # Employment terms
        "start_date": offer["start_date"],
        "location": offer["location"],
        "remote_policy": offer.get("remote_policy"),
        "probation_period": 90,  # Default 90 days
        
        # Contract terms
        "terms_and_conditions": offer.get("terms_and_conditions"),
        "confidentiality_clause": True,
        "non_compete_clause": False,  # Default, should be configurable
        
        # Status
        "status": "generated",
        "generated_at": datetime.utcnow(),
        "signed_by_candidate": False,
        "signed_by_company": False,
        "effective_date": None
    }
    
    # Insert contract
    await db.contracts.insert_one(contract_doc)
    return contract_doc
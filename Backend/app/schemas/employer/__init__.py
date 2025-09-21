"""Employer-side API schemas for the BreakIn platform."""

from .job_schema import (
    JobPostingCreate,
    JobPostingUpdate,
    JobPostingResponse,
    JobPostingList,
    JobPostingFilters,
    JobApplicationResponse,
    ApplicationStatusUpdate,
    JobPipelineResponse,
    JobPipelineUpdate,
    JobAnalytics
)

from .offer_schema import (
    JobOfferCreate,
    JobOfferUpdate,
    JobOfferResponse,
    OfferStatusUpdate,
    ContractResponse,
    ContractCreate,
    OfferTemplateResponse,
    OfferTemplateCreate,
    OfferNegotiationResponse,
    OfferNegotiationCreate,
    OfferList,
    OfferFilters
)

from .payment_schema import (
    CompanyBillingResponse,
    BillingPlanUpdate,
    BillingAddressUpdate,
    InvoiceResponse,
    InvoiceCreate,
    PaymentResponse,
    PaymentCreate,
    PaymentMethodResponse,
    PaymentMethodCreate,
    UsageRecordResponse,
    UsageRecordCreate,
    PayoutResponse,
    PayoutCreate,
    BillingAnalytics,
    InvoiceList,
    PaymentList,
    BillingFilters
)

__all__ = [
    # Job posting schemas
    "JobPostingCreate",
    "JobPostingUpdate",
    "JobPostingResponse",
    "JobPostingList",
    "JobPostingFilters",
    "JobApplicationResponse",
    "ApplicationStatusUpdate",
    "JobPipelineResponse",
    "JobPipelineUpdate",
    "JobAnalytics",
    
    # Offer and contract schemas
    "JobOfferCreate",
    "JobOfferUpdate",
    "JobOfferResponse",
    "OfferStatusUpdate",
    "ContractResponse",
    "ContractCreate",
    "OfferTemplateResponse",
    "OfferTemplateCreate",
    "OfferNegotiationResponse",
    "OfferNegotiationCreate",
    "OfferList",
    "OfferFilters",
    
    # Payment and billing schemas
    "CompanyBillingResponse",
    "BillingPlanUpdate",
    "BillingAddressUpdate",
    "InvoiceResponse",
    "InvoiceCreate",
    "PaymentResponse",
    "PaymentCreate",
    "PaymentMethodResponse",
    "PaymentMethodCreate",
    "UsageRecordResponse",
    "UsageRecordCreate",
    "PayoutResponse",
    "PayoutCreate",
    "BillingAnalytics",
    "InvoiceList",
    "PaymentList",
    "BillingFilters"
]
"""Employer routes package initialization."""
from fastapi import APIRouter, Depends
from app.core.auth import require_role

# Import all employer route modules
from .job_routes import router as job_router
from .dashboard_routes import router as dashboard_router
from .offer_routes import router as offer_router
from .payment_routes import router as payment_router
from .matching_routes import router as matching_router
from .reports_routes import router as reports_router

# Create main employer router protected by role authorization
employer_router = APIRouter(
    prefix="/employer",
    tags=["Employer"],
    dependencies=[Depends(require_role(["employer", "admin"]))]
)

# Include all sub-routers
employer_router.include_router(job_router)
employer_router.include_router(dashboard_router)
employer_router.include_router(offer_router)
employer_router.include_router(payment_router)
employer_router.include_router(matching_router)
employer_router.include_router(reports_router)

# Export for use in main application
__all__ = [
    "employer_router",
    "job_router",
    "dashboard_router", 
    "offer_router",
    "payment_router",
    "matching_router",
    "reports_router"
]
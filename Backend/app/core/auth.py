"""Authentication and authorization utilities."""
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from bson import ObjectId
import os
from enum import Enum

# Database imports
from app.core.database import get_database
from app.models.users.user_model import UserModel

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

class UserRole(str, Enum):
    """User roles in the system."""
    SUPER_ADMIN = "super_admin"
    COMPANY_ADMIN = "company_admin"
    HIRING_MANAGER = "hiring_manager"
    RECRUITER = "recruiter"
    HR_SPECIALIST = "hr_specialist"
    CANDIDATE = "candidate"

class Permission(str, Enum):
    """System permissions."""
    # Job management
    CREATE_JOBS = "create_jobs"
    EDIT_JOBS = "edit_jobs"
    DELETE_JOBS = "delete_jobs"
    VIEW_JOBS = "view_jobs"
    PUBLISH_JOBS = "publish_jobs"
    
    # Candidate management
    VIEW_CANDIDATES = "view_candidates"
    CONTACT_CANDIDATES = "contact_candidates"
    MANAGE_APPLICATIONS = "manage_applications"
    
    # Offer management
    CREATE_OFFERS = "create_offers"
    APPROVE_OFFERS = "approve_offers"
    SEND_OFFERS = "send_offers"
    MANAGE_CONTRACTS = "manage_contracts"
    
    # Team management
    MANAGE_TEAM = "manage_team"
    VIEW_TEAM_ACTIVITY = "view_team_activity"
    
    # Financial
    VIEW_BILLING = "view_billing"
    MANAGE_BILLING = "manage_billing"
    VIEW_REPORTS = "view_reports"
    EXPORT_DATA = "export_data"
    
    # System admin
    MANAGE_COMPANY = "manage_company"
    SYSTEM_ADMIN = "system_admin"

# Role-based permissions mapping
ROLE_PERMISSIONS = {
    UserRole.SUPER_ADMIN: list(Permission),  # All permissions
    UserRole.COMPANY_ADMIN: [
        Permission.CREATE_JOBS, Permission.EDIT_JOBS, Permission.DELETE_JOBS, Permission.VIEW_JOBS, Permission.PUBLISH_JOBS,
        Permission.VIEW_CANDIDATES, Permission.CONTACT_CANDIDATES, Permission.MANAGE_APPLICATIONS,
        Permission.CREATE_OFFERS, Permission.APPROVE_OFFERS, Permission.SEND_OFFERS, Permission.MANAGE_CONTRACTS,
        Permission.MANAGE_TEAM, Permission.VIEW_TEAM_ACTIVITY,
        Permission.VIEW_BILLING, Permission.MANAGE_BILLING, Permission.VIEW_REPORTS, Permission.EXPORT_DATA,
        Permission.MANAGE_COMPANY
    ],
    UserRole.HIRING_MANAGER: [
        Permission.CREATE_JOBS, Permission.EDIT_JOBS, Permission.VIEW_JOBS, Permission.PUBLISH_JOBS,
        Permission.VIEW_CANDIDATES, Permission.CONTACT_CANDIDATES, Permission.MANAGE_APPLICATIONS,
        Permission.CREATE_OFFERS, Permission.APPROVE_OFFERS, Permission.SEND_OFFERS, Permission.MANAGE_CONTRACTS,
        Permission.VIEW_TEAM_ACTIVITY, Permission.VIEW_REPORTS
    ],
    UserRole.RECRUITER: [
        Permission.VIEW_JOBS, Permission.EDIT_JOBS,
        Permission.VIEW_CANDIDATES, Permission.CONTACT_CANDIDATES, Permission.MANAGE_APPLICATIONS,
        Permission.CREATE_OFFERS, Permission.SEND_OFFERS,
        Permission.VIEW_REPORTS
    ],
    UserRole.HR_SPECIALIST: [
        Permission.VIEW_JOBS, Permission.VIEW_CANDIDATES, Permission.MANAGE_APPLICATIONS,
        Permission.MANAGE_CONTRACTS, Permission.VIEW_TEAM_ACTIVITY, Permission.VIEW_REPORTS
    ],
    UserRole.CANDIDATE: []  # Candidates have different permission system
}

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return payload
    except JWTError:
        return None

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_database)
) -> UserModel:
    """Get the current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_token(credentials.credentials, "access")
        if payload is None:
            raise credentials_exception
        
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    user_doc = await db.users.find_one({"id": user_id})
    if user_doc is None:
        raise credentials_exception
    
    # Convert to UserModel
    user = UserModel(**user_doc)
    return user

async def get_current_active_user(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    """Get the current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

async def require_company_access(user: UserModel, db) -> str:
    """Require user to have company access and return company_id."""
    if not user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be associated with a company"
        )
    
    # Verify company exists and user has access
    company = await db.companies.find_one({"id": user.company_id})
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Check if user is active in company
    if user.id not in company.get("active_members", []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not an active member of this company"
        )
    
    return user.company_id

def require_permission(permission: Permission):
    """Decorator to require specific permission."""
    def permission_checker(current_user: UserModel = Depends(get_current_active_user)):
        user_permissions = get_user_permissions(current_user)
        if permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {permission.value}"
            )
        return current_user
    return permission_checker

def require_role(allowed_roles: List[UserRole]):
    """Decorator to require specific role(s)."""
    def role_checker(current_user: UserModel = Depends(get_current_active_user)):
        if current_user.role not in [role.value for role in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role required: {', '.join([role.value for role in allowed_roles])}"
            )
        return current_user
    return role_checker

def get_user_permissions(user: UserModel) -> List[Permission]:
    """Get all permissions for a user based on their role."""
    try:
        user_role = UserRole(user.role)
        return ROLE_PERMISSIONS.get(user_role, [])
    except ValueError:
        # Invalid role
        return []

def has_permission(user: UserModel, permission: Permission) -> bool:
    """Check if user has a specific permission."""
    user_permissions = get_user_permissions(user)
    return permission in user_permissions

async def require_job_access(user: UserModel, job_id: str, db) -> dict:
    """Require user to have access to a specific job."""
    job = await db.job_postings.find_one({"id": job_id})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check if user's company owns the job
    if job["company_id"] != user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this job"
        )
    
    # Additional role-based checks
    if user.role == UserRole.RECRUITER.value:
        # Recruiters can only access jobs assigned to them
        if job.get("recruiter_id") != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: job not assigned to you"
            )
    
    return job

async def require_candidate_access(user: UserModel, candidate_id: str, db) -> dict:
    """Require user to have access to a specific candidate."""
    # Check if candidate applied to any of the company's jobs
    application = await db.job_applications.find_one({
        "candidate_id": candidate_id,
        "job_id": {"$in": await get_company_job_ids(user.company_id, db)}
    })
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this candidate"
        )
    
    # Get candidate details
    candidate = await db.users.find_one({"id": candidate_id})
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    return candidate

async def get_company_job_ids(company_id: str, db) -> List[str]:
    """Get all job IDs for a company."""
    jobs = await db.job_postings.find(
        {"company_id": company_id},
        {"id": 1}
    ).to_list(length=None)
    return [job["id"] for job in jobs]

async def log_user_activity(user: UserModel, action: str, resource_type: str, resource_id: str, db, metadata: Optional[Dict[str, Any]] = None):
    """Log user activity for audit purposes."""
    activity_log = {
        "id": str(ObjectId()),
        "user_id": user.id,
        "company_id": user.company_id,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "metadata": metadata or {},
        "timestamp": datetime.utcnow(),
        "ip_address": None,  # Would be populated from request context
        "user_agent": None   # Would be populated from request context
    }
    
    await db.activity_logs.insert_one(activity_log)

# Rate limiting helpers
class RateLimiter:
    """Simple rate limiter for API endpoints."""
    
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = {}  # In production, use Redis
    
    async def is_allowed(self, key: str) -> bool:
        """Check if request is allowed under rate limit."""
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=self.window_seconds)
        
        # Clean old entries
        if key in self.requests:
            self.requests[key] = [
                req_time for req_time in self.requests[key]
                if req_time > window_start
            ]
        else:
            self.requests[key] = []
        
        # Check if under limit
        if len(self.requests[key]) >= self.max_requests:
            return False
        
        # Add current request
        self.requests[key].append(now)
        return True

# Create rate limiters for different endpoints
api_rate_limiter = RateLimiter(max_requests=100, window_seconds=60)  # 100 requests per minute
search_rate_limiter = RateLimiter(max_requests=20, window_seconds=60)  # 20 searches per minute
export_rate_limiter = RateLimiter(max_requests=5, window_seconds=300)  # 5 exports per 5 minutes

async def check_rate_limit(limiter: RateLimiter, user: UserModel):
    """Check rate limit for a user."""
    key = f"user:{user.id}"
    if not await limiter.is_allowed(key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        )

# Usage tracking for billing
async def track_usage(user: UserModel, action: str, db, cost: float = 0.0, metadata: Optional[Dict[str, Any]] = None):
    """Track usage for billing purposes."""
    usage_record = {
        "id": str(ObjectId()),
        "company_id": user.company_id,
        "user_id": user.id,
        "action": action,
        "cost": cost,
        "metadata": metadata or {},
        "timestamp": datetime.utcnow()
    }
    
    await db.usage_records.insert_one(usage_record)
    
    # Update company usage summary
    await db.company_billing.update_one(
        {"company_id": user.company_id},
        {
            "$inc": {
                "current_usage.total_cost": cost,
                f"current_usage.actions.{action}": 1
            },
            "$set": {"last_updated": datetime.utcnow()}
        },
        upsert=True
    )

# Company subscription helpers
async def check_subscription_limits(user: UserModel, action: str, db) -> bool:
    """Check if action is allowed under current subscription."""
    billing = await db.company_billing.find_one({"company_id": user.company_id})
    if not billing:
        # No billing record, assume basic limits
        return await _check_basic_limits(user.company_id, action, db)
    
    plan = billing.get("subscription_plan", "basic")
    current_usage = billing.get("current_usage", {})
    
    # Define plan limits
    plan_limits = {
        "basic": {
            "job_postings": 5,
            "candidate_searches": 50,
            "exports": 10,
            "team_members": 3
        },
        "professional": {
            "job_postings": 25,
            "candidate_searches": 500,
            "exports": 100,
            "team_members": 10
        },
        "enterprise": {
            "job_postings": -1,  # Unlimited
            "candidate_searches": -1,
            "exports": -1,
            "team_members": -1
        }
    }
    
    limits = plan_limits.get(plan, plan_limits["basic"])
    limit = limits.get(action, 0)
    
    if limit == -1:  # Unlimited
        return True
    
    current_count = current_usage.get("actions", {}).get(action, 0)
    return current_count < limit

async def _check_basic_limits(company_id: str, action: str, db) -> bool:
    """Check basic limits for companies without billing setup."""
    # Count current usage this month
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    current_usage = await db.usage_records.count_documents({
        "company_id": company_id,
        "action": action,
        "timestamp": {"$gte": start_of_month}
    })
    
    basic_limits = {
        "job_postings": 5,
        "candidate_searches": 50,
        "exports": 10
    }
    
    limit = basic_limits.get(action, 0)
    return current_usage < limit
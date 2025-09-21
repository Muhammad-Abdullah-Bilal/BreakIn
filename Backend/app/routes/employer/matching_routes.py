"""Routes for candidate matching and discovery."""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer
from datetime import datetime, timedelta
from bson import ObjectId

# Database and auth imports
from app.core.database import get_database
from app.core.auth import get_current_user, require_company_access
from app.models.users.user_model import UserModel

# Existing matching system imports
# Temporarily commented out to fix schema generation error
# from app.schemas.matching.match_request_schema import (
#     MatchRequest, MatchResponse, MatchFilters, RoleRequirements
# )

# Pydantic models for employer-specific matching
from pydantic import BaseModel, Field
from enum import Enum

router = APIRouter(prefix="/matching", tags=["Matching & Discovery"])
security = HTTPBearer()

class SearchSortBy(str, Enum):
    RELEVANCE = "relevance"
    MATCH_SCORE = "match_score"
    EXPERIENCE = "experience"
    LAST_ACTIVE = "last_active"
    CREATED_AT = "created_at"

class CandidateSearchRequest(BaseModel):
    """Request model for candidate search."""
    # Job-specific search
    job_id: Optional[str] = None
    
    # Skills and experience
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    min_experience_years: Optional[int] = None
    max_experience_years: Optional[int] = None
    
    # Location and remote work
    locations: List[str] = []
    remote_ok: Optional[bool] = None
    
    # Compensation
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    currency: str = "USD"
    
    # Availability
    availability_status: Optional[str] = None  # "available", "passive", "not_looking"
    
    # Education and certifications
    education_levels: List[str] = []
    certifications: List[str] = []
    
    # Diversity and inclusion
    diversity_filters: Dict[str, Any] = {}
    
    # Search parameters
    query: Optional[str] = None  # Free text search
    sort_by: SearchSortBy = SearchSortBy.RELEVANCE
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)
    
    # AI matching
    use_ai_matching: bool = True
    min_match_score: float = Field(0.0, ge=0.0, le=1.0)

class CandidateSearchResult(BaseModel):
    """Individual candidate search result."""
    candidate_id: str
    profile_id: str
    
    # Basic info
    name: str
    title: Optional[str]
    location: Optional[str]
    
    # Professional info
    experience_years: Optional[int]
    current_company: Optional[str]
    skills: List[str]
    
    # Matching info
    match_score: Optional[float]
    matching_reasons: List[str] = []
    
    # Availability
    availability_status: Optional[str]
    last_active: Optional[datetime]
    
    # Privacy settings
    profile_visibility: str
    contact_allowed: bool
    
    # Metadata
    indexed_at: datetime

class CandidateSearchResponse(BaseModel):
    """Response model for candidate search."""
    candidates: List[CandidateSearchResult]
    total_count: int
    search_time_ms: int
    filters_applied: Dict[str, Any]
    
    # Pagination
    limit: int
    offset: int
    has_more: bool
    
    # Search metadata
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class SavedSearch(BaseModel):
    """Saved search configuration."""
    id: str
    name: str
    description: Optional[str]
    search_criteria: CandidateSearchRequest
    alert_frequency: str  # "immediate", "daily", "weekly"
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_run: Optional[datetime]
    results_count: int

class MatchingInsights(BaseModel):
    """Insights about matching performance."""
    job_id: Optional[str]
    total_candidates_matched: int
    avg_match_score: float
    top_matching_skills: List[Dict[str, Any]]
    location_distribution: Dict[str, int]
    experience_distribution: Dict[str, int]
    availability_breakdown: Dict[str, int]
    
    # Recommendations
    suggested_skill_adjustments: List[str] = []
    suggested_location_expansions: List[str] = []
    
    generated_at: datetime = Field(default_factory=datetime.utcnow)

@router.post("/search", response_model=CandidateSearchResponse)
async def search_candidates(
    search_request: CandidateSearchRequest,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Search for candidates with advanced filtering and AI matching."""
    company_id = await require_company_access(current_user, db)
    
    # Track search for billing
    await _track_search_usage(company_id, db)
    
    start_time = datetime.utcnow()
    
    # Build search query
    search_query = await _build_candidate_search_query(
        search_request, company_id, db
    )
    
    # Execute search
    candidates_cursor = db.candidate_profiles.find(search_query)
    
    # Apply sorting
    sort_field, sort_direction = _get_sort_parameters(search_request.sort_by)
    candidates_cursor = candidates_cursor.sort(sort_field, sort_direction)
    
    # Get total count for pagination
    total_count = await db.candidate_profiles.count_documents(search_query)
    
    # Apply pagination
    candidates = await candidates_cursor.skip(search_request.offset)\
        .limit(search_request.limit).to_list(length=search_request.limit)
    
    # Process results with AI matching if enabled
    processed_candidates = []
    for candidate in candidates:
        result = await _process_candidate_result(
            candidate, search_request, company_id, db
        )
        if result:
            processed_candidates.append(result)
    
    # Calculate search time
    search_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
    
    # Build response
    return CandidateSearchResponse(
        candidates=processed_candidates,
        total_count=total_count,
        search_time_ms=search_time_ms,
        filters_applied=search_request.dict(exclude_unset=True),
        limit=search_request.limit,
        offset=search_request.offset,
        has_more=(search_request.offset + len(processed_candidates)) < total_count
    )

@router.post("/match-for-job/{job_id}", response_model=MatchResponse)
async def match_candidates_for_job(
    job_id: str,
    filters: Optional[MatchFilters] = None,
    limit: int = Query(20, ge=1, le=100),
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get AI-matched candidates for a specific job posting."""
    company_id = await require_company_access(current_user, db)
    
    # Verify job exists and belongs to company
    job = await db.job_postings.find_one({
        "id": job_id,
        "company_id": company_id
    })
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )
    
    # Build match request from job posting
    role_requirements = RoleRequirements(
        title=job["title"],
        required_skills=job.get("required_skills", []),
        preferred_skills=job.get("preferred_skills", []),
        experience_level=job.get("experience_level"),
        location=job.get("location"),
        remote_ok=job.get("remote_policy") in ["remote", "hybrid"]
    )
    
    match_request = MatchRequest(
        company_id=company_id,
        job_id=job_id,
        role_requirements=role_requirements,
        filters=filters or MatchFilters(),
        limit=limit
    )
    
    # Use existing matching service
    # This would integrate with the existing matching system
    matching_service = await _get_matching_service(db)
    match_response = await matching_service.find_matches(match_request)
    
    # Track usage
    await _track_matching_usage(company_id, len(match_response.candidates), db)
    
    return match_response

@router.get("/insights/{job_id}", response_model=MatchingInsights)
async def get_matching_insights(
    job_id: str,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get insights about matching performance for a job."""
    company_id = await require_company_access(current_user, db)
    
    # Verify job access
    job = await db.job_postings.find_one({
        "id": job_id,
        "company_id": company_id
    })
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )
    
    # Get matching data for this job
    applications = await db.job_applications.find({
        "job_id": job_id,
        "ai_match_score": {"$exists": True}
    }).to_list(length=None)
    
    if not applications:
        # Return empty insights if no matches yet
        return MatchingInsights(
            job_id=job_id,
            total_candidates_matched=0,
            avg_match_score=0.0,
            top_matching_skills=[],
            location_distribution={},
            experience_distribution={},
            availability_breakdown={}
        )
    
    # Calculate insights
    total_matched = len(applications)
    avg_score = sum(app.get("ai_match_score", 0) for app in applications) / total_matched
    
    # Analyze skills, locations, experience
    skills_analysis = await _analyze_matching_skills(applications, db)
    location_analysis = await _analyze_locations(applications, db)
    experience_analysis = await _analyze_experience(applications, db)
    availability_analysis = await _analyze_availability(applications, db)
    
    # Generate recommendations
    suggestions = await _generate_matching_suggestions(job, applications, db)
    
    return MatchingInsights(
        job_id=job_id,
        total_candidates_matched=total_matched,
        avg_match_score=avg_score,
        top_matching_skills=skills_analysis,
        location_distribution=location_analysis,
        experience_distribution=experience_analysis,
        availability_breakdown=availability_analysis,
        suggested_skill_adjustments=suggestions.get("skills", []),
        suggested_location_expansions=suggestions.get("locations", [])
    )

@router.post("/saved-searches", response_model=SavedSearch)
async def create_saved_search(
    name: str,
    search_criteria: CandidateSearchRequest,
    description: Optional[str] = None,
    alert_frequency: str = "weekly",
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a saved search with optional alerts."""
    company_id = await require_company_access(current_user, db)
    
    search_id = str(ObjectId())
    saved_search_doc = {
        "id": search_id,
        "company_id": company_id,
        "created_by": current_user.id,
        "name": name,
        "description": description,
        "search_criteria": search_criteria.dict(),
        "alert_frequency": alert_frequency,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_run": None,
        "results_count": 0
    }
    
    await db.saved_searches.insert_one(saved_search_doc)
    return SavedSearch(**saved_search_doc)

@router.get("/saved-searches", response_model=List[SavedSearch])
async def list_saved_searches(
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """List all saved searches for the company."""
    company_id = await require_company_access(current_user, db)
    
    searches = await db.saved_searches.find({
        "company_id": company_id,
        "is_active": True
    }).sort("created_at", -1).to_list(length=None)
    
    return [SavedSearch(**search) for search in searches]

@router.post("/saved-searches/{search_id}/run", response_model=CandidateSearchResponse)
async def run_saved_search(
    search_id: str,
    current_user: UserModel = Depends(get_current_user),
    db = Depends(get_database)
):
    """Execute a saved search."""
    company_id = await require_company_access(current_user, db)
    
    # Get saved search
    saved_search = await db.saved_searches.find_one({
        "id": search_id,
        "company_id": company_id
    })
    if not saved_search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved search not found"
        )
    
    # Execute search
    search_criteria = CandidateSearchRequest(**saved_search["search_criteria"])
    results = await search_candidates(search_criteria, current_user, db)
    
    # Update last run info
    await db.saved_searches.update_one(
        {"id": search_id},
        {
            "$set": {
                "last_run": datetime.utcnow(),
                "results_count": results.total_count
            }
        }
    )
    
    return results

# Helper functions
async def _build_candidate_search_query(
    search_request: CandidateSearchRequest, 
    company_id: str, 
    db
) -> Dict[str, Any]:
    """Build MongoDB query from search request."""
    query = {
        "profile_visibility": {"$in": ["public", "searchable"]},
        "is_active": True
    }
    
    # Skills filtering
    if search_request.required_skills:
        query["skills"] = {"$all": search_request.required_skills}
    
    # Experience filtering
    if search_request.min_experience_years is not None:
        query["experience_years"] = {"$gte": search_request.min_experience_years}
    if search_request.max_experience_years is not None:
        if "experience_years" in query:
            query["experience_years"]["$lte"] = search_request.max_experience_years
        else:
            query["experience_years"] = {"$lte": search_request.max_experience_years}
    
    # Location filtering
    if search_request.locations:
        query["$or"] = [
            {"location": {"$in": search_request.locations}},
            {"remote_ok": True} if search_request.remote_ok else {}
        ]
    
    # Availability filtering
    if search_request.availability_status:
        query["availability_status"] = search_request.availability_status
    
    # Text search
    if search_request.query:
        query["$text"] = {"$search": search_request.query}
    
    # AI matching score filter
    if search_request.use_ai_matching and search_request.min_match_score > 0:
        # This would be calculated dynamically or pre-computed
        pass
    
    return query

def _get_sort_parameters(sort_by: SearchSortBy) -> tuple:
    """Get MongoDB sort parameters."""
    sort_mapping = {
        SearchSortBy.RELEVANCE: ("_score", -1),
        SearchSortBy.MATCH_SCORE: ("ai_match_score", -1),
        SearchSortBy.EXPERIENCE: ("experience_years", -1),
        SearchSortBy.LAST_ACTIVE: ("last_active", -1),
        SearchSortBy.CREATED_AT: ("created_at", -1)
    }
    return sort_mapping.get(sort_by, ("created_at", -1))

async def _process_candidate_result(
    candidate: dict, 
    search_request: CandidateSearchRequest,
    company_id: str,
    db
) -> Optional[CandidateSearchResult]:
    """Process and enrich candidate search result."""
    # Get user info
    user = await db.users.find_one({"id": candidate["user_id"]})
    if not user:
        return None
    
    # Calculate match score if AI matching is enabled
    match_score = None
    matching_reasons = []
    
    if search_request.use_ai_matching:
        # This would integrate with AI matching service
        match_score = await _calculate_match_score(candidate, search_request, db)
        matching_reasons = await _get_matching_reasons(candidate, search_request, db)
    
    return CandidateSearchResult(
        candidate_id=candidate["user_id"],
        profile_id=candidate["id"],
        name=user.get("full_name", "Anonymous"),
        title=candidate.get("current_title"),
        location=candidate.get("location"),
        experience_years=candidate.get("experience_years"),
        current_company=candidate.get("current_company"),
        skills=candidate.get("skills", []),
        match_score=match_score,
        matching_reasons=matching_reasons,
        availability_status=candidate.get("availability_status"),
        last_active=user.get("last_active"),
        profile_visibility=candidate.get("profile_visibility", "private"),
        contact_allowed=candidate.get("contact_allowed", False),
        indexed_at=candidate.get("updated_at", datetime.utcnow())
    )

async def _track_search_usage(company_id: str, db):
    """Track search usage for billing."""
    await db.company_billing.update_one(
        {"company_id": company_id},
        {
            "$inc": {"candidate_views_used": 1},
            "$set": {"last_activity": datetime.utcnow()}
        },
        upsert=True
    )

async def _track_matching_usage(company_id: str, candidates_count: int, db):
    """Track matching usage for billing."""
    await db.company_billing.update_one(
        {"company_id": company_id},
        {
            "$inc": {"ai_matches_used": candidates_count},
            "$set": {"last_activity": datetime.utcnow()}
        },
        upsert=True
    )

async def _get_matching_service(db):
    """Get matching service instance."""
    # This would return the existing matching service
    # For now, return a mock service
    class MockMatchingService:
        async def find_matches(self, request: MatchRequest) -> MatchResponse:
            # Mock implementation - would use real matching logic
            return MatchResponse(
                candidates=[],
                total_count=0,
                search_time_ms=100,
                generated_at=datetime.utcnow()
            )
    
    return MockMatchingService()

async def _calculate_match_score(candidate: dict, search_request: CandidateSearchRequest, db) -> float:
    """Calculate AI match score for candidate."""
    # Mock implementation - would use real AI matching
    return 0.85

async def _get_matching_reasons(candidate: dict, search_request: CandidateSearchRequest, db) -> List[str]:
    """Get reasons for the match."""
    # Mock implementation
    return ["Strong skill match", "Location preference", "Experience level"]

async def _analyze_matching_skills(applications: List[dict], db) -> List[Dict[str, Any]]:
    """Analyze top matching skills."""
    # Mock implementation
    return [
        {"skill": "Python", "count": 15, "avg_score": 0.9},
        {"skill": "React", "count": 12, "avg_score": 0.85}
    ]

async def _analyze_locations(applications: List[dict], db) -> Dict[str, int]:
    """Analyze location distribution."""
    return {"San Francisco": 10, "New York": 8, "Remote": 15}

async def _analyze_experience(applications: List[dict], db) -> Dict[str, int]:
    """Analyze experience distribution."""
    return {"0-2 years": 5, "3-5 years": 12, "6+ years": 8}

async def _analyze_availability(applications: List[dict], db) -> Dict[str, int]:
    """Analyze availability breakdown."""
    return {"available": 20, "passive": 5, "not_looking": 0}

async def _generate_matching_suggestions(job: dict, applications: List[dict], db) -> Dict[str, List[str]]:
    """Generate suggestions to improve matching."""
    return {
        "skills": ["Consider adding 'Node.js' to expand candidate pool"],
        "locations": ["Consider remote candidates to increase matches"]
    }
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from enum import Enum
import uuid
from decimal import Decimal

# Import your database session dependency
# from ..database import get_db

router = APIRouter(prefix="/pipeline", tags=["pipeline"])

# Enums
class CandidateStage(str, Enum):
    SOURCED = "sourced"
    INITIAL_CONTACT = "initial_contact"
    SCREENING = "screening"
    TECHNICAL_REVIEW = "technical_review"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_COMPLETED = "interview_completed"
    REFERENCE_CHECK = "reference_check"
    OFFER_PREPARATION = "offer_preparation"
    OFFER_SENT = "offer_sent"
    OFFER_NEGOTIATION = "offer_negotiation"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_DECLINED = "offer_declined"
    HIRED = "hired"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"

class InterviewType(str, Enum):
    PHONE_SCREENING = "phone_screening"
    VIDEO_INTERVIEW = "video_interview"
    TECHNICAL_INTERVIEW = "technical_interview"
    BEHAVIORAL_INTERVIEW = "behavioral_interview"
    PANEL_INTERVIEW = "panel_interview"
    ON_SITE = "on_site"
    FINAL_INTERVIEW = "final_interview"

class InterviewStatus(str, Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    NO_SHOW = "no_show"

class ActivityType(str, Enum):
    STAGE_CHANGE = "stage_change"
    NOTE_ADDED = "note_added"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_COMPLETED = "interview_completed"
    EMAIL_SENT = "email_sent"
    DOCUMENT_UPLOADED = "document_uploaded"
    OFFER_SENT = "offer_sent"
    FEEDBACK_RECEIVED = "feedback_received"

class NotificationType(str, Enum):
    STAGE_CHANGE = "stage_change"
    INTERVIEW_REMINDER = "interview_reminder"
    OFFER_EXPIRING = "offer_expiring"
    FEEDBACK_REQUIRED = "feedback_required"
    DOCUMENT_REQUIRED = "document_required"

# Pydantic Models
class CandidateCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    codename: str
    position_applied: str
    job_id: str
    source: str = "direct_application"  # direct_application, ai_radar, referral, linkedin
    resume_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    skills: List[str] = []
    experience_years: Optional[int] = None
    current_salary: Optional[Decimal] = Field(None, decimal_places=2)
    expected_salary: Optional[Decimal] = Field(None, decimal_places=2)
    location: Optional[str] = None
    availability: str = "available"  # available, 2_weeks_notice, 1_month_notice, not_available
    remote_preference: bool = True
    notes: Optional[str] = None

class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    position_applied: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_years: Optional[int] = None
    current_salary: Optional[Decimal] = Field(None, decimal_places=2)
    expected_salary: Optional[Decimal] = Field(None, decimal_places=2)
    location: Optional[str] = None
    availability: Optional[str] = None
    remote_preference: Optional[bool] = None
    notes: Optional[str] = None

class StageUpdate(BaseModel):
    stage: CandidateStage
    notes: Optional[str] = None
    scheduled_follow_up: Optional[datetime] = None

class CandidateResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    codename: str
    position_applied: str
    job_id: str
    current_stage: CandidateStage
    source: str
    match_score: Optional[float] = None
    skills: List[str]
    experience_years: Optional[int] = None
    location: Optional[str] = None
    availability: str
    created_at: datetime
    updated_at: datetime
    last_activity: Optional[datetime] = None
    next_follow_up: Optional[datetime] = None
    stage_history: List[Dict[str, Any]] = []

class InterviewCreate(BaseModel):
    candidate_id: str
    job_id: str
    interview_type: InterviewType
    scheduled_at: datetime
    duration_minutes: int = 60
    interviewer_ids: List[str]
    location: Optional[str] = None  # For on-site interviews
    meeting_link: Optional[str] = None  # For video interviews
    agenda: Optional[str] = None
    preparation_notes: Optional[str] = None
    send_calendar_invite: bool = True

class InterviewUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    interviewer_ids: Optional[List[str]] = None
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    agenda: Optional[str] = None
    preparation_notes: Optional[str] = None
    status: Optional[InterviewStatus] = None

class InterviewResponse(BaseModel):
    id: str
    candidate_id: str
    candidate_name: str
    job_id: str
    position_title: str
    interview_type: InterviewType
    status: InterviewStatus
    scheduled_at: datetime
    duration_minutes: int
    interviewer_names: List[str]
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    agenda: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    feedback_submitted: bool = False

class InterviewFeedback(BaseModel):
    interview_id: str
    interviewer_id: str
    overall_rating: int = Field(..., ge=1, le=5)
    technical_skills: Optional[int] = Field(None, ge=1, le=5)
    communication: Optional[int] = Field(None, ge=1, le=5)
    problem_solving: Optional[int] = Field(None, ge=1, le=5)
    cultural_fit: Optional[int] = Field(None, ge=1, le=5)
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    recommendation: str  # hire, no_hire, maybe
    detailed_feedback: Optional[str] = None

class ActivityCreate(BaseModel):
    candidate_id: str
    activity_type: ActivityType
    title: str
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}

class ActivityResponse(BaseModel):
    id: str
    candidate_id: str
    activity_type: ActivityType
    title: str
    description: Optional[str] = None
    metadata: Dict[str, Any]
    created_at: datetime
    created_by: str

class NotificationCreate(BaseModel):
    recipient_id: str
    notification_type: NotificationType
    title: str
    message: str
    candidate_id: Optional[str] = None
    interview_id: Optional[str] = None
    scheduled_for: Optional[datetime] = None

class PipelineStats(BaseModel):
    total_candidates: int
    candidates_by_stage: Dict[str, int]
    conversion_rates: Dict[str, float]
    average_time_in_stage: Dict[str, float]
    interviews_this_week: int
    offers_pending: int
    recent_hires: int

# Mock database functions
async def get_candidates_from_db(
    company_id: str, 
    stage: Optional[CandidateStage] = None,
    job_id: Optional[str] = None
) -> List[dict]:
    """Mock function to get candidates from database"""
    mock_candidates = [
        {
            "id": "candidate_1",
            "name": "Alex Chen",
            "email": "alex.chen@email.com",
            "phone": "+1-555-0123",
            "codename": "ReactNinja_2024",
            "position_applied": "Senior Frontend Developer",
            "job_id": "job_1",
            "current_stage": CandidateStage.INITIAL_CONTACT,
            "source": "ai_radar",
            "match_score": 0.94,
            "skills": ["React", "TypeScript", "Next.js", "GraphQL"],
            "experience_years": 5,
            "location": "San Francisco, CA",
            "availability": "available",
            "created_at": datetime.now() - timedelta(days=2),
            "updated_at": datetime.now() - timedelta(hours=2),
            "last_activity": datetime.now() - timedelta(hours=2),
            "next_follow_up": datetime.now() + timedelta(days=1),
            "stage_history": [
                {
                    "stage": "sourced",
                    "timestamp": datetime.now() - timedelta(days=2),
                    "notes": "Found through AI radar system"
                },
                {
                    "stage": "initial_contact",
                    "timestamp": datetime.now() - timedelta(hours=2),
                    "notes": "Sent initial outreach email"
                }
            ]
        },
        {
            "id": "candidate_2",
            "name": "Sarah Johnson",
            "email": "sarah.j@email.com",
            "phone": "+1-555-0124",
            "codename": "FullStackPro",
            "position_applied": "Full Stack Developer",
            "job_id": "job_2",
            "current_stage": CandidateStage.TECHNICAL_REVIEW,
            "source": "direct_application",
            "match_score": 0.87,
            "skills": ["Python", "Django", "React", "PostgreSQL"],
            "experience_years": 4,
            "location": "Austin, TX",
            "availability": "2_weeks_notice",
            "created_at": datetime.now() - timedelta(days=5),
            "updated_at": datetime.now() - timedelta(days=1),
            "last_activity": datetime.now() - timedelta(days=1),
            "next_follow_up": datetime.now() + timedelta(days=2),
            "stage_history": [
                {
                    "stage": "sourced",
                    "timestamp": datetime.now() - timedelta(days=5),
                    "notes": "Applied directly through website"
                },
                {
                    "stage": "screening",
                    "timestamp": datetime.now() - timedelta(days=3),
                    "notes": "Passed initial screening"
                },
                {
                    "stage": "technical_review",
                    "timestamp": datetime.now() - timedelta(days=1),
                    "notes": "Technical assessment submitted"
                }
            ]
        }
    ]
    
    if stage:
        mock_candidates = [c for c in mock_candidates if c["current_stage"] == stage]
    if job_id:
        mock_candidates = [c for c in mock_candidates if c["job_id"] == job_id]
    
    return mock_candidates

async def send_notification_email(recipient_email: str, subject: str, message: str):
    """Background task to send notification email"""
    print(f"Sending notification to {recipient_email}: {subject}")

async def send_calendar_invite(interview_data: dict):
    """Background task to send calendar invite"""
    print(f"Sending calendar invite for interview {interview_data['id']}")

# Candidate Management Endpoints
@router.get("/candidates", response_model=List[CandidateResponse])
async def get_candidates(
    stage: Optional[CandidateStage] = None,
    job_id: Optional[str] = None,
    company_id: str = "company_1"
):
    """Get all candidates in the pipeline"""
    try:
        candidates = await get_candidates_from_db(company_id, stage, job_id)
        return [CandidateResponse(**candidate) for candidate in candidates]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch candidates: {str(e)}")

@router.post("/candidates", response_model=CandidateResponse)
async def create_candidate(
    candidate: CandidateCreate,
    background_tasks: BackgroundTasks,
    company_id: str = "company_1"
):
    """Add a new candidate to the pipeline"""
    try:
        candidate_id = str(uuid.uuid4())
        candidate_data = {
            "id": candidate_id,
            "name": candidate.name,
            "email": candidate.email,
            "phone": candidate.phone,
            "codename": candidate.codename,
            "position_applied": candidate.position_applied,
            "job_id": candidate.job_id,
            "current_stage": CandidateStage.SOURCED,
            "source": candidate.source,
            "match_score": None,
            "skills": candidate.skills,
            "experience_years": candidate.experience_years,
            "location": candidate.location,
            "availability": candidate.availability,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "last_activity": datetime.now(),
            "next_follow_up": None,
            "stage_history": [
                {
                    "stage": "sourced",
                    "timestamp": datetime.now(),
                    "notes": f"Added to pipeline from {candidate.source}"
                }
            ]
        }
        
        # Send welcome notification
        background_tasks.add_task(
            send_notification_email,
            candidate.email,
            "Welcome to our hiring process",
            f"Hi {candidate.name}, thank you for your interest in the {candidate.position_applied} position."
        )
        
        return CandidateResponse(**candidate_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create candidate: {str(e)}")

@router.get("/candidates/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(candidate_id: str):
    """Get a specific candidate by ID"""
    try:
        candidates = await get_candidates_from_db("company_1")
        candidate = next((c for c in candidates if c["id"] == candidate_id), None)
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        return CandidateResponse(**candidate)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch candidate: {str(e)}")

@router.put("/candidates/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(candidate_id: str, candidate_update: CandidateUpdate):
    """Update candidate information"""
    try:
        candidates = await get_candidates_from_db("company_1")
        candidate = next((c for c in candidates if c["id"] == candidate_id), None)
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        # Update fields
        update_data = candidate_update.dict(exclude_unset=True)
        candidate.update(update_data)
        candidate["updated_at"] = datetime.now()
        
        return CandidateResponse(**candidate)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update candidate: {str(e)}")

@router.post("/candidates/{candidate_id}/stage")
async def update_candidate_stage(
    candidate_id: str, 
    stage_update: StageUpdate,
    background_tasks: BackgroundTasks
):
    """Move candidate to a different stage"""
    try:
        candidates = await get_candidates_from_db("company_1")
        candidate = next((c for c in candidates if c["id"] == candidate_id), None)
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        old_stage = candidate["current_stage"]
        candidate["current_stage"] = stage_update.stage
        candidate["updated_at"] = datetime.now()
        candidate["last_activity"] = datetime.now()
        
        if stage_update.scheduled_follow_up:
            candidate["next_follow_up"] = stage_update.scheduled_follow_up
        
        # Add to stage history
        candidate["stage_history"].append({
            "stage": stage_update.stage,
            "timestamp": datetime.now(),
            "notes": stage_update.notes or f"Moved from {old_stage} to {stage_update.stage}"
        })
        
        # Send stage change notification
        background_tasks.add_task(
            send_notification_email,
            candidate["email"],
            f"Update on your {candidate['position_applied']} application",
            f"Your application has progressed to the {stage_update.stage.replace('_', ' ').title()} stage."
        )
        
        return {
            "message": "Candidate stage updated successfully",
            "candidate_id": candidate_id,
            "old_stage": old_stage,
            "new_stage": stage_update.stage
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update candidate stage: {str(e)}")

# Interview Management Endpoints
@router.get("/interviews", response_model=List[InterviewResponse])
async def get_interviews(
    status: Optional[InterviewStatus] = None,
    candidate_id: Optional[str] = None,
    company_id: str = "company_1"
):
    """Get all interviews"""
    try:
        # Mock interviews data
        interviews = [
            {
                "id": "interview_1",
                "candidate_id": "candidate_1",
                "candidate_name": "Alex Chen",
                "job_id": "job_1",
                "position_title": "Senior Frontend Developer",
                "interview_type": InterviewType.TECHNICAL_INTERVIEW,
                "status": InterviewStatus.SCHEDULED,
                "scheduled_at": datetime.now() + timedelta(days=2, hours=10),
                "duration_minutes": 90,
                "interviewer_names": ["John Smith", "Jane Doe"],
                "location": None,
                "meeting_link": "https://zoom.us/j/123456789",
                "agenda": "Technical discussion on React and system design",
                "created_at": datetime.now() - timedelta(days=1),
                "updated_at": datetime.now() - timedelta(days=1),
                "feedback_submitted": False
            }
        ]
        
        if status:
            interviews = [i for i in interviews if i["status"] == status]
        if candidate_id:
            interviews = [i for i in interviews if i["candidate_id"] == candidate_id]
        
        return [InterviewResponse(**interview) for interview in interviews]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch interviews: {str(e)}")

@router.post("/interviews", response_model=InterviewResponse)
async def schedule_interview(
    interview: InterviewCreate,
    background_tasks: BackgroundTasks
):
    """Schedule a new interview"""
    try:
        interview_id = str(uuid.uuid4())
        interview_data = {
            "id": interview_id,
            "candidate_id": interview.candidate_id,
            "candidate_name": "Alex Chen",  # Would fetch from candidate table
            "job_id": interview.job_id,
            "position_title": "Senior Frontend Developer",  # Would fetch from job table
            "interview_type": interview.interview_type,
            "status": InterviewStatus.SCHEDULED,
            "scheduled_at": interview.scheduled_at,
            "duration_minutes": interview.duration_minutes,
            "interviewer_names": ["John Smith", "Jane Doe"],  # Would fetch from interviewer IDs
            "location": interview.location,
            "meeting_link": interview.meeting_link,
            "agenda": interview.agenda,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "feedback_submitted": False
        }
        
        # Send calendar invites
        if interview.send_calendar_invite:
            background_tasks.add_task(send_calendar_invite, interview_data)
        
        # Update candidate stage
        background_tasks.add_task(
            send_notification_email,
            "candidate@example.com",  # Would fetch from candidate table
            "Interview Scheduled",
            f"Your interview for {interview_data['position_title']} has been scheduled for {interview.scheduled_at.strftime('%B %d, %Y at %I:%M %p')}"
        )
        
        return InterviewResponse(**interview_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to schedule interview: {str(e)}")

@router.put("/interviews/{interview_id}", response_model=InterviewResponse)
async def update_interview(
    interview_id: str, 
    interview_update: InterviewUpdate,
    background_tasks: BackgroundTasks
):
    """Update an existing interview"""
    try:
        interviews = await get_interviews()
        interview = next((i for i in interviews if i.id == interview_id), None)
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        # Update fields
        update_data = interview_update.dict(exclude_unset=True)
        interview_dict = interview.dict()
        interview_dict.update(update_data)
        interview_dict["updated_at"] = datetime.now()
        
        # Send update notifications if rescheduled
        if interview_update.scheduled_at and interview_update.scheduled_at != interview.scheduled_at:
            background_tasks.add_task(
                send_notification_email,
                "candidate@example.com",
                "Interview Rescheduled",
                f"Your interview has been rescheduled to {interview_update.scheduled_at.strftime('%B %d, %Y at %I:%M %p')}"
            )
        
        return InterviewResponse(**interview_dict)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update interview: {str(e)}")

@router.post("/interviews/{interview_id}/feedback")
async def submit_interview_feedback(interview_id: str, feedback: InterviewFeedback):
    """Submit feedback for an interview"""
    try:
        feedback_id = str(uuid.uuid4())
        feedback_data = {
            "id": feedback_id,
            "interview_id": interview_id,
            "interviewer_id": feedback.interviewer_id,
            "overall_rating": feedback.overall_rating,
            "technical_skills": feedback.technical_skills,
            "communication": feedback.communication,
            "problem_solving": feedback.problem_solving,
            "cultural_fit": feedback.cultural_fit,
            "strengths": feedback.strengths,
            "weaknesses": feedback.weaknesses,
            "recommendation": feedback.recommendation,
            "detailed_feedback": feedback.detailed_feedback,
            "submitted_at": datetime.now()
        }
        
        return {
            "message": "Interview feedback submitted successfully",
            "feedback_id": feedback_id,
            "interview_id": interview_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {str(e)}")

# Activity Tracking Endpoints
@router.get("/candidates/{candidate_id}/activities", response_model=List[ActivityResponse])
async def get_candidate_activities(candidate_id: str):
    """Get all activities for a candidate"""
    try:
        # Mock activities data
        activities = [
            {
                "id": "activity_1",
                "candidate_id": candidate_id,
                "activity_type": ActivityType.STAGE_CHANGE,
                "title": "Moved to Technical Review",
                "description": "Candidate progressed from screening to technical review stage",
                "metadata": {"from_stage": "screening", "to_stage": "technical_review"},
                "created_at": datetime.now() - timedelta(days=1),
                "created_by": "recruiter_1"
            },
            {
                "id": "activity_2",
                "candidate_id": candidate_id,
                "activity_type": ActivityType.EMAIL_SENT,
                "title": "Technical Assessment Sent",
                "description": "Sent technical assessment link to candidate",
                "metadata": {"email_type": "technical_assessment", "template_id": "tech_001"},
                "created_at": datetime.now() - timedelta(hours=6),
                "created_by": "system"
            }
        ]
        
        return [ActivityResponse(**activity) for activity in activities]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch activities: {str(e)}")

@router.post("/activities", response_model=ActivityResponse)
async def create_activity(activity: ActivityCreate):
    """Create a new activity record"""
    try:
        activity_id = str(uuid.uuid4())
        activity_data = {
            "id": activity_id,
            "candidate_id": activity.candidate_id,
            "activity_type": activity.activity_type,
            "title": activity.title,
            "description": activity.description,
            "metadata": activity.metadata or {},
            "created_at": datetime.now(),
            "created_by": "current_user"  # Would get from auth
        }
        
        return ActivityResponse(**activity_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create activity: {str(e)}")

# Pipeline Analytics Endpoints
@router.get("/analytics/pipeline", response_model=PipelineStats)
async def get_pipeline_analytics(company_id: str = "company_1"):
    """Get pipeline analytics and statistics"""
    try:
        return PipelineStats(
            total_candidates=45,
            candidates_by_stage={
                "sourced": 8,
                "initial_contact": 6,
                "screening": 5,
                "technical_review": 7,
                "interview_scheduled": 4,
                "interview_completed": 3,
                "offer_sent": 2,
                "hired": 10
            },
            conversion_rates={
                "sourced_to_screening": 0.75,
                "screening_to_technical": 0.85,
                "technical_to_interview": 0.70,
                "interview_to_offer": 0.60,
                "offer_to_hire": 0.80
            },
            average_time_in_stage={
                "sourced": 1.2,
                "screening": 2.5,
                "technical_review": 3.8,
                "interview_scheduled": 1.5,
                "offer_sent": 4.2
            },
            interviews_this_week=8,
            offers_pending=5,
            recent_hires=3
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch pipeline analytics: {str(e)}")

@router.get("/analytics/funnel")
async def get_hiring_funnel(company_id: str = "company_1"):
    """Get detailed hiring funnel analysis"""
    try:
        return {
            "funnel_stages": [
                {"stage": "sourced", "count": 156, "percentage": 100.0},
                {"stage": "initial_contact", "count": 89, "percentage": 57.1},
                {"stage": "screening", "count": 67, "percentage": 42.9},
                {"stage": "technical_review", "count": 45, "percentage": 28.8},
                {"stage": "interview_scheduled", "count": 32, "percentage": 20.5},
                {"stage": "interview_completed", "count": 28, "percentage": 17.9},
                {"stage": "offer_sent", "count": 15, "percentage": 9.6},
                {"stage": "hired", "count": 12, "percentage": 7.7}
            ],
            "drop_off_analysis": {
                "highest_drop_off": "initial_contact",
                "drop_off_rate": 0.429,
                "improvement_suggestions": [
                    "Improve initial outreach messaging",
                    "Reduce response time to applications",
                    "Implement automated follow-up sequences"
                ]
            },
            "time_to_hire": {
                "average_days": 18.5,
                "median_days": 16.0,
                "fastest_hire": 8,
                "slowest_hire": 45
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch funnel analysis: {str(e)}")

# Notification Management
@router.get("/notifications")
async def get_notifications(user_id: str = "current_user"):
    """Get notifications for current user"""
    try:
        notifications = [
            {
                "id": "notif_1",
                "type": NotificationType.INTERVIEW_REMINDER,
                "title": "Interview Tomorrow",
                "message": "Alex Chen has an interview scheduled for tomorrow at 10:00 AM",
                "candidate_id": "candidate_1",
                "interview_id": "interview_1",
                "created_at": datetime.now() - timedelta(hours=2),
                "read": False
            },
            {
                "id": "notif_2",
                "type": NotificationType.FEEDBACK_REQUIRED,
                "title": "Feedback Required",
                "message": "Please submit feedback for Sarah Johnson's interview",
                "candidate_id": "candidate_2",
                "interview_id": "interview_2",
                "created_at": datetime.now() - timedelta(hours=6),
                "read": False
            }
        ]
        
        return notifications
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch notifications: {str(e)}")

@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a notification as read"""
    try:
        return {
            "message": "Notification marked as read",
            "notification_id": notification_id,
            "read_at": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark notification as read: {str(e)}")
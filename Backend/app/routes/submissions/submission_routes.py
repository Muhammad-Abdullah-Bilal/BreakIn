"""Routes for creating submissions (GitHub PRs) and mentor claim flow."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime
import logging

from app.dependencies import get_db, get_current_user
from app.models.auth import User
from app.services.feedback.assignment_service import AssignmentService
from app.config import get_database

logger = logging.getLogger(__name__)
router = APIRouter()


class SubmissionCreate(BaseModel):
    pr_url: HttpUrl
    title: Optional[str]
    preferred_mentor_count: int = Field(default=1, ge=1)
    squad_id: Optional[str] = None
    is_school_project: bool = False


class SubmissionOut(BaseModel):
    id: str
    pr_url: HttpUrl
    title: Optional[str]
    author_id: str
    preferred_mentor_count: int
    squad_id: Optional[str]
    assigned_mentors: List[dict]
    status: str


@router.post("/submissions", response_model=SubmissionOut)
async def create_submission(
    payload: SubmissionCreate,
    background: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> SubmissionOut:
    """Create a submission from a GitHub PR URL and trigger assignment."""
    # Basic PR parsing (owner/repo/pull) could be validated later by worker
    submission = {
        "pr_url": str(payload.pr_url),
        "title": payload.title or "",
        "author_id": current_user.id,
        "preferred_mentor_count": payload.preferred_mentor_count,
        "squad_id": payload.squad_id,
        "is_school_project": payload.is_school_project,
        "pre_assigned_mentors": [],
        "assigned_mentors": [],
        "assigned_count": 0,
        "status": "needs_review",
        "created_at": datetime.utcnow()
    }

    # If squad provided, populate pre_assigned_mentors from squad defaults
    if payload.squad_id:
        squad = await db.squads.find_one({"_id": payload.squad_id})
        if squad:
            # get mentor ids from squad members (keys of members with role mentor)
            mentors = []
            for uid, data in squad.get("members", {}).items():
                if data.get("role") == "mentor":
                    mentors.append(uid)

            # take up to preferred_mentor_count
            submission["pre_assigned_mentors"] = mentors[:payload.preferred_mentor_count]
            submission["assigned_mentors"] = [
                {"mentor_id": m, "role": "primary", "assigned_at": datetime.utcnow(), "status": "assigned"}
                for m in submission["pre_assigned_mentors"]
            ]
            submission["assigned_count"] = len(submission["assigned_mentors"])

    res = await db.submissions.insert_one(submission)
    submission_id = str(res.inserted_id)

    # If we still need more mentors, schedule fill operation in background
    if submission["assigned_count"] < submission["preferred_mentor_count"]:
        background.add_task(
            _fill_remaining_slots_task,
            submission_id,
        )

    return SubmissionOut(
        id=submission_id,
        pr_url=submission["pr_url"],
        title=submission["title"],
        author_id=submission["author_id"],
        preferred_mentor_count=submission["preferred_mentor_count"],
        squad_id=submission["squad_id"],
        assigned_mentors=submission["assigned_mentors"],
        status=submission["status"],
    )


async def _fill_remaining_slots_task(submission_id: str) -> None:
    """Background task that gets DB via app.config.get_database and fills slots."""
    try:
        db = get_database()
        service = AssignmentService(db)
        submission = await db.submissions.find_one({"_id": submission_id})
        if not submission:
            logger.warning("Submission %s not found for slot filling", submission_id)
            return

        preferred = submission.get("preferred_mentor_count", 1)
        remaining = preferred - submission.get("assigned_count", 0)
        if remaining <= 0:
            logger.info("No remaining slots for submission %s", submission_id)
            return

        submission_ids = [submission_id] * remaining
        await service.assign_reviews(submission_ids, strategy="balanced")
        logger.info("Filled %d slots for submission %s", remaining, submission_id)
    except Exception as e:
        logger.exception("Error filling remaining slots for submission %s: %s", submission_id, e)


@router.get("/submissions/for-review")
async def list_submissions_for_review(
    assigned: Optional[bool] = None,
    ai_reviewed: Optional[bool] = None,
    skill: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> List[dict]:
    """Return submissions visible to the current user for review.

    Mentors see assigned to them and unassigned; regular users see their own.
    """
    q = {}
    if current_user.role != "admin":
        if current_user.is_mentor:
            # Mentors can see any submissions (optionally filter assigned)
            pass
        else:
            # Regular users only their own
            q["author_id"] = current_user.id

    if assigned is not None:
        if assigned:
            q["assigned_count"] = {"$gt": 0}
        else:
            q["assigned_count"] = 0

    if skill:
        q["skills"] = skill

    cursor = db.submissions.find(q).skip(skip).limit(limit)
    results = []
    async for doc in cursor:
        doc["id"] = str(doc.get("_id"))
        results.append(doc)

    return results


@router.post("/submissions/{submission_id}/claim")
async def claim_submission(
    submission_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Mentor claims a slot for a submission using an atomic update.

    This uses find_one_and_update to increment assigned_count only if there's capacity.
    """
    if not current_user.is_mentor:
        raise HTTPException(status_code=403, detail="Only mentors can claim submissions")

    # Atomically increment assigned_count if below preferred_mentor_count
    submission = await db.submissions.find_one({"_id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    preferred = submission.get("preferred_mentor_count", 1)

    result = await db.submissions.find_one_and_update(
        {
            "_id": submission_id,
            "assigned_count": {"$lt": preferred}
        },
        {
            "$inc": {"assigned_count": 1},
            "$push": {"assigned_mentors": {"mentor_id": current_user.id, "role": "secondary", "assigned_at": datetime.utcnow(), "status": "in_progress"}},
            "$set": {"status": "in_progress"}
        },
        return_document=True
    )

    if not result:
        # no capacity left
        raise HTTPException(status_code=409, detail="No available mentor slots for this submission")

    # create assignment record
    assignment = {
        "submission_id": submission_id,
        "reviewer_id": current_user.id,
        "status": "in_progress",
        "assigned_at": datetime.utcnow(),
        "completed_at": None
    }
    await db.review_assignments.insert_one(assignment)

    return {"ok": True, "assigned_to": current_user.id}


@router.post("/submissions/{submission_id}/ai-review")
async def request_ai_review(
    submission_id: str,
    background: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """Queue an AI review for a submission. Returns job-like response."""
    # Basic permission: author or mentor can request AI review
    submission = await db.submissions.find_one({"_id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if current_user["id"] != submission.get("author_id") and not current_user.get("is_mentor") and not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Not authorized to request AI review")

    # create a job entry
    job = {
        "submission_id": submission_id,
        "status": "queued",
        "requested_by": current_user["id"],
        "created_at": datetime.utcnow(),
        "result_review_id": None,
        "error": None
    }
    res = await db.ai_review_jobs.insert_one(job)
    job_id = str(res.inserted_id)

    # enqueue background worker to perform AI review
    background.add_task(_run_ai_review_job, job_id)

    return {"job_id": job_id, "status": "queued"}


async def _run_ai_review_job(job_id: str):
    try:
        db = get_database()
        job = await db.ai_review_jobs.find_one({"_id": job_id})
        if not job:
            logger.warning("AI review job %s not found", job_id)
            return

        submission_id = job["submission_id"]
        # call AI review helper (ReviewService will call get_ai_review when finalizing)
        # create a draft review with reviewer_type 'ai'
        review_doc = {
            "submission_id": submission_id,
            "reviewer_id": "ai:generator",
            "reviewer_type": "ai",
            "scores": {},
            "comments": "AI generated draft",
            "status": "draft",
            "created_at": datetime.utcnow()
        }
        r = await db.reviews.insert_one(review_doc)
        await db.ai_review_jobs.update_one({"_id": job_id}, {"$set": {"status": "completed", "result_review_id": r.inserted_id, "finished_at": datetime.utcnow()}})
        logger.info("AI review job %s completed", job_id)
    except Exception as e:
        logger.exception("AI review job %s failed: %s", job_id, e)
        await db.ai_review_jobs.update_one({"_id": job_id}, {"$set": {"status": "failed", "error": str(e)}})

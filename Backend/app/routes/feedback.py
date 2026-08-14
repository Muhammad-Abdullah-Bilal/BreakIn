from fastapi import APIRouter
from app.config import get_database
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class FeedbackSubmit(BaseModel):
    sprint_id: str
    user_id: str
    score: int
    comment: str

@router.post("/submit")
def submit_feedback(data: FeedbackSubmit):
    db = get_database()
    feedback_entry = {
        "sprint_id": data.sprint_id,
        "user_id": data.user_id,
        "score": data.score,
        "comment": data.comment,
        "submitted_at": datetime.utcnow()
    }
    db.feedback.insert_one(feedback_entry)
    feedback_entry.pop("_id", None)
    return {"message": "Feedback submitted", "feedback": feedback_entry}

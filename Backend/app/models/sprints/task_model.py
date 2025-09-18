"""Task model definitions for MongoDB."""
from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field
from bson import ObjectId

class TaskStatus(str, Enum):
    """Task status states."""
    BACKLOG = "backlog"
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"

class TaskPriority(str, Enum):
    """Task priority levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class TaskComment(BaseModel):
    """Task comment model."""
    id: str
    user_id: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {ObjectId: str}

class TaskModel(BaseModel):
    """Task document model."""
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    assigned_to: Optional[str] = None  # User ID or name
    sprint_id: ObjectId
    
    # Time tracking
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = Field(None, ge=0, le=1000)
    actual_hours: Optional[float] = Field(None, ge=0)
    completed_at: Optional[datetime] = None
    
    # Organization
    tags: List[str] = Field(default_factory=list)
    attachments: List[str] = Field(default_factory=list)
    comments: List[TaskComment] = Field(default_factory=list)
    
    # Dependencies
    depends_on: List[ObjectId] = Field(default_factory=list)
    blocks: List[ObjectId] = Field(default_factory=list)
    
    # Metadata
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        """Pydantic model configuration."""
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "title": "Implement user authentication",
                "description": "Add JWT-based authentication system",
                "status": "todo",
                "priority": "high",
                "assigned_to": "dev-123",
                "estimated_hours": 8,
                "tags": ["auth", "security"],
                "due_date": "2025-09-20T18:00:00Z"
            }
        }

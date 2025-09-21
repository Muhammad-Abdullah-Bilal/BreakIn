"""Sprint task management routes."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId

from app.dependencies import get_db, get_current_user
from app.models.auth import User
from app.models.sprints.sprint_model import SprintModel
from app.models.sprints.task_model import TaskModel, TaskStatus, TaskPriority
from app.services.realtime import RealtimeService
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models for requests/responses
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = Field(None, ge=0, le=1000)
    tags: List[str] = Field(default_factory=list)

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = Field(None, ge=0, le=1000)
    tags: Optional[List[str]] = None
    completed_at: Optional[datetime] = None

class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    assigned_to: Optional[str]
    sprint_id: str
    due_date: Optional[datetime]
    estimated_hours: Optional[float]
    completed_at: Optional[datetime]
    tags: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {ObjectId: str}

@router.get("/sprints/{sprint_id}/tasks", response_model=List[TaskResponse])
async def get_sprint_tasks(
    sprint_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all tasks for a sprint."""
    try:
        # Verify sprint exists and user has access
        sprint = await db.sprints.find_one({"_id": ObjectId(sprint_id)})
        if not sprint:
            raise HTTPException(status_code=404, detail="Sprint not found")

        # Get tasks for the sprint
        tasks_cursor = db.tasks.find({"sprint_id": ObjectId(sprint_id)})
        tasks = await tasks_cursor.to_list(None)
        
        # Convert to response models
        response_tasks = []
        for task in tasks:
            response_tasks.append(TaskResponse(
                id=str(task["_id"]),
                title=task["title"],
                description=task.get("description"),
                status=TaskStatus(task["status"]),
                priority=TaskPriority(task["priority"]),
                assigned_to=task.get("assigned_to"),
                sprint_id=str(task["sprint_id"]),
                due_date=task.get("due_date"),
                estimated_hours=task.get("estimated_hours"),
                completed_at=task.get("completed_at"),
                tags=task.get("tags", []),
                created_at=task["created_at"],
                updated_at=task["updated_at"]
            ))
        
        return response_tasks
        
    except Exception as e:
        logger.error(f"Failed to get sprint tasks: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve tasks")

@router.post("/sprints/{sprint_id}/tasks", response_model=TaskResponse)
async def create_task(
    sprint_id: str,
    task_data: TaskCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new task in a sprint."""
    try:
        # Verify sprint exists and user has access
        sprint = await db.sprints.find_one({"_id": ObjectId(sprint_id)})
        if not sprint:
            raise HTTPException(status_code=404, detail="Sprint not found")

        # Create task document
        task_doc = {
            "title": task_data.title,
            "description": task_data.description,
            "status": task_data.status.value,
            "priority": task_data.priority.value,
            "assigned_to": task_data.assigned_to,
            "sprint_id": ObjectId(sprint_id),
            "due_date": task_data.due_date,
            "estimated_hours": task_data.estimated_hours,
            "completed_at": None,
            "tags": task_data.tags,
            "created_by": current_user.id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        # Insert task
        result = await db.tasks.insert_one(task_doc)
        task_doc["_id"] = result.inserted_id

        # Send real-time update
        background_tasks.add_task(
            RealtimeService.broadcast_to_sprint,
            sprint_id,
            "task_created",
            {
                "task_id": str(result.inserted_id),
                "task": TaskResponse(**{
                    "id": str(result.inserted_id),
                    "title": task_doc["title"],
                    "description": task_doc["description"],
                    "status": TaskStatus(task_doc["status"]),
                    "priority": TaskPriority(task_doc["priority"]),
                    "assigned_to": task_doc["assigned_to"],
                    "sprint_id": str(task_doc["sprint_id"]),
                    "due_date": task_doc["due_date"],
                    "estimated_hours": task_doc["estimated_hours"],
                    "completed_at": task_doc["completed_at"],
                    "tags": task_doc["tags"],
                    "created_at": task_doc["created_at"],
                    "updated_at": task_doc["updated_at"]
                }).dict()
            }
        )

        return TaskResponse(
            id=str(result.inserted_id),
            title=task_doc["title"],
            description=task_doc["description"],
            status=TaskStatus(task_doc["status"]),
            priority=TaskPriority(task_doc["priority"]),
            assigned_to=task_doc["assigned_to"],
            sprint_id=str(task_doc["sprint_id"]),
            due_date=task_doc["due_date"],
            estimated_hours=task_doc["estimated_hours"],
            completed_at=task_doc["completed_at"],
            tags=task_doc["tags"],
            created_at=task_doc["created_at"],
            updated_at=task_doc["updated_at"]
        )

    except Exception as e:
        logger.error(f"Failed to create task: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create task")

@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_updates: TaskUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update a task."""
    try:
        # Find task
        task = await db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        # Prepare update data
        update_data = {}
        if task_updates.title is not None:
            update_data["title"] = task_updates.title
        if task_updates.description is not None:
            update_data["description"] = task_updates.description
        if task_updates.status is not None:
            update_data["status"] = task_updates.status.value
            # Set completed_at when moving to DONE
            if task_updates.status == TaskStatus.DONE and task["status"] != TaskStatus.DONE.value:
                update_data["completed_at"] = datetime.utcnow()
            elif task_updates.status != TaskStatus.DONE:
                update_data["completed_at"] = None
        if task_updates.priority is not None:
            update_data["priority"] = task_updates.priority.value
        if task_updates.assigned_to is not None:
            update_data["assigned_to"] = task_updates.assigned_to
        if task_updates.due_date is not None:
            update_data["due_date"] = task_updates.due_date
        if task_updates.estimated_hours is not None:
            update_data["estimated_hours"] = task_updates.estimated_hours
        if task_updates.tags is not None:
            update_data["tags"] = task_updates.tags
        if task_updates.completed_at is not None:
            update_data["completed_at"] = task_updates.completed_at

        update_data["updated_at"] = datetime.utcnow()

        # Update task
        result = await db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": update_data}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Task not found or no changes made")

        # Get updated task
        updated_task = await db.tasks.find_one({"_id": ObjectId(task_id)})
        
        # Send real-time update
        background_tasks.add_task(
            RealtimeService.broadcast_to_sprint,
            str(updated_task["sprint_id"]),
            "task_updated",
            {
                "task_id": task_id,
                "updates": update_data
            }
        )

        return TaskResponse(
            id=str(updated_task["_id"]),
            title=updated_task["title"],
            description=updated_task.get("description"),
            status=TaskStatus(updated_task["status"]),
            priority=TaskPriority(updated_task["priority"]),
            assigned_to=updated_task.get("assigned_to"),
            sprint_id=str(updated_task["sprint_id"]),
            due_date=updated_task.get("due_date"),
            estimated_hours=updated_task.get("estimated_hours"),
            completed_at=updated_task.get("completed_at"),
            tags=updated_task.get("tags", []),
            created_at=updated_task["created_at"],
            updated_at=updated_task["updated_at"]
        )

    except Exception as e:
        logger.error(f"Failed to update task: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update task")

@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete a task."""
    try:
        # Find task first to get sprint_id for real-time update
        task = await db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        sprint_id = str(task["sprint_id"])

        # Delete task
        result = await db.tasks.delete_one({"_id": ObjectId(task_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Task not found")

        # Send real-time update
        background_tasks.add_task(
            RealtimeService.broadcast_to_sprint,
            sprint_id,
            "task_deleted",
            {"task_id": task_id}
        )

        return {"message": "Task deleted successfully"}

    except Exception as e:
        logger.error(f"Failed to delete task: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete task")

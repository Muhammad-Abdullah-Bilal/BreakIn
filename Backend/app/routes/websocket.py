from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import List, Dict, Any
import json
import asyncio
from datetime import datetime
import logging
from enum import Enum

logger = logging.getLogger(__name__)

router = APIRouter()

class NotificationType(str, Enum):
    CANDIDATE_ACTIVITY = "candidate_activity"
    AGENT_STATUS = "agent_status"
    SYSTEM = "system"
    INTERVIEW = "interview"
    SPRINT = "sprint"

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(websocket)
        
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket, user_id: str = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if user_id and user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
    
    async def send_to_user(self, message: str, user_id: str):
        if user_id in self.user_connections:
            disconnected = []
            for websocket in self.user_connections[user_id]:
                try:
                    await websocket.send_text(message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected.append(websocket)
            
            # Clean up disconnected websockets
            for ws in disconnected:
                self.disconnect(ws, user_id)
    
    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected websockets
        for ws in disconnected:
            self.disconnect(ws)

manager = ConnectionManager()

# Notification creation helpers
def create_candidate_activity_notification(
    candidate_id: str,
    candidate_name: str,
    activity: str,
    details: str,
    metadata: Dict[str, Any] = None
) -> Dict[str, Any]:
    return {
        "type": NotificationType.CANDIDATE_ACTIVITY,
        "candidate_id": candidate_id,
        "candidate_name": candidate_name,
        "activity": activity,
        "details": details,
        "timestamp": datetime.now().isoformat(),
        "metadata": metadata or {}
    }

def create_agent_status_notification(
    agent_id: str,
    agent_name: str,
    agent_type: str,
    status: str,
    message: str,
    metadata: Dict[str, Any] = None
) -> Dict[str, Any]:
    return {
        "type": NotificationType.AGENT_STATUS,
        "agent_id": agent_id,
        "agent_name": agent_name,
        "agent_type": agent_type,
        "status": status,
        "message": message,
        "timestamp": datetime.now().isoformat(),
        "metadata": metadata or {}
    }

def create_system_notification(
    level: str,
    title: str,
    message: str,
    action_required: bool = False,
    action_url: str = None
) -> Dict[str, Any]:
    notification = {
        "type": NotificationType.SYSTEM,
        "level": level,
        "title": title,
        "message": message,
        "timestamp": datetime.now().isoformat(),
        "action_required": action_required
    }
    
    if action_url:
        notification["action_url"] = action_url
    
    return notification

def create_interview_notification(
    interview_id: str,
    candidate_name: str,
    interviewer: str,
    event: str,
    details: str,
    scheduled_time: str = None
) -> Dict[str, Any]:
    notification = {
        "type": NotificationType.INTERVIEW,
        "interview_id": interview_id,
        "candidate_name": candidate_name,
        "interviewer": interviewer,
        "event": event,
        "details": details,
        "timestamp": datetime.now().isoformat()
    }
    
    if scheduled_time:
        notification["scheduled_time"] = scheduled_time
    
    return notification

def create_sprint_notification(
    sprint_id: str,
    sprint_name: str,
    event: str,
    details: str,
    participant_count: int = None
) -> Dict[str, Any]:
    notification = {
        "type": NotificationType.SPRINT,
        "sprint_id": sprint_id,
        "sprint_name": sprint_name,
        "event": event,
        "details": details,
        "timestamp": datetime.now().isoformat()
    }
    
    if participant_count is not None:
        notification["participant_count"] = participant_count
    
    return notification

# Global notification functions
async def send_notification(notification: Dict[str, Any], user_id: str = None):
    """Send notification to specific user or broadcast to all"""
    message = json.dumps(notification)
    
    if user_id:
        await manager.send_to_user(message, user_id)
    else:
        await manager.broadcast(message)

async def send_candidate_activity(candidate_id: str, candidate_name: str, activity: str, details: str, user_id: str = None):
    """Send candidate activity notification"""
    notification = create_candidate_activity_notification(candidate_id, candidate_name, activity, details)
    await send_notification(notification, user_id)

async def send_agent_status(agent_id: str, agent_name: str, agent_type: str, status: str, message: str, user_id: str = None):
    """Send agent status notification"""
    notification = create_agent_status_notification(agent_id, agent_name, agent_type, status, message)
    await send_notification(notification, user_id)

async def send_system_alert(level: str, title: str, message: str, action_required: bool = False, action_url: str = None, user_id: str = None):
    """Send system notification"""
    notification = create_system_notification(level, title, message, action_required, action_url)
    await send_notification(notification, user_id)

# Demo notification sender (for testing)
async def send_demo_notifications():
    """Send demo notifications periodically"""
    while True:
        try:
            # Send various demo notifications
            await send_candidate_activity(
                "cand_001", 
                "Alice Johnson", 
                "application_submitted", 
                "Applied for Senior Frontend Developer position"
            )
            
            await asyncio.sleep(10)
            
            await send_agent_status(
                "agent_job_radar", 
                "Job Radar Agent", 
                "job_radar", 
                "processing", 
                "Scanning 1,247 new job postings..."
            )
            
            await asyncio.sleep(15)
            
            await send_interview_notification(
                "int_001", 
                "Bob Smith", 
                "Sarah Wilson", 
                "scheduled", 
                "Technical interview scheduled for tomorrow at 2 PM",
                "2024-01-15T14:00:00Z"
            )
            
            await asyncio.sleep(20)
            
            await send_sprint_notification(
                "sprint_001", 
                "React Dashboard Challenge", 
                "submission_received", 
                "New submission from candidate",
                12
            )
            
            await asyncio.sleep(25)
            
            await send_system_alert(
                "info", 
                "System Update", 
                "New AI agent features are now available",
                True,
                "/ai-agents"
            )
            
            await asyncio.sleep(30)
            
        except Exception as e:
            logger.error(f"Error in demo notifications: {e}")
            await asyncio.sleep(5)

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    user_id = None
    
    try:
        await manager.connect(websocket)
        
        # Send welcome message
        welcome_msg = create_system_notification(
            "info", 
            "Connected", 
            "Real-time notifications are now active"
        )
        await manager.send_personal_message(json.dumps(welcome_msg), websocket)
        
        while True:
            # Receive messages from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                
                # Handle authentication
                if message.get("type") == "auth":
                    user_id = message.get("token", "demo_user")
                    logger.info(f"User authenticated: {user_id}")
                    
                    # Send authentication confirmation
                    auth_msg = create_system_notification(
                        "success", 
                        "Authenticated", 
                        f"Welcome! You are now receiving live updates."
                    )
                    await manager.send_personal_message(json.dumps(auth_msg), websocket)
                
                # Handle ping/pong for connection health
                elif message.get("type") == "ping":
                    pong_msg = {"type": "pong", "timestamp": datetime.now().isoformat()}
                    await manager.send_personal_message(json.dumps(pong_msg), websocket)
                
                # Handle other message types as needed
                else:
                    logger.info(f"Received message: {message}")
                    
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received: {data}")
            except Exception as e:
                logger.error(f"Error processing message: {e}")
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        logger.info(f"WebSocket disconnected for user: {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, user_id)

# Start demo notifications task
@router.on_event("startup")
async def startup_event():
    # Start demo notifications in background
    asyncio.create_task(send_demo_notifications())
    logger.info("WebSocket router started with demo notifications")

# Health check endpoint
@router.get("/ws/health")
async def websocket_health():
    return {
        "status": "healthy",
        "active_connections": len(manager.active_connections),
        "user_connections": len(manager.user_connections),
        "timestamp": datetime.now().isoformat()
    }

# Manual notification endpoints for testing
@router.post("/ws/send-notification")
async def send_manual_notification(
    notification_type: NotificationType,
    title: str,
    message: str,
    user_id: str = None
):
    """Manually send a notification (for testing)"""
    try:
        if notification_type == NotificationType.SYSTEM:
            await send_system_alert("info", title, message, user_id=user_id)
        elif notification_type == NotificationType.CANDIDATE_ACTIVITY:
            await send_candidate_activity("test_candidate", title, "manual_test", message, user_id)
        elif notification_type == NotificationType.AGENT_STATUS:
            await send_agent_status("test_agent", title, "test", "info", message, user_id)
        
        return {"status": "success", "message": "Notification sent"}
    except Exception as e:
        logger.error(f"Error sending manual notification: {e}")
        return {"status": "error", "message": str(e)}
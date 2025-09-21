from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import List, Dict, Any
import json
import asyncio
from datetime import datetime
import logging
from enum import Enum
import uuid

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
        self.sprint_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str = None, sprint_id: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(websocket)
        
        if sprint_id:
            if sprint_id not in self.sprint_connections:
                self.sprint_connections[sprint_id] = []
            self.sprint_connections[sprint_id].append(websocket)
        
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket, user_id: str = None, sprint_id: str = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if user_id and user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        if sprint_id and sprint_id in self.sprint_connections:
            if websocket in self.sprint_connections[sprint_id]:
                self.sprint_connections[sprint_id].remove(websocket)
            if not self.sprint_connections[sprint_id]:
                del self.sprint_connections[sprint_id]
        
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
    
    async def send_to_sprint(self, message: str, sprint_id: str):
        if sprint_id in self.sprint_connections:
            disconnected = []
            for websocket in self.sprint_connections[sprint_id]:
                try:
                    await websocket.send_text(message)
                except Exception as e:
                    logger.error(f"Error sending message to sprint {sprint_id}: {e}")
                    disconnected.append(websocket)
            
            # Clean up disconnected websockets
            for ws in disconnected:
                self.disconnect(ws, sprint_id=sprint_id)
    
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
    return {
        "type": NotificationType.SYSTEM,
        "level": level,
        "title": title,
        "message": message,
        "action_required": action_required,
        "action_url": action_url,
        "timestamp": datetime.now().isoformat()
    }

def create_sprint_notification(
    sprint_id: str,
    sprint_name: str,
    event: str,
    details: str,
    participant_count: int = None
) -> Dict[str, Any]:
    return {
        "type": NotificationType.SPRINT,
        "sprint_id": sprint_id,
        "sprint_name": sprint_name,
        "event": event,
        "details": details,
        "participant_count": participant_count,
        "timestamp": datetime.now().isoformat()
    }

# WebSocket endpoints
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Echo back the message with timestamp
            response = {
                "type": "echo",
                "original_message": message,
                "timestamp": datetime.now().isoformat(),
                "connection_id": str(id(websocket))
            }
            await manager.send_personal_message(json.dumps(response), websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@router.websocket("/ws/sprint/{sprint_id}")
async def sprint_websocket_endpoint(websocket: WebSocket, sprint_id: str):
    await manager.connect(websocket, sprint_id=sprint_id)
    try:
        # Send welcome message
        welcome_message = {
            "type": "sprint_connected",
            "sprint_id": sprint_id,
            "message": f"Connected to sprint {sprint_id}",
            "timestamp": datetime.now().isoformat()
        }
        await manager.send_personal_message(json.dumps(welcome_message), websocket)
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Broadcast message to all sprint participants
            sprint_message = {
                "type": "sprint_message",
                "sprint_id": sprint_id,
                "message": message,
                "timestamp": datetime.now().isoformat()
            }
            await manager.send_to_sprint(json.dumps(sprint_message), sprint_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, sprint_id=sprint_id)
        logger.info(f"Sprint WebSocket disconnected from {sprint_id}")
    except Exception as e:
        logger.error(f"Sprint WebSocket error: {e}")
        manager.disconnect(websocket, sprint_id=sprint_id)

@router.websocket("/ws/user/{user_id}")
async def user_websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id=user_id)
    try:
        # Send welcome message
        welcome_message = {
            "type": "user_connected",
            "user_id": user_id,
            "message": f"Connected as user {user_id}",
            "timestamp": datetime.now().isoformat()
        }
        await manager.send_personal_message(json.dumps(welcome_message), websocket)
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle user-specific messages
            response = {
                "type": "user_message_received",
                "user_id": user_id,
                "message": message,
                "timestamp": datetime.now().isoformat()
            }
            await manager.send_personal_message(json.dumps(response), websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id=user_id)
        logger.info(f"User WebSocket disconnected: {user_id}")
    except Exception as e:
        logger.error(f"User WebSocket error: {e}")
        manager.disconnect(websocket, user_id=user_id)

# API endpoints
@router.get("/ws/stats")
async def get_websocket_stats():
    return {
        "total_connections": len(manager.active_connections),
        "user_connections": len(manager.user_connections),
        "sprint_connections": len(manager.sprint_connections)
    }

@router.get("/ws/health")
async def websocket_health():
    return {
        "status": "healthy",
        "active_connections": len(manager.active_connections),
        "timestamp": datetime.now().isoformat()
    }

@router.post("/ws/send-notification")
async def send_manual_notification(
    notification_type: NotificationType,
    title: str,
    message: str,
    user_id: str = None
):
    notification = create_system_notification(
        level="info",
        title=title,
        message=message
    )
    
    if user_id:
        await manager.send_to_user(json.dumps(notification), user_id)
    else:
        await manager.broadcast(json.dumps(notification))
    
    return {"status": "sent", "notification": notification}

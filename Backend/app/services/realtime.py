"""Real-time communication service for WebSocket broadcasting."""

import json
import asyncio
from typing import Dict, Set, Any, Optional
from datetime import datetime
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""
    
    def __init__(self):
        # Active connections: {connection_id: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}
        
        # Sprint subscriptions: {sprint_id: set(connection_ids)}
        self.sprint_subscriptions: Dict[str, Set[str]] = {}
        
        # User subscriptions: {user_id: set(connection_ids)}
        self.user_subscriptions: Dict[str, Set[str]] = {}
        
        # Connection metadata: {connection_id: {user_id, sprint_id, etc.}}
        self.connection_metadata: Dict[str, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, connection_id: str, user_id: Optional[str] = None, sprint_id: Optional[str] = None):
        """Accept a WebSocket connection and register it."""
        await websocket.accept()
        
        self.active_connections[connection_id] = websocket
        self.connection_metadata[connection_id] = {
            "user_id": user_id,
            "sprint_id": sprint_id,
            "connected_at": datetime.utcnow().isoformat()
        }
        
        # Subscribe to sprint updates
        if sprint_id:
            if sprint_id not in self.sprint_subscriptions:
                self.sprint_subscriptions[sprint_id] = set()
            self.sprint_subscriptions[sprint_id].add(connection_id)
            
        # Subscribe to user updates
        if user_id:
            if user_id not in self.user_subscriptions:
                self.user_subscriptions[user_id] = set()
            self.user_subscriptions[user_id].add(connection_id)
            
        logger.info(f"WebSocket connection established: {connection_id} (user: {user_id}, sprint: {sprint_id})")

    def disconnect(self, connection_id: str):
        """Remove a WebSocket connection and clean up subscriptions."""
        if connection_id not in self.active_connections:
            return
            
        metadata = self.connection_metadata.get(connection_id, {})
        sprint_id = metadata.get("sprint_id")
        user_id = metadata.get("user_id")
        
        # Remove from active connections
        del self.active_connections[connection_id]
        del self.connection_metadata[connection_id]
        
        # Clean up sprint subscriptions
        if sprint_id and sprint_id in self.sprint_subscriptions:
            self.sprint_subscriptions[sprint_id].discard(connection_id)
            if not self.sprint_subscriptions[sprint_id]:
                del self.sprint_subscriptions[sprint_id]
                
        # Clean up user subscriptions
        if user_id and user_id in self.user_subscriptions:
            self.user_subscriptions[user_id].discard(connection_id)
            if not self.user_subscriptions[user_id]:
                del self.user_subscriptions[user_id]
                
        logger.info(f"WebSocket connection closed: {connection_id}")

    async def send_personal_message(self, message: Dict[str, Any], connection_id: str):
        """Send a message to a specific connection."""
        if connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]
            try:
                await websocket.send_text(json.dumps({
                    **message,
                    "timestamp": datetime.utcnow().isoformat()
                }))
            except Exception as e:
                logger.error(f"Failed to send message to {connection_id}: {e}")
                self.disconnect(connection_id)

    async def broadcast_to_sprint(self, sprint_id: str, event_type: str, payload: Any):
        """Broadcast a message to all connections subscribed to a sprint."""
        if sprint_id not in self.sprint_subscriptions:
            return
            
        message = {
            "type": event_type,
            "payload": payload,
            "sprint_id": sprint_id
        }
        
        disconnected_connections = []
        
        for connection_id in self.sprint_subscriptions[sprint_id].copy():
            if connection_id in self.active_connections:
                websocket = self.active_connections[connection_id]
                try:
                    await websocket.send_text(json.dumps({
                        **message,
                        "timestamp": datetime.utcnow().isoformat()
                    }))
                except Exception as e:
                    logger.error(f"Failed to broadcast to {connection_id}: {e}")
                    disconnected_connections.append(connection_id)
        
        # Clean up disconnected connections
        for connection_id in disconnected_connections:
            self.disconnect(connection_id)
            
        logger.info(f"Broadcasted {event_type} to {len(self.sprint_subscriptions[sprint_id])} connections in sprint {sprint_id}")

    async def broadcast_to_user(self, user_id: str, event_type: str, payload: Any):
        """Broadcast a message to all connections of a specific user."""
        if user_id not in self.user_subscriptions:
            return
            
        message = {
            "type": event_type,
            "payload": payload,
            "user_id": user_id
        }
        
        disconnected_connections = []
        
        for connection_id in self.user_subscriptions[user_id].copy():
            if connection_id in self.active_connections:
                websocket = self.active_connections[connection_id]
                try:
                    await websocket.send_text(json.dumps({
                        **message,
                        "timestamp": datetime.utcnow().isoformat()
                    }))
                except Exception as e:
                    logger.error(f"Failed to broadcast to user {user_id}: {e}")
                    disconnected_connections.append(connection_id)
        
        # Clean up disconnected connections
        for connection_id in disconnected_connections:
            self.disconnect(connection_id)

    def get_connection_count(self) -> int:
        """Get the total number of active connections."""
        return len(self.active_connections)
        
    def get_sprint_connection_count(self, sprint_id: str) -> int:
        """Get the number of connections subscribed to a sprint."""
        return len(self.sprint_subscriptions.get(sprint_id, set()))

# Global connection manager instance
connection_manager = ConnectionManager()

class RealtimeService:
    """Service for real-time communication."""
    
    @staticmethod
    async def broadcast_to_sprint(sprint_id: str, event_type: str, payload: Any):
        """Broadcast an event to all connections in a sprint."""
        await connection_manager.broadcast_to_sprint(sprint_id, event_type, payload)
        
    @staticmethod
    async def broadcast_to_user(user_id: str, event_type: str, payload: Any):
        """Broadcast an event to all connections of a user."""
        await connection_manager.broadcast_to_user(user_id, event_type, payload)
        
    @staticmethod
    async def send_notification(user_id: str, notification: Dict[str, Any]):
        """Send a notification to a specific user."""
        await RealtimeService.broadcast_to_user(user_id, "notification", notification)
        
    @staticmethod
    def get_stats() -> Dict[str, Any]:
        """Get real-time service statistics."""
        return {
            "total_connections": connection_manager.get_connection_count(),
            "active_sprints": len(connection_manager.sprint_subscriptions),
            "active_users": len(connection_manager.user_subscriptions)
        }

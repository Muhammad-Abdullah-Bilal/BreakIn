"""WebSocket routes for real-time communication."""

import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from app.services.realtime import connection_manager
from app.dependencies import get_current_user_ws
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/ws/sprint/{sprint_id}")
async def sprint_websocket_endpoint(websocket: WebSocket, sprint_id: str):
    """WebSocket endpoint for sprint real-time updates."""
    connection_id = str(uuid.uuid4())
    
    try:
        # For now, we'll connect without authentication
        # In production, you'd want to verify the user and sprint access
        await connection_manager.connect(
            websocket=websocket, 
            connection_id=connection_id,
            sprint_id=sprint_id
        )
        
        # Send welcome message
        await connection_manager.send_personal_message(
            {
                "type": "connected",
                "payload": {
                    "message": f"Connected to sprint {sprint_id}",
                    "connection_id": connection_id
                }
            },
            connection_id
        )
        
        # Listen for messages from client
        while True:
            try:
                # Receive message from WebSocket
                data = await websocket.receive_text()
                logger.info(f"Received message from {connection_id}: {data}")
                
                # Echo message back (for testing)
                await connection_manager.send_personal_message(
                    {
                        "type": "echo",
                        "payload": {
                            "message": f"Server received: {data}"
                        }
                    },
                    connection_id
                )
                
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error in WebSocket loop: {e}")
                break
                
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
    finally:
        connection_manager.disconnect(connection_id)

@router.websocket("/ws/user/{user_id}")
async def user_websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for user-specific real-time updates."""
    connection_id = str(uuid.uuid4())
    
    try:
        await connection_manager.connect(
            websocket=websocket, 
            connection_id=connection_id,
            user_id=user_id
        )
        
        await connection_manager.send_personal_message(
            {
                "type": "connected",
                "payload": {
                    "message": f"Connected as user {user_id}",
                    "connection_id": connection_id
                }
            },
            connection_id
        )
        
        while True:
            try:
                data = await websocket.receive_text()
                logger.info(f"Received message from user {user_id}: {data}")
                
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error in user WebSocket loop: {e}")
                break
                
    except Exception as e:
        logger.error(f"User WebSocket connection error: {e}")
    finally:
        connection_manager.disconnect(connection_id)

@router.get("/ws/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics."""
    from app.services.realtime import RealtimeService
    return RealtimeService.get_stats()

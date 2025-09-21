from typing import Generator, Optional
from fastapi import WebSocket, Depends

from app.config import get_database, settings


def get_db() -> Generator:
    """FastAPI dependency that yields a MongoDB database instance."""
    db = get_database()
    try:
        yield db
    finally:
        # For pymongo we don't close per-request; keep connection pooling
        pass


def get_settings():
    """Return application settings (pydantic Settings instance)."""
    return settings


async def get_current_user():
    """Get current authenticated user."""
    # TODO: Implement user authentication
    # For now, return a mock user
    return {"id": "user-123", "username": "testuser"}


async def get_current_user_ws(websocket: WebSocket) -> Optional[dict]:
    """Get current authenticated user from WebSocket connection."""
    # TODO: Implement WebSocket authentication
    # For now, return None (anonymous access)
    return None

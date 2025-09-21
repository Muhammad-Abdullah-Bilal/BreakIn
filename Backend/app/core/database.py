"""Database connection utilities for the core module.

This module provides database connection functions that can be imported
by other core modules, particularly the employer routes.
"""

from app.config import get_database, db
from app.dependencies import get_db

# Re-export the main database functions
__all__ = ["get_database", "get_db", "db"]
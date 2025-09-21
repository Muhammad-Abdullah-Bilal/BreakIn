"""Base migration framework for MongoDB.

This module provides the foundation for database migrations including
version tracking, migration execution, and rollback capabilities.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, Any, Optional, List
import logging
from pymongo.database import Database
from bson import ObjectId

logger = logging.getLogger(__name__)

class Migration(ABC):
    """Base class for all database migrations."""
    
    def __init__(self):
        self.version: str = ""
        self.description: str = ""
        self.depends_on: List[str] = []
    
    @abstractmethod
    def up(self, db: Database) -> bool:
        """Apply the migration.
        
        Args:
            db: MongoDB database instance
            
        Returns:
            bool: True if migration succeeded, False otherwise
        """
        pass
    
    @abstractmethod
    def down(self, db: Database) -> bool:
        """Rollback the migration.
        
        Args:
            db: MongoDB database instance
            
        Returns:
            bool: True if rollback succeeded, False otherwise
        """
        pass
    
    def validate(self, db: Database) -> bool:
        """Validate that the migration can be applied.
        
        Args:
            db: MongoDB database instance
            
        Returns:
            bool: True if migration can be applied, False otherwise
        """
        return True

class MigrationRecord:
    """Represents a migration record in the database."""
    
    def __init__(self, version: str, description: str, applied_at: datetime, 
                 checksum: str, execution_time_ms: int = 0):
        self.version = version
        self.description = description
        self.applied_at = applied_at
        self.checksum = checksum
        self.execution_time_ms = execution_time_ms
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for MongoDB storage."""
        return {
            "_id": self.version,
            "version": self.version,
            "description": self.description,
            "applied_at": self.applied_at,
            "checksum": self.checksum,
            "execution_time_ms": self.execution_time_ms
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MigrationRecord':
        """Create from MongoDB document."""
        return cls(
            version=data["version"],
            description=data["description"],
            applied_at=data["applied_at"],
            checksum=data["checksum"],
            execution_time_ms=data.get("execution_time_ms", 0)
        )

class MigrationManager:
    """Manages database migrations."""
    
    MIGRATION_COLLECTION = "_migrations"
    
    def __init__(self, db: Database):
        self.db = db
        self.collection = db[self.MIGRATION_COLLECTION]
        self._ensure_migration_collection()
    
    def _ensure_migration_collection(self):
        """Ensure the migration tracking collection exists."""
        # Create index on version for uniqueness
        self.collection.create_index("version", unique=True)
        logger.info("Migration collection initialized")
    
    def is_applied(self, version: str) -> bool:
        """Check if a migration version has been applied."""
        return self.collection.find_one({"version": version}) is not None
    
    def get_applied_migrations(self) -> List[MigrationRecord]:
        """Get all applied migrations ordered by application time."""
        docs = self.collection.find().sort("applied_at", 1)
        return [MigrationRecord.from_dict(doc) for doc in docs]
    
    def record_migration(self, migration: Migration, execution_time_ms: int = 0) -> bool:
        """Record a successful migration."""
        try:
            record = MigrationRecord(
                version=migration.version,
                description=migration.description,
                applied_at=datetime.utcnow(),
                checksum=self._calculate_checksum(migration),
                execution_time_ms=execution_time_ms
            )
            self.collection.insert_one(record.to_dict())
            logger.info(f"Recorded migration {migration.version}")
            return True
        except Exception as e:
            logger.error(f"Failed to record migration {migration.version}: {e}")
            return False
    
    def remove_migration_record(self, version: str) -> bool:
        """Remove migration record (for rollbacks)."""
        try:
            result = self.collection.delete_one({"version": version})
            if result.deleted_count > 0:
                logger.info(f"Removed migration record {version}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to remove migration record {version}: {e}")
            return False
    
    def _calculate_checksum(self, migration: Migration) -> str:
        """Calculate a checksum for the migration."""
        import hashlib
        content = f"{migration.version}{migration.description}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def apply_migration(self, migration: Migration) -> bool:
        """Apply a single migration with proper tracking."""
        if self.is_applied(migration.version):
            logger.info(f"Migration {migration.version} already applied, skipping")
            return True
        
        logger.info(f"Applying migration {migration.version}: {migration.description}")
        
        # Validate before applying
        if not migration.validate(self.db):
            logger.error(f"Migration {migration.version} failed validation")
            return False
        
        start_time = datetime.utcnow()
        try:
            # Apply the migration
            success = migration.up(self.db)
            if not success:
                logger.error(f"Migration {migration.version} failed to apply")
                return False
            
            # Record the migration
            execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            if not self.record_migration(migration, execution_time):
                # If we can't record it, we should rollback
                logger.error(f"Failed to record migration {migration.version}, attempting rollback")
                migration.down(self.db)
                return False
            
            logger.info(f"Successfully applied migration {migration.version}")
            return True
            
        except Exception as e:
            logger.error(f"Error applying migration {migration.version}: {e}")
            # Attempt rollback
            try:
                migration.down(self.db)
                logger.info(f"Rolled back migration {migration.version}")
            except Exception as rollback_error:
                logger.error(f"Rollback failed for migration {migration.version}: {rollback_error}")
            return False
    
    def rollback_migration(self, version: str, migration: Migration) -> bool:
        """Rollback a specific migration."""
        if not self.is_applied(version):
            logger.info(f"Migration {version} not applied, nothing to rollback")
            return True
        
        logger.info(f"Rolling back migration {version}")
        
        try:
            success = migration.down(self.db)
            if not success:
                logger.error(f"Failed to rollback migration {version}")
                return False
            
            # Remove the migration record
            if not self.remove_migration_record(version):
                logger.warning(f"Migration {version} rolled back but record not removed")
            
            logger.info(f"Successfully rolled back migration {version}")
            return True
            
        except Exception as e:
            logger.error(f"Error rolling back migration {version}: {e}")
            return False
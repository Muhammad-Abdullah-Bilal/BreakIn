"""Initial schema migration - Create core collections and indexes.

Version: 1.0.0
Description: Creates the foundational collections and indexes for the BreakIn platform
Dependencies: None
"""

import logging
from pymongo.database import Database
from pymongo import IndexModel, ASCENDING, DESCENDING, TEXT
from migrations.base import Migration

logger = logging.getLogger(__name__)

class InitialSchemaMigration(Migration):
    """Create initial database schema with core collections and indexes."""
    
    def __init__(self):
        super().__init__()
        self.version = "1.0.0"
        self.description = "Create initial database schema with core collections"
        self.depends_on = []
    
    def up(self, db: Database) -> bool:
        """Create the initial schema."""
        try:
            logger.info("Creating initial database schema...")
            
            # Users collection
            self._create_users_collection(db)
            
            # Sprints collection  
            self._create_sprints_collection(db)
            
            # Submissions collection
            self._create_submissions_collection(db)
            
            # Feedback and reviews collection
            self._create_feedback_collection(db)
            
            # Scores collection
            self._create_scores_collection(db)
            
            # Companies collection
            self._create_companies_collection(db)
            
            # Analytics collection
            self._create_analytics_collection(db)
            
            logger.info("Initial schema created successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create initial schema: {e}")
            return False
    
    def _create_users_collection(self, db: Database) -> None:
        """Create users collection with indexes."""
        collection = db["users"]
        
        # Create indexes
        indexes = [
            IndexModel([("email", ASCENDING)], unique=True, name="email_unique"),
            IndexModel([("handle", ASCENDING)], unique=True, name="handle_unique"),
            IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
            IndexModel([("is_active", ASCENDING)], name="is_active"),
            IndexModel([("roles", ASCENDING)], name="roles"),
            IndexModel([("access_level", ASCENDING)], name="access_level"),
            IndexModel([("full_name", TEXT), ("handle", TEXT)], name="user_search"),
        ]
        
        collection.create_indexes(indexes)
        logger.info("Created users collection with indexes")
    
    def _create_sprints_collection(self, db: Database) -> None:
        """Create sprints collection with indexes."""
        collection = db["sprints"]
        
        indexes = [
            IndexModel([("owner_id", ASCENDING)], name="owner_id"),
            IndexModel([("state", ASCENDING)], name="state"),
            IndexModel([("start_at", ASCENDING)], name="start_at"),
            IndexModel([("end_at", ASCENDING)], name="end_at"),
            IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
            IndexModel([("sector_tags", ASCENDING)], name="sector_tags"),
            IndexModel([("difficulty_level", ASCENDING)], name="difficulty_level"),
            IndexModel([("config.stack", ASCENDING)], name="tech_stack"),
            IndexModel([("title", TEXT), ("description", TEXT)], name="sprint_search"),
            # Compound indexes for common queries
            IndexModel([("state", ASCENDING), ("start_at", ASCENDING)], name="state_start"),
            IndexModel([("owner_id", ASCENDING), ("state", ASCENDING)], name="owner_state"),
        ]
        
        collection.create_indexes(indexes)
        logger.info("Created sprints collection with indexes")
    
    def _create_submissions_collection(self, db: Database) -> None:
        """Create submissions collection with indexes."""
        collection = db["submissions"]
        
        indexes = [
            IndexModel([("sprint_id", ASCENDING)], name="sprint_id"),
            IndexModel([("team_id", ASCENDING)], name="team_id"),
            IndexModel([("submitted_by", ASCENDING)], name="submitted_by"),
            IndexModel([("status", ASCENDING)], name="status"),
            IndexModel([("submitted_at", DESCENDING)], name="submitted_at_desc"),
            IndexModel([("version", ASCENDING)], name="version"),
            # Compound indexes
            IndexModel([("sprint_id", ASCENDING), ("team_id", ASCENDING)], name="sprint_team"),
            IndexModel([("sprint_id", ASCENDING), ("status", ASCENDING)], name="sprint_status"),
            IndexModel([("team_id", ASCENDING), ("version", DESCENDING)], name="team_version"),
        ]
        
        collection.create_indexes(indexes)
        logger.info("Created submissions collection with indexes")
    
    def _create_feedback_collection(self, db: Database) -> None:
        """Create feedback/reviews collection with indexes."""
        collection = db["feedback"]
        
        indexes = [
            IndexModel([("submission_id", ASCENDING)], name="submission_id"),
            IndexModel([("reviewer_id", ASCENDING)], name="reviewer_id"),
            IndexModel([("status", ASCENDING)], name="status"),
            IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
            IndexModel([("normalized_score", DESCENDING)], name="normalized_score_desc"),
            # Compound indexes
            IndexModel([("submission_id", ASCENDING), ("status", ASCENDING)], name="submission_status"),
            IndexModel([("reviewer_id", ASCENDING), ("created_at", DESCENDING)], name="reviewer_created"),
        ]
        
        collection.create_indexes(indexes)
        logger.info("Created feedback collection with indexes")
    
    def _create_scores_collection(self, db: Database) -> None:
        """Create scores collection with indexes."""
        collection = db["scores"]
        
        indexes = [
            IndexModel([("user_id", ASCENDING)], name="user_id"),
            IndexModel([("sprint_id", ASCENDING)], name="sprint_id"),
            IndexModel([("category", ASCENDING)], name="category"),
            IndexModel([("score", DESCENDING)], name="score_desc"),
            IndexModel([("updated_at", DESCENDING)], name="updated_at_desc"),
            # Compound indexes for leaderboards
            IndexModel([("sprint_id", ASCENDING), ("score", DESCENDING)], name="sprint_leaderboard"),
            IndexModel([("category", ASCENDING), ("score", DESCENDING)], name="category_leaderboard"),
            IndexModel([("user_id", ASCENDING), ("sprint_id", ASCENDING)], name="user_sprint", unique=True),
        ]
        
        collection.create_indexes(indexes)
        logger.info("Created scores collection with indexes")
    
    def _create_companies_collection(self, db: Database) -> None:
        """Create companies collection with indexes."""
        collection = db["companies"]
        
        indexes = [
            IndexModel([("slug", ASCENDING)], unique=True, name="slug_unique"),
            IndexModel([("owner_id", ASCENDING)], name="owner_id"),
            IndexModel([("is_active", ASCENDING)], name="is_active"),
            IndexModel([("industry", ASCENDING)], name="industry"),
            IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
            IndexModel([("name", TEXT), ("description", TEXT)], name="company_search"),
        ]
        
        collection.create_indexes(indexes)
        logger.info("Created companies collection with indexes")
    
    def _create_analytics_collection(self, db: Database) -> None:
        """Create analytics collection with indexes."""
        collection = db["analytics"]
        
        indexes = [
            IndexModel([("event_type", ASCENDING)], name="event_type"),
            IndexModel([("user_id", ASCENDING)], name="user_id"),
            IndexModel([("timestamp", DESCENDING)], name="timestamp_desc"),
            IndexModel([("session_id", ASCENDING)], name="session_id"),
            # Compound indexes for time-series queries
            IndexModel([("event_type", ASCENDING), ("timestamp", DESCENDING)], name="event_time"),
            IndexModel([("user_id", ASCENDING), ("timestamp", DESCENDING)], name="user_time"),
        ]
        
        collection.create_indexes(indexes)
        logger.info("Created analytics collection with indexes")
    
    def down(self, db: Database) -> bool:
        """Rollback the initial schema."""
        try:
            logger.info("Rolling back initial schema...")
            
            # Drop collections (this will also drop their indexes)
            collections_to_drop = [
                "users", "sprints", "submissions", "feedback", 
                "scores", "companies", "analytics"
            ]
            
            for collection_name in collections_to_drop:
                db.drop_collection(collection_name)
                logger.info(f"Dropped collection: {collection_name}")
            
            logger.info("Initial schema rollback completed")
            return True
            
        except Exception as e:
            logger.error(f"Failed to rollback initial schema: {e}")
            return False
    
    def validate(self, db: Database) -> bool:
        """Validate that the migration can be applied."""
        try:
            # Check if any of the collections already exist
            existing_collections = db.list_collection_names()
            target_collections = [
                "users", "sprints", "submissions", "feedback", 
                "scores", "companies", "analytics"
            ]
            
            conflicts = [col for col in target_collections if col in existing_collections]
            if conflicts:
                logger.warning(f"Collections already exist: {conflicts}")
                # This is not necessarily an error - we can still apply indexes
            
            return True
            
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            return False
"""User profiles and identity migration.

Version: 1.1.0
Description: Creates collections for user profiles, skills, portfolios, and identity management
Dependencies: 1.0.0
"""

import logging
from pymongo.database import Database
from pymongo import IndexModel, ASCENDING, DESCENDING, TEXT
from migrations.base import Migration

logger = logging.getLogger(__name__)

class UserProfilesMigration(Migration):
    """Create user profile related collections and indexes."""
    
    def __init__(self):
        super().__init__()
        self.version = "1.1.0"
        self.description = "Create user profiles, skills, and identity collections"
        self.depends_on = ["1.0.0"]
    
    def up(self, db: Database) -> bool:
        """Create user profile collections."""
        try:
            logger.info("Creating user profile collections...")
            
            # User profiles collection
            self._create_user_profiles_collection(db)
            
            # User skills collection
            self._create_user_skills_collection(db)
            
            # User portfolios collection
            self._create_user_portfolios_collection(db)
            
            # User settings collection
            self._create_user_settings_collection(db)
            
            # User activities collection
            self._create_user_activities_collection(db)
            
            # Reputation/endorsements collection
            self._create_reputation_collection(db)
            
            logger.info("User profile collections created successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create user profile collections: {e}")
            return False
    
    def _create_user_profiles_collection(self, db: Database) -> None:
        """Create user_profiles collection with indexes."""
        collection = db["user_profiles"]
        
        indexes = [
            IndexModel([("user_id", ASCENDING)], unique=True, name="user_id_unique"),
            IndexModel([("display_name", ASCENDING)], name="display_name"),
            IndexModel([("location.country", ASCENDING)], name="country"),
            IndexModel([("location.city", ASCENDING)], name="city"),
            IndexModel([("experience_level", ASCENDING)], name="experience_level"),
            IndexModel([("industries", ASCENDING)], name="industries"),
            IndexModel([("updated_at", DESCENDING)], name="updated_at_desc"),
            IndexModel([("visibility", ASCENDING)], name="visibility"),
            IndexModel([("display_name", TEXT), ("bio", TEXT), ("headline", TEXT)], name="profile_search"),
        ]
        
        collection.create_indexes(indexes)
        logger.info("Created user_profiles collection with indexes")
    
    def _create_user_skills_collection(self, db: Database) -> None:
        """Create user_skills collection with indexes."""
        collection = db["user_skills"]
        
        indexes = [
            IndexModel([("user_id", ASCENDING)], name="user_id"),
            IndexModel([("skill_name", ASCENDING)], name="skill_name"),
            IndexModel([("category", ASCENDING)], name="category"),
            IndexModel([("level", DESCENDING)], name="level_desc"),
            IndexModel([("verified", ASCENDING)], name="verified"),
            IndexModel([("updated_at", DESCENDING)], name="updated_at_desc"),
            # Compound indexes
            IndexModel([("user_id", ASCENDING), ("category", ASCENDING)], name="user_category"),
            IndexModel([("skill_name", ASCENDING), ("level", DESCENDING)], name="skill_level"),
            IndexModel([("user_id", ASCENDING), ("skill_name", ASCENDING)], name="user_skill", unique=True),
        ]
        
        collection.create_indexes(indexes)
        logger.info("Created user_skills collection with indexes")
    
    def _create_user_portfolios_collection(self, db: Database) -> None:
        """Create user_portfolios collection with indexes."""
        collection = db["user_portfolios"]
        
        indexes = [
            IndexModel([("user_id", ASCENDING)], name="user_id"),
            IndexModel([("project_type", ASCENDING)], name="project_type"),
            IndexModel([("technologies", ASCENDING)], name="technologies"),
            IndexModel([("status", ASCENDING)], name="status"),
            IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
            IndexModel([("featured", ASCENDING)], name="featured"),
            IndexModel([("visibility", ASCENDING)], name="visibility"),
            IndexModel([("title", TEXT), ("description", TEXT)], name="portfolio_search"),
            # Compound indexes
            IndexModel([("user_id", ASCENDING), ("status", ASCENDING)], name="user_status"),
            IndexModel([("user_id", ASCENDING), ("featured", DESCENDING)], name="user_featured"),
        ]
        
        collection.create_indexes(indexes)
        logger.info("Created user_portfolios collection with indexes")
    
    def _create_user_settings_collection(self, db: Database) -> None:
        """Create user_settings collection with indexes."""
        collection = db["user_settings"]
        
        indexes = [
            IndexModel([("user_id", ASCENDING)], unique=True, name="user_id_unique"),
            IndexModel([("updated_at", DESCENDING)], name="updated_at_desc"),
        ]
        
        collection.create_indexes(indexes)
        logger.info("Created user_settings collection with indexes")
    
    def _create_user_activities_collection(self, db: Database) -> None:
        """Create user_activities collection with indexes."""
        collection = db["user_activities"]
        
        indexes = [
            IndexModel([("user_id", ASCENDING)], name="user_id"),
            IndexModel([("activity_type", ASCENDING)], name="activity_type"),
            IndexModel([("timestamp", DESCENDING)], name="timestamp_desc"),
            IndexModel([("sprint_id", ASCENDING)], name="sprint_id"),
            IndexModel([("points_earned", DESCENDING)], name="points_desc"),
            # Compound indexes for activity feeds
            IndexModel([("user_id", ASCENDING), ("timestamp", DESCENDING)], name="user_timeline"),
            IndexModel([("activity_type", ASCENDING), ("timestamp", DESCENDING)], name="activity_timeline"),
            IndexModel([("sprint_id", ASCENDING), ("timestamp", DESCENDING)], name="sprint_timeline"),
        ]
        
        collection.create_indexes(indexes)
        logger.info("Created user_activities collection with indexes")
    
    def _create_reputation_collection(self, db: Database) -> None:
        """Create reputation/endorsements collection with indexes."""
        collection = db["reputation"]
        
        indexes = [
            IndexModel([("user_id", ASCENDING)], name="user_id"),
            IndexModel([("endorser_id", ASCENDING)], name="endorser_id"),
            IndexModel([("skill", ASCENDING)], name="skill"),
            IndexModel([("type", ASCENDING)], name="type"),  # endorsement, review, rating
            IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
            IndexModel([("rating", DESCENDING)], name="rating_desc"),
            # Compound indexes
            IndexModel([("user_id", ASCENDING), ("skill", ASCENDING)], name="user_skill_rep"),
            IndexModel([("user_id", ASCENDING), ("type", ASCENDING)], name="user_type"),
            IndexModel([("endorser_id", ASCENDING), ("user_id", ASCENDING)], name="endorser_user", unique=True),
        ]
        
        collection.create_indexes(indexes)
        logger.info("Created reputation collection with indexes")
    
    def down(self, db: Database) -> bool:
        """Rollback user profile collections."""
        try:
            logger.info("Rolling back user profile collections...")
            
            collections_to_drop = [
                "user_profiles", "user_skills", "user_portfolios", 
                "user_settings", "user_activities", "reputation"
            ]
            
            for collection_name in collections_to_drop:
                db.drop_collection(collection_name)
                logger.info(f"Dropped collection: {collection_name}")
            
            logger.info("User profile collections rollback completed")
            return True
            
        except Exception as e:
            logger.error(f"Failed to rollback user profile collections: {e}")
            return False
    
    def validate(self, db: Database) -> bool:
        """Validate that the migration can be applied."""
        try:
            # Check if users collection exists (dependency)
            if "users" not in db.list_collection_names():
                logger.error("Users collection does not exist. Run migration 1.0.0 first.")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            return False
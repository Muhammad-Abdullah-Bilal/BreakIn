"""Squad and team management migration.

Version: 1.2.0
Description: Creates collections for squads, teams, invitations, and team management
Dependencies: 1.0.0, 1.1.0
"""

import logging
from pymongo.database import Database
from pymongo import IndexModel, ASCENDING, DESCENDING, TEXT
from migrations.base import Migration

logger = logging.getLogger(__name__)

class SquadManagementMigration(Migration):
    """Create squad and team management collections."""
    
    def __init__(self):
        super().__init__()
        self.version = "1.2.0"
        self.description = "Create squad, team, and invitation management collections"
        self.depends_on = ["1.0.0", "1.1.0"]
    
    def up(self, db: Database) -> bool:
        """Create squad management collections."""
        try:
            logger.info("Creating squad management collections...")
            
            # Teams/squads collection
            self._create_teams_collection(db)
            
            # Team memberships collection
            self._create_team_memberships_collection(db)
            
            # Team invitations collection
            self._create_team_invitations_collection(db)
            
            # Team activities collection
            self._create_team_activities_collection(db)
            
            # Squad rankings collection
            self._create_squad_rankings_collection(db)
            
            logger.info("Squad management collections created successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create squad management collections: {e}")
            return False
    
    def _create_teams_collection(self, db: Database) -> None:
        """Create teams collection with indexes."""
        collection = db["teams"]
        
        indexes = [
            IndexModel([("team_name", ASCENDING)], name="team_name"),
            IndexModel([("leader_id", ASCENDING)], name="leader_id"),
            IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
            IndexModel([("status", ASCENDING)], name="status"),
            IndexModel([("sprint_id", ASCENDING)], name="sprint_id"),
            IndexModel([("is_public", ASCENDING)], name="is_public"),
            IndexModel([("skills_needed", ASCENDING)], name="skills_needed"),
            IndexModel([("max_members", ASCENDING)], name="max_members"),
            IndexModel([("team_name", TEXT), ("description", TEXT)], name="team_search"),
            # Compound indexes
            IndexModel([("sprint_id", ASCENDING), ("status", ASCENDING)], name="sprint_status"),
            IndexModel([("leader_id", ASCENDING), ("status", ASCENDING)], name="leader_status"),
            IndexModel([("is_public", ASCENDING), ("status", ASCENDING)], name="public_status"),
        ]
        
        try:
            collection.create_indexes(indexes)
        except Exception as e:
            if 'already exists' in str(e) or 'IndexOptionsConflict' in str(e):
                logger.warning(f"Some indexes already exist for teams, continuing...")
            else:
                raise e
        logger.info("Created teams collection with indexes")
    
    def _create_team_memberships_collection(self, db: Database) -> None:
        """Create team_memberships collection with indexes."""
        collection = db["team_memberships"]
        
        indexes = [
            IndexModel([("team_id", ASCENDING)], name="team_id"),
            IndexModel([("user_id", ASCENDING)], name="user_id"),
            IndexModel([("role", ASCENDING)], name="role"),
            IndexModel([("status", ASCENDING)], name="status"),
            IndexModel([("joined_at", DESCENDING)], name="joined_at_desc"),
            IndexModel([("contribution_score", DESCENDING)], name="contribution_desc"),
            # Compound indexes
            IndexModel([("team_id", ASCENDING), ("status", ASCENDING)], name="team_status"),
            IndexModel([("user_id", ASCENDING), ("status", ASCENDING)], name="user_status"),
            IndexModel([("team_id", ASCENDING), ("user_id", ASCENDING)], name="team_user", unique=True),
            IndexModel([("team_id", ASCENDING), ("role", ASCENDING)], name="team_role"),
        ]
        
        try:
            collection.create_indexes(indexes)
        except Exception as e:
            if 'already exists' in str(e) or 'IndexOptionsConflict' in str(e):
                logger.warning(f"Some indexes already exist for team_memberships, continuing...")
            else:
                raise e
        logger.info("Created team_memberships collection with indexes")
    
    def _create_team_invitations_collection(self, db: Database) -> None:
        """Create team_invitations collection with indexes."""
        collection = db["team_invitations"]
        
        indexes = [
            IndexModel([("team_id", ASCENDING)], name="team_id"),
            IndexModel([("invitee_id", ASCENDING)], name="invitee_id"),
            IndexModel([("inviter_id", ASCENDING)], name="inviter_id"),
            IndexModel([("status", ASCENDING)], name="status"),
            IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
            IndexModel([("expires_at", ASCENDING)], name="expires_at"),
            # Compound indexes
            IndexModel([("invitee_id", ASCENDING), ("status", ASCENDING)], name="invitee_status"),
            IndexModel([("team_id", ASCENDING), ("status", ASCENDING)], name="team_status"),
            IndexModel([("team_id", ASCENDING), ("invitee_id", ASCENDING)], name="team_invitee", unique=True),
            # TTL index for automatic cleanup of expired invitations
            IndexModel([("expires_at", ASCENDING)], name="expires_ttl", expireAfterSeconds=0),
        ]
        
        try:
            collection.create_indexes(indexes)
        except Exception as e:
            if 'already exists' in str(e) or 'IndexOptionsConflict' in str(e):
                logger.warning(f"Some indexes already exist for team_invitations, continuing...")
            else:
                raise e
        logger.info("Created team_invitations collection with indexes")
    
    def _create_team_activities_collection(self, db: Database) -> None:
        """Create team_activities collection with indexes."""
        collection = db["team_activities"]
        
        indexes = [
            IndexModel([("team_id", ASCENDING)], name="team_id"),
            IndexModel([("user_id", ASCENDING)], name="user_id"),
            IndexModel([("activity_type", ASCENDING)], name="activity_type"),
            IndexModel([("timestamp", DESCENDING)], name="timestamp_desc"),
            IndexModel([("sprint_id", ASCENDING)], name="sprint_id"),
            # Compound indexes for activity feeds
            IndexModel([("team_id", ASCENDING), ("timestamp", DESCENDING)], name="team_timeline"),
            IndexModel([("user_id", ASCENDING), ("timestamp", DESCENDING)], name="user_timeline"),
            IndexModel([("team_id", ASCENDING), ("activity_type", ASCENDING)], name="team_activity"),
        ]
        
        try:
            collection.create_indexes(indexes)
        except Exception as e:
            if 'already exists' in str(e) or 'IndexOptionsConflict' in str(e):
                logger.warning(f"Some indexes already exist for team_activities, continuing...")
            else:
                raise e
        logger.info("Created team_activities collection with indexes")
    
    def _create_squad_rankings_collection(self, db: Database) -> None:
        """Create squad_rankings collection with indexes."""
        collection = db["squad_rankings"]
        
        indexes = [
            IndexModel([("team_id", ASCENDING)], name="team_id"),
            IndexModel([("sprint_id", ASCENDING)], name="sprint_id"),
            IndexModel([("ranking_type", ASCENDING)], name="ranking_type"),  # global, sprint, skill-based
            IndexModel([("rank", ASCENDING)], name="rank"),
            IndexModel([("score", DESCENDING)], name="score_desc"),
            IndexModel([("updated_at", DESCENDING)], name="updated_at_desc"),
            # Compound indexes for leaderboards
            IndexModel([("ranking_type", ASCENDING), ("score", DESCENDING)], name="type_score"),
            IndexModel([("sprint_id", ASCENDING), ("score", DESCENDING)], name="sprint_score"),
            IndexModel([("team_id", ASCENDING), ("ranking_type", ASCENDING)], name="team_type", unique=True),
        ]
        
        try:
            collection.create_indexes(indexes)
        except Exception as e:
            if 'already exists' in str(e) or 'IndexOptionsConflict' in str(e):
                logger.warning(f"Some indexes already exist for squad_rankings, continuing...")
            else:
                raise e
        logger.info("Created squad_rankings collection with indexes")
    
    def down(self, db: Database) -> bool:
        """Rollback squad management collections."""
        try:
            logger.info("Rolling back squad management collections...")
            
            collections_to_drop = [
                "teams", "team_memberships", "team_invitations", 
                "team_activities", "squad_rankings"
            ]
            
            for collection_name in collections_to_drop:
                db.drop_collection(collection_name)
                logger.info(f"Dropped collection: {collection_name}")
            
            logger.info("Squad management collections rollback completed")
            return True
            
        except Exception as e:
            logger.error(f"Failed to rollback squad management collections: {e}")
            return False
    
    def validate(self, db: Database) -> bool:
        """Validate that the migration can be applied."""
        try:
            # Check dependencies
            required_collections = ["users", "sprints", "user_profiles"]
            existing_collections = db.list_collection_names()
            
            for collection in required_collections:
                if collection not in existing_collections:
                    logger.error(f"Required collection '{collection}' does not exist")
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            return False
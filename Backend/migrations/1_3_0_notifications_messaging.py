"""Notification and messaging system migration.

Version: 1.3.0
Description: Creates collections for notifications, messages, and communication
Dependencies: 1.0.0, 1.1.0
"""

import logging
from pymongo.database import Database
from pymongo import IndexModel, ASCENDING, DESCENDING, TEXT
from migrations.base import Migration

logger = logging.getLogger(__name__)

class NotificationMessagingMigration(Migration):
    """Create notification and messaging collections."""
    
    def __init__(self):
        super().__init__()
        self.version = "1.3.0"
        self.description = "Create notification and messaging system collections"
        self.depends_on = ["1.0.0", "1.1.0"]
    
    def up(self, db: Database) -> bool:
        """Create notification and messaging collections."""
        try:
            logger.info("Creating notification and messaging collections...")
            
            # Notifications collection
            self._create_notifications_collection(db)
            
            # Messages/conversations collection
            self._create_messages_collection(db)
            
            # Conversation participants collection
            self._create_conversation_participants_collection(db)
            
            # Push notification tokens collection
            self._create_push_tokens_collection(db)
            
            # Email queue collection
            self._create_email_queue_collection(db)
            
            logger.info("Notification and messaging collections created successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create notification and messaging collections: {e}")
            return False
    
    def _create_notifications_collection(self, db: Database) -> None:
        """Create notifications collection with indexes."""
        collection = db["notifications"]
        
        indexes = [
            IndexModel([("user_id", ASCENDING)], name="user_id"),
            IndexModel([("type", ASCENDING)], name="type"),
            IndexModel([("status", ASCENDING)], name="status"),  # unread, read, dismissed
            IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
            IndexModel([("priority", DESCENDING)], name="priority_desc"),
            IndexModel([("category", ASCENDING)], name="category"),
            IndexModel([("related_entity_type", ASCENDING)], name="entity_type"),
            IndexModel([("related_entity_id", ASCENDING)], name="entity_id"),
            # Compound indexes
            IndexModel([("user_id", ASCENDING), ("status", ASCENDING)], name="user_status"),
            IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)], name="user_timeline"),
            IndexModel([("type", ASCENDING), ("created_at", DESCENDING)], name="type_timeline"),
            IndexModel([("user_id", ASCENDING), ("category", ASCENDING)], name="user_category"),
            # TTL index for automatic cleanup of old notifications (30 days)
            IndexModel([("created_at", ASCENDING)], name="notification_ttl", expireAfterSeconds=2592000),
        ]
        
        collection.create_indexes(indexes)
        logger.info("Created notifications collection with indexes")
    
    def _create_messages_collection(self, db: Database) -> None:
        """Create messages collection with indexes."""
        collection = db["messages"]
        
        indexes = [
            IndexModel([("conversation_id", ASCENDING)], name="conversation_id"),
            IndexModel([("sender_id", ASCENDING)], name="sender_id"),
            IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
            IndexModel([("message_type", ASCENDING)], name="message_type"),  # text, system, file, etc.
            IndexModel([("edited", ASCENDING)], name="edited"),
            IndexModel([("deleted", ASCENDING)], name="deleted"),
            IndexModel([("content", TEXT)], name="message_search"),
            # Compound indexes
            IndexModel([("conversation_id", ASCENDING), ("created_at", DESCENDING)], name="conversation_timeline"),
            IndexModel([("sender_id", ASCENDING), ("created_at", DESCENDING)], name="sender_timeline"),
            IndexModel([("conversation_id", ASCENDING), ("deleted", ASCENDING)], name="conversation_active"),
        ]
        
        collection.create_indexes(indexes)
        logger.info("Created messages collection with indexes")
    
    def _create_conversation_participants_collection(self, db: Database) -> None:
        """Create conversation_participants collection with indexes."""
        collection = db["conversation_participants"]
        
        indexes = [
            IndexModel([("conversation_id", ASCENDING)], name="conversation_id"),
            IndexModel([("user_id", ASCENDING)], name="user_id"),
            IndexModel([("role", ASCENDING)], name="role"),  # admin, member, readonly
            IndexModel([("joined_at", DESCENDING)], name="joined_at_desc"),
            IndexModel([("last_read_at", DESCENDING)], name="last_read_desc"),
            IndexModel([("is_active", ASCENDING)], name="is_active"),
            # Compound indexes
            IndexModel([("user_id", ASCENDING), ("is_active", ASCENDING)], name="user_active"),
            IndexModel([("conversation_id", ASCENDING), ("is_active", ASCENDING)], name="conversation_active"),
            IndexModel([("conversation_id", ASCENDING), ("user_id", ASCENDING)], name="conversation_user", unique=True),
        ]
        
        collection.create_indexes(indexes)
        logger.info("Created conversation_participants collection with indexes")
    
    def _create_push_tokens_collection(self, db: Database) -> None:
        """Create push_tokens collection with indexes."""
        collection = db["push_tokens"]
        
        indexes = [
            IndexModel([("user_id", ASCENDING)], name="user_id"),
            IndexModel([("token", ASCENDING)], unique=True, name="token_unique"),
            IndexModel([("platform", ASCENDING)], name="platform"),  # ios, android, web
            IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
            IndexModel([("last_used_at", DESCENDING)], name="last_used_desc"),
            IndexModel([("is_active", ASCENDING)], name="is_active"),
            # Compound indexes
            IndexModel([("user_id", ASCENDING), ("is_active", ASCENDING)], name="user_active"),
            IndexModel([("platform", ASCENDING), ("is_active", ASCENDING)], name="platform_active"),
            # TTL index for automatic cleanup of inactive tokens (90 days)
            IndexModel([("last_used_at", ASCENDING)], name="token_ttl", expireAfterSeconds=7776000),
        ]
        
        collection.create_indexes(indexes)
        logger.info("Created push_tokens collection with indexes")
    
    def _create_email_queue_collection(self, db: Database) -> None:
        """Create email_queue collection with indexes."""
        collection = db["email_queue"]
        
        indexes = [
            IndexModel([("status", ASCENDING)], name="status"),  # pending, sent, failed, retrying
            IndexModel([("priority", DESCENDING)], name="priority_desc"),
            IndexModel([("scheduled_at", ASCENDING)], name="scheduled_at"),
            IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
            IndexModel([("template_id", ASCENDING)], name="template_id"),
            IndexModel([("recipient_email", ASCENDING)], name="recipient_email"),
            IndexModel([("retry_count", ASCENDING)], name="retry_count"),
            # Compound indexes for queue processing
            IndexModel([("status", ASCENDING), ("priority", DESCENDING)], name="status_priority"),
            IndexModel([("status", ASCENDING), ("scheduled_at", ASCENDING)], name="status_scheduled"),
            IndexModel([("recipient_email", ASCENDING), ("created_at", DESCENDING)], name="recipient_timeline"),
            # TTL index for automatic cleanup of processed emails (30 days)
            IndexModel([("created_at", ASCENDING)], name="email_ttl", expireAfterSeconds=2592000),
        ]
        
        collection.create_indexes(indexes)
        logger.info("Created email_queue collection with indexes")
    
    def down(self, db: Database) -> bool:
        """Rollback notification and messaging collections."""
        try:
            logger.info("Rolling back notification and messaging collections...")
            
            collections_to_drop = [
                "notifications", "messages", "conversation_participants", 
                "push_tokens", "email_queue"
            ]
            
            for collection_name in collections_to_drop:
                db.drop_collection(collection_name)
                logger.info(f"Dropped collection: {collection_name}")
            
            logger.info("Notification and messaging collections rollback completed")
            return True
            
        except Exception as e:
            logger.error(f"Failed to rollback notification and messaging collections: {e}")
            return False
    
    def validate(self, db: Database) -> bool:
        """Validate that the migration can be applied."""
        try:
            # Check dependencies
            required_collections = ["users", "user_profiles"]
            existing_collections = db.list_collection_names()
            
            for collection in required_collections:
                if collection not in existing_collections:
                    logger.error(f"Required collection '{collection}' does not exist")
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            return False
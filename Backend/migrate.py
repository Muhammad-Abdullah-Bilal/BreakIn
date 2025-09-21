#!/usr/bin/env python3
"""Database migration management script for BreakIn platform.

Usage:
    python migrate.py migrate [--target VERSION]  # Run migrations
    python migrate.py rollback --target VERSION   # Rollback to version  
    python migrate.py status                       # Show migration status
    python migrate.py create DESCRIPTION          # Create new migration template

Examples:
    python migrate.py migrate                      # Run all pending migrations
    python migrate.py migrate --target 1.2.0      # Run migrations up to 1.2.0
    python migrate.py rollback --target 1.0.0     # Rollback to 1.0.0
    python migrate.py status                       # Show current status
"""

import os
import sys
import argparse
from pathlib import Path
from datetime import datetime

# Add the parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from migrations.runner import MigrationRunner

def create_migration_template(description: str) -> None:
    """Create a new migration file template."""
    # Generate version number based on current time
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    version = f"1.{len(list(Path('migrations').glob('*.py')) - 2)}.0"  # Subtract base.py and runner.py
    
    # Create filename
    safe_description = "".join(c if c.isalnum() or c in "_ " else "" for c in description.lower())
    safe_description = "_".join(safe_description.split())
    filename = f"{version.replace('.', '_')}_{safe_description}.py"
    filepath = Path("migrations") / filename
    
    # Migration template
    template = f'''"""Migration: {description}

Version: {version}
Description: {description}
Dependencies: []  # Add version dependencies here
"""

import logging
from pymongo.database import Database
from pymongo import IndexModel, ASCENDING, DESCENDING, TEXT
from migrations.base import Migration

logger = logging.getLogger(__name__)

class {safe_description.title().replace('_', '')}Migration(Migration):
    """Migration: {description}"""
    
    def __init__(self):
        super().__init__()
        self.version = "{version}"
        self.description = "{description}"
        self.depends_on = []  # Add dependencies like ["1.0.0", "1.1.0"]
    
    def up(self, db: Database) -> bool:
        """Apply the migration."""
        try:
            logger.info("Applying migration {version}: {description}")
            
            # TODO: Implement migration logic here
            # Example:
            # collection = db["new_collection"]
            # indexes = [
            #     IndexModel([("field", ASCENDING)], name="field_index"),
            # ]
            # collection.create_indexes(indexes)
            
            logger.info("Migration {version} applied successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to apply migration {version}: {{e}}")
            return False
    
    def down(self, db: Database) -> bool:
        """Rollback the migration."""
        try:
            logger.info("Rolling back migration {version}: {description}")
            
            # TODO: Implement rollback logic here
            # Example:
            # db.drop_collection("new_collection")
            
            logger.info("Migration {version} rolled back successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to rollback migration {version}: {{e}}")
            return False
    
    def validate(self, db: Database) -> bool:
        """Validate that the migration can be applied."""
        try:
            # TODO: Add validation logic here
            # Example:
            # if "required_collection" not in db.list_collection_names():
            #     logger.error("Required collection does not exist")
            #     return False
            
            return True
            
        except Exception as e:
            logger.error(f"Validation failed: {{e}}")
            return False
'''
    
    # Write the template file
    with open(filepath, 'w') as f:
        f.write(template)
    
    print(f"Created migration template: {filepath}")
    print(f"Version: {version}")
    print(f"Edit the file to implement your migration logic.")

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="BreakIn Database Migration Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Migrate command
    migrate_parser = subparsers.add_parser("migrate", help="Run database migrations")
    migrate_parser.add_argument("--target", help="Target version to migrate to")
    migrate_parser.add_argument("--dry-run", action="store_true", help="Show what would be migrated without applying")
    
    # Rollback command
    rollback_parser = subparsers.add_parser("rollback", help="Rollback database migrations")
    rollback_parser.add_argument("--target", required=True, help="Target version to rollback to")
    rollback_parser.add_argument("--dry-run", action="store_true", help="Show what would be rolled back without applying")
    
    # Status command
    subparsers.add_parser("status", help="Show migration status")
    
    # Create command
    create_parser = subparsers.add_parser("create", help="Create new migration template")
    create_parser.add_argument("description", help="Description of the migration")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    try:
        if args.command == "create":
            create_migration_template(args.description)
            return
        
        # For other commands, create the runner
        runner = MigrationRunner()
        
        if args.command == "migrate":
            if hasattr(args, 'dry_run') and args.dry_run:
                print("DRY RUN: Would apply the following migrations:")
                # TODO: Implement dry run logic
                runner.status()
            else:
                print("🚀 Starting database migration...")
                success = runner.run_migrations(args.target)
                if success:
                    print("✅ Migration completed successfully!")
                    runner.status()
                else:
                    print("❌ Migration failed!")
                    sys.exit(1)
        
        elif args.command == "rollback":
            if hasattr(args, 'dry_run') and args.dry_run:
                print("DRY RUN: Would rollback the following migrations:")
                # TODO: Implement dry run logic
                runner.status()
            else:
                print(f"🔄 Rolling back to version {args.target}...")
                success = runner.rollback_to_version(args.target)
                if success:
                    print("✅ Rollback completed successfully!")
                    runner.status()
                else:
                    print("❌ Rollback failed!")
                    sys.exit(1)
        
        elif args.command == "status":
            runner.status()
    
    except KeyboardInterrupt:
        print("\\n❌ Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
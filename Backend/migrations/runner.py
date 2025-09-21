"""Migration runner and management utilities."""

import os
import sys
import importlib.util
from typing import List, Dict, Type
import logging
from pathlib import Path

# Add the parent directory to the path so we can import app modules
sys.path.append(str(Path(__file__).parent.parent))

from app.config import get_database
from migrations.base import Migration, MigrationManager

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

class MigrationRunner:
    """Utility to discover and run database migrations."""
    
    def __init__(self, migrations_dir: str = None):
        self.migrations_dir = migrations_dir or os.path.join(os.path.dirname(__file__))
        self.db = get_database()
        self.manager = MigrationManager(self.db)
        
    def discover_migrations(self) -> Dict[str, Type[Migration]]:
        """Discover all migration classes in the migrations directory."""
        migrations = {}
        migrations_path = Path(self.migrations_dir)
        
        # Look for Python files that start with a version number
        for file_path in migrations_path.glob("*.py"):
            if file_path.name.startswith("__") or file_path.name == "base.py" or file_path.name == "runner.py":
                continue
                
            try:
                # Import the module
                spec = importlib.util.spec_from_file_location(file_path.stem, file_path)
                if spec is None or spec.loader is None:
                    continue
                    
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                # Find Migration classes in the module
                for attr_name in dir(module):
                    attr = getattr(module, attr_name)
                    if (isinstance(attr, type) and 
                        issubclass(attr, Migration) and 
                        attr != Migration):
                        migration_instance = attr()
                        if hasattr(migration_instance, 'version') and migration_instance.version:
                            migrations[migration_instance.version] = attr
                            logger.debug(f"Discovered migration {migration_instance.version}: {attr_name}")
                            
            except Exception as e:
                logger.error(f"Failed to load migration from {file_path}: {e}")
                
        return migrations
    
    def sort_migrations(self, migrations: Dict[str, Type[Migration]]) -> List[Type[Migration]]:
        """Sort migrations by version number."""
        # Convert version strings to sortable format (assuming semantic versioning)
        def version_key(migration_class):
            instance = migration_class()
            version = instance.version
            # Handle different version formats
            if version.count('.') == 2:  # e.g., "1.0.0"
                parts = version.split('.')
                return tuple(int(p) for p in parts)
            elif version.count('.') == 1:  # e.g., "1.0"
                parts = version.split('.')
                return tuple(int(p) for p in parts) + (0,)
            else:  # Single number or date format
                try:
                    return (int(version),)
                except ValueError:
                    # For date-based versions like "20250920_001"
                    return (version,)
        
        sorted_classes = sorted(migrations.values(), key=version_key)
        return sorted_classes
    
    def run_migrations(self, target_version: str = None) -> bool:
        """Run all pending migrations up to target version."""
        logger.info("Starting migration process...")
        
        # Discover all migrations
        migrations = self.discover_migrations()
        if not migrations:
            logger.info("No migrations found")
            return True
        
        # Sort migrations by version
        sorted_migrations = self.sort_migrations(migrations)
        
        # Filter by target version if specified
        if target_version:
            filtered = []
            for migration_class in sorted_migrations:
                instance = migration_class()
                filtered.append(migration_class)
                if instance.version == target_version:
                    break
            sorted_migrations = filtered
        
        # Apply each migration
        success_count = 0
        for migration_class in sorted_migrations:
            migration = migration_class()
            
            # Check dependencies
            if not self._check_dependencies(migration):
                logger.error(f"Dependencies not met for migration {migration.version}")
                return False
            
            if self.manager.apply_migration(migration):
                success_count += 1
            else:
                logger.error(f"Failed to apply migration {migration.version}")
                return False
        
        logger.info(f"Successfully applied {success_count} migrations")
        return True
    
    def _check_dependencies(self, migration: Migration) -> bool:
        """Check if migration dependencies are satisfied."""
        for dep_version in migration.depends_on:
            if not self.manager.is_applied(dep_version):
                logger.error(f"Migration {migration.version} depends on {dep_version} which is not applied")
                return False
        return True
    
    def rollback_to_version(self, target_version: str) -> bool:
        """Rollback migrations to a specific version."""
        logger.info(f"Rolling back to version {target_version}")
        
        # Get applied migrations in reverse order
        applied = self.manager.get_applied_migrations()
        applied.reverse()
        
        # Discover migrations for rollback
        migrations = self.discover_migrations()
        
        success_count = 0
        for record in applied:
            if record.version == target_version:
                break
                
            if record.version not in migrations:
                logger.error(f"Cannot rollback {record.version}: migration class not found")
                return False
            
            migration = migrations[record.version]()
            if self.manager.rollback_migration(record.version, migration):
                success_count += 1
            else:
                logger.error(f"Failed to rollback migration {record.version}")
                return False
        
        logger.info(f"Successfully rolled back {success_count} migrations")
        return True
    
    def status(self) -> None:
        """Show migration status."""
        print("\\n=== Migration Status ===")
        
        # Get applied migrations
        applied = self.manager.get_applied_migrations()
        
        # Discover all migrations
        all_migrations = self.discover_migrations()
        sorted_migrations = self.sort_migrations(all_migrations)
        
        print(f"\\nApplied migrations ({len(applied)}):")
        for record in applied:
            print(f"  ✅ {record.version} - {record.description}")
            print(f"     Applied: {record.applied_at}")
            print(f"     Execution time: {record.execution_time_ms}ms\\n")
        
        # Show pending migrations
        applied_versions = {r.version for r in applied}
        pending = [m for m in sorted_migrations if m().version not in applied_versions]
        
        print(f"Pending migrations ({len(pending)}):")
        for migration_class in pending:
            migration = migration_class()
            print(f"  ⏳ {migration.version} - {migration.description}")
        
        if not pending:
            print("  None")
        
        print()

def main():
    """Main CLI entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Database migration runner")
    parser.add_argument("command", choices=["migrate", "rollback", "status"], 
                       help="Command to execute")
    parser.add_argument("--target", help="Target version for migrate/rollback")
    parser.add_argument("--migrations-dir", help="Path to migrations directory")
    
    args = parser.parse_args()
    
    try:
        runner = MigrationRunner(args.migrations_dir)
        
        if args.command == "migrate":
            success = runner.run_migrations(args.target)
            sys.exit(0 if success else 1)
        elif args.command == "rollback":
            if not args.target:
                print("Error: --target version required for rollback")
                sys.exit(1)
            success = runner.rollback_to_version(args.target)
            sys.exit(0 if success else 1)
        elif args.command == "status":
            runner.status()
            sys.exit(0)
            
    except KeyboardInterrupt:
        print("\\nAborted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
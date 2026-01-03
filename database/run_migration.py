#!/usr/bin/env python3
"""
Run database migrations for schema fixes
"""

import os
import sys
import psycopg2
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_CONFIG = {
    'host': 'dpg-d596prv5r7bs73938m2g-a.oregon-postgres.render.com',
    'database': 'pghero_dpg_d37pd8nfte5s73bfl1ug_a_y6fl',
    'user': 'pghero_dpg_d37pd8nfte5s73bfl1ug_a_y6fl_user',
    'password': 'hyVL0yZEuw6EyIOKXs4nS5nTFmR1Sg5j',
    'port': 5432,
    'sslmode': 'require',
    'ssl': True
}

class DatabaseMigrator:
    """Handles database migrations"""

    def __init__(self):
        self.connection_string = (
            f"host={DATABASE_CONFIG['host']} "
            f"dbname={DATABASE_CONFIG['database']} "
            f"user={DATABASE_CONFIG['user']} "
            f"password={DATABASE_CONFIG['password']} "
            f"port={DATABASE_CONFIG['port']} "
            f"sslmode={DATABASE_CONFIG['sslmode']}"
        )

    def get_connection(self):
        """Get database connection"""
        try:
            conn = psycopg2.connect(self.connection_string)
            return conn
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            raise

    def execute_sql_file(self, file_path: str):
        """Execute SQL commands from a file"""
        if not Path(file_path).exists():
            logger.error(f"❌ Migration file not found: {file_path}")
            return False

        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                with open(file_path, 'r') as sql_file:
                    sql_content = sql_file.read()

                # Execute the SQL commands
                cursor.execute(sql_content)
                conn.commit()

                logger.info(f"✅ Successfully executed migration: {file_path}")

        except Exception as e:
            logger.error(f"❌ Failed to execute migration {file_path}: {e}")
            if conn:
                conn.rollback()
            return False
        finally:
            if conn:
                conn.close()

        return True

def main():
    """Main migration function"""
    print("🔄 PostgreSQL Database Migration")
    print("=" * 40)

    # Initialize migrator
    migrator = DatabaseMigrator()

    # Find migration file
    migration_file = Path(__file__).parent / "migrate_schema_fixes.sql"
    if not migration_file.exists():
        print(f"❌ Migration file not found: {migration_file}")
        sys.exit(1)

    # Execute migration
    print(f"📄 Executing migration from: {migration_file}")
    if not migrator.execute_sql_file(str(migration_file)):
        print("❌ Migration failed!")
        sys.exit(1)

    print("\n✅ Migration completed successfully!")
    print("📊 Schema constraints have been updated")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Database Setup Script for TraderEdge Pro PostgreSQL Database
Run this script to initialize the database schema and tables
"""

import os
import sys
import psycopg2
import psycopg2.extras
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database configuration - Load from environment or use defaults
DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'dpg-d596prv5r7bs73938m2g-a.oregon-postgres.render.com'),
    'database': os.getenv('DB_NAME', 'pghero_dpg_d37pd8nfte5s73bfl1ug_a_y6fl'),
    'user': os.getenv('DB_USER', 'pghero_dpg_d37pd8nfte5s73bfl1ug_a_y6fl_user'),
    'password': os.getenv('DB_PASSWORD', 'hyVL0yZEuw6EyIOKXs4nS5nTFmR1Sg5j'),
    'port': int(os.getenv('DB_PORT', '5432')),
    'sslmode': 'require',
    'ssl': True
}

class DatabaseSetup:
    """Handles database setup and initialization"""

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
            logger.info("✅ Database connection established")
            return conn
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            raise

    def execute_sql_file(self, file_path: str):
        """Execute SQL commands from a file"""
        if not Path(file_path).exists():
            logger.error(f"❌ SQL file not found: {file_path}")
            return False

        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                with open(file_path, 'r') as sql_file:
                    sql_content = sql_file.read()

                # Execute the entire SQL file as one statement
                logger.info(f"Executing SQL file: {file_path}")
                cursor.execute(sql_content)

                conn.commit()
                logger.info(f"✅ Successfully executed SQL file: {file_path}")

        except Exception as e:
            logger.error(f"❌ Failed to execute SQL file {file_path}: {e}")
            if conn:
                conn.rollback()
            return False
        finally:
            if conn:
                conn.close()

        return True

    def test_connection(self):
        """Test database connection"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1 as test")
                result = cursor.fetchone()
                logger.info(f"✅ Database test query successful: {result}")
            conn.close()
            return True
        except Exception as e:
            logger.error(f"❌ Database test failed: {e}")
            return False

    def check_tables_exist(self):
        """Check if required tables exist"""
        required_tables = [
            'enhanced_users',
            'payment_transactions',
            'questionnaire_responses',
            'user_dashboard_data',
            'trading_signals',
            'signal_tracking',
            'subscription_plans'
        ]

        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                for table in required_tables:
                    cursor.execute("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables
                            WHERE table_schema = 'public'
                            AND table_name = %s
                        );
                    """, (table,))

                    exists = cursor.fetchone()[0]
                    if exists:
                        logger.info(f"✅ Table '{table}' exists")
                    else:
                        logger.warning(f"⚠️  Table '{table}' does not exist")

            conn.close()
            return True
        except Exception as e:
            logger.error(f"❌ Failed to check tables: {e}")
            return False

def main():
    """Main setup function"""
    print("🚀 TraderEdge Pro Database Setup")
    print("=" * 50)

    # Initialize database setup
    db_setup = DatabaseSetup()

    # Test connection
    print("\n🔗 Testing database connection...")
    if not db_setup.test_connection():
        print("❌ Database connection failed. Please check your configuration.")
        sys.exit(1)

    # Find schema file
    schema_file = Path(__file__).parent / "comprehensive_database_schema_complete.sql"
    if not schema_file.exists():
        print(f"❌ Schema file not found: {schema_file}")
        sys.exit(1)

    # Execute schema
    print(f"\n📄 Executing database schema from: {schema_file}")
    if not db_setup.execute_sql_file(str(schema_file)):
        print("❌ Failed to execute database schema")
        sys.exit(1)

    # Check tables
    print("\n🔍 Verifying database tables...")
    if not db_setup.check_tables_exist():
        print("❌ Database table verification failed")
        sys.exit(1)

    print("\n🎉 Database setup completed successfully!")
    print("\n📊 Database Summary:")
    print(f"   Host: {DATABASE_CONFIG['host']}")
    print(f"   Database: {DATABASE_CONFIG['database']}")
    print("   Tables: enhanced_users, payment_transactions, questionnaire_responses,")
    print("           user_dashboard_data, trading_signals, signal_tracking, etc.")

    print("\n🚀 Your PostgreSQL database is ready for TraderEdge Pro!")

if __name__ == "__main__":
    main()

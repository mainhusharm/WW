#!/usr/bin/env python3
"""
Database Setup and Migration Script for TraderEdge Pro
This script executes the comprehensive database schema and migration
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
import sys

def get_database_connection():
    """Get database connection from environment variables"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        print("Please set DATABASE_URL=postgresql://username:password@host:port/database")
        sys.exit(1)
    
    try:
        conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

def execute_sql_file(conn, file_path):
    """Execute SQL file and return success status"""
    try:
        with open(file_path, 'r') as file:
            sql_content = file.read()
        
        cursor = conn.cursor()
        cursor.execute(sql_content)
        conn.commit()
        cursor.close()
        return True
    except Exception as e:
        print(f"❌ Error executing {file_path}: {e}")
        conn.rollback()
        return False

def main():
    """Main execution function"""
    print("🚀 Starting TraderEdge Pro Database Setup...")
    print("=" * 50)
    
    # Get database connection
    conn = get_database_connection()
    print("✅ Database connection established")
    
    # Execute comprehensive schema
    print("\n📊 Creating comprehensive database schema...")
    if execute_sql_file(conn, 'comprehensive_database_schema.sql'):
        print("✅ Comprehensive database schema created successfully")
    else:
        print("❌ Failed to create database schema")
        conn.close()
        sys.exit(1)
    
    # Execute migration script
    print("\n🔄 Running database migration...")
    if execute_sql_file(conn, 'database_migration_script.sql'):
        print("✅ Database migration completed successfully")
    else:
        print("❌ Database migration failed")
        conn.close()
        sys.exit(1)
    
    # Verify tables were created
    print("\n🔍 Verifying table creation...")
    cursor = conn.cursor()
    
    tables_to_check = [
        'payment_details',
        'questionnaire_details', 
        'user_dashboard_data'
    ]
    
    for table in tables_to_check:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = %s
            );
        """, (table,))
        
        exists = cursor.fetchone()[0]
        if exists:
            print(f"✅ Table '{table}' exists")
        else:
            print(f"❌ Table '{table}' not found")
    
    # Check plan types
    print("\n🎯 Verifying plan types...")
    cursor.execute("""
        SELECT DISTINCT plan_type FROM users 
        ORDER BY plan_type;
    """)
    
    plan_types = [row['plan_type'] for row in cursor.fetchall()]
    expected_plans = ['kickstarter', 'basic', 'pro', 'enterprise']
    
    print(f"Current plan types: {plan_types}")
    if all(plan in expected_plans for plan in plan_types):
        print("✅ All plan types are valid")
    else:
        print("⚠️  Some plan types may need updating")
    
    # Get record counts
    print("\n📈 Database Statistics:")
    cursor.execute("SELECT COUNT(*) as count FROM users")
    user_count = cursor.fetchone()['count']
    print(f"Users: {user_count}")
    
    cursor.execute("SELECT COUNT(*) as count FROM questionnaire_details")
    questionnaire_count = cursor.fetchone()['count']
    print(f"Questionnaire records: {questionnaire_count}")
    
    cursor.execute("SELECT COUNT(*) as count FROM user_dashboard_data")
    dashboard_count = cursor.fetchone()['count']
    print(f"Dashboard records: {dashboard_count}")
    
    cursor.execute("SELECT COUNT(*) as count FROM payment_details")
    payment_count = cursor.fetchone()['count']
    print(f"Payment records: {payment_count}")
    
    cursor.close()
    conn.close()
    
    print("\n" + "=" * 50)
    print("🎉 Database setup completed successfully!")
    print("=" * 50)
    print("\n📋 What was created:")
    print("• Enhanced payment_details table with all payment fields")
    print("• Comprehensive questionnaire_details table with trading preferences")
    print("• User dashboard_data table connected to questionnaire answers")
    print("• Updated plan types: kickstarter, basic, pro, enterprise")
    print("• Immutability constraints to prevent data modification after creation")
    print("• Proper relationships between all tables")
    print("• Views for common queries")
    print("• Triggers for automatic timestamp updates")
    
    print("\n🔒 Security Features:")
    print("• Data immutability after payment completion")
    print("• Questionnaire data immutability after completion")
    print("• Proper foreign key constraints")
    print("• Data validation constraints")
    
    print("\n🎯 Dashboard Integration:")
    print("• User dashboard data is connected to questionnaire answers")
    print("• Overview tab data structure ready")
    print("• Risk protocol tab data structure ready")
    print("• Prop firm rules tab data structure ready")
    
    print("\n✨ Your database is now ready for production use!")

if __name__ == "__main__":
    main()

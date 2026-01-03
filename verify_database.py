#!/usr/bin/env python3
"""
Database Verification Script
Checks if data is actually being saved to the PostgreSQL database
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import psycopg2

# Load environment variables
load_dotenv('database.env')

def verify_database_connection():
    """Verify database connection and check for users"""
    print("🔍 Verifying database connection...")
    
    # Get database connection details
    db_host = os.getenv('DB_HOST', 'localhost')
    db_port = os.getenv('DB_PORT', '5432')
    db_name = os.getenv('DB_NAME', 'trading_journal')
    db_user = os.getenv('DB_USER', 'postgres')
    db_password = os.getenv('DB_PASSWORD', '')
    
    print(f"📊 Database details:")
    print(f"   Host: {db_host}")
    print(f"   Port: {db_port}")
    print(f"   Database: {db_name}")
    print(f"   User: {db_user}")
    
    try:
        # Test direct PostgreSQL connection
        print("\n🔌 Testing direct PostgreSQL connection...")
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_password
        )
        
        cursor = conn.cursor()
        
        # Check if users table exists
        print("📋 Checking if users table exists...")
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        """)
        
        table_exists = cursor.fetchone()[0]
        print(f"✅ Users table exists: {table_exists}")
        
        if table_exists:
            # Get table structure
            print("\n📊 Users table structure:")
            cursor.execute("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                ORDER BY ordinal_position;
            """)
            
            columns = cursor.fetchall()
            for col in columns:
                print(f"   {col[0]}: {col[1]} (nullable: {col[2]})")
            
            # Count users
            print("\n👥 Checking user count...")
            cursor.execute("SELECT COUNT(*) FROM users;")
            user_count = cursor.fetchone()[0]
            print(f"📊 Total users in database: {user_count}")
            
            if user_count > 0:
                # Get sample users
                print("\n👤 Sample users:")
                cursor.execute("SELECT id, username, email, first_name, last_name, created_at FROM users LIMIT 5;")
                users = cursor.fetchall()
                
                for user in users:
                    print(f"   ID: {user[0]}, Username: {user[1]}, Email: {user[2]}, Name: {user[3]} {user[4]}, Created: {user[5]}")
            else:
                print("❌ No users found in database")
        
        # Check other tables
        print("\n📋 Checking other tables...")
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print(f"📊 Found {len(tables)} tables:")
        for table in tables:
            print(f"   - {table[0]}")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Database verification completed successfully")
        return True
        
    except Exception as e:
        print(f"❌ Database verification failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_sqlalchemy_connection():
    """Test SQLAlchemy connection using the same config as the app"""
    print("\n🔍 Testing SQLAlchemy connection...")
    
    try:
        # Import the app's database configuration
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from journal import create_app, db
        
        # Create app without starting services
        app = create_app(start_services=False)
        
        with app.app_context():
            # Test database connection
            print("🔌 Testing SQLAlchemy connection...")
            result = db.session.execute(text("SELECT 1")).scalar()
            print(f"✅ SQLAlchemy connection test result: {result}")
            
            # Test User model
            from journal.models import User
            user_count = User.query.count()
            print(f"📊 Users found via SQLAlchemy: {user_count}")
            
            if user_count > 0:
                # Get sample users
                users = User.query.limit(3).all()
                print("👤 Sample users via SQLAlchemy:")
                for user in users:
                    print(f"   ID: {user.id}, Username: {user.username}, Email: {user.email}, Name: {user.first_name} {user.last_name}")
            
            return True
            
    except Exception as e:
        print(f"❌ SQLAlchemy connection test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main verification function"""
    print("🚀 Starting database verification...")
    print("=" * 50)
    
    # Test direct PostgreSQL connection
    pg_success = verify_database_connection()
    
    # Test SQLAlchemy connection
    sa_success = test_sqlalchemy_connection()
    
    print("\n" + "=" * 50)
    print("📊 Verification Summary:")
    print(f"   PostgreSQL Direct Connection: {'✅ Success' if pg_success else '❌ Failed'}")
    print(f"   SQLAlchemy Connection: {'✅ Success' if sa_success else '❌ Failed'}")
    
    if pg_success and sa_success:
        print("\n🎉 All database connections are working correctly!")
    else:
        print("\n⚠️ Some database connections failed. Check the error messages above.")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Create Test User Account for Dashboard Testing (SQLite Version)
This script creates a test user account with premium plan to test signal flow
"""

import os
import sys
import sqlite3
from datetime import datetime
from werkzeug.security import generate_password_hash
import hashlib
import random
import string

def create_test_user_sqlite():
    """Create a test user account using SQLite database"""
    try:
        print("🔄 Creating test user account...")
        
        # Database path
        db_path = "trading_bots.db"
        if not os.path.exists(db_path):
            print(f"❌ Database file not found: {db_path}")
            print("   Please ensure the database exists or run the application first")
            return None
        
        # Test user credentials
        test_email = "testuser@example.com"
        test_password = "TestPassword123!"
        test_username = "Test User"
        
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if test user already exists
        cursor.execute("SELECT id, unique_id, email, plan_type, created_at FROM users WHERE email = ?", (test_email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print(f"⚠️  Test user already exists:")
            print(f"   ID: {existing_user[0]}")
            print(f"   Unique ID: {existing_user[1]}")
            print(f"   Email: {existing_user[2]}")
            print(f"   Plan: {existing_user[3]}")
            print(f"   Created: {existing_user[4]}")
            conn.close()
            return existing_user
        
        # Generate unique ID
        def generate_unique_id():
            while True:
                unique_id = ''.join(random.choices(string.digits, k=6))
                cursor.execute("SELECT id FROM users WHERE unique_id = ?", (unique_id,))
                if not cursor.fetchone():
                    return unique_id
        
        # Create new test user
        unique_id = generate_unique_id()
        hashed_password = generate_password_hash(test_password, method='pbkdf2:sha256')
        normalized_email = test_email.lower().strip()
        
        # Insert user
        cursor.execute("""
            INSERT INTO users (unique_id, username, email, normalized_email, password_hash, 
                             plan_type, created_at, consent_accepted, consent_timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (unique_id, test_username, test_email, normalized_email, hashed_password, 
              'premium', datetime.utcnow().isoformat(), True, datetime.utcnow().isoformat()))
        
        user_id = cursor.lastrowid
        conn.commit()
        
        print("✅ Test user created successfully!")
        print("=" * 50)
        print("📋 TEST USER CREDENTIALS:")
        print(f"   Email: {test_email}")
        print(f"   Password: {test_password}")
        print(f"   User ID: {unique_id}")
        print(f"   Plan: premium")
        print(f"   Created: {datetime.utcnow().isoformat()}")
        print("=" * 50)
        print("🔐 LOGIN INSTRUCTIONS:")
        print("1. Go to your application login page")
        print("2. Use the email and password above")
        print("3. Navigate to the Signals tab in the dashboard")
        print("4. Check if signals from admin are appearing")
        print("=" * 50)
        
        conn.close()
        return (user_id, unique_id, test_email, 'premium', datetime.utcnow().isoformat())
        
    except Exception as e:
        print(f"❌ Error creating test user: {str(e)}")
        if 'conn' in locals():
            conn.close()
        return None

def verify_test_user():
    """Verify test user exists and has proper permissions"""
    try:
        print("🔍 Verifying test user...")
        
        db_path = "trading_bots.db"
        if not os.path.exists(db_path):
            print("❌ Database file not found")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if test user exists
        cursor.execute("""
            SELECT id, unique_id, username, email, plan_type, consent_accepted, created_at 
            FROM users WHERE email = ?
        """, ("testuser@example.com",))
        
        user = cursor.fetchone()
        if not user:
            print("❌ Test user not found")
            conn.close()
            return False
        
        print(f"✅ User found: {user[2]}")
        print(f"   Email: {user[3]}")
        print(f"   Plan: {user[4]}")
        print(f"   Unique ID: {user[1]}")
        print(f"   Consent: {user[5]}")
        print(f"   Created: {user[6]}")
        
        # Verify plan allows login
        if user[4] == 'free':
            print("⚠️  Warning: User has 'free' plan - login may be restricted")
        else:
            print("✅ User plan allows login")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error verifying test user: {str(e)}")
        if 'conn' in locals():
            conn.close()
        return False

def check_database_tables():
    """Check what tables exist in the database"""
    try:
        print("🔍 Checking database structure...")
        
        db_path = "trading_bots.db"
        if not os.path.exists(db_path):
            print("❌ Database file not found")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("📊 Database tables found:")
        for table in tables:
            print(f"   - {table[0]}")
        
        # Check if users table exists and has required columns
        if any('users' in table for table in tables):
            cursor.execute("PRAGMA table_info(users);")
            columns = cursor.fetchall()
            print("\n📋 Users table columns:")
            for col in columns:
                print(f"   - {col[1]} ({col[2]})")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error checking database: {str(e)}")
        if 'conn' in locals():
            conn.close()
        return False

if __name__ == '__main__':
    print("🚀 Test User Creation Script (SQLite Version)")
    print("=" * 60)
    
    try:
        # Check database structure first
        check_database_tables()
        print()
        
        # Create test user
        user = create_test_user_sqlite()
        print()
        
        # Verify test user
        if user:
            verify_test_user()
        
        print("\n🎉 Test user setup completed!")
        print("\n📝 Next steps:")
        print("1. Start your Flask application")
        print("2. Login with the test credentials")
        print("3. Navigate to the user dashboard")
        print("4. Check the Signals tab for admin-generated signals")
        print("5. Run signal flow tests to verify delivery")
        
    except Exception as e:
        print(f"\n❌ Setup failed: {str(e)}")
        sys.exit(1)

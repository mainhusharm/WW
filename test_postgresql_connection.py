#!/usr/bin/env python3
"""
Test PostgreSQL connection to Render database
"""

import psycopg2
import os

def test_connection():
    """Test connection to Render PostgreSQL database"""
    
    # You need to provide your PostgreSQL password
    password = input("Enter your PostgreSQL password from Render: ").strip()
    
    if not password:
        print("❌ Password is required")
        return False
    
    try:
        print("🔍 Testing connection to Render PostgreSQL...")
        
        conn = psycopg2.connect(
            host='dpg-d37pd8nfte5s73bfl1ug-a',
            database='pghero_dpg_d2v9i7er433s73f0878g_a_cdm2',
            user='pghero_dpg_d2v9i7er433s73f0878g_a_cdm2',
            password=password,
            port=5432
        )
        
        cursor = conn.cursor()
        
        # Test basic connection
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Connected to PostgreSQL: {version[0]}")
        
        # Check if users table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        """)
        table_exists = cursor.fetchone()[0]
        
        if table_exists:
            print("✅ Users table exists")
            
            # Get current users
            cursor.execute("SELECT COUNT(*) FROM users;")
            user_count = cursor.fetchone()[0]
            print(f"📊 Current users in database: {user_count}")
            
            if user_count > 0:
                cursor.execute("SELECT email, first_name, last_name, created_at FROM users ORDER BY created_at DESC LIMIT 5;")
                users = cursor.fetchall()
                print("👥 Recent users:")
                for user in users:
                    print(f"   - {user[0]} ({user[1]} {user[2]}) - {user[3]}")
        else:
            print("⚠️  Users table does not exist - will be created")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()

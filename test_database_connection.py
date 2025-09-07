#!/usr/bin/env python3
"""
Test script to verify database connection and user data
"""

import sqlite3
import json
from datetime import datetime

def test_database():
    """Test database connection and fetch user data"""
    try:
        print("🔍 Testing database connection...")
        conn = sqlite3.connect('trading_bots.db')
        cursor = conn.cursor()
        
        # Test basic connection
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"✅ Database connected successfully. Found {user_count} users.")
        
        # Get all users
        cursor.execute("""
            SELECT id, username, email, created_at, plan_type, unique_id, normalized_email
            FROM users
            ORDER BY created_at DESC
        """)
        
        users = cursor.fetchall()
        print(f"📊 Retrieved {len(users)} users from database:")
        
        for user in users:
            user_id, username, email, created_at, plan_type, unique_id, normalized_email = user
            print(f"  👤 ID: {user_id}, Username: {username}, Email: {email}, Plan: {plan_type}")
            
            # Check for risk plan data
            cursor.execute("SELECT COUNT(*) FROM risk_plans WHERE user_id = ?", (user_id,))
            risk_plan_count = cursor.fetchone()[0]
            if risk_plan_count > 0:
                print(f"    📋 Has questionnaire data")
            else:
                print(f"    ⚠️ No questionnaire data")
        
        conn.close()
        print("🎉 Database test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_database()

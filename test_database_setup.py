#!/usr/bin/env python3
"""
Test Database Setup Script
This script tests the PostgreSQL database setup and API functionality
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
import json

def test_database_connection():
    """Test database connection"""
    print("🔍 Testing database connection...")
    
    try:
        # Try to connect to database
        conn = psycopg2.connect(
            host="localhost",
            database="trading_platform",
            user="trading_user",
            password="secure_password_123"
        )
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Database connected: {version['version']}")
        
        # Test tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        print(f"📊 Tables found: {[table['table_name'] for table in tables]}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_api_endpoints():
    """Test API endpoints"""
    print("\n🔍 Testing API endpoints...")
    
    base_url = "http://localhost:5000"
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health endpoint working")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
    
    # Test users endpoint
    try:
        response = requests.get(f"{base_url}/api/users")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Users endpoint working: {data.get('count', 0)} users found")
        else:
            print(f"❌ Users endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Users endpoint error: {e}")

def create_test_user():
    """Create a test user"""
    print("\n🔍 Creating test user...")
    
    base_url = "http://localhost:5000"
    
    test_user = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
        "plan_type": "free"
    }
    
    try:
        response = requests.post(f"{base_url}/api/users", json=test_user)
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Test user created: {data.get('user_id')}")
            return data.get('user_id')
        else:
            print(f"❌ Test user creation failed: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Test user creation error: {e}")
    
    return None

def test_questionnaire_update(user_id):
    """Test questionnaire update"""
    if not user_id:
        return
        
    print(f"\n🔍 Testing questionnaire update for user {user_id}...")
    
    base_url = "http://localhost:5000"
    
    questionnaire_data = {
        "account_type": "standard",
        "prop_firm": "FTMO",
        "account_size": 10000,
        "trading_experience": "intermediate",
        "risk_tolerance": "medium",
        "trading_goals": "income generation",
        "questionnaire_data": {
            "has_trading_experience": True,
            "preferred_assets": ["forex", "crypto"],
            "risk_level": "medium"
        }
    }
    
    try:
        response = requests.post(f"{base_url}/api/users/{user_id}/questionnaire", json=questionnaire_data)
        if response.status_code == 200:
            print("✅ Questionnaire updated successfully")
        else:
            print(f"❌ Questionnaire update failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Questionnaire update error: {e}")

def main():
    """Main test function"""
    print("🧪 Testing Trading Platform Database Setup")
    print("=" * 50)
    
    # Test database connection
    db_ok = test_database_connection()
    
    if not db_ok:
        print("\n❌ Database tests failed. Please check your database setup.")
        return
    
    # Test API endpoints
    test_api_endpoints()
    
    # Create test user
    user_id = create_test_user()
    
    # Test questionnaire update
    test_questionnaire_update(user_id)
    
    print("\n🎉 Database setup test completed!")
    print("\n📋 Next steps:")
    print("1. Deploy to Render using the deployment guide")
    print("2. Update frontend API URL")
    print("3. Test the complete system")

if __name__ == "__main__":
    main()

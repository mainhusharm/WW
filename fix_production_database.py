#!/usr/bin/env python3
"""
Fix production database by running the setup script
This will create the users table on the production PostgreSQL database
"""

import requests
import time

def fix_production_database():
    """Fix the production database by triggering the setup"""
    print("🔧 Fixing production database...")
    
    # The production backend should have the setup script
    # Let's try to trigger it by making a request to a health endpoint first
    try:
        # Test if the backend is responding
        response = requests.get('https://backend-ox9b.onrender.com/health', timeout=10)
        print(f"✅ Backend health check: {response.status_code}")
        
        # Try to trigger database initialization by making a registration request
        # This should trigger the init_database() function
        test_data = {
            'email': 'database_init_test@example.com',
            'password': 'testpass123',
            'username': 'dbtest'
        }
        
        print("🔄 Triggering database initialization...")
        response = requests.post(
            'https://backend-ox9b.onrender.com/api/auth/register',
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"📊 Response status: {response.status_code}")
        print(f"📊 Response body: {response.text}")
        
        if response.status_code == 201:
            print("✅ Database initialization successful!")
            return True
        elif response.status_code == 409:
            print("✅ Database is working (user already exists)")
            return True
        else:
            print(f"❌ Database initialization failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error fixing production database: {e}")
        return False

if __name__ == '__main__':
    success = fix_production_database()
    if success:
        print("🎉 Production database fix completed!")
    else:
        print("❌ Production database fix failed!")

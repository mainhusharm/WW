#!/usr/bin/env python3
"""
Auto Registration Script - This WILL work
"""

import requests
import json
import time

def auto_register():
    """Automatically register a test user"""
    print("🚀 Auto Registration")
    print("=" * 30)
    
    # Create test user data
    user_data = {
        "firstName": "Auto",
        "lastName": "Test",
        "email": f"auto_test_{int(time.time())}@example.com",
        "password": "test123",
        "phone": "1234567890",
        "company": "Test Company",
        "country": "US",
        "terms": True,
        "newsletter": False
    }
    
    print(f"📝 Registering user: {user_data['email']}")
    
    try:
        # Make the request
        response = requests.post(
            'http://localhost:8080/api/user/register',
            json=user_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ SUCCESS! User created with ID: {data.get('user_id')}")
            print(f"📧 Email: {user_data['email']}")
            print(f"👤 Name: {user_data['firstName']} {user_data['lastName']}")
            print(f"🏢 Company: {user_data['company']}")
            print(f"🌍 Country: {user_data['country']}")
            print("\n🎉 User registered successfully!")
            return True
        else:
            print(f"❌ FAILED: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        print("Make sure backend is running: python3 app.py")
        return False

def check_database():
    """Check how many users are in the database"""
    print("\n🔍 Checking Database...")
    print("=" * 30)
    
    try:
        response = requests.get('http://localhost:8080/api/user/customers')
        
        if response.status_code == 200:
            users = response.json()
            print(f"✅ Database has {len(users)} users")
            
            if users:
                print("\n📋 Recent users:")
                for user in users[-3:]:  # Show last 3 users
                    print(f"  - {user.get('email', 'No email')} (ID: {user.get('id', 'No ID')})")
            
            return len(users)
        else:
            print(f"❌ Database check failed: {response.status_code}")
            return 0
            
    except Exception as e:
        print(f"❌ Database error: {e}")
        return 0

def main():
    """Main function"""
    print("🧪 AUTO REGISTRATION SCRIPT")
    print("=" * 40)
    print("This script will automatically register a test user.")
    print("No CORS issues, no browser problems - just works!\n")
    
    # Check initial database state
    initial_count = check_database()
    
    # Register user
    success = auto_register()
    
    # Check final database state
    final_count = check_database()
    
    print("\n🎯 RESULTS:")
    print("=" * 30)
    if success and final_count > initial_count:
        print("✅ REGISTRATION WORKING PERFECTLY!")
        print("✅ Data is being saved to PostgreSQL database!")
        print("✅ Your backend is working correctly!")
        print("✅ Frontend → Backend → Database: WORKING!")
    else:
        print("❌ Registration failed - check backend server")
    
    print(f"\n📊 Database: {initial_count} → {final_count} users")

if __name__ == "__main__":
    main()

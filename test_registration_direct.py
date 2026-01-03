#!/usr/bin/env python3
"""
Direct Registration Test - This WILL work
"""

import requests
import json
import time

def test_registration():
    """Test registration directly with Python requests"""
    print("🚀 Testing Registration Directly...")
    print("=" * 50)
    
    # Test data
    user_data = {
        "firstName": "Python",
        "lastName": "Test",
        "email": f"python_test_{int(time.time())}@example.com",
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
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"📋 Response: {response.text}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ SUCCESS! User created with ID: {data.get('user_id')}")
            return True
        else:
            print(f"❌ FAILED: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def check_database():
    """Check how many users are in the database"""
    print("\n🔍 Checking Database...")
    print("=" * 50)
    
    try:
        response = requests.get('http://localhost:8080/api/user/customers')
        
        if response.status_code == 200:
            users = response.json()
            print(f"✅ Database has {len(users)} users")
            
            # Show last few users
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
    """Main test function"""
    print("🧪 DIRECT REGISTRATION TEST")
    print("=" * 50)
    print("This test bypasses browser CORS issues completely.")
    print("If this works, your backend is working perfectly!\n")
    
    # Check initial database state
    initial_count = check_database()
    
    # Test registration
    success = test_registration()
    
    # Check final database state
    final_count = check_database()
    
    print("\n🎯 RESULTS:")
    print("=" * 50)
    if success and final_count > initial_count:
        print("✅ REGISTRATION WORKING PERFECTLY!")
        print("✅ Data is being saved to PostgreSQL database!")
        print("✅ Your backend is working correctly!")
    else:
        print("❌ Registration failed - check backend server")
    
    print(f"\n📊 Database: {initial_count} → {final_count} users")

if __name__ == "__main__":
    main()

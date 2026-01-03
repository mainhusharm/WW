#!/usr/bin/env python3
"""
Create Production Test User
This script creates a test user that will work with the production authentication system
"""

import requests
import json
from datetime import datetime

def create_production_test_user():
    """Create a test user via the production API"""
    try:
        print("🔄 Creating production test user...")
        
        # Production API endpoint
        base_url = "https://backend-ox9b.onrender.com"  # Based on your env files
        
        # Test user data
        test_user_data = {
            "firstName": "Test",
            "lastName": "User",
            "email": "testuser@example.com",
            "password": "TestPassword123!",
            "plan_type": "premium"
        }
        
        print(f"   Registering user: {test_user_data['email']}")
        
        # Try to register the user
        response = requests.post(
            f"{base_url}/api/auth/register",
            json=test_user_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"   Registration response status: {response.status_code}")
        
        if response.status_code == 201:
            print("✅ Test user registered successfully!")
            data = response.json()
            if "access_token" in data:
                print(f"   Access token received: {data['access_token'][:20]}...")
                return True
        elif response.status_code == 409:
            print("⚠️  User already exists - this is expected")
            return True
        else:
            print(f"❌ Registration failed: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to production API")
        print("   The backend server might be down or unreachable")
        return False
    except Exception as e:
        print(f"❌ Error creating production test user: {str(e)}")
        return False

def test_production_login():
    """Test login with the production API"""
    try:
        print("🔍 Testing production login...")
        
        base_url = "https://backend-ox9b.onrender.com"
        
        login_data = {
            "email": "testuser@example.com",
            "password": "TestPassword123!"
        }
        
        response = requests.post(
            f"{base_url}/api/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"   Login response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                print("✅ Login successful!")
                print(f"   Access token: {data['access_token'][:20]}...")
                return True
        else:
            print(f"❌ Login failed: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to production API")
        return False
    except Exception as e:
        print(f"❌ Error testing login: {str(e)}")
        return False

def create_local_storage_user():
    """Create a user in localStorage for frontend testing"""
    try:
        print("🔄 Creating localStorage test user...")
        
        # Create user data that matches the frontend expectations
        user_data = {
            "id": "test_user_123",
            "name": "Test User",
            "email": "testuser@example.com",
            "membershipTier": "premium",
            "accountType": "personal",
            "riskTolerance": "moderate",
            "isAuthenticated": True,
            "setupComplete": True,
            "token": "demo-token-test-user-123"
        }
        
        # Create the localStorage data structure
        localStorage_data = {
            "user_data": user_data,
            "pending_signup_data": {
                "firstName": "Test",
                "lastName": "User",
                "email": "testuser@example.com",
                "password": "TestPassword123!",
                "plan_type": "premium"
            }
        }
        
        print("✅ localStorage user data created!")
        print("=" * 50)
        print("📋 FRONTEND TEST USER DATA:")
        print("   Email: testuser@example.com")
        print("   Password: TestPassword123!")
        print("   Plan: premium")
        print("=" * 50)
        print("🔧 TO USE THIS USER:")
        print("1. Open browser developer tools (F12)")
        print("2. Go to Application/Storage tab")
        print("3. Find localStorage for your domain")
        print("4. Add these keys and values:")
        print()
        for key, value in localStorage_data.items():
            print(f"   Key: {key}")
            print(f"   Value: {json.dumps(value, indent=2)}")
            print()
        print("5. Refresh the page and try logging in")
        print("=" * 50)
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating localStorage user: {str(e)}")
        return False

def check_production_api():
    """Check if the production API is accessible"""
    try:
        print("🔍 Checking production API...")
        
        base_url = "https://backend-ox9b.onrender.com"
        
        # Test health endpoint
        response = requests.get(f"{base_url}/healthz", timeout=10)
        print(f"   Health check status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Production API is accessible")
            return True
        else:
            print("⚠️  Production API responded with unexpected status")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Production API is not accessible")
        return False
    except Exception as e:
        print(f"❌ Error checking production API: {str(e)}")
        return False

if __name__ == '__main__':
    print("🚀 Production Test User Creation")
    print("=" * 60)
    
    try:
        # Check if production API is accessible
        api_accessible = check_production_api()
        print()
        
        if api_accessible:
            # Try to create user via production API
            create_production_test_user()
            print()
            
            # Test login
            test_production_login()
            print()
        
        # Create localStorage user for frontend testing
        create_local_storage_user()
        
        print("\n🎉 Test user setup completed!")
        print("\n📝 NEXT STEPS:")
        print("1. Try the localStorage method first (easier)")
        print("2. If that doesn't work, the production API might need the user")
        print("3. Check browser console for any authentication errors")
        print("4. Verify the backend is running and accessible")
        
    except Exception as e:
        print(f"\n❌ Setup failed: {str(e)}")
        sys.exit(1)

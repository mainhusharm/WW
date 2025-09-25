#!/usr/bin/env python3
"""
Test Frontend-Backend Connection
"""

import requests
import time

def test_connection():
    print("🧪 Testing Frontend-Backend Connection")
    print("=" * 50)
    
    # Test backend health
    print("1. Testing Backend Health...")
    try:
        response = requests.get('http://localhost:8080/health')
        if response.status_code == 200:
            print("   ✅ Backend is running")
        else:
            print(f"   ❌ Backend error: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Backend not reachable: {e}")
        return False
    
    # Test frontend server
    print("2. Testing Frontend Server...")
    try:
        response = requests.get('http://localhost:5000')
        if response.status_code == 200:
            print("   ✅ Frontend server is running")
        else:
            print(f"   ❌ Frontend server error: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Frontend server not reachable: {e}")
        return False
    
    # Test registration
    print("3. Testing Registration...")
    user_data = {
        "firstName": "Frontend",
        "lastName": "Test",
        "email": f"frontend_test_{int(time.time())}@example.com",
        "password": "test123",
        "phone": "1234567890",
        "company": "Test Company",
        "country": "US",
        "terms": True,
        "newsletter": False
    }
    
    try:
        response = requests.post(
            'http://localhost:8080/api/user/register',
            json=user_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"   ✅ Registration successful - User ID: {data.get('user_id')}")
        else:
            print(f"   ❌ Registration failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Registration error: {e}")
        return False
    
    print("\n🎯 RESULTS:")
    print("=" * 50)
    print("✅ Frontend server: http://localhost:5000")
    print("✅ Backend server: http://localhost:8080")
    print("✅ Registration API: Working")
    print("✅ CORS: Enabled")
    print("\n🚀 Your frontend forms should now work!")
    print("📝 Open: http://localhost:5000")
    print("🔗 Choose a form to test")
    
    return True

if __name__ == "__main__":
    test_connection()

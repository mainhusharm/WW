#!/usr/bin/env python3
"""
Test script to verify email uniqueness is working properly
"""

import requests
import json

def test_email_uniqueness():
    """Test that email uniqueness is enforced"""
    
    base_url = "http://localhost:5000"  # Adjust if your server runs on different port
    test_email = "test@example.com"
    
    # Test data for first registration
    user_data_1 = {
        "username": "testuser1",
        "email": test_email,
        "password": "testpassword123",
        "plan_type": "free"
    }
    
    # Test data for second registration with same email
    user_data_2 = {
        "username": "testuser2", 
        "email": test_email,
        "password": "testpassword456",
        "plan_type": "free"
    }
    
    print("🧪 Testing email uniqueness...")
    
    # First registration should succeed
    print(f"1. Registering first user with email: {test_email}")
    response1 = requests.post(f"{base_url}/api/auth/register", json=user_data_1)
    print(f"   Status: {response1.status_code}")
    print(f"   Response: {response1.json()}")
    
    if response1.status_code == 201:
        print("   ✅ First registration successful")
    else:
        print("   ❌ First registration failed")
        return
    
    # Second registration with same email should fail
    print(f"\n2. Attempting to register second user with same email: {test_email}")
    response2 = requests.post(f"{base_url}/api/auth/register", json=user_data_2)
    print(f"   Status: {response2.status_code}")
    print(f"   Response: {response2.json()}")
    
    if response2.status_code == 409:
        print("   ✅ Email uniqueness properly enforced - second registration rejected")
    else:
        print("   ❌ Email uniqueness NOT enforced - second registration was allowed")
    
    # Test with different case (should also be rejected due to normalized_email)
    print(f"\n3. Attempting to register with different case: {test_email.upper()}")
    user_data_3 = {
        "username": "testuser3",
        "email": test_email.upper(),
        "password": "testpassword789",
        "plan_type": "free"
    }
    
    response3 = requests.post(f"{base_url}/api/auth/register", json=user_data_3)
    print(f"   Status: {response3.status_code}")
    print(f"   Response: {response3.json()}")
    
    if response3.status_code == 409:
        print("   ✅ Case-insensitive email uniqueness properly enforced")
    else:
        print("   ❌ Case-insensitive email uniqueness NOT enforced")

if __name__ == "__main__":
    test_email_uniqueness()

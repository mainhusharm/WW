#!/usr/bin/env python3
"""
Test script to verify email creation functionality
"""

import requests
import json

def test_email_creation():
    """Test email creation with proper data"""
    
    # Test data with all required fields
    test_data = {
        "email": "testuser@example.com",
        "firstName": "Test",
        "lastName": "User", 
        "password": "TestPassword123!",
        "plan_type": "Basic",
        "tradingData": {
            "experience": "Beginner",
            "riskTolerance": "Moderate"
        }
    }
    
    print("🧪 Testing Email Creation...")
    print(f"📧 Email: {test_data['email']}")
    print(f"👤 Name: {test_data['firstName']} {test_data['lastName']}")
    print(f"📋 Plan: {test_data['plan_type']}")
    
    try:
        # Test local backend first
        print("\n🔍 Testing local backend...")
        local_response = requests.post(
            'http://localhost:5000/api/auth/register',
            json=test_data,
            timeout=10
        )
        
        print(f"📊 Local Status: {local_response.status_code}")
        if local_response.status_code == 201:
            print("✅ Local email creation successful!")
            return True
        else:
            print(f"❌ Local error: {local_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("⚠️  Local backend not running, testing production...")
    except Exception as e:
        print(f"❌ Local test error: {e}")
    
    try:
        # Test production backend
        print("\n🌐 Testing production backend...")
        prod_response = requests.post(
            'https://backend-u4hy.onrender.com/api/auth/register',
            json=test_data,
            timeout=15
        )
        
        print(f"📊 Production Status: {prod_response.status_code}")
        if prod_response.status_code == 201:
            print("✅ Production email creation successful!")
            return True
        else:
            print(f"❌ Production error: {prod_response.text}")
            
    except Exception as e:
        print(f"❌ Production test error: {e}")
    
    return False

def test_coupon_validation():
    """Test coupon validation functionality"""
    
    print("\n🎫 Testing Coupon Validation...")
    
    coupon_data = {
        "coupon_code": "TRADERFREE",
        "plan_id": "enterprise",
        "original_price": 499
    }
    
    try:
        response = requests.post(
            'https://backend-u4hy.onrender.com/api/validate-coupon',
            json=coupon_data,
            timeout=10
        )
        
        print(f"📊 Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            if result.get('valid') and result.get('final_price') == 0.0:
                print("✅ TRADERFREE coupon working correctly!")
                return True
            else:
                print(f"❌ Coupon validation failed: {result}")
        else:
            print(f"❌ HTTP error: {response.text}")
            
    except Exception as e:
        print(f"❌ Coupon test error: {e}")
    
    return False

if __name__ == "__main__":
    print("🚀 Starting Email and Coupon Tests...\n")
    
    email_success = test_email_creation()
    coupon_success = test_coupon_validation()
    
    print(f"\n📋 Test Results:")
    print(f"   Email Creation: {'✅ PASS' if email_success else '❌ FAIL'}")
    print(f"   Coupon Validation: {'✅ PASS' if coupon_success else '❌ FAIL'}")
    
    if email_success and coupon_success:
        print("\n🎉 All tests passed!")
    else:
        print("\n⚠️  Some tests failed. Check the output above.")

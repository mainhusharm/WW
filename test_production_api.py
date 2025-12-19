#!/usr/bin/env python3
"""
Test script to verify production API endpoints are working
"""

import requests
import json
import time
from datetime import datetime

# Your production API base URL
API_BASE = "https://backend-topb.onrender.com/api"

def test_api_endpoints():
    """Test all the API endpoints we're using"""
    print("🚀 TESTING PRODUCTION API ENDPOINTS")
    print("=" * 60)
    print(f"🌐 Backend URL: {API_BASE}")
    print("=" * 60)
    
    # Test data
    timestamp = int(time.time())
    test_email = f"test_user_{timestamp}@example.com"
    
    # Test 1: Health check (if available)
    print("\n1️⃣ Testing API Health Check...")
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        if response.status_code == 200:
            print(f"   ✅ Health check: {response.status_code} - {response.text[:100]}")
        else:
            print(f"   ⚠️ Health check: {response.status_code} - {response.text[:100]}")
    except Exception as e:
        print(f"   ❌ Health check failed: {e}")
    
    # Test 2: Working Register Endpoint
    print("\n2️⃣ Testing /api/working/register...")
    try:
        signup_data = {
            "id": str(timestamp),
            "first_name": "Test",
            "last_name": "User",
            "email": test_email,
            "phone": "+1-555-TEST",
            "company": "Test Company",
            "country": "US",
            "password_hash": "test_hash",
            "plan_type": "Test Plan"
        }
        
        response = requests.post(
            f"{API_BASE}/working/register",
            json=signup_data,
            headers={'Content-Type': 'application/json'},
            timeout=15
        )
        
        print(f"   📊 Status: {response.status_code}")
        print(f"   📝 Response: {response.text[:200]}")
        
        if response.status_code in [200, 201]:
            print("   ✅ Registration endpoint is working!")
            user_created = True
        else:
            print("   ❌ Registration endpoint failed")
            user_created = False
            
    except Exception as e:
        print(f"   ❌ Registration test failed: {e}")
        user_created = False
    
    # Test 3: Working Payment Endpoint
    print("\n3️⃣ Testing /api/working/payment...")
    try:
        payment_data = {
            "user_id": str(timestamp),
            "user_email": test_email,
            "user_name": "Test User",
            "plan_name_payment": "Test Plan",
            "original_price": 99.99,
            "final_price": 79.99,
            "payment_method": "test",
            "transaction_id": f"TEST_TXN_{timestamp}",
            "payment_status": "completed"
        }
        
        response = requests.post(
            f"{API_BASE}/working/payment",
            json=payment_data,
            headers={'Content-Type': 'application/json'},
            timeout=15
        )
        
        print(f"   📊 Status: {response.status_code}")
        print(f"   📝 Response: {response.text[:200]}")
        
        if response.status_code in [200, 201]:
            print("   ✅ Payment endpoint is working!")
        else:
            print("   ❌ Payment endpoint failed")
            
    except Exception as e:
        print(f"   ❌ Payment test failed: {e}")
    
    # Test 4: Working Questionnaire Endpoint
    print("\n4️⃣ Testing /api/working/questionnaire...")
    try:
        questionnaire_data = {
            "user_id": str(timestamp),
            "user_email": test_email,
            "user_name": "Test User",
            "trades_per_day": "5-10",
            "trading_session": "London",
            "prop_firm": "FTMO",
            "account_type": "Live",
            "risk_percentage": 2.0
        }
        
        response = requests.post(
            f"{API_BASE}/working/questionnaire",
            json=questionnaire_data,
            headers={'Content-Type': 'application/json'},
            timeout=15
        )
        
        print(f"   📊 Status: {response.status_code}")
        print(f"   📝 Response: {response.text[:200]}")
        
        if response.status_code in [200, 201]:
            print("   ✅ Questionnaire endpoint is working!")
        else:
            print("   ❌ Questionnaire endpoint failed")
            
    except Exception as e:
        print(f"   ❌ Questionnaire test failed: {e}")
    
    # Test 5: Working Dashboard Data Endpoint
    print("\n5️⃣ Testing /api/working/dashboard-data...")
    try:
        response = requests.get(
            f"{API_BASE}/working/dashboard-data?user_id={test_email}",
            timeout=15
        )
        
        print(f"   📊 Status: {response.status_code}")
        print(f"   📝 Response: {response.text[:200]}")
        
        if response.status_code in [200, 201]:
            print("   ✅ Dashboard endpoint is working!")
        else:
            print("   ❌ Dashboard endpoint failed")
            
    except Exception as e:
        print(f"   ❌ Dashboard test failed: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 SUMMARY:")
    print("If you see ✅ for the endpoints, your frontend will work!")
    print("If you see ❌, you need to deploy the working database routes to production.")
    print("=" * 60)
    
    # Alternative endpoints to try
    print("\n🔄 ALTERNATIVE ENDPOINTS TO TRY:")
    print("If /api/working/* doesn't work, try these:")
    print("- /api/auth/register")
    print("- /api/payments") 
    print("- /api/questionnaire")
    print("- /api/dashboard")
    print("\nRun this script to see which endpoints are available on your backend!")

if __name__ == "__main__":
    test_api_endpoints()

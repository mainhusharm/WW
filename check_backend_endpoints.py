#!/usr/bin/env python3
"""
Comprehensive test to check which endpoints exist on the production backend
"""

import requests
import json
import time

# Your production API base URL
BACKEND_URL = "https://backend-topb.onrender.com"
API_BASE = f"{BACKEND_URL}/api"

def test_endpoint(method, endpoint, data=None):
    """Test a single endpoint"""
    try:
        if method == "GET":
            response = requests.get(f"{API_BASE}{endpoint}", timeout=10)
        elif method == "POST":
            response = requests.post(
                f"{API_BASE}{endpoint}", 
                json=data or {}, 
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
        
        return {
            'status': response.status_code,
            'text': response.text[:200],
            'success': response.status_code < 400
        }
    except Exception as e:
        return {
            'status': 'ERROR',
            'text': str(e),
            'success': False
        }

def check_all_endpoints():
    """Check all possible endpoints"""
    print("🔍 CHECKING BACKEND ENDPOINTS")
    print("=" * 60)
    print(f"🌐 Backend: {BACKEND_URL}")
    print("=" * 60)
    
    # Test data
    timestamp = int(time.time())
    test_data = {
        "signup": {
            "id": str(timestamp),
            "first_name": "Test",
            "last_name": "User", 
            "email": f"test_{timestamp}@example.com",
            "phone": "+1-555-TEST",
            "company": "Test Co",
            "country": "US"
        },
        "payment": {
            "user_id": str(timestamp),
            "amount": 99.99,
            "payment_method": "test"
        },
        "questionnaire": {
            "user_id": str(timestamp),
            "prop_firm": "FTMO",
            "risk_percentage": 2.0
        }
    }
    
    # List of endpoints to test
    endpoints_to_test = [
        # Health/Status endpoints
        ("GET", "/health", None),
        ("GET", "/status", None),
        ("GET", "/", None),
        
        # Authentication endpoints
        ("POST", "/auth/register", test_data["signup"]),
        ("POST", "/auth/login", {"email": "test@test.com", "password": "test"}),
        ("POST", "/register", test_data["signup"]),
        ("POST", "/login", {"email": "test@test.com", "password": "test"}),
        
        # Working endpoints (from memory)
        ("POST", "/working/register", test_data["signup"]),
        ("POST", "/working/payment", test_data["payment"]),
        ("POST", "/working/questionnaire", test_data["questionnaire"]),
        ("GET", "/working/dashboard-data", None),
        ("GET", "/working/health", None),
        
        # Standard endpoints
        ("POST", "/payments", test_data["payment"]),
        ("POST", "/questionnaire", test_data["questionnaire"]),
        ("GET", "/dashboard", None),
        ("POST", "/dashboard", {"user_id": str(timestamp)}),
        ("PUT", "/dashboard/equity", {"user_id": str(timestamp), "equity": 10000}),
        
        # Enhanced endpoints
        ("POST", "/enhanced-signup", test_data["signup"]),
        ("POST", "/enhanced-payment", test_data["payment"]),
        
        # Simple endpoints
        ("POST", "/simple/payments", test_data["payment"]),
        ("POST", "/simple/questionnaire", test_data["questionnaire"]),
    ]
    
    working_endpoints = []
    failed_endpoints = []
    
    for method, endpoint, data in endpoints_to_test:
        print(f"\n🧪 Testing {method} {endpoint}...")
        result = test_endpoint(method, endpoint, data)
        
        if result['success']:
            print(f"   ✅ {result['status']} - {result['text'][:100]}")
            working_endpoints.append(f"{method} {endpoint}")
        else:
            print(f"   ❌ {result['status']} - {result['text'][:100]}")
            failed_endpoints.append(f"{method} {endpoint}")
    
    print("\n" + "=" * 60)
    print("📊 RESULTS SUMMARY")
    print("=" * 60)
    
    if working_endpoints:
        print(f"\n✅ WORKING ENDPOINTS ({len(working_endpoints)}):")
        for endpoint in working_endpoints:
            print(f"   - {endpoint}")
    
    if failed_endpoints:
        print(f"\n❌ FAILED ENDPOINTS ({len(failed_endpoints)}):")
        for endpoint in failed_endpoints[:10]:  # Show first 10
            print(f"   - {endpoint}")
        if len(failed_endpoints) > 10:
            print(f"   ... and {len(failed_endpoints) - 10} more")
    
    print(f"\n🎯 RECOMMENDATION:")
    if working_endpoints:
        print("Use the working endpoints above in your frontend!")
        print("Update your frontend components to use these exact endpoint paths.")
    else:
        print("❌ No working endpoints found!")
        print("You need to deploy the PostgreSQL API routes to your backend.")
        print("Copy the journal/api_routes.py file to your production server.")
    
    return working_endpoints

if __name__ == "__main__":
    working = check_all_endpoints()
    
    if working:
        print(f"\n🚀 NEXT STEPS:")
        print("1. Update your frontend to use the working endpoints shown above")
        print("2. Test your forms again")
        print("3. Check the PostgreSQL database for new data")
    else:
        print(f"\n🔧 DEPLOYMENT NEEDED:")
        print("1. Deploy the API routes from journal/api_routes.py to your backend")
        print("2. Make sure PostgreSQL connection is configured")
        print("3. Restart your backend service")
        print("4. Run this test again")

#!/usr/bin/env python3
"""
Test what's actually happening on the live website
"""

import requests
import json

def test_live_website():
    """Test the actual endpoints your live website is trying to use"""
    print("🔍 TESTING LIVE WEBSITE API CALLS")
    print("=" * 60)
    
    # Test the endpoints your live website is actually calling
    endpoints_to_test = [
        "https://backend-topb.onrender.com/api/auth/register",
        "https://backend-topb.onrender.com/api/register", 
        "https://trading-cors-proxy-gbhz.onrender.com/api/auth/register",
        "https://trading-cors-proxy-gbhz.onrender.com/api/health"
    ]
    
    test_data = {
        "firstName": "Test",
        "lastName": "User",
        "email": "test@example.com",
        "phone": "+1-555-TEST",
        "company": "Test Co",
        "country": "US"
    }
    
    for endpoint in endpoints_to_test:
        print(f"\n🧪 Testing: {endpoint}")
        try:
            if "health" in endpoint:
                response = requests.get(endpoint, timeout=10)
            else:
                response = requests.post(
                    endpoint, 
                    json=test_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
            
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            
            if response.status_code < 400:
                print(f"   ✅ WORKING!")
            else:
                print(f"   ❌ FAILED")
                
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
    
    print(f"\n🎯 CONCLUSION:")
    print("If all endpoints show ❌ FAILED, that's why your signups aren't working!")

if __name__ == "__main__":
    test_live_website()

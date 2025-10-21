#!/usr/bin/env python3
"""
Test the endpoints that should exist based on previous implementations
"""

import requests
import json

def test_existing_endpoints():
    backend_url = "https://backend-topb.onrender.com"
    
    print(f"🔍 Testing Known Endpoints: {backend_url}")
    print("=" * 60)
    
    # Based on memories, these endpoints should exist
    endpoints_to_test = [
        # Working endpoints from memory
        ("GET", "/api/working/health"),
        ("GET", "/api/working/dashboard-data"),
        
        # Enhanced endpoints from memory  
        ("GET", "/api/enhanced/admin/stats"),
        
        # Basic endpoints
        ("GET", "/"),
        ("GET", "/api"),
        ("GET", "/health"),
        ("GET", "/status"),
    ]
    
    working_endpoints = []
    
    for method, endpoint in endpoints_to_test:
        try:
            url = f"{backend_url}{endpoint}"
            print(f"Testing {method} {endpoint} ... ", end="")
            
            if method == "GET":
                response = requests.get(url, timeout=15)
            else:
                response = requests.post(url, json={}, timeout=15)
            
            if response.status_code < 400:
                print(f"✅ {response.status_code}")
                working_endpoints.append(endpoint)
                
                # Try to parse JSON response
                try:
                    data = response.json()
                    print(f"    📊 Response: {json.dumps(data, indent=2)}")
                except:
                    print(f"    📄 Response: {response.text[:150]}...")
            else:
                print(f"❌ {response.status_code}")
                
        except requests.exceptions.Timeout:
            print("⏰ Timeout (service might be sleeping)")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n" + "=" * 60)
    print("📊 RESULTS")
    print("=" * 60)
    
    if working_endpoints:
        print(f"✅ Found {len(working_endpoints)} working endpoints:")
        for endpoint in working_endpoints:
            print(f"  - {endpoint}")
        
        print(f"\n🔧 UPDATE FRONTEND:")
        print("Update fresh_frontend_connection.js to use these endpoints:")
        for endpoint in working_endpoints:
            if "health" in endpoint:
                print(f"  health: '{endpoint}',")
            elif "register" in endpoint:
                print(f"  register: '{endpoint}',")
            elif "stats" in endpoint:
                print(f"  stats: '{endpoint}',")
    else:
        print("❌ No working endpoints found!")
        print("\n🚀 NEXT STEPS:")
        print("1. Your backend service might be sleeping - try accessing it in browser first")
        print("2. Deploy the fresh backend API to your existing service")
        print("3. Or deploy as a new service")

if __name__ == "__main__":
    test_existing_endpoints()

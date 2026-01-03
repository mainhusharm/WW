#!/usr/bin/env python3
"""
Test script to verify signal endpoints are working
"""

import requests
import json

BASE_URL = "http://localhost:8080"

def test_endpoint(endpoint, method="GET", data=None):
    """Test an API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=10)
        
        print(f"\n🔍 Testing {method} {endpoint}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if 'signals' in data:
                    print(f"✅ Signals found: {len(data['signals'])}")
                    if data['signals']:
                        print(f"   First signal: {data['signals'][0]['pair']} {data['signals'][0]['direction']}")
                else:
                    print(f"✅ Response: {json.dumps(data, indent=2)[:200]}...")
            except:
                print(f"✅ Response: {response.text[:200]}...")
        else:
            print(f"❌ Error: {response.text[:200]}...")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")

def main():
    print("🚀 Testing Signal Endpoints")
    print("=" * 50)
    
    # Test health first
    test_endpoint("/health")
    
    # Test signal endpoints
    test_endpoint("/api/test/signals")
    test_endpoint("/api/signals")
    
    # Test other endpoints
    test_endpoint("/api/user/profile")
    test_endpoint("/api/dashboard-data")
    
    print("\n✅ Testing complete!")

if __name__ == "__main__":
    main()

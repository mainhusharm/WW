#!/usr/bin/env python3
"""
Quick test to see what's available on your backend
"""

import requests

def quick_test():
    backend_url = "https://backend-topb.onrender.com"
    
    print(f"🔍 Quick Backend Test: {backend_url}")
    print("=" * 50)
    
    # Test basic connectivity
    try:
        response = requests.get(backend_url, timeout=15)
        print(f"✅ Backend is reachable - Status: {response.status_code}")
        print(f"📄 Response: {response.text[:200]}...")
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return
    
    # Test common endpoints
    endpoints = ["/api", "/api/health", "/health", "/status"]
    
    for endpoint in endpoints:
        try:
            url = f"{backend_url}{endpoint}"
            response = requests.get(url, timeout=10)
            print(f"✅ {endpoint} - Status: {response.status_code}")
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"   📊 JSON Response: {data}")
                except:
                    print(f"   📄 Text Response: {response.text[:100]}...")
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")

if __name__ == "__main__":
    quick_test()

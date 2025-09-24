#!/usr/bin/env python3
"""
Quick test to check backend endpoints
"""

import requests
import json

def test_backend():
    backend = "https://backend-topb.onrender.com"
    
    print(f"🔍 Testing {backend}")
    
    # Test basic endpoints
    endpoints = [
        "/api/health",
        "/api/auth/register", 
        "/api/working/register",
        "/api/register",
        "/health"
    ]
    
    for endpoint in endpoints:
        try:
            url = f"{backend}{endpoint}"
            print(f"\n🧪 Testing {url}")
            
            if "register" in endpoint:
                # POST test
                response = requests.post(url, json={"test": "data"}, timeout=5)
            else:
                # GET test
                response = requests.get(url, timeout=5)
                
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text[:100]}")
            
            if response.status_code < 400:
                print(f"   ✅ WORKING!")
            else:
                print(f"   ❌ Failed")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    test_backend()

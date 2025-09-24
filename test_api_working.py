#!/usr/bin/env python3
"""
Test script to verify the simple customers API is working
"""

import requests
import json

def test_api():
    """Test the simple customers API"""
    try:
        print("🔍 Testing Simple Customers API...")
        
        # Test health endpoint
        print("📊 Testing health endpoint...")
        health_response = requests.get("http://localhost:5003/health", timeout=5)
        if health_response.status_code == 200:
            print("✅ Health endpoint working")
            print(f"   Response: {health_response.json()}")
        else:
            print(f"❌ Health endpoint failed: {health_response.status_code}")
            return False
        
        # Test customers endpoint
        print("📊 Testing customers endpoint...")
        customers_response = requests.get("http://localhost:5003/api/customers", timeout=10)
        if customers_response.status_code == 200:
            customers = customers_response.json()
            print(f"✅ Customers endpoint working - found {len(customers)} customers")
            
            if customers:
                print("📋 Sample customer data:")
                for i, customer in enumerate(customers[:3]):  # Show first 3 customers
                    print(f"   {i+1}. {customer.get('username', 'N/A')} ({customer.get('email', 'N/A')})")
            else:
                print("⚠️ No customers found in response")
        else:
            print(f"❌ Customers endpoint failed: {customers_response.status_code}")
            print(f"   Response: {customers_response.text}")
            return False
        
        print("🎉 API test completed successfully!")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API - is it running on port 5003?")
        return False
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

if __name__ == "__main__":
    test_api()

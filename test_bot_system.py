#!/usr/bin/env python3
"""
Test script for the Trading Bot System
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:5000"

def test_api_endpoint(endpoint, method="GET", data=None):
    """Test an API endpoint"""
    try:
        url = f"{BASE_URL}{endpoint}"
        if method == "GET":
            response = requests.get(url, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=10)
        
        print(f"✅ {method} {endpoint}: {response.status_code}")
        if response.status_code == 200:
            try:
                result = response.json()
                if result.get('success'):
                    print(f"   Response: {json.dumps(result, indent=2)}")
                else:
                    print(f"   Error: {result.get('error', 'Unknown error')}")
            except:
                print(f"   Response: {response.text[:100]}...")
        else:
            print(f"   Error: {response.text}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ {method} {endpoint}: {str(e)}")
        return False

def test_bot_system():
    """Test the entire bot system"""
    print("🧪 Testing Trading Bot System...")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1. Testing Health Check...")
    test_api_endpoint("/api/health")
    
    # Test 2: Bot status
    print("\n2. Testing Bot Status...")
    test_api_endpoint("/api/bot/status")
    
    # Test 3: Start crypto bot
    print("\n3. Testing Bot Start (Crypto)...")
    test_api_endpoint("/api/bot/start", "POST", {
        "bot_type": "crypto",
        "updated_by": "test_script"
    })
    
    # Wait a moment
    time.sleep(2)
    
    # Test 4: Check status again
    print("\n4. Checking Bot Status After Start...")
    test_api_endpoint("/api/bot/status")
    
    # Test 5: Start forex bot
    print("\n5. Testing Bot Start (Forex)...")
    test_api_endpoint("/api/bot/start", "POST", {
        "bot_type": "forex",
        "updated_by": "test_script"
    })
    
    # Wait a moment
    time.sleep(2)
    
    # Test 6: Check status again
    print("\n6. Checking Bot Status After Both Started...")
    test_api_endpoint("/api/bot/status")
    
    # Test 7: Store some test data
    print("\n7. Testing Data Storage...")
    test_data = {
        "bot_type": "crypto",
        "pair": "BTC-USD",
        "price": 45000.50,
        "signal_type": "buy",
        "signal_strength": 85.5,
        "is_recommended": True,
        "volume": 1000.0,
        "high": 45100.0,
        "low": 44900.0,
        "open_price": 44950.0,
        "close_price": 45000.50,
        "timeframe": "1m"
    }
    test_api_endpoint("/api/bot/data", "POST", test_data)
    
    # Test 8: Retrieve stored data
    print("\n8. Testing Data Retrieval...")
    test_api_endpoint("/api/bot/data?bot_type=crypto&limit=5")
    
    # Test 9: Test dashboard authentication
    print("\n9. Testing Dashboard Authentication...")
    test_api_endpoint("/api/bot/dashboard/auth", "POST", {"mpin": "231806"})
    
    # Test 10: Test dashboard stats
    print("\n10. Testing Dashboard Stats...")
    test_api_endpoint("/api/bot/dashboard/stats")
    
    # Test 11: Stop both bots
    print("\n11. Testing Bot Stop...")
    test_api_endpoint("/api/bot/stop", "POST", {
        "bot_type": "crypto",
        "updated_by": "test_script"
    })
    test_api_endpoint("/api/bot/stop", "POST", {
        "bot_type": "forex",
        "updated_by": "test_script"
    })
    
    # Test 12: Final status check
    print("\n12. Final Bot Status Check...")
    test_api_endpoint("/api/bot/status")
    
    print("\n" + "=" * 50)
    print("🎉 Bot System Testing Completed!")
    print("\n📋 Next Steps:")
    print("1. Check the results above for any ❌ errors")
    print("2. If all tests pass, your system is working correctly")
    print("3. Access the dashboards to see the bots in action")
    print("4. Use M-PIN '231806' to access the database dashboard")

if __name__ == "__main__":
    try:
        test_bot_system()
    except KeyboardInterrupt:
        print("\n\n🛑 Testing interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Testing failed with error: {str(e)}")
        print("Make sure the backend is running: python3 journal/run_journal.py")

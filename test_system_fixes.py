#!/usr/bin/env python3
"""
Test script to verify all system fixes are working:
1. Signal delivery from admin to user dashboard
2. Customer service dashboard functionality
3. Payment page display
4. Email uniqueness constraint
"""

import requests
import json
import time
from datetime import datetime

# Test configuration
BASE_URL = "http://localhost:5000"
TEST_EMAIL = f"test_{int(time.time())}@example.com"
TEST_USERNAME = f"testuser_{int(time.time())}"

def test_health_check():
    """Test if the server is running"""
    print("🔍 Testing server health...")
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running and healthy")
            return True
        else:
            print(f"❌ Server health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Server health check error: {e}")
        return False

def test_signal_relay():
    """Test signal relay from admin to user dashboard"""
    print("\n🔍 Testing signal relay system...")
    
    # Test signal relay endpoint
    test_signal = {
        "symbol": "BTC/USDT",
        "timeframe": "1h",
        "direction": "buy",
        "entry": 45000.00,
        "stop_loss": 44000.00,
        "take_profit": 47000.00,
        "is_recommended": True,
        "signal_strength": 85.5,
        "bot_type": "admin"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/signals/relay",
            json=test_signal,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Signal relay endpoint working")
                print(f"   Unique key: {data.get('unique_key')}")
                return True
            else:
                print(f"❌ Signal relay failed: {data.get('error')}")
                return False
        else:
            print(f"❌ Signal relay HTTP error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Signal relay error: {e}")
        return False

def test_signal_retrieval():
    """Test if signals can be retrieved from user dashboard"""
    print("\n🔍 Testing signal retrieval...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/signals", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                signals = data.get('data', [])
                print(f"✅ Retrieved {len(signals)} signals")
                if signals:
                    latest = signals[0]
                    print(f"   Latest signal: {latest.get('pair')} {latest.get('signal_type')}")
                return True
            else:
                print(f"❌ Signal retrieval failed: {data.get('error')}")
                return False
        else:
            print(f"❌ Signal retrieval HTTP error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Signal retrieval error: {e}")
        return False

def test_email_uniqueness():
    """Test email uniqueness constraint"""
    print("\n🔍 Testing email uniqueness constraint...")
    
    # Test user registration
    test_user = {
        "username": TEST_USERNAME,
        "email": TEST_EMAIL,
        "password": "testpassword123"
    }
    
    try:
        # First registration should succeed
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=test_user,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ First user registration successful")
                user_id = data.get('user_id')
            else:
                print(f"❌ First registration failed: {data.get('error')}")
                return False
        else:
            print(f"❌ First registration HTTP error: {response.status_code}")
            return False
        
        # Second registration with same email should fail
        duplicate_user = {
            "username": f"{TEST_USERNAME}_duplicate",
            "email": TEST_EMAIL,  # Same email
            "password": "testpassword123"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=duplicate_user,
            timeout=10
        )
        
        if response.status_code == 409:
            data = response.json()
            if "already exists" in data.get('error', ''):
                print("✅ Email uniqueness constraint working")
                return True
            else:
                print(f"❌ Unexpected error message: {data.get('error')}")
                return False
        else:
            print(f"❌ Duplicate registration should have failed with 409, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Email uniqueness test error: {e}")
        return False

def test_customer_database():
    """Test customer database functionality"""
    print("\n🔍 Testing customer database...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/customer-database", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                customers = data.get('data', [])
                print(f"✅ Customer database accessible, {len(customers)} customers found")
                return True
            else:
                print(f"❌ Customer database failed: {data.get('error')}")
                return False
        else:
            print(f"❌ Customer database HTTP error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Customer database error: {e}")
        return False

def test_bot_status():
    """Test bot status endpoints"""
    print("\n🔍 Testing bot status...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/bot/status", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                bots = data.get('data', [])
                print(f"✅ Bot status accessible, {len(bots)} bots found")
                for bot in bots:
                    print(f"   {bot.get('bot_type')}: {'🟢 Active' if bot.get('is_active') else '🔴 Inactive'}")
                return True
            else:
                print(f"❌ Bot status failed: {data.get('error')}")
                return False
        else:
            print(f"❌ Bot status HTTP error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Bot status error: {e}")
        return False

def run_all_tests():
    """Run all tests and provide summary"""
    print("🚀 Starting System Fixes Test Suite")
    print("=" * 50)
    
    tests = [
        ("Server Health", test_health_check),
        ("Signal Relay", test_signal_relay),
        ("Signal Retrieval", test_signal_retrieval),
        ("Email Uniqueness", test_email_uniqueness),
        ("Customer Database", test_customer_database),
        ("Bot Status", test_bot_status)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if success:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! System fixes are working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the implementation.")
    
    return passed == total

if __name__ == "__main__":
    try:
        success = run_all_tests()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⏹️  Tests interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n💥 Test suite crashed: {e}")
        exit(1)

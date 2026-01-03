#!/usr/bin/env python3
"""
Test script to verify the real-time signal system is working
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://backend-ox9b.onrender.com"
API_ENDPOINT = f"{BACKEND_URL}/api/admin/create-signal"
HEALTH_ENDPOINT = f"{BACKEND_URL}/health"
SIGNALS_ENDPOINT = f"{BACKEND_URL}/api/signals"

def test_backend_health():
    """Test if the backend is responding"""
    print("🔍 Testing backend health...")
    try:
        response = requests.get(HEALTH_ENDPOINT, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend is healthy: {data.get('message', 'OK')}")
            print(f"   Signals count: {data.get('signals_count', 0)}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend health check error: {e}")
        return False

def test_get_signals():
    """Test getting existing signals"""
    print("\n📊 Testing signal retrieval...")
    try:
        response = requests.get(SIGNALS_ENDPOINT, timeout=10)
        if response.status_code == 200:
            data = response.json()
            signals = data.get('signals', [])
            print(f"✅ Retrieved {len(signals)} signals")
            if signals:
                latest = signals[0]
                print(f"   Latest signal: {latest.get('pair', 'N/A')} {latest.get('direction', 'N/A')}")
            return True
        else:
            print(f"❌ Signal retrieval failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Signal retrieval error: {e}")
        return False

def test_create_signal():
    """Test creating a new signal"""
    print("\n🚀 Testing signal creation...")
    
    # Test signal data
    signal_data = {
        "pair": "EURUSD",
        "direction": "BUY",
        "entry": 1.0850,
        "stopLoss": 1.0800,
        "takeProfit": "1.0900,1.0950",
        "confidence": 85,
        "analysis": "Test signal created by automated test script",
        "ictConcepts": ["FVG", "Liquidity"],
        "market": "forex",
        "timeframe": "1h"
    }
    
    try:
        response = requests.post(
            API_ENDPOINT,
            json=signal_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Signal created successfully!")
            print(f"   Signal ID: {result.get('signal_id', 'N/A')}")
            print(f"   Created at: {result.get('created_at', 'N/A')}")
            return True
        else:
            print(f"❌ Signal creation failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
            except:
                print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Signal creation error: {e}")
        return False

def test_multiple_signals():
    """Test creating multiple signals"""
    print("\n🔄 Testing multiple signal creation...")
    
    test_signals = [
        {
            "pair": "GBPUSD",
            "direction": "SELL",
            "entry": 1.2650,
            "stopLoss": 1.2700,
            "takeProfit": "1.2600,1.2550",
            "confidence": 90,
            "analysis": "Automated test signal 1",
            "market": "forex",
            "timeframe": "1h"
        },
        {
            "pair": "BTCUSD",
            "direction": "BUY",
            "entry": 45000,
            "stopLoss": 44000,
            "takeProfit": "46000,47000",
            "confidence": 75,
            "analysis": "Automated test signal 2",
            "market": "crypto",
            "timeframe": "1h"
        },
        {
            "pair": "USDJPY",
            "direction": "BUY",
            "entry": 150.50,
            "stopLoss": 150.00,
            "takeProfit": "151.00,151.50",
            "confidence": 80,
            "analysis": "Automated test signal 3",
            "market": "forex",
            "timeframe": "1h"
        }
    ]
    
    successful = 0
    for i, signal_data in enumerate(test_signals, 1):
        print(f"   Creating signal {i}/{len(test_signals)}: {signal_data['pair']} {signal_data['direction']}")
        
        try:
            response = requests.post(
                API_ENDPOINT,
                json=signal_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 201:
                print(f"   ✅ Signal {i} created successfully")
                successful += 1
            else:
                print(f"   ❌ Signal {i} failed: {response.status_code}")
            
            # Wait between signals
            if i < len(test_signals):
                time.sleep(2)
                
        except Exception as e:
            print(f"   ❌ Signal {i} error: {e}")
    
    print(f"\n📊 Multiple signal test results: {successful}/{len(test_signals)} successful")
    return successful == len(test_signals)

def main():
    """Run all tests"""
    print("🧪 Real-Time Signal System Test Suite")
    print("=" * 50)
    
    tests = [
        ("Backend Health", test_backend_health),
        ("Get Signals", test_get_signals),
        ("Create Signal", test_create_signal),
        ("Multiple Signals", test_multiple_signals)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 Test Results Summary:")
    print("=" * 50)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:20} {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! The real-time signal system is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the backend configuration.")
    
    print(f"\nTest completed at: {datetime.now().isoformat()}")

if __name__ == "__main__":
    main()

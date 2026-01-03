#!/usr/bin/env python3
"""
Test Render Deployment of Enhanced Signal System
This script tests the deployed enhanced signal system on Render
"""

import requests
import json
import time
from datetime import datetime

# Configuration
RENDER_BASE_URL = "https://backend-ox9b.onrender.com"
API_BASE = f"{RENDER_BASE_URL}/api"

def test_render_deployment():
    """Test the enhanced signal system on Render"""
    print("🚀 Testing Enhanced Signal System on Render")
    print("=" * 50)
    
    # Test 1: Health Check
    print("\n1. Testing Health Check...")
    try:
        response = requests.get(f"{RENDER_BASE_URL}/healthz", timeout=10)
        if response.status_code == 200:
            health_data = response.json()
            print("✅ Health check passed")
            print(f"   Status: {health_data.get('status', 'unknown')}")
            print(f"   Database: {health_data.get('database', 'unknown')}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Test 2: Enhanced Signal System Endpoints
    print("\n2. Testing Enhanced Signal System Endpoints...")
    
    # Test signal stats
    try:
        response = requests.get(f"{API_BASE}/signals/stats", timeout=10)
        if response.status_code == 200:
            stats = response.json()
            print("✅ Signal stats endpoint working")
            print(f"   Total signals: {stats.get('stats', {}).get('total_signals', 0)}")
        else:
            print(f"⚠️ Signal stats endpoint returned: {response.status_code}")
    except Exception as e:
        print(f"⚠️ Signal stats endpoint error: {e}")
    
    # Test admin signals endpoint
    try:
        response = requests.get(f"{API_BASE}/signals/admin", timeout=10)
        if response.status_code == 200:
            admin_data = response.json()
            print("✅ Admin signals endpoint working")
            print(f"   Total admin signals: {admin_data.get('total', 0)}")
        else:
            print(f"⚠️ Admin signals endpoint returned: {response.status_code}")
    except Exception as e:
        print(f"⚠️ Admin signals endpoint error: {e}")
    
    # Test 3: Create Test Signals
    print("\n3. Creating Test Signals on Render...")
    
    test_signals = [
        {
            "symbol": "EUR/USD",
            "action": "BUY",
            "entryPrice": 1.0850,
            "stopLoss": 1.0800,
            "takeProfit": 1.0950,
            "timeframe": "1H",
            "confidence": 88,
            "rrRatio": "1:2.0",
            "analysis": "Strong bullish momentum with key support at 1.0800",
            "ictConcepts": ["Order Block", "Liquidity Sweep"]
        },
        {
            "symbol": "BTC/USDT",
            "action": "BUY",
            "entryPrice": 45000.00,
            "stopLoss": 44000.00,
            "takeProfit": 47000.00,
            "timeframe": "4H",
            "confidence": 92,
            "rrRatio": "1:2.0",
            "analysis": "Bitcoin showing strong bullish divergence",
            "ictConcepts": ["Smart Money", "Market Structure"]
        }
    ]
    
    created_signals = []
    
    for i, signal_data in enumerate(test_signals, 1):
        print(f"\n   {i}. Creating {signal_data['symbol']} signal...")
        
        # Determine market type
        market_type = "crypto" if "/USDT" in signal_data["symbol"] else "forex"
        
        try:
            # Try admin routes first (they're more reliable)
            if market_type == "forex":
                response = requests.post(f"{API_BASE}/admin/forex/generate-signal", 
                                       json=signal_data,
                                       headers={'Content-Type': 'application/json'},
                                       timeout=15)
            else:
                response = requests.post(f"{API_BASE}/admin/crypto/generate-signal", 
                                       json=signal_data,
                                       headers={'Content-Type': 'application/json'},
                                       timeout=15)
            
            if response.status_code == 201:
                result = response.json()
                print(f"      ✅ Signal created successfully")
                created_signals.append(signal_data)
            else:
                print(f"      ❌ Failed: {response.status_code} - {response.text[:100]}")
                
        except Exception as e:
            print(f"      ❌ Error: {e}")
        
        # Small delay between requests
        time.sleep(1)
    
    # Test 4: Verify Signals Were Created
    print(f"\n4. Verifying Created Signals...")
    try:
        response = requests.get(f"{API_BASE}/signals/admin", timeout=10)
        if response.status_code == 200:
            admin_data = response.json()
            total_signals = admin_data.get('total', 0)
            print(f"✅ Total signals in system: {total_signals}")
            
            if total_signals > 0:
                print("✅ Signals are being stored successfully")
                signals = admin_data.get('signals', [])
                for signal in signals[:3]:  # Show first 3 signals
                    print(f"   - {signal.get('symbol')}: {signal.get('action')} (Confidence: {signal.get('confidence')}%)")
            else:
                print("⚠️ No signals found in system")
        else:
            print(f"❌ Failed to verify signals: {response.status_code}")
    except Exception as e:
        print(f"❌ Error verifying signals: {e}")
    
    # Test 5: Test Signal Feed Endpoint
    print(f"\n5. Testing Signal Feed Endpoint...")
    try:
        response = requests.get(f"{API_BASE}/signal-feed/signals/feed", timeout=10)
        if response.status_code == 200:
            feed_data = response.json()
            signals = feed_data.get('signals', [])
            print(f"✅ Signal feed endpoint working")
            print(f"   Signals in feed: {len(signals)}")
        else:
            print(f"⚠️ Signal feed endpoint returned: {response.status_code}")
    except Exception as e:
        print(f"⚠️ Signal feed endpoint error: {e}")
    
    print(f"\n" + "=" * 50)
    print(f"🎉 Render Deployment Test Complete!")
    print(f"✅ Successfully created {len(created_signals)} signals")
    print("=" * 50)
    
    if created_signals:
        print(f"\n📊 Created Signals:")
        for signal in created_signals:
            print(f"   - {signal['symbol']}: {signal['action']} (Confidence: {signal['confidence']}%)")
    
    print(f"\n🌐 Render Backend URL: {RENDER_BASE_URL}")
    print(f"📡 WebSocket URL: wss://backend-u4hy.onrender.com")
    print(f"🔍 Your dashboard should now show these signals!")
    
    return len(created_signals) > 0

def wait_for_deployment():
    """Wait for Render deployment to complete"""
    print("⏳ Waiting for Render deployment to complete...")
    print("This may take 2-3 minutes...")
    
    max_attempts = 30  # 5 minutes with 10-second intervals
    attempt = 0
    
    while attempt < max_attempts:
        try:
            response = requests.get(f"{RENDER_BASE_URL}/healthz", timeout=5)
            if response.status_code == 200:
                print("✅ Render deployment is ready!")
                return True
        except:
            pass
        
        attempt += 1
        print(f"   Attempt {attempt}/{max_attempts} - Waiting...")
        time.sleep(10)
    
    print("⚠️ Render deployment is taking longer than expected")
    print("You can still try to test the deployment manually")
    return False

if __name__ == "__main__":
    print("Enhanced Signal System - Render Deployment Test")
    print("=" * 50)
    
    # Wait for deployment if needed
    if not wait_for_deployment():
        print("\n⚠️ Proceeding with test anyway...")
    
    # Run tests
    success = test_render_deployment()
    
    if success:
        print("\n🎉 Enhanced Signal System is working on Render!")
        print("\n📱 Next Steps:")
        print("1. Go to your user dashboard")
        print("2. Refresh the page")
        print("3. Check the Signal Feed tab")
        print("4. You should see the test signals with real-time connection")
    else:
        print("\n⚠️ Some tests failed, but the system may still be working")
        print("Please check your dashboard manually")

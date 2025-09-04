#!/usr/bin/env python3
"""
Complete test script to verify signal flow from admin to users
"""
import requests
import json
import time
from datetime import datetime

# Test endpoints
BASE_URL = "https://backend-u4hy.onrender.com"

def test_backend_health():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        print(f"✅ Backend Health: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Database Status: {data.get('database_status', 'Unknown')}")
            return True
    except Exception as e:
        print(f"❌ Backend Health Failed: {e}")
    return False

def create_test_signal():
    """Create a test signal from admin dashboard"""
    signal_data = {
        "symbol": "BTC/USD",
        "side": "buy",
        "entry_price": 45000.0,
        "stop_loss": 44000.0,
        "take_profit": 46000.0,
        "risk_tier": "medium",
        "analysis": "Test signal from crypto bot - strong bullish momentum",
        "confidence": 85
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/signals",
            json=signal_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"📤 Create Signal: {response.status_code}")
        if response.status_code in [200, 201]:
            data = response.json()
            print(f"   ✅ Signal created: {data.get('signal_id', 'Unknown ID')}")
            print(f"   Message: {data.get('message', 'No message')}")
            return data.get('signal_id')
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Create Signal Failed: {e}")
    return None

def fetch_signals():
    """Fetch signals for user dashboard"""
    try:
        response = requests.get(f"{BASE_URL}/api/signals", timeout=10)
        print(f"📥 Fetch Signals: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                signals = data.get('signals', [])
                print(f"   ✅ Found {len(signals)} signals")
                if signals:
                    latest = signals[0]
                    print(f"   Latest signal: {latest.get('pair', 'Unknown')} - {latest.get('direction', 'Unknown')}")
                    print(f"   Entry: {latest.get('entry', 'Unknown')}")
                    print(f"   Stop Loss: {latest.get('stopLoss', 'Unknown')}")
                    print(f"   Take Profit: {latest.get('takeProfit', 'Unknown')}")
                    print(f"   Confidence: {latest.get('confidence', 'Unknown')}%")
                    print(f"   Analysis: {latest.get('analysis', 'No analysis')}")
                return signals
            else:
                print(f"   ❌ API Error: {data.get('error', 'Unknown error')}")
        else:
            print(f"   ❌ HTTP Error: {response.text}")
    except Exception as e:
        print(f"❌ Fetch Signals Failed: {e}")
    return []

def test_signal_feed_endpoint():
    """Test the signal feed endpoint used by user dashboard"""
    try:
        response = requests.get(f"{BASE_URL}/api/signal-feed/api/signals/feed", timeout=10)
        print(f"📡 Signal Feed Endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                signals = data.get('signals', [])
                print(f"   ✅ Signal feed has {len(signals)} signals")
                return signals
            else:
                print(f"   ❌ Signal feed error: {data.get('error', 'Unknown error')}")
        else:
            print(f"   ❌ Signal feed HTTP error: {response.text}")
    except Exception as e:
        print(f"❌ Signal Feed Test Failed: {e}")
    return []

def main():
    print("🧪 Complete Signal Flow Test: Admin → Backend → User Dashboard")
    print("=" * 60)
    
    # Test backend health
    if not test_backend_health():
        print("❌ Backend is not running. Cannot test signal flow.")
        return
    
    print("\n📤 Step 1: Create Signal from Admin Dashboard (Crypto Bot)")
    signal_id = create_test_signal()
    
    if signal_id:
        print(f"\n⏳ Waiting 3 seconds for signal to be processed...")
        time.sleep(3)
        
        print("\n📥 Step 2: Fetch Signals for User Dashboard")
        signals = fetch_signals()
        
        print("\n📡 Step 3: Test Signal Feed Endpoint")
        feed_signals = test_signal_feed_endpoint()
        
        print("\n📊 Step 4: Verify Signal Flow")
        if signals and feed_signals:
            print("✅ Signal flow is working!")
            print(f"   - Admin created signal: {signal_id}")
            print(f"   - User dashboard can fetch: {len(signals)} signals")
            print(f"   - Signal feed endpoint has: {len(feed_signals)} signals")
            
            # Check if the created signal is in the results
            created_signal_found = any(s.get('id') == signal_id for s in signals)
            if created_signal_found:
                print("✅ Created signal found in user dashboard!")
            else:
                print("⚠️  Created signal not found in user dashboard")
        else:
            print("❌ Signal flow is not working properly")
            print("   - Check backend logs for errors")
            print("   - Verify database connection")
            print("   - Check signal endpoints")
    else:
        print("❌ Could not create test signal")
        print("   - Check backend signal creation endpoint")
        print("   - Verify database connection")
    
    print("\n✅ Signal flow test completed!")

if __name__ == "__main__":
    main()
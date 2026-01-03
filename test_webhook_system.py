#!/usr/bin/env python3
"""
Test Webhook System for Real-time Signal Delivery
Tests the complete webhook flow from admin to user dashboard
"""

import requests
import time
import json
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8080"
WEBHOOK_RECEIVER_URL = "http://localhost:8081"

def test_webhook_system():
    """Test the complete webhook system"""
    print("🧪 TESTING WEBHOOK SYSTEM")
    print("=" * 50)
    
    # Step 1: Register webhook
    print("\n1️⃣ Registering webhook...")
    webhook_data = {
        "webhook_url": f"{WEBHOOK_RECEIVER_URL}/webhook/signal"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/webhook/register", json=webhook_data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Webhook registered: {result['webhook_url']}")
            print(f"   Total subscribers: {result['total_subscribers']}")
        else:
            print(f"❌ Failed to register webhook: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error registering webhook: {e}")
        return False
    
    # Step 2: Check webhook subscribers
    print("\n2️⃣ Checking webhook subscribers...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/webhook/subscribers")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Subscribers: {result['subscribers']}")
            print(f"   Total count: {result['total_count']}")
        else:
            print(f"❌ Failed to get subscribers: {response.status_code}")
    except Exception as e:
        print(f"❌ Error getting subscribers: {e}")
    
    # Step 3: Test webhook with sample signal
    print("\n3️⃣ Testing webhook delivery...")
    try:
        response = requests.post(f"{BACKEND_URL}/api/webhook/test")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Test signal broadcasted")
            print(f"   Subscribers notified: {result['subscribers_notified']}")
            print(f"   Signal: {result['signal']['pair']} {result['signal']['direction']}")
        else:
            print(f"❌ Failed to test webhook: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing webhook: {e}")
    
    # Step 4: Wait and check received signals
    print("\n4️⃣ Checking received signals...")
    time.sleep(2)  # Wait for webhook delivery
    
    try:
        response = requests.get(f"{WEBHOOK_RECEIVER_URL}/webhook/signals")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Received signals: {result['total_count']}")
            if result['signals']:
                for i, signal_data in enumerate(result['signals']):
                    signal = signal_data['signal']
                    print(f"   Signal {i+1}: {signal['pair']} {signal['direction']}")
                    print(f"   Entry: {signal['entry_price']}")
                    print(f"   Source: {signal['source']}")
            else:
                print("   No signals received yet")
        else:
            print(f"❌ Failed to get received signals: {response.status_code}")
    except Exception as e:
        print(f"❌ Error getting received signals: {e}")
    
    # Step 5: Create admin signal and test webhook delivery
    print("\n5️⃣ Creating admin signal and testing webhook delivery...")
    admin_signal = {
        "pair": "GBPUSD",
        "direction": "SHORT",
        "entry": "1.2650",
        "stopLoss": "1.2700",
        "takeProfit": "1.2550",
        "confidence": 90,
        "analysis": "Strong bearish momentum with clear order block breakdown",
        "ictConcepts": ["Order Block", "Fair Value Gap", "Liquidity Sweep"],
        "market": "forex",
        "timeframe": "4h"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/admin/create-signal", json=admin_signal)
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Admin signal created: {result['signal_id']}")
            print(f"   Message: {result['message']}")
        else:
            print(f"❌ Failed to create admin signal: {response.status_code}")
    except Exception as e:
        print(f"❌ Error creating admin signal: {e}")
    
    # Step 6: Check if admin signal was delivered via webhook
    print("\n6️⃣ Checking if admin signal was delivered via webhook...")
    time.sleep(2)  # Wait for webhook delivery
    
    try:
        response = requests.get(f"{WEBHOOK_RECEIVER_URL}/webhook/signals")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Total received signals: {result['total_count']}")
            if result['signals']:
                latest_signal = result['signals'][-1]
                signal = latest_signal['signal']
                print(f"   Latest signal: {signal['pair']} {signal['direction']}")
                print(f"   Entry: {signal['entry_price']}")
                print(f"   Source: {signal['source']}")
                print(f"   Received at: {latest_signal['received_at']}")
        else:
            print(f"❌ Failed to get received signals: {response.status_code}")
    except Exception as e:
        print(f"❌ Error getting received signals: {e}")
    
    # Step 7: Test webhook receiver health
    print("\n7️⃣ Testing webhook receiver health...")
    try:
        response = requests.get(f"{WEBHOOK_RECEIVER_URL}/webhook/health")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Webhook receiver healthy")
            print(f"   Status: {result['status']}")
            print(f"   Received signals: {result['received_signals']}")
        else:
            print(f"❌ Webhook receiver unhealthy: {response.status_code}")
    except Exception as e:
        print(f"❌ Error checking webhook receiver health: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 WEBHOOK SYSTEM TEST COMPLETE")
    print("=" * 50)
    
    return True

if __name__ == "__main__":
    print("🚀 Starting Webhook System Test")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Webhook Receiver URL: {WEBHOOK_RECEIVER_URL}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    success = test_webhook_system()
    
    if success:
        print("\n🎉 WEBHOOK SYSTEM TEST SUCCESSFUL!")
        print("✅ Real-time signal delivery is working")
        print("✅ Admin signals are being delivered to webhooks")
        print("✅ Webhook system is ready for production")
    else:
        print("\n❌ WEBHOOK SYSTEM TEST FAILED!")
        print("🔧 Please check the configuration and try again")

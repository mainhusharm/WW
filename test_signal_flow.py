#!/usr/bin/env python3
"""
Test Signal Flow - Admin to User Dashboard
Tests the complete signal flow from admin dashboard to user dashboard
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://backend-bkt7.onrender.com"
ADMIN_SIGNAL_ENDPOINT = f"{BACKEND_URL}/api/admin/create-signal"
SIGNALS_ENDPOINT = f"{BACKEND_URL}/api/signals"

def test_admin_signal_creation():
    """Test creating a signal from admin dashboard"""
    print("🧪 Testing Admin Signal Creation...")
    
    # Test signal data
    signal_data = {
        "pair": "EURUSD",
        "direction": "LONG",
        "entry": "1.0850",
        "stopLoss": "1.0800",
        "takeProfit": "1.0950",
        "confidence": 85,
        "analysis": "Strong bullish momentum with ICT concepts: Order Block, Fair Value Gap",
        "ictConcepts": ["Order Block", "Fair Value Gap", "Liquidity Sweep"],
        "market": "forex",
        "timeframe": "1h"
    }
    
    try:
        response = requests.post(
            ADMIN_SIGNAL_ENDPOINT,
            json=signal_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Admin signal created successfully!")
            print(f"   Signal ID: {result.get('signal_id')}")
            print(f"   Created at: {result.get('created_at')}")
            return result.get('signal_id')
        else:
            print(f"❌ Failed to create admin signal: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating admin signal: {e}")
        return None

def test_signals_retrieval():
    """Test retrieving signals from user dashboard"""
    print("\n🧪 Testing Signals Retrieval...")
    
    try:
        response = requests.get(
            SIGNALS_ENDPOINT,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            signals = result.get('signals', [])
            print(f"✅ Retrieved {len(signals)} signals successfully!")
            
            if signals:
                latest_signal = signals[0]
                print(f"   Latest signal: {latest_signal.get('pair')} - {latest_signal.get('direction')}")
                print(f"   Entry: {latest_signal.get('entry_price')}")
                print(f"   Stop Loss: {latest_signal.get('stop_loss')}")
                print(f"   Take Profit: {latest_signal.get('take_profit')}")
            
            return signals
        else:
            print(f"❌ Failed to retrieve signals: {response.status_code}")
            print(f"   Response: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Error retrieving signals: {e}")
        return []

def test_webhook_registration():
    """Test webhook registration for real-time delivery"""
    print("\n🧪 Testing Webhook Registration...")
    
    webhook_data = {
        "webhook_url": "https://frontend-i6xs.onrender.com/api/webhook/signal"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/webhook/register",
            json=webhook_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Webhook registered successfully!")
            print(f"   Total subscribers: {result.get('total_subscribers')}")
            return True
        else:
            print(f"❌ Failed to register webhook: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error registering webhook: {e}")
        return False

def test_webhook_subscribers():
    """Test getting webhook subscribers"""
    print("\n🧪 Testing Webhook Subscribers...")
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/webhook/subscribers",
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            subscribers = result.get('subscribers', [])
            print(f"✅ Retrieved {len(subscribers)} webhook subscribers!")
            
            for i, subscriber in enumerate(subscribers, 1):
                print(f"   {i}. {subscriber}")
            
            return subscribers
        else:
            print(f"❌ Failed to get webhook subscribers: {response.status_code}")
            print(f"   Response: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Error getting webhook subscribers: {e}")
        return []

def test_health_check():
    """Test backend health"""
    print("🧪 Testing Backend Health...")
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/health",
            timeout=30
        )
        
        if response.status_code == 200:
            print("✅ Backend is healthy!")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error checking backend health: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Signal Flow Tests")
    print("=" * 50)
    
    # Test 1: Health check
    if not test_health_check():
        print("\n❌ Backend is not healthy. Stopping tests.")
        return
    
    # Test 2: Webhook registration
    test_webhook_registration()
    
    # Test 3: Get webhook subscribers
    test_webhook_subscribers()
    
    # Test 4: Create admin signal
    signal_id = test_admin_signal_creation()
    
    if signal_id:
        # Wait a moment for signal to be processed
        print("\n⏳ Waiting 3 seconds for signal processing...")
        time.sleep(3)
        
        # Test 5: Retrieve signals
        signals = test_signals_retrieval()
        
        # Check if our signal is in the list
        if signals:
            signal_found = any(s.get('id') == signal_id for s in signals)
            if signal_found:
                print(f"\n✅ Signal flow test PASSED! Signal {signal_id} found in user dashboard.")
            else:
                print(f"\n⚠️  Signal flow test PARTIAL. Signal {signal_id} created but not found in user dashboard.")
        else:
            print(f"\n❌ Signal flow test FAILED. No signals retrieved from user dashboard.")
    
    print("\n" + "=" * 50)
    print("🏁 Signal Flow Tests Complete")

if __name__ == "__main__":
    main()
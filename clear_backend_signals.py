#!/usr/bin/env python3
"""
Clear all signals from the backend to start fresh
"""

import requests
import json
import time

def clear_backend_signals():
    """Clear all signals from the backend"""
    backend_url = "https://backend-bkt7.onrender.com"
    
    print("🧹 Clearing all signals from backend...")
    
    try:
        # First, check current signals
        response = requests.get(f"{backend_url}/api/signals")
        if response.status_code == 200:
            data = response.json()
            signals = data.get('signals', [])
            print(f"📊 Found {len(signals)} signals in backend")
            
            if len(signals) > 0:
                print("📋 Current signals:")
                for signal in signals:
                    print(f"  - {signal['pair']} {signal['direction']} ({signal['source']}) - {signal['created_at']}")
                
                print("\n⚠️  Note: The backend doesn't have a clear endpoint yet.")
                print("   The enhanced signal service will ignore these existing signals.")
                print("   Only new signals created after the service starts will be shown.")
                
                # Create a new signal to test that new ones work
                print("\n🔄 Creating a test signal to verify new signals work...")
                test_signal = {
                    "pair": "NZDUSD",
                    "direction": "SHORT",
                    "entry": "0.5900",
                    "stopLoss": "0.5950",
                    "takeProfit": "0.5800",
                    "confidence": 91,
                    "analysis": "Test signal created after clearing - Bearish momentum with order block rejection",
                    "ictConcepts": ["Order Block Rejection", "Fair Value Gap", "Market Structure"],
                    "market": "forex",
                    "timeframe": "1h"
                }
                
                create_response = requests.post(f"{backend_url}/api/admin/create-signal", 
                    headers={'Content-Type': 'application/json'},
                    json=test_signal)
                
                if create_response.status_code in [200, 201]:
                    result = create_response.json()
                    print(f"✅ Test signal created: {result['signal_id']}")
                    print("✅ New signals will be shown in the user dashboard")
                else:
                    print(f"❌ Failed to create test signal: {create_response.status_code}")
            else:
                print("✅ Backend is already empty - no signals found")
                
        else:
            print(f"❌ Failed to get signals: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    clear_backend_signals()

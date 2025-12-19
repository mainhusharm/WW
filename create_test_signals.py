#!/usr/bin/env python3
"""
Create Test Signals for Enhanced Signal System
This script creates sample signals to demonstrate the system
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://127.0.0.1:5000"
API_BASE = f"{BASE_URL}/api"

def create_test_signals():
    """Create test signals to populate the dashboard"""
    print("🚀 Creating Test Signals for Enhanced Signal System")
    print("=" * 50)
    
    # Test signals data
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
            "analysis": "Strong bullish momentum with key support at 1.0800. Price action shows clear order block formation.",
            "ictConcepts": ["Order Block", "Liquidity Sweep", "Fair Value Gap"]
        },
        {
            "symbol": "GBP/USD",
            "action": "SELL",
            "entryPrice": 1.2650,
            "stopLoss": 1.2700,
            "takeProfit": 1.2550,
            "timeframe": "4H",
            "confidence": 85,
            "rrRatio": "1:2.0",
            "analysis": "Bearish divergence on RSI with resistance at 1.2700. Smart money distribution pattern visible.",
            "ictConcepts": ["Smart Money", "Market Structure", "Liquidity Pool"]
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
            "analysis": "Bitcoin showing strong bullish divergence with RSI oversold. Key support level holding.",
            "ictConcepts": ["Smart Money", "Market Structure", "Liquidity Pool"]
        },
        {
            "symbol": "ETH/USDT",
            "action": "BUY",
            "entryPrice": 3200.00,
            "stopLoss": 3100.00,
            "takeProfit": 3400.00,
            "timeframe": "1H",
            "confidence": 87,
            "rrRatio": "1:2.0",
            "analysis": "Ethereum breaking out of consolidation with strong volume. Next target at 3400.",
            "ictConcepts": ["Break of Structure", "Volume Analysis", "Fair Value Gap"]
        },
        {
            "symbol": "USD/JPY",
            "action": "SELL",
            "entryPrice": 150.50,
            "stopLoss": 151.00,
            "takeProfit": 149.50,
            "timeframe": "1H",
            "confidence": 83,
            "rrRatio": "1:2.0",
            "analysis": "USD/JPY showing bearish momentum with key resistance at 151.00. Risk-off sentiment building.",
            "ictConcepts": ["Order Block", "Market Structure", "Liquidity Sweep"]
        }
    ]
    
    created_signals = []
    
    for i, signal_data in enumerate(test_signals, 1):
        print(f"\n{i}. Creating {signal_data['symbol']} signal...")
        
        # Determine market type
        market_type = "crypto" if "/USDT" in signal_data["symbol"] else "forex"
        
        try:
            # Try the enhanced signal system first
            response = requests.post(f"{API_BASE}/signals/create", 
                                   json={**signal_data, "marketType": market_type},
                                   headers={'Content-Type': 'application/json'},
                                   timeout=10)
            
            if response.status_code == 201:
                result = response.json()
                print(f"   ✅ Enhanced system: {result.get('message', 'Signal created')}")
                created_signals.append(signal_data)
            else:
                print(f"   ⚠️ Enhanced system failed: {response.status_code}")
                
                # Fallback to admin routes
                if market_type == "forex":
                    response = requests.post(f"{API_BASE}/admin/forex/generate-signal", 
                                           json=signal_data,
                                           headers={'Content-Type': 'application/json'},
                                           timeout=10)
                else:
                    response = requests.post(f"{API_BASE}/admin/crypto/generate-signal", 
                                           json=signal_data,
                                           headers={'Content-Type': 'application/json'},
                                           timeout=10)
                
                if response.status_code == 201:
                    print(f"   ✅ Admin route: Signal created successfully")
                    created_signals.append(signal_data)
                else:
                    print(f"   ❌ Failed: {response.status_code} - {response.text}")
                    
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Network error: {e}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        # Small delay between requests
        time.sleep(0.5)
    
    print(f"\n" + "=" * 50)
    print(f"🎉 Test Signal Creation Complete!")
    print(f"✅ Successfully created {len(created_signals)} signals")
    
    if created_signals:
        print(f"\n📊 Created Signals:")
        for signal in created_signals:
            print(f"   - {signal['symbol']}: {signal['action']} (Confidence: {signal['confidence']}%)")
    
    print(f"\n🌐 Dashboard URL: http://127.0.0.1:5000")
    print(f"📡 WebSocket: ws://127.0.0.1:5000")
    print(f"🔍 Check your dashboard for the new signals!")

def check_server_status():
    """Check if the server is running"""
    try:
        response = requests.get(f"{BASE_URL}/healthz", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running and accessible")
            return True
        else:
            print(f"⚠️ Server responded with status: {response.status_code}")
            return False
    except requests.exceptions.RequestException:
        print("❌ Server is not running or not accessible")
        print("   Please start the server first")
        return False

if __name__ == "__main__":
    print("Enhanced Signal System - Test Signal Creator")
    print("=" * 50)
    
    if check_server_status():
        create_test_signals()
    else:
        print("\n💡 To start the server:")
        print("   python3 start_local_server.py")
        print("   or")
        print("   python3 app.py")

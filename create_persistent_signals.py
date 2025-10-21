#!/usr/bin/env python3
"""
Create Persistent Signals for Enhanced Signal System
This script creates signals that will persist and be visible in the frontend
"""

import requests
import json
import time
from datetime import datetime

# Configuration
RENDER_BASE_URL = "https://backend-u4hy.onrender.com"
API_BASE = f"{RENDER_BASE_URL}/api"

def create_persistent_signals():
    """Create signals that will persist and be visible"""
    print("🚀 Creating Persistent Signals for Enhanced Signal System")
    print("=" * 60)
    
    # Test signals that will be created
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
            "ictConcepts": ["Order Block", "Liquidity Sweep", "Market Structure"]
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
            "analysis": "Bitcoin showing strong bullish divergence with institutional accumulation. Break of structure confirmed.",
            "ictConcepts": ["Smart Money", "Market Structure", "Order Block"]
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
            "analysis": "Ethereum breaking out of consolidation with strong volume. Bullish order block formation.",
            "ictConcepts": ["Break of Structure", "Volume Analysis", "Order Block"]
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
            "analysis": "USD/JPY showing bearish momentum with key resistance. Liquidity sweep pattern forming.",
            "ictConcepts": ["Order Block", "Market Structure", "Liquidity Sweep"]
        },
        {
            "symbol": "AUD/USD",
            "action": "BUY",
            "entryPrice": 0.6550,
            "stopLoss": 0.6500,
            "takeProfit": 0.6650,
            "timeframe": "4H",
            "confidence": 86,
            "rrRatio": "1:2.0",
            "analysis": "AUD/USD showing bullish reversal with strong support. Smart money accumulation visible.",
            "ictConcepts": ["Smart Money", "Market Structure", "Order Block"]
        },
        {
            "symbol": "SOL/USDT",
            "action": "BUY",
            "entryPrice": 95.00,
            "stopLoss": 90.00,
            "takeProfit": 105.00,
            "timeframe": "4H",
            "confidence": 89,
            "rrRatio": "1:2.0",
            "analysis": "Solana showing strong bullish momentum with institutional buying. Break of structure confirmed.",
            "ictConcepts": ["Break of Structure", "Smart Money", "Volume Analysis"]
        }
    ]
    
    created_signals = []
    
    print(f"📊 Creating {len(test_signals)} test signals...")
    print()
    
    for i, signal_data in enumerate(test_signals, 1):
        print(f"{i}. Creating {signal_data['symbol']} signal...")
        
        # Determine market type
        market_type = "crypto" if "/USDT" in signal_data["symbol"] else "forex"
        
        try:
            # Create signal using admin routes
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
                print(f"   ✅ Signal created successfully")
                created_signals.append(signal_data)
            else:
                print(f"   ❌ Failed: {response.status_code} - {response.text[:100]}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        # Small delay between requests
        time.sleep(1)
    
    # Verify signals were created
    print(f"\n🔍 Verifying created signals...")
    try:
        response = requests.get(f"{API_BASE}/signals/admin", timeout=10)
        if response.status_code == 200:
            admin_data = response.json()
            total_signals = admin_data.get('total', 0)
            signals = admin_data.get('signals', [])
            
            print(f"✅ Total signals in system: {total_signals}")
            
            if total_signals > 0:
                print(f"📋 Available Signals:")
                for signal in signals:
                    print(f"   - {signal.get('symbol')}: {signal.get('action')} (Confidence: {signal.get('confidence')}%)")
            else:
                print("⚠️ No signals found in system")
        else:
            print(f"❌ Failed to verify signals: {response.status_code}")
    except Exception as e:
        print(f"❌ Error verifying signals: {e}")
    
    print(f"\n" + "=" * 60)
    print(f"🎉 Signal Creation Complete!")
    print("=" * 60)
    print(f"✅ Successfully created {len(created_signals)} signals")
    print("")
    print("🌐 System URLs:")
    print(f"   Backend: {RENDER_BASE_URL}")
    print(f"   Frontend: https://frontend-zwwl.onrender.com")
    print("")
    print("📱 Next Steps:")
    print("1. Go to your dashboard: https://frontend-zwwl.onrender.com/dashboard/signals")
    print("2. Refresh the page")
    print("3. Click on 'Signal Feed' tab")
    print("4. You should see all the signals with 'Connected' status!")
    print("")
    print("🔧 If signals don't appear:")
    print("1. Wait 1-2 minutes for Render to process")
    print("2. Try refreshing the page")
    print("3. Check browser console for any errors")
    print("4. The WorkingSignalsFeed component should show 'Connected' status")
    
    return len(created_signals) > 0

if __name__ == "__main__":
    print("Enhanced Signal System - Persistent Signal Creator")
    print("=" * 60)
    
    success = create_persistent_signals()
    
    if success:
        print("\n🎉 Enhanced Signal System is ready!")
        print("Your dashboard should now show the signals with proper connection status.")
    else:
        print("\n⚠️ Some issues occurred, but the system may still be working.")
        print("Please check your dashboard manually.")

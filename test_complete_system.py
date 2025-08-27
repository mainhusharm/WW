#!/usr/bin/env python3
"""
Complete System Test - Real-time Forex Data & SMC Signals
Tests all components to ensure they work together correctly
"""

import requests
import time
import json
from datetime import datetime

def test_system():
    print("🚀 Testing Complete Forex Bot System")
    print("=" * 60)
    
    # Test 1: Backend Health Check
    print("\n1. 🔍 Testing Backend Health Check")
    try:
        response = requests.get("http://localhost:5000/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend health: {data['status']}")
            print(f"📊 Database records: {data['bot_data_count']}")
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend not responding: {e}")
        return False
    
    # Test 2: YFinance Proxy Direct Test
    print("\n2. 🔍 Testing YFinance Proxy Direct")
    try:
        response = requests.get("http://localhost:3001/api/yfinance/price/EUR%2FUSD", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ YFinance proxy: {data['symbol']} = {data['price']}")
        else:
            print(f"❌ YFinance proxy failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ YFinance proxy not responding: {e}")
        return False
    
    # Test 3: Backend YFinance Proxy Route
    print("\n3. 🔍 Testing Backend -> YFinance Proxy")
    major_pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD']
    
    for pair in major_pairs:
        try:
            encoded_pair = pair.replace('/', '%2F')
            response = requests.get(f"http://localhost:5000/api/yfinance/price/{encoded_pair}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {pair}: {data['price']} (via backend)")
            else:
                print(f"❌ {pair} failed: {response.status_code}")
                
        except Exception as e:
            print(f"❌ {pair} error: {e}")
    
    # Test 4: Historical Data
    print("\n4. 🔍 Testing Historical Data")
    try:
        response = requests.get("http://localhost:5000/api/yfinance/historical/EUR%2FUSD/1m", timeout=30)
        if response.status_code == 200:
            data = response.json()
            history_count = len(data.get('history', []))
            print(f"✅ Historical data: {history_count} bars for EUR/USD")
            
            if history_count > 50:
                print("✅ Sufficient data for SMC analysis")
            else:
                print("⚠️ Insufficient data for SMC analysis")
        else:
            print(f"❌ Historical data failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Historical data error: {e}")
    
    # Test 5: Database Storage
    print("\n5. 🔍 Testing Database Storage")
    try:
        # Store some test data
        test_data = {
            'pair': 'EUR/USD',
            'price': 1.1650,
            'bot_type': 'forex',
            'signal_type': 'buy',
            'signal_strength': 0.8
        }
        
        response = requests.post("http://localhost:5000/api/bot/data", json=test_data, timeout=5)
        if response.status_code == 200:
            print("✅ Data storage successful")
        else:
            print(f"❌ Data storage failed: {response.status_code}")
            
        # Retrieve data
        response = requests.get("http://localhost:5000/api/database/bot-data?bot_type=forex&limit=5", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Data retrieval: {len(data)} records")
        else:
            print(f"❌ Data retrieval failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Database test error: {e}")
    
    # Test 6: Price Validation
    print("\n6. 🔍 Testing Price Validation")
    try:
        validation_data = {
            'pair': 'EUR/USD',
            'price': 1.1650,
            'tolerance': 0.001
        }
        
        response = requests.post("http://localhost:5000/api/validate/price", json=validation_data, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Price validation: {data['validated']}")
        else:
            print(f"❌ Price validation failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Price validation error: {e}")
    
    # Test 7: SMC Signal Generation (Mock)
    print("\n7. 🔍 Testing SMC Signal Logic")
    try:
        # Get historical data for signal generation
        response = requests.get("http://localhost:5000/api/yfinance/historical/EUR%2FUSD/1m", timeout=30)
        if response.status_code == 200:
            data = response.json()
            history = data.get('history', [])
            
            if len(history) >= 50:
                signals_generated = 0
                
                # Basic SMC logic test
                for i in range(20, len(history) - 1):
                    current = history[i]
                    previous = history[i - 1]
                    
                    if current and previous:
                        current_close = float(current['close'])
                        previous_close = float(previous['close'])
                        current_high = float(current['high'])
                        current_low = float(current['low'])
                        previous_high = float(previous['high'])
                        previous_low = float(previous['low'])
                        
                        # BOS (Break of Structure) Detection
                        if current_close > previous_high and previous_close < previous_high:
                            # Bullish BOS
                            stop_loss = min(previous_low, current_low) - (current_high - current_low) * 0.5
                            risk = current_close - stop_loss
                            take_profit = current_close + (risk * 2.0)
                            
                            signals_generated += 1
                            print(f"✅ Bullish BOS Signal: Entry={current_close:.5f}, SL={stop_loss:.5f}, TP={take_profit:.5f}")
                            break
                        
                        elif current_close < previous_low and previous_close > previous_low:
                            # Bearish BOS
                            stop_loss = max(previous_high, current_high) + (current_high - current_low) * 0.5
                            risk = stop_loss - current_close
                            take_profit = current_close - (risk * 2.0)
                            
                            signals_generated += 1
                            print(f"✅ Bearish BOS Signal: Entry={current_close:.5f}, SL={stop_loss:.5f}, TP={take_profit:.5f}")
                            break
                
                if signals_generated > 0:
                    print(f"✅ SMC logic working: {signals_generated} signals generated")
                else:
                    print("ℹ️ No signals generated (market conditions)")
            else:
                print("❌ Insufficient data for SMC testing")
                
    except Exception as e:
        print(f"❌ SMC signal test error: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 System Test Complete!")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    test_system()

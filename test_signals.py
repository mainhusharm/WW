#!/usr/bin/env python3
"""
Test script to verify signal flow from admin to user dashboard
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
ADMIN_TOKEN = "test_admin_token"  # Replace with actual admin token

def test_signal_creation():
    """Test creating a signal from admin dashboard"""
    print("🧪 Testing signal creation...")
    
    signal_data = {
        "currencyPair": "EUR/USD",
        "timeframe": "1h",
        "direction": "BUY",
        "entryPrice": 1.0850,
        "stopLoss": 1.0800,
        "takeProfit": [1.0950, 1.1000],
        "confidence": 85,
        "analysis": "Strong bullish momentum with key support at 1.0800",
        "ictConcepts": ["Fair Value Gap", "Order Block"]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/signals",
            json=signal_data,
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        
        if response.status_code == 201:
            print("✅ Signal created successfully!")
            signal = response.json()
            print(f"   Signal ID: {signal['signal']['id']}")
            print(f"   Pair: {signal['signal']['pair']}")
            print(f"   Direction: {signal['signal']['direction']}")
            return signal['signal']['id']
        else:
            print(f"❌ Failed to create signal: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating signal: {str(e)}")
        return None

def test_signal_feed():
    """Test getting signals from user feed"""
    print("\n🧪 Testing signal feed...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/signals/feed")
        
        if response.status_code == 200:
            data = response.json()
            signals = data['signals']
            print(f"✅ Signal feed retrieved successfully!")
            print(f"   Total signals: {len(signals)}")
            
            if signals:
                latest_signal = signals[0]
                print(f"   Latest signal: {latest_signal['pair']} {latest_signal['direction']}")
                print(f"   Entry: {latest_signal['entry']}")
                print(f"   Stop Loss: {latest_signal['stopLoss']}")
                print(f"   Take Profit: {latest_signal['takeProfit']}")
            else:
                print("   No signals available in feed")
                
            return True
        else:
            print(f"❌ Failed to get signal feed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error getting signal feed: {str(e)}")
        return False

def test_forex_news():
    """Test forex news API"""
    print("\n🧪 Testing forex news...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/forex-data/health")
        
        if response.status_code == 200:
            print("✅ Forex data service is healthy!")
            
            # Test news endpoint if available
            news_response = requests.get(f"{BASE_URL}/api/forex-data/")
            if news_response.status_code == 200:
                print("✅ Forex data service endpoints accessible!")
            else:
                print(f"⚠️  Forex data endpoints: {news_response.status_code}")
                
            return True
        else:
            print(f"❌ Forex data service unhealthy: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing forex news: {str(e)}")
        return False

def test_customer_database():
    """Test customer database access"""
    print("\n🧪 Testing customer database...")
    
    try:
        # Test customer service health
        response = requests.get("http://localhost:3005/health")
        
        if response.status_code == 200:
            print("✅ Customer service is healthy!")
            
            # Test database route
            db_response = requests.get("http://localhost:3005/database")
            if db_response.status_code == 200:
                print("✅ Database dashboard accessible!")
            else:
                print(f"⚠️  Database dashboard: {db_response.status_code}")
                
            return True
        else:
            print(f"❌ Customer service unhealthy: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing customer database: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting comprehensive system tests...")
    print("=" * 50)
    
    # Test forex news
    news_ok = test_forex_news()
    
    # Test customer database
    db_ok = test_customer_database()
    
    # Test signal creation
    signal_id = test_signal_creation()
    
    # Test signal feed
    feed_ok = test_signal_feed()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"   Forex News: {'✅ PASS' if news_ok else '❌ FAIL'}")
    print(f"   Customer DB: {'✅ PASS' if db_ok else '❌ FAIL'}")
    print(f"   Signal Creation: {'✅ PASS' if signal_id else '❌ FAIL'}")
    print(f"   Signal Feed: {'✅ PASS' if feed_ok else '❌ FAIL'}")
    
    if all([news_ok, db_ok, signal_id, feed_ok]):
        print("\n🎉 All tests passed! System is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please check the logs above.")
    
    print("\n🔗 Service URLs:")
    print(f"   Main Backend: {BASE_URL}")
    print(f"   Customer Service: http://localhost:3005")
    print(f"   Database Dashboard: http://localhost:3005/database")
    print(f"   Forex Data Service: http://localhost:3004")

if __name__ == "__main__":
    main()

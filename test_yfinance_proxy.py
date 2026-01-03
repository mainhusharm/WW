#!/usr/bin/env python3
"""
Test script to verify yfinance-proxy integration for forex data
"""

import requests
import json
import time

def test_yfinance_proxy_health():
    """Test if yfinance-proxy service is healthy"""
    try:
        response = requests.get('https://yfinance-proxy.onrender.com/health', timeout=10)
        if response.status_code == 200:
            print("✅ yfinance-proxy service is healthy")
            return True
        else:
            print(f"❌ yfinance-proxy service unhealthy: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Failed to connect to yfinance-proxy: {e}")
        return False

def test_forex_data_fetch():
    """Test fetching forex data from yfinance-proxy"""
    try:
        # Test bulk forex data fetch
        symbols = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD']
        
        payload = {
            "symbols": symbols,
            "timeframe": "1m"
        }
        
        response = requests.post(
            'https://yfinance-proxy.onrender.com/api/yfinance/bulk',
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Successfully fetched forex data from yfinance-proxy")
            
            # Check data structure
            success_count = 0
            for symbol in symbols:
                if symbol in data and isinstance(data[symbol], list) and len(data[symbol]) > 0:
                    latest_bar = data[symbol][-1]
                    if 'close' in latest_bar and latest_bar['close']:
                        print(f"  ✅ {symbol}: {latest_bar['close']}")
                        success_count += 1
                    else:
                        print(f"  ⚠️ {symbol}: Missing close price")
                else:
                    print(f"  ❌ {symbol}: No data")
            
            print(f"📊 Data quality: {success_count}/{len(symbols)} symbols have valid data")
            return success_count > 0
        else:
            print(f"❌ Failed to fetch forex data: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing forex data fetch: {e}")
        return False

def test_individual_forex_price():
    """Test fetching individual forex price"""
    try:
        symbol = 'EUR/USD'
        response = requests.get(
            f'https://yfinance-proxy.onrender.com/api/yfinance/price/{symbol}',
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if 'price' in data and data['price']:
                print(f"✅ Individual price fetch successful: {symbol} = {data['price']}")
                return True
            else:
                print(f"❌ Invalid price data for {symbol}")
                return False
        else:
            print(f"❌ Failed to fetch individual price: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing individual price fetch: {e}")
        return False

def test_forex_data_service_fallback():
    """Test the forex-data-service fallback"""
    try:
        response = requests.get(
            'https://forex-data-service.onrender.com/api/forex-news',
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Forex-data-service fallback is accessible")
            return True
        else:
            print(f"❌ Forex-data-service fallback failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing forex-data-service fallback: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing yfinance-proxy integration for forex data...")
    print("=" * 60)
    
    tests = [
        ("Service Health Check", test_yfinance_proxy_health),
        ("Forex Data Fetch", test_forex_data_fetch),
        ("Individual Price Fetch", test_individual_forex_price),
        ("Fallback Service Check", test_forex_data_service_fallback)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🔍 Running: {test_name}")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 60)
    print("📋 Test Results Summary:")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
    
    print(f"\n📊 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! yfinance-proxy integration is working correctly.")
    else:
        print("⚠️ Some tests failed. Check the service configuration.")
    
    return passed == total

if __name__ == "__main__":
    main()

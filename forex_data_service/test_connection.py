#!/usr/bin/env python3
"""
Quick test script to diagnose yfinance connection issues
"""
import yfinance as yf
import requests
import time

def test_basic_connection():
    """Test basic internet connectivity"""
    try:
        response = requests.get('https://httpbin.org/get', timeout=10)
        print(f"✅ Basic internet connection: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Basic internet connection failed: {e}")
        return False

def test_yahoo_finance_direct():
    """Test direct Yahoo Finance connection"""
    try:
        response = requests.get('https://finance.yahoo.com', timeout=10)
        print(f"✅ Yahoo Finance website: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Yahoo Finance website failed: {e}")
        return False

def test_yfinance_simple():
    """Test simple yfinance call"""
    try:
        ticker = yf.Ticker("EURUSD=X")
        data = ticker.history(period="1d", interval="1h")
        if not data.empty:
            print(f"✅ yfinance simple test: Got {len(data)} data points")
            print(f"   Latest price: {data['Close'].iloc[-1]:.5f}")
            return True
        else:
            print("❌ yfinance simple test: No data returned")
            return False
    except Exception as e:
        print(f"❌ yfinance simple test failed: {e}")
        return False

def test_yfinance_bulk():
    """Test yfinance bulk download"""
    try:
        symbols = ["EURUSD=X", "GBPUSD=X"]
        data = yf.download(symbols, period="1d", interval="1h", group_by='ticker', progress=False)
        if not data.empty:
            print(f"✅ yfinance bulk test: Got data for {len(symbols)} symbols")
            return True
        else:
            print("❌ yfinance bulk test: No data returned")
            return False
    except Exception as e:
        print(f"❌ yfinance bulk test failed: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Testing yfinance connectivity...")
    print("=" * 50)
    
    # Run all tests
    tests = [
        ("Basic Internet", test_basic_connection),
        ("Yahoo Finance Site", test_yahoo_finance_direct),
        ("yfinance Simple", test_yfinance_simple),
        ("yfinance Bulk", test_yfinance_bulk)
    ]
    
    results = []
    for name, test_func in tests:
        print(f"\n📋 Testing {name}...")
        result = test_func()
        results.append((name, result))
        time.sleep(1)  # Small delay between tests
    
    print("\n" + "=" * 50)
    print("📊 Test Summary:")
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {name}: {status}")
    
    all_passed = all(result for _, result in results)
    if all_passed:
        print("\n🎉 All tests passed! yfinance should work properly.")
    else:
        print("\n⚠️  Some tests failed. Check network connectivity or firewall settings.")

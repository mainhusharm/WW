#!/usr/bin/env python3
"""
Comprehensive test script for the trading journal application
Tests all major functionality including signals, payments, forex news, and customer database
"""

import requests
import json
import time
from datetime import datetime

def test_forex_news_api():
    """Test forex news API with RapidAPI"""
    print("\n🧪 Testing forex news API...")
    
    try:
        # Test the RapidAPI endpoint directly
        rapidapi_url = "https://forex-factory-scraper1.p.rapidapi.com/get_calendar_details"
        headers = {
            "x-rapidapi-host": "forex-factory-scraper1.p.rapidapi.com",
            "x-rapidapi-key": "68dc9d220amsh35ccd500e6b2ff1p13e4e9jsn989df0c5acd2"
        }
        params = {
            "year": 2024,
            "month": 12,
            "day": 16,
            "currency": "ALL",
            "event_name": "ALL",
            "timezone": "GMT-06:00 Central Time (US & Canada)",
            "time_format": "12h"
        }
        
        response = requests.get(rapidapi_url, headers=headers, params=params)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                print(f"     ✅ PASS: RapidAPI returned {len(data)} news events")
                print(f"        Sample event: {data[0].get('title', 'No title')[:50]}...")
                return True
            else:
                print(f"     ⚠️  WARNING: RapidAPI returned empty or invalid data")
                print(f"        Response type: {type(data)}")
                print(f"        Response length: {len(data) if isinstance(data, list) else 'N/A'}")
                return False
        else:
            print(f"     ❌ FAIL: RapidAPI request failed with status {response.status_code}")
            print(f"        Response: {response.text[:200]}...")
            return False
            
    except Exception as e:
        print(f"     ❌ ERROR: {str(e)}")
        return False

def test_customer_database():
    """Test customer database functionality"""
    print("\n🧪 Testing customer database...")
    
    try:
        # Test customer service health
        response = requests.get('http://localhost:3005/health', timeout=5)
        if response.status_code == 200:
            print("     ✅ PASS: Customer service is running")
        else:
            print(f"     ❌ FAIL: Customer service health check failed with status {response.status_code}")
            return False
            
        # Test database dashboard route
        response = requests.get('http://localhost:3005/database', timeout=5)
        if response.status_code == 200:
            print("     ✅ PASS: Database dashboard route is accessible")
        else:
            print(f"     ❌ FAIL: Database dashboard route failed with status {response.status_code}")
            return False
            
        # Test customer service route
        response = requests.get('http://localhost:3005/customer-service', timeout=5)
        if response.status_code == 200:
            print("     ✅ PASS: Customer service route is accessible")
        else:
            print(f"     ❌ FAIL: Customer service route failed with status {response.status_code}")
            return False
            
        return True
        
    except requests.exceptions.ConnectionError:
        print("     ❌ FAIL: Customer service is not running on port 3005")
        return False
    except Exception as e:
        print(f"     ❌ ERROR: {str(e)}")
        return False

def test_signal_creation():
    """Test signal creation in admin dashboard"""
    print("\n🧪 Testing signal creation...")
    
    try:
        # Test signal creation endpoint
        signal_data = {
            'currencyPair': 'EURUSD',
            'timeframe': '15m',
            'direction': 'BUY',
            'entryPrice': '1.08500',
            'stopLoss': '1.08300',
            'takeProfit': '1.08700, 1.08900, 1.09100',
            'confidence': 90,
            'analysis': 'Test signal for system verification',
            'ictConcepts': ['Order Block', 'Fair Value Gap']
        }
        
        response = requests.post('http://localhost:5000/api/signals', 
                               json=signal_data, timeout=10)
        
        if response.status_code == 201:
            print("     ✅ PASS: Signal created successfully")
            signal_response = response.json()
            print(f"        Signal ID: {signal_response.get('signal', {}).get('id', 'N/A')}")
            return True
        else:
            print(f"     ❌ FAIL: Signal creation failed with status {response.status_code}")
            print(f"        Response: {response.text[:200]}...")
            return False
            
    except requests.exceptions.ConnectionError:
        print("     ❌ FAIL: Main backend is not running on port 5000")
        return False
    except Exception as e:
        print(f"     ❌ ERROR: {str(e)}")
        return False

def test_signal_feed():
    """Test signal feed for users"""
    print("\n🧪 Testing signal feed...")
    
    try:
        # Test signal feed endpoint
        response = requests.get('http://localhost:5000/api/signal-feed/signals/feed', timeout=10)
        
        if response.status_code == 200:
            feed_data = response.json()
            signals = feed_data.get('signals', [])
            print(f"     ✅ PASS: Signal feed accessible with {len(signals)} signals")
            if signals:
                print(f"        Latest signal: {signals[0].get('pair', 'N/A')} {signals[0].get('direction', 'N/A')}")
            return True
        else:
            print(f"     ❌ FAIL: Signal feed failed with status {response.status_code}")
            print(f"        Response: {response.text[:200]}...")
            return False
            
    except requests.exceptions.ConnectionError:
        print("     ❌ FAIL: Main backend is not running on port 5000")
        return False
    except Exception as e:
        print(f"     ❌ ERROR: {str(e)}")
        return False

def test_payment_coupons():
    """Test payment coupon system"""
    print("\n🧪 Testing payment coupons...")
    
    try:
        # Test TRADERFREE coupon
        coupon_data = {
            'coupon_code': 'TRADERFREE',
            'plan_id': 'pro',
            'original_price': 199.00
        }
        
        response = requests.post('http://localhost:5000/api/payment/validate-coupon', 
                               json=coupon_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('valid') and data.get('final_price') == 0.00:
                print("     ✅ PASS: TRADERFREE coupon sets price to $0.00")
            else:
                print(f"     ❌ FAIL: TRADERFREE coupon validation failed")
                print(f"        Response: {data}")
                return False
        else:
            print(f"     ❌ FAIL: TRADERFREE coupon validation failed with status {response.status_code}")
            return False
            
        # Test INTERNAL_DEV_OVERRIDE_2024 coupon
        coupon_data = {
            'coupon_code': 'INTERNAL_DEV_OVERRIDE_2024',
            'plan_id': 'pro',
            'original_price': 199.00
        }
        
        response = requests.post('http://localhost:5000/api/payment/validate-coupon', 
                               json=coupon_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('valid') and data.get('final_price') == 0.10:
                print("     ✅ PASS: INTERNAL_DEV_OVERRIDE_2024 coupon sets price to $0.10")
            else:
                print(f"     ❌ FAIL: INTERNAL_DEV_OVERRIDE_2024 coupon validation failed")
                print(f"        Response: {data}")
                return False
        else:
            print(f"     ❌ FAIL: INTERNAL_DEV_OVERRIDE_2024 coupon validation failed with status {response.status_code}")
            return False
            
        return True
        
    except requests.exceptions.ConnectionError:
        print("     ❌ FAIL: Main backend is not running on port 5000")
        return False
    except Exception as e:
        print(f"     ❌ ERROR: {str(e)}")
        return False

def test_forex_data_service():
    """Test forex data service"""
    print("\n🧪 Testing forex data service...")
    
    try:
        # Test health check
        response = requests.get('http://localhost:3004/health', timeout=5)
        if response.status_code == 200:
            print("     ✅ PASS: Forex data service is running")
        else:
            print(f"     ❌ FAIL: Forex data service health check failed with status {response.status_code}")
            return False
            
        # Test forex news endpoint
        response = requests.get('http://localhost:3004/api/forex-news', timeout=10)
        if response.status_code == 200:
            news_data = response.json()
            if isinstance(news_data, list):
                print(f"     ✅ PASS: Forex news endpoint accessible with {len(news_data)} news items")
                return True
            else:
                print(f"     ❌ FAIL: Forex news endpoint returned invalid data format")
                return False
        else:
            print(f"     ❌ FAIL: Forex news endpoint failed with status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("     ❌ FAIL: Forex data service is not running on port 3004")
        return False
    except Exception as e:
        print(f"     ❌ ERROR: {str(e)}")
        return False

def main():
    """Run all comprehensive tests"""
    print("🚀 Starting comprehensive system tests...")
    print("=" * 50)
    
    test_results = []
    
    # Test forex news API
    test_results.append(('Forex News API', test_forex_news_api()))
    
    # Test customer database
    test_results.append(('Customer Database', test_customer_database()))
    
    # Test signal creation
    test_results.append(('Signal Creation', test_signal_creation()))
    
    # Test signal feed
    test_results.append(('Signal Feed', test_signal_feed()))
    
    # Test payment coupons
    test_results.append(('Payment Coupons', test_payment_coupons()))
    
    # Test forex data service
    test_results.append(('Forex Data Service', test_forex_data_service()))
    
    # Print results summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! System is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the logs above.")
    
    print("\n🔗 Service URLs:")
    print("   Main Backend: http://localhost:5000")
    print("   Customer Service: http://localhost:3005")
    print("   Database Dashboard: http://localhost:3005/database")
    print("   Customer Service: http://localhost:3005/customer-service")
    print("   Forex Data Service: http://localhost:3004")
    
    return passed == total

if __name__ == "__main__":
    main()

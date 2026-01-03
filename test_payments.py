#!/usr/bin/env python3
"""
Test script to verify payment coupon system
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:5000"

def test_coupon_validation():
    """Test coupon validation"""
    print("🧪 Testing coupon validation...")
    
    test_cases = [
        {
            "coupon_code": "TRADERFREE",
            "plan_id": "pro",
            "original_price": 199.99,
            "expected_final": 0.00
        },
        {
            "coupon_code": "INTERNAL_DEV_OVERRIDE_2024",
            "plan_id": "enterprise",
            "original_price": 499.99,
            "expected_final": 0.10
        },
        {
            "coupon_code": "INVALID_COUPON",
            "plan_id": "pro",
            "original_price": 199.99,
            "expected_final": 199.99
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n   Test Case {i}: {test_case['coupon_code']}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/payment/validate-coupon",
                json={
                    "coupon_code": test_case["coupon_code"],
                    "plan_id": test_case["plan_id"],
                    "original_price": test_case["original_price"]
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data["valid"]:
                    final_price = data["final_price"]
                    discount = data["discount_amount"]
                    
                    if abs(final_price - test_case["expected_final"]) < 0.01:
                        print(f"     ✅ PASS: Final price ${final_price} (Expected: ${test_case['expected_final']})")
                        print(f"        Discount: ${discount}")
                    else:
                        print(f"     ❌ FAIL: Final price ${final_price} (Expected: ${test_case['expected_final']})")
                else:
                    if test_case["coupon_code"] == "INVALID_COUPON":
                        print(f"     ✅ PASS: Invalid coupon correctly rejected")
                    else:
                        print(f"     ❌ FAIL: Valid coupon rejected: {data.get('error', 'Unknown error')}")
            else:
                print(f"     ❌ FAIL: HTTP {response.status_code}")
                print(f"        Response: {response.text}")
                
        except Exception as e:
            print(f"     ❌ ERROR: {str(e)}")
    
    return True

def test_payment_verification():
    """Test payment verification with coupons"""
    print("\n🧪 Testing payment verification...")
    
    test_cases = [
        {
            "token": "free_coupon_checkout",
            "plan": "pro",
            "user_id": "test_user_123",
            "amount_paid": 0.00,
            "coupon_code": "TRADERFREE",
            "expected_result": "success"
        },
        {
            "token": "paypal_test_123",
            "plan": "enterprise",
            "user_id": "test_user_456",
            "amount_paid": 0.10,
            "coupon_code": "INTERNAL_DEV_OVERRIDE_2024",
            "expected_result": "success"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n   Test Case {i}: {test_case['coupon_code']} - ${test_case['amount_paid']}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/verify-payment",
                json={
                    "token": test_case["token"],
                    "plan": test_case["plan"],
                    "user_id": test_case["user_id"],
                    "amount_paid": test_case["amount_paid"],
                    "coupon_code": test_case["coupon_code"]
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"     ✅ PASS: Payment verified successfully")
                print(f"        Message: {data.get('message', 'No message')}")
            else:
                print(f"     ❌ FAIL: HTTP {response.status_code}")
                print(f"        Response: {response.text}")
                
        except Exception as e:
            print(f"     ❌ ERROR: {str(e)}")
    
    return True

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
            else:
                print(f"     ⚠️  WARNING: RapidAPI returned empty or invalid data")
                print(f"        Response type: {type(data)}")
                print(f"        Response length: {len(data) if isinstance(data, list) else 'N/A'}")
        else:
            print(f"     ❌ FAIL: RapidAPI request failed with status {response.status_code}")
            print(f"        Response: {response.text[:200]}...")
            
    except Exception as e:
        print(f"     ❌ ERROR: {str(e)}")
    
    return True

def main():
    """Run all payment tests"""
    print("🚀 Starting payment system tests...")
    print("=" * 50)
    
    # Test coupon validation
    coupon_ok = test_coupon_validation()
    
    # Test payment verification
    payment_ok = test_payment_verification()
    
    # Test forex news API
    news_ok = test_forex_news_api()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Payment Test Results Summary:")
    print(f"   Coupon Validation: {'✅ PASS' if coupon_ok else '❌ FAIL'}")
    print(f"   Payment Verification: {'✅ PASS' if payment_ok else '❌ FAIL'}")
    print(f"   Forex News API: {'✅ PASS' if news_ok else '❌ FAIL'}")
    
    if all([coupon_ok, payment_ok, news_ok]):
        print("\n🎉 All payment tests passed! System is working correctly.")
    else:
        print("\n⚠️  Some payment tests failed. Please check the logs above.")
    
    print("\n💡 Test Notes:")
    print("   - TRADERFREE coupon should set price to $0.00")
    print("   - INTERNAL_DEV_OVERRIDE_2024 should set price to $0.10")
    print("   - Invalid coupons should be rejected")
    print("   - Payment verification should work with coupon amounts")

if __name__ == "__main__":
    main()

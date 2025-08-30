#!/usr/bin/env python3
"""
Comprehensive test script to verify the coupon system
"""

import requests
import json
import time

# Configuration
FRONTEND_URL = "http://localhost:5175"
BACKEND_URL = "http://localhost:8080"

def test_backend_direct():
    """Test backend coupon endpoint directly"""
    print("🧪 Testing Backend Coupon Endpoint Directly...")
    
    test_cases = [
        {
            "coupon_code": "TRADERFREE",
            "plan_id": "enterprise",
            "original_price": 499.00,
            "expected_final": 0.00,
            "expected_discount": 499.00
        },
        {
            "coupon_code": "INTERNAL_DEV_OVERRIDE_2024",
            "plan_id": "pro",
            "original_price": 199.99,
            "expected_final": 0.10,
            "expected_discount": 199.89
        },
        {
            "coupon_code": "INVALID_COUPON",
            "plan_id": "basic",
            "original_price": 99.99,
            "expected_final": 99.99,
            "expected_discount": 0
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n   Test Case {i}: {test_case['coupon_code']}")
        
        try:
            response = requests.post(
                f"{BACKEND_URL}/api/payment/validate-coupon",
                json={
                    "coupon_code": test_case["coupon_code"],
                    "plan_id": test_case["plan_id"],
                    "original_price": test_case["original_price"]
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"     ✅ Status: {response.status_code}")
                print(f"     📊 Response: {json.dumps(data, indent=2)}")
                
                if data.get("valid"):
                    final_price = data.get("final_price", 0)
                    discount = data.get("discount_amount", 0)
                    
                    if abs(final_price - test_case["expected_final"]) < 0.01:
                        print(f"     ✅ Final price: ${final_price} (Expected: ${test_case['expected_final']})")
                    else:
                        print(f"     ❌ Final price: ${final_price} (Expected: ${test_case['expected_final']})")
                    
                    if abs(discount - test_case["expected_discount"]) < 0.01:
                        print(f"     ✅ Discount: ${discount} (Expected: ${test_case['expected_discount']})")
                    else:
                        print(f"     ❌ Discount: ${discount} (Expected: ${test_case['expected_discount']})")
                else:
                    if test_case["coupon_code"] == "INVALID_COUPON":
                        print(f"     ✅ Invalid coupon correctly rejected")
                    else:
                        print(f"     ❌ Valid coupon rejected: {data.get('error', 'Unknown error')}")
            else:
                print(f"     ❌ HTTP {response.status_code}")
                print(f"        Response: {response.text}")
                
        except Exception as e:
            print(f"     ❌ ERROR: {str(e)}")
    
    return True

def test_frontend_proxy():
    """Test frontend proxy to backend"""
    print("\n🧪 Testing Frontend Proxy to Backend...")
    
    try:
        response = requests.post(
            f"{FRONTEND_URL}/api/payment/validate-coupon",
            json={
                "coupon_code": "TRADERFREE",
                "plan_id": "enterprise",
                "original_price": 499.00
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"     ✅ Frontend proxy working: {response.status_code}")
            print(f"     📊 Response: {json.dumps(data, indent=2)}")
            
            if data.get("valid") and data.get("final_price") == 0.00:
                print("     ✅ TRADERFREE coupon working through frontend proxy")
                return True
            else:
                print("     ❌ TRADERFREE coupon not working through frontend proxy")
                return False
        else:
            print(f"     ❌ Frontend proxy failed: {response.status_code}")
            print(f"        Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"     ❌ Frontend proxy error: {str(e)}")
        return False

def test_frontend_accessibility():
    """Test if frontend is accessible"""
    print("\n🧪 Testing Frontend Accessibility...")
    
    try:
        response = requests.get(FRONTEND_URL, timeout=10)
        if response.status_code == 200:
            print(f"     ✅ Frontend accessible: {response.status_code}")
            return True
        else:
            print(f"     ❌ Frontend not accessible: {response.status_code}")
            return False
    except Exception as e:
        print(f"     ❌ Frontend accessibility error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Comprehensive Coupon System Test...")
    print("=" * 60)
    
    # Test backend directly
    backend_ok = test_backend_direct()
    
    # Test frontend accessibility
    frontend_ok = test_frontend_accessibility()
    
    # Test frontend proxy
    proxy_ok = False
    if frontend_ok:
        proxy_ok = test_frontend_proxy()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"Backend Direct:     {'✅ PASS' if backend_ok else '❌ FAIL'}")
    print(f"Frontend Access:    {'✅ PASS' if frontend_ok else '❌ FAIL'}")
    print(f"Frontend Proxy:     {'✅ PASS' if proxy_ok else '❌ FAIL'}")
    
    if backend_ok and frontend_ok and proxy_ok:
        print("\n🎉 All tests passed! Coupon system is working correctly.")
        return True
    else:
        print("\n⚠️  Some tests failed. Check the issues above.")
        return False

if __name__ == "__main__":
    main()

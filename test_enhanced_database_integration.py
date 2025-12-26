#!/usr/bin/env python3
"""
Test Enhanced Database Integration
This script tests the complete flow from signup to questionnaire with PostgreSQL
"""

import requests
import json
import time
import os
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
TEST_USER_EMAIL = f"test_{int(time.time())}@traderedgepro.com"

def print_step(step, message):
    """Print formatted step message"""
    print(f"\n{'='*60}")
    print(f"Step {step}: {message}")
    print('='*60)

def test_health_endpoint():
    """Test the health endpoint"""
    print_step(1, "Testing Enhanced Health Endpoint")
    
    try:
        response = requests.get(f"{BASE_URL}/api/working/health", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Health endpoint working")
            print(f"   Status: {data.get('status')}")
            print(f"   Message: {data.get('message')}")
            print(f"   Database: {data.get('database_type')}")
            print(f"   Tables: {data.get('tables')}")
            print(f"   Record counts: {data.get('record_counts')}")
            return True
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
        return False

def test_enhanced_registration():
    """Test the enhanced registration endpoint"""
    print_step(2, "Testing Enhanced User Registration")
    
    registration_data = {
        "firstName": "John",
        "lastName": "Doe", 
        "email": TEST_USER_EMAIL,
        "phone": "+1234567890",
        "password": "SecurePassword123!",
        "company": "Test Trading LLC",
        "country": "US",
        "terms": True,
        "newsletter": True
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/working/register",
            json=registration_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        if response.status_code == 201:
            data = response.json()
            print("✅ Enhanced registration successful")
            print(f"   User ID: {data.get('user_id')}")
            print(f"   Access Token: {data.get('access_token')[:20]}...")
            print(f"   User Data: {data.get('user', {}).get('first_name')} {data.get('user', {}).get('last_name')}")
            return data
        else:
            print(f"❌ Enhanced registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Enhanced registration error: {e}")
        return None

def test_enhanced_payment(user_data):
    """Test the enhanced payment endpoint"""
    print_step(3, "Testing Enhanced Payment Processing")
    
    payment_data = {
        "user_id": user_data.get('user_id'),
        "payment": {
            "method": "cryptomus",
            "amount": 199.99,
            "currency": "USD",
            "cryptocurrency": "USDT",
            "network": "tron",
            "plan": "Premium Trading Plan"
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/working/payment",
            json=payment_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        if response.status_code == 201:
            data = response.json()
            print("✅ Enhanced payment successful")
            print(f"   Payment ID: {data.get('payment_id')}")
            print(f"   Transaction ID: {data.get('transaction_id')}")
            print(f"   Amount: ${data.get('amount')} {data.get('currency')}")
            print(f"   Method: {data.get('method')}")
            print(f"   Cryptocurrency: {data.get('cryptocurrency')}")
            print(f"   Network: {data.get('network')}")
            return data
        else:
            print(f"❌ Enhanced payment failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Enhanced payment error: {e}")
        return None

def test_enhanced_questionnaire(user_data):
    """Test the enhanced questionnaire endpoint"""
    print_step(4, "Testing Enhanced Questionnaire")
    
    questionnaire_data = {
        "user_id": user_data.get('user_id'),
        "questionnaire": {
            "propFirm": "FTMO",
            "accountType": "Challenge",
            "challengeStep": "Step 1",
            "accountSize": 100000,
            "riskPerTrade": 2.0,
            "riskRewardRatio": "1:2",
            "cryptoAssets": ["BTC", "ETH", "USDT"],
            "forexPairs": ["EURUSD", "GBPUSD", "USDJPY"],
            "accountNumber": "FTMO123456"
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/working/questionnaire",
            json=questionnaire_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {user_data.get('access_token')}"
            },
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Enhanced questionnaire successful")
            print(f"   Response ID: {data.get('response_id')}")
            print(f"   Prop Firm: {data.get('data', {}).get('prop_firm')}")
            print(f"   Account Type: {data.get('data', {}).get('account_type')}")
            print(f"   Account Size: ${data.get('data', {}).get('account_size'):,}")
            print(f"   Risk per Trade: {data.get('data', {}).get('risk_per_trade')}%")
            print(f"   Crypto Assets: {len(data.get('data', {}).get('crypto_assets', []))} selected")
            print(f"   Forex Pairs: {len(data.get('data', {}).get('forex_pairs', []))} selected")
            return data
        else:
            print(f"❌ Enhanced questionnaire failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Enhanced questionnaire error: {e}")
        return None

def test_enhanced_dashboard_data(user_data):
    """Test the enhanced dashboard data endpoint"""
    print_step(5, "Testing Enhanced Dashboard Data")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/working/dashboard-data",
            headers={"Authorization": f"Bearer {user_data.get('access_token')}"},
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Enhanced dashboard data successful")
            
            user_profile = data.get('user_profile', {})
            payment_info = data.get('payment_info', {})
            trading_profile = data.get('trading_profile', {})
            
            print(f"   User: {user_profile.get('first_name')} {user_profile.get('last_name')}")
            print(f"   Email: {user_profile.get('email')}")
            print(f"   Phone: {user_profile.get('phone')}")
            print(f"   Country: {user_profile.get('country')}")
            print(f"   Payment: ${payment_info.get('amount')} via {payment_info.get('method')}")
            print(f"   Prop Firm: {trading_profile.get('prop_firm')}")
            print(f"   Account Size: ${trading_profile.get('account_size'):,}")
            print(f"   Crypto Assets: {len(trading_profile.get('crypto_assets', []))}")
            print(f"   Forex Pairs: {len(trading_profile.get('forex_pairs', []))}")
            return data
        else:
            print(f"❌ Enhanced dashboard data failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Enhanced dashboard data error: {e}")
        return None

def test_cors_functionality():
    """Test CORS functionality"""
    print_step(6, "Testing CORS Functionality")
    
    try:
        # Test preflight request
        response = requests.options(
            f"{BASE_URL}/api/working/health",
            headers={
                "Origin": "https://www.traderedgepro.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type,Authorization"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ CORS preflight working")
            print(f"   Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin')}")
            print(f"   Access-Control-Allow-Methods: {response.headers.get('Access-Control-Allow-Methods')}")
            print(f"   Access-Control-Allow-Headers: {response.headers.get('Access-Control-Allow-Headers')}")
            return True
        else:
            print(f"❌ CORS preflight failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ CORS test error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Enhanced Database Integration Tests")
    print(f"   Base URL: {BASE_URL}")
    print(f"   Test Email: {TEST_USER_EMAIL}")
    print(f"   Timestamp: {datetime.now().isoformat()}")
    
    results = []
    
    # Test 1: Health endpoint
    results.append(test_health_endpoint())
    
    # Test 2: Enhanced registration
    user_data = test_enhanced_registration()
    results.append(user_data is not None)
    
    if user_data:
        # Test 3: Enhanced payment
        payment_data = test_enhanced_payment(user_data)
        results.append(payment_data is not None)
        
        # Test 4: Enhanced questionnaire
        questionnaire_data = test_enhanced_questionnaire(user_data)
        results.append(questionnaire_data is not None)
        
        # Test 5: Enhanced dashboard data
        dashboard_data = test_enhanced_dashboard_data(user_data)
        results.append(dashboard_data is not None)
    else:
        results.extend([False, False, False])
    
    # Test 6: CORS functionality
    results.append(test_cors_functionality())
    
    # Summary
    print_step("SUMMARY", "Test Results")
    passed = sum(results)
    total = len(results)
    
    test_names = [
        "Health Endpoint",
        "Enhanced Registration", 
        "Enhanced Payment",
        "Enhanced Questionnaire",
        "Enhanced Dashboard Data",
        "CORS Functionality"
    ]
    
    for i, (test_name, result) in enumerate(zip(test_names, results)):
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"   {i+1}. {test_name}: {status}")
    
    print(f"\n🎯 Overall Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Enhanced database integration is working correctly.")
        print("\n📝 Next Steps:")
        print("1. Deploy the enhanced Flask app to your production server")
        print("2. Update your PostgreSQL DATABASE_URL environment variable")
        print("3. Run the enhanced database schema on your production database")
        print("4. Update your frontend to use the enhanced API endpoints")
        print("5. Test with real form submissions on your live site")
    else:
        print("⚠️  Some tests failed. Please check the logs above and:")
        print("1. Ensure PostgreSQL is running and accessible")
        print("2. Check that all required Python packages are installed")
        print("3. Verify the DATABASE_URL environment variable")
        print("4. Check server logs for detailed error messages")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

#!/usr/bin/env python3
"""
Flask Routes Test Script
Tests the enhanced Flask routes with real database
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"  # Change this to your server URL
TEST_EMAIL = f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com"

def test_health_endpoint():
    """Test the enhanced health endpoint"""
    print("🔍 Testing enhanced health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/enhanced/health", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Health endpoint working!")
            print(f"   Status: {data.get('status')}")
            print(f"   Database: {data.get('database')}")
            print(f"   Schema: {data.get('schema')}")
            if 'counts' in data:
                counts = data['counts']
                print(f"   Users: {counts.get('users', 0)}")
                print(f"   Payments: {counts.get('payments', 0)}")
                print(f"   Questionnaires: {counts.get('questionnaires', 0)}")
            return True
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
        return False

def test_enhanced_registration():
    """Test enhanced user registration"""
    print("\n🔍 Testing enhanced registration...")
    
    registration_data = {
        "email": TEST_EMAIL,
        "password": "testpassword123",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+1234567890",
        "company": "Test Company",
        "country": "USA",
        "agree_to_terms": True,
        "agree_to_marketing": False,
        "privacy_policy_accepted": True,
        "referral_source": "test"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/enhanced/register",
            json=registration_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            print("✅ Registration successful!")
            print(f"   User ID: {data['user']['id']}")
            print(f"   Email: {data['user']['email']}")
            print(f"   Name: {data['user']['full_name']}")
            print(f"   Token received: {'access_token' in data}")
            
            return {
                'success': True,
                'user_id': data['user']['id'],
                'access_token': data.get('access_token')
            }
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return {'success': False}
            
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return {'success': False}

def test_enhanced_payment(user_id):
    """Test enhanced payment processing"""
    print("\n🔍 Testing enhanced payment...")
    
    payment_data = {
        "user_id": user_id,
        "plan_type": "pro",
        "plan_name": "Pro Plan",
        "payment_method": "stripe",
        "payment_provider": "stripe",
        "original_price": 199.00,
        "final_price": 179.10,
        "currency": "USD",
        "coupon_code": "SAVE10",
        "coupon_applied": True,
        "coupon_message": "10% discount applied",
        "payment_status": "completed",
        "transaction_id": f"test_txn_{int(time.time())}",
        "billing_country": "USA",
        "billing_city": "New York"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/enhanced/payment",
            json=payment_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            print("✅ Payment processing successful!")
            print(f"   Payment ID: {data.get('payment_id')}")
            print(f"   Transaction ID: {data.get('transaction_id')}")
            print(f"   Status: {data.get('status')}")
            return True
        else:
            print(f"❌ Payment processing failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Payment processing error: {e}")
        return False

def test_enhanced_questionnaire(access_token):
    """Test enhanced questionnaire"""
    print("\n🔍 Testing enhanced questionnaire...")
    
    questionnaire_data = {
        "trades_per_day": "3-5",
        "trading_session": "us",
        "preferred_trading_hours": "9:30-16:00 EST",
        "crypto_assets": ["BTC", "ETH", "ADA"],
        "forex_assets": ["EURUSD", "GBPUSD", "USDJPY"],
        "custom_forex_pairs": ["AUDCAD"],
        "has_account": "yes",
        "account_equity": 50000,
        "prop_firm": "FTMO",
        "account_type": "Pro",
        "account_size": 100000,
        "account_number": "TEST123456",
        "account_currency": "USD",
        "broker_name": "Test Broker",
        "broker_platform": "MetaTrader 5",
        "risk_percentage": 2.0,
        "risk_reward_ratio": "3",
        "max_daily_loss_percentage": 5.0,
        "max_weekly_loss_percentage": 10.0,
        "max_monthly_loss_percentage": 15.0,
        "trading_experience": "intermediate",
        "trading_goals": "Consistent profits and risk management",
        "trading_style": "swing",
        "preferred_markets": ["forex", "crypto"],
        "risk_tolerance": "medium",
        "volatility_tolerance": "medium",
        "drawdown_tolerance": "low",
        "emotional_control": "good",
        "discipline_level": "high",
        "stress_management": "good",
        "additional_notes": "Test questionnaire submission",
        "marketing_consent": False,
        "terms_accepted": True,
        "privacy_policy_accepted": True,
        "completion_percentage": 100.0,
        "is_completed": True
    }
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/enhanced/questionnaire",
            json=questionnaire_data,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Questionnaire submission successful!")
            print(f"   Questionnaire ID: {data.get('questionnaire_id')}")
            print(f"   Milestone Access Level: {data.get('milestone_access_level')}")
            return True
        else:
            print(f"❌ Questionnaire submission failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Questionnaire submission error: {e}")
        return False

def test_enhanced_dashboard_data(access_token):
    """Test enhanced dashboard data retrieval"""
    print("\n🔍 Testing enhanced dashboard data...")
    
    try:
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.get(
            f"{BASE_URL}/api/enhanced/dashboard-data",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Dashboard data retrieval successful!")
            print(f"   Account Balance: ${data.get('account_balance', 0)}")
            print(f"   Total PnL: ${data.get('total_pnl', 0)}")
            print(f"   Win Rate: {data.get('win_rate', 0)}%")
            print(f"   Signals Taken: {data.get('signals_taken', 0)}")
            print(f"   Milestone Access: Level {data.get('milestone_access_level', 1)}")
            return True
        else:
            print(f"❌ Dashboard data retrieval failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Dashboard data retrieval error: {e}")
        return False

def test_old_routes_comparison():
    """Test old routes for comparison"""
    print("\n🔍 Testing old routes for comparison...")
    
    try:
        # Test old health endpoint
        response = requests.get(f"{BASE_URL}/api/user/health", timeout=5)
        if response.status_code == 200:
            print("✅ Old health endpoint still working")
        else:
            print("⚠️  Old health endpoint not responding")
    except:
        print("⚠️  Old health endpoint not accessible")
    
    try:
        # Test old registration endpoint
        old_registration_data = {
            "email": f"old_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
            "password": "testpassword123",
            "first_name": "Old",
            "last_name": "Test"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/user/register",
            json=old_registration_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        if response.status_code in [200, 201]:
            print("✅ Old registration endpoint still working")
        else:
            print("⚠️  Old registration endpoint issues")
    except:
        print("⚠️  Old registration endpoint not accessible")

def main():
    """Run all Flask route tests"""
    print("🧪 Starting Enhanced Flask Routes Tests")
    print("=" * 60)
    
    tests_passed = 0
    total_tests = 5
    
    # Test 1: Health endpoint
    if test_health_endpoint():
        tests_passed += 1
    
    # Test 2: Registration
    registration_result = test_enhanced_registration()
    if registration_result['success']:
        tests_passed += 1
        user_id = registration_result['user_id']
        access_token = registration_result['access_token']
        
        # Test 3: Payment (only if registration succeeded)
        if test_enhanced_payment(user_id):
            tests_passed += 1
        
        # Test 4: Questionnaire (only if registration succeeded)
        if access_token and test_enhanced_questionnaire(access_token):
            tests_passed += 1
        
        # Test 5: Dashboard data (only if registration succeeded)
        if access_token and test_enhanced_dashboard_data(access_token):
            tests_passed += 1
    
    # Comparison test (not counted in main tests)
    test_old_routes_comparison()
    
    print("\n" + "=" * 60)
    print(f"🧪 Test Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All enhanced routes working perfectly!")
        print("✅ Your enhanced database system is ready for production!")
        return True
    else:
        print("⚠️  Some route tests failed. Please check the issues above.")
        print("💡 Make sure your Flask app is running and database is migrated.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

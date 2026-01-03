#!/usr/bin/env python3
"""
Test Working Database Routes
Tests the exact working method extracted from database done copy
"""

import requests
import json
import time
from datetime import datetime
import sys

# Configuration
BASE_URL = "http://localhost:5000"
TEST_EMAIL = f"test_working_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com"

def test_working_health():
    """Test the working health endpoint"""
    print("🔍 Testing working health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/working/health", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Working health endpoint success!")
            print(f"   Status: {data.get('status')}")
            print(f"   Database: {data.get('database')}")
            print(f"   Database Type: {data.get('database_type')}")
            print(f"   Tables: {data.get('tables')}")
            print(f"   Users: {data.get('users')}")
            return True
        else:
            print(f"❌ Working health endpoint failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Working health endpoint error: {e}")
        return False

def test_working_registration():
    """Test working user registration"""
    print("\n🔍 Testing working registration...")
    
    registration_data = {
        "email": TEST_EMAIL,
        "password": "testpassword123",
        "username": "testuser",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+1234567890",
        "company": "Test Company",
        "country": "USA"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/working/register",
            json=registration_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            print("✅ Working registration successful!")
            print(f"   User ID: {data.get('user_id')}")
            print(f"   Email: {data['user']['email']}")
            print(f"   Name: {data['user']['full_name']}")
            print(f"   Token: {data.get('access_token')[:20]}...")
            
            return {
                'success': True,
                'user_id': data.get('user_id'),
                'access_token': data.get('access_token')
            }
        else:
            print(f"❌ Working registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return {'success': False}
            
    except Exception as e:
        print(f"❌ Working registration error: {e}")
        return {'success': False}

def test_working_payment(user_id):
    """Test working payment processing"""
    print("\n🔍 Testing working payment...")
    
    payment_data = {
        "user_id": user_id,
        "amount": 199.99,
        "payment_method": "stripe",
        "transaction_id": f"test_txn_{int(time.time())}"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/working/payment",
            json=payment_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            print("✅ Working payment successful!")
            print(f"   Transaction ID: {data.get('transaction_id')}")
            print(f"   Status: {data.get('status')}")
            return True
        else:
            print(f"❌ Working payment failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Working payment error: {e}")
        return False

def test_working_questionnaire(access_token):
    """Test working questionnaire"""
    print("\n🔍 Testing working questionnaire...")
    
    questionnaire_data = {
        "prop_firm": "FTMO",
        "account_type": "Pro",
        "account_size": 100000,
        "risk_percentage": 2.0,
        "account_equity": 50000,
        "trading_experience": "intermediate",
        "crypto_assets": ["BTC", "ETH"],
        "forex_assets": ["EURUSD", "GBPUSD"]
    }
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/working/questionnaire",
            json=questionnaire_data,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Working questionnaire successful!")
            print(f"   Message: {data.get('msg')}")
            return True
        else:
            print(f"❌ Working questionnaire failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Working questionnaire error: {e}")
        return False

def test_working_dashboard_data(access_token):
    """Test working dashboard data"""
    print("\n🔍 Testing working dashboard data...")
    
    try:
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.get(
            f"{BASE_URL}/api/working/dashboard-data",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Working dashboard data successful!")
            print(f"   Account Balance: ${data.get('account_balance', 0)}")
            print(f"   Total PnL: ${data.get('total_pnl', 0)}")
            print(f"   Win Rate: {data.get('win_rate', 0)}%")
            print(f"   User Profile Keys: {list(data.get('user_profile', {}).keys())}")
            return True
        else:
            print(f"❌ Working dashboard data failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Working dashboard data error: {e}")
        return False

def test_database_persistence():
    """Test that data is actually persisted in database"""
    print("\n🔍 Testing database persistence...")
    
    try:
        # Import the working database module to check data directly
        import sys
        import os
        sys.path.append(os.path.dirname(__file__))
        
        from working_database_routes import get_db_connection, DATABASE_URL
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if our test user exists
        if DATABASE_URL.startswith('sqlite'):
            cursor.execute("SELECT COUNT(*) FROM users WHERE email = ?", (TEST_EMAIL,))
        else:
            cursor.execute("SELECT COUNT(*) FROM users WHERE email = %s", (TEST_EMAIL,))
        
        user_count = cursor.fetchone()[0]
        
        if user_count > 0:
            print("✅ Database persistence verified!")
            print(f"   Test user found in database: {TEST_EMAIL}")
            
            # Get additional data
            if DATABASE_URL.startswith('sqlite'):
                cursor.execute("SELECT COUNT(*) FROM customer_data")
                customer_count = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM payment_transactions")
                payment_count = cursor.fetchone()[0]
            else:
                cursor.execute("SELECT COUNT(*) FROM customer_data")
                customer_count = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM payment_transactions")
                payment_count = cursor.fetchone()[0]
            
            print(f"   Customer records: {customer_count}")
            print(f"   Payment records: {payment_count}")
            
            conn.close()
            return True
        else:
            print("❌ Database persistence failed!")
            print(f"   Test user not found in database")
            conn.close()
            return False
            
    except Exception as e:
        print(f"❌ Database persistence check error: {e}")
        return False

def main():
    """Run all working database tests"""
    print("🧪 TESTING WORKING DATABASE ROUTES")
    print("=" * 50)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Test email: {TEST_EMAIL}")
    
    tests_passed = 0
    total_tests = 6
    
    # Test 1: Health endpoint
    if test_working_health():
        tests_passed += 1
    
    # Test 2: Registration
    registration_result = test_working_registration()
    if registration_result['success']:
        tests_passed += 1
        user_id = registration_result['user_id']
        access_token = registration_result['access_token']
        
        # Test 3: Payment (only if registration succeeded)
        if test_working_payment(user_id):
            tests_passed += 1
        
        # Test 4: Questionnaire (only if registration succeeded)
        if access_token and test_working_questionnaire(access_token):
            tests_passed += 1
        
        # Test 5: Dashboard data (only if registration succeeded)
        if access_token and test_working_dashboard_data(access_token):
            tests_passed += 1
        
        # Test 6: Database persistence
        if test_database_persistence():
            tests_passed += 1
    
    print("\n" + "=" * 50)
    print(f"🧪 Test Results: {tests_passed}/{total_tests} tests passed")
    print(f"Success rate: {(tests_passed/total_tests)*100:.1f}%")
    
    if tests_passed == total_tests:
        print("\n🎉 ALL WORKING DATABASE TESTS PASSED!")
        print("✅ The working database method is functioning correctly!")
        print("\n📋 This confirms:")
        print("1. ✅ Database connection works")
        print("2. ✅ User registration saves data")
        print("3. ✅ Payment processing works")
        print("4. ✅ Questionnaire data is saved")
        print("5. ✅ Dashboard data retrieval works")
        print("6. ✅ Data persists in database")
        return True
    else:
        print(f"\n⚠️  {total_tests - tests_passed} tests failed")
        print("Please check the Flask app and database connection.")
        return False

if __name__ == "__main__":
    success = main()
    print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    exit(0 if success else 1)

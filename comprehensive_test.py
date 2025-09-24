#!/usr/bin/env python3
"""
Comprehensive Test Suite for TradeEdge Pro
Tests all components: PostgreSQL, Flask API, and data flow
"""

import requests
import json
import time
import psycopg2
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('database.env')
DATABASE_URL = os.getenv('DATABASE_URL')

class ComprehensiveTest:
    def __init__(self):
        self.base_url = "http://localhost:8080"
        self.test_email = f"comprehensive_test_{int(time.time())}@example.com"
        self.results = {
            "postgresql_connection": False,
            "flask_server": False,
            "payment_api": False,
            "questionnaire_api": False,
            "dashboard_api": False,
            "health_api": False,
            "data_verification": False
        }
    
    def test_postgresql_connection(self):
        """Test direct PostgreSQL connection"""
        print("🔍 Testing PostgreSQL Connection...")
        try:
            conn = psycopg2.connect(DATABASE_URL)
            cur = conn.cursor()
            cur.execute("SELECT version()")
            version = cur.fetchone()[0]
            cur.close()
            conn.close()
            print(f"✅ PostgreSQL connected: {version[:50]}...")
            self.results["postgresql_connection"] = True
            return True
        except Exception as e:
            print(f"❌ PostgreSQL connection failed: {e}")
            return False
    
    def test_flask_server(self):
        """Test if Flask server is running"""
        print("\n🔍 Testing Flask Server...")
        try:
            response = requests.get(f"{self.base_url}/api/simple/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Flask server running: {data}")
                self.results["flask_server"] = True
                return True
            else:
                print(f"❌ Flask server returned status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Flask server not accessible: {e}")
            return False
    
    def test_payment_api(self):
        """Test payment API endpoint"""
        print("\n🔍 Testing Payment API...")
        try:
            payment_data = {
                "user_id": f"test_{int(time.time())}",
                "user_email": self.test_email,
                "user_name": "Comprehensive Test User",
                "plan_name_payment": "Pro Plan",
                "original_price": 29.99,
                "final_price": 29.99,
                "payment_method": "stripe",
                "transaction_id": f"TXN-COMPREHENSIVE-{int(time.time())}",
                "payment_status": "completed",
                "payment_provider": "Stripe"
            }
            
            response = requests.post(
                f"{self.base_url}/api/simple/payments",
                json=payment_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                print(f"✅ Payment API working: {data}")
                self.results["payment_api"] = True
                return True
            else:
                print(f"❌ Payment API failed: {response.status_code} - {response.text}")
                return False
    except Exception as e:
            print(f"❌ Payment API error: {e}")
        return False
    
    def test_questionnaire_api(self):
        """Test questionnaire API endpoint"""
        print("\n🔍 Testing Questionnaire API...")
        try:
            questionnaire_data = {
                "user_id": f"test_{int(time.time())}",
                "user_email": self.test_email,
                "user_name": "Comprehensive Test User",
                "trades_per_day": "5-10",
                "trading_session": "London",
                "crypto_assets": ["BTC", "ETH"],
                "forex_assets": ["EUR/USD", "GBP/USD"],
                "has_account": "yes",
                "account_equity": 10000,
                "prop_firm": "FTMO",
                "account_type": "Challenge",
                "account_size": 10000,
                "risk_percentage": 2,
                "risk_reward_ratio": "1:2",
                "trading_experience": "intermediate",
                "risk_tolerance": "moderate",
                "trading_goals": "Consistent profits"
            }
            
            response = requests.post(
                f"{self.base_url}/api/simple/questionnaire",
                json=questionnaire_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                print(f"✅ Questionnaire API working: {data}")
                self.results["questionnaire_api"] = True
                return True
            else:
                print(f"❌ Questionnaire API failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Questionnaire API error: {e}")
            return False
    
    def test_dashboard_api(self):
        """Test dashboard API endpoint"""
        print("\n🔍 Testing Dashboard API...")
        try:
            dashboard_data = {
                "user_id": f"test_{int(time.time())}",
                "user_email": self.test_email,
                "user_name": "Comprehensive Test User",
                "current_equity": 10000,
                "initial_equity": 10000,
                "total_pnl": 150.50,
                "win_rate": 65.5,
                "total_trades": 20,
                "winning_trades": 13,
                "losing_trades": 7,
                "account_balance": 10150.50,
                "daily_pnl": 25.30
            }
            
            response = requests.post(
                f"{self.base_url}/api/simple/dashboard",
                json=dashboard_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                print(f"✅ Dashboard API working: {data}")
                self.results["dashboard_api"] = True
                return True
            else:
                print(f"❌ Dashboard API failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Dashboard API error: {e}")
            return False
    
    def test_health_api(self):
        """Test health API endpoint"""
        print("\n🔍 Testing Health API...")
        try:
            response = requests.get(f"{self.base_url}/api/simple/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Health API working: {data}")
                self.results["health_api"] = True
                return True
            else:
                print(f"❌ Health API failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Health API error: {e}")
            return False
    
    def verify_data_in_database(self):
        """Verify data was actually saved to PostgreSQL"""
        print("\n🔍 Verifying Data in PostgreSQL Database...")
        try:
            conn = psycopg2.connect(DATABASE_URL)
            cur = conn.cursor()
            
            # Check payment data
            cur.execute("SELECT COUNT(*) FROM payment_details WHERE user_email = %s", (self.test_email,))
            payment_count = cur.fetchone()[0]
            
            # Check questionnaire data
            cur.execute("SELECT COUNT(*) FROM questionnaire_details WHERE user_email = %s", (self.test_email,))
            questionnaire_count = cur.fetchone()[0]
            
            # Check dashboard data
            cur.execute("SELECT COUNT(*) FROM user_dashboard WHERE user_email = %s", (self.test_email,))
            dashboard_count = cur.fetchone()[0]
            
            total_records = payment_count + questionnaire_count + dashboard_count
            
            print(f"💳 Payment records: {payment_count}")
            print(f"📋 Questionnaire records: {questionnaire_count}")
            print(f"📊 Dashboard records: {dashboard_count}")
            print(f"📈 Total records: {total_records}")
            
            if total_records >= 3:
                print("✅ Data verification successful!")
                self.results["data_verification"] = True
                return True
            else:
                print("❌ Data verification failed - not enough records")
                return False
                
        except Exception as e:
            print(f"❌ Data verification error: {e}")
            return False
        finally:
            if 'cur' in locals():
                cur.close()
            if 'conn' in locals():
                conn.close()
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 COMPREHENSIVE TEST SUITE FOR TRADEEDGE PRO")
        print("=" * 60)
        
        # Run all tests
        self.test_postgresql_connection()
        self.test_flask_server()
        self.test_health_api()
        self.test_payment_api()
        self.test_questionnaire_api()
        self.test_dashboard_api()
        self.verify_data_in_database()
        
        # Print results
        print("\n📊 TEST RESULTS SUMMARY")
        print("=" * 40)
        
        passed = 0
        total = len(self.results)
        
        for test_name, result in self.results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
            if result:
                passed += 1
        
        print(f"\n📈 OVERALL RESULT: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! System is working perfectly!")
            print("✅ PostgreSQL Database: WORKING")
            print("✅ Flask API Server: WORKING") 
            print("✅ Data Flow: WORKING")
            print("✅ Frontend Integration: READY")
    else:
            print("⚠️  Some tests failed. Please check the issues above.")
        
        return passed == total

if __name__ == "__main__":
    tester = ComprehensiveTest()
    success = tester.run_all_tests()
    exit(0 if success else 1)
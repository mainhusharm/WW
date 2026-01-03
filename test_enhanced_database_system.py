#!/usr/bin/env python3
"""
COMPREHENSIVE TEST SCRIPT FOR ENHANCED DATABASE SYSTEM
Tests all database tables, API endpoints, and data flow
PostgreSQL Database: postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2
"""

import requests
import json
import time
import psycopg2
import psycopg2.extras
from datetime import datetime
import uuid

# Configuration
API_BASE_URL = "http://localhost:5000"  # Change this to your deployed API URL
DATABASE_CONFIG = {
    'host': 'dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com',
    'database': 'pghero_dpg_d2v9i7er433s73f0878g_a_cdm2',
    'user': 'pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user',
    'password': 'f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V',
    'port': 5432,
    'sslmode': 'require'
}

class DatabaseTester:
    """Test the enhanced database system"""
    
    def __init__(self):
        self.connection_string = (
            f"host={DATABASE_CONFIG['host']} "
            f"dbname={DATABASE_CONFIG['database']} "
            f"user={DATABASE_CONFIG['user']} "
            f"password={DATABASE_CONFIG['password']} "
            f"port={DATABASE_CONFIG['port']} "
            f"sslmode={DATABASE_CONFIG['sslmode']}"
        )
        self.test_user_email = f"test_user_{int(time.time())}@example.com"
        self.test_results = []
    
    def log_test(self, test_name, success, message="", data=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'data': data,
            'timestamp': datetime.now().isoformat()
        })
    
    def test_database_connection(self):
        """Test direct database connection"""
        try:
            conn = psycopg2.connect(self.connection_string)
            with conn.cursor() as cursor:
                cursor.execute("SELECT version();")
                version = cursor.fetchone()[0]
            conn.close()
            self.log_test("Database Connection", True, f"Connected to PostgreSQL: {version[:50]}...")
            return True
        except Exception as e:
            self.log_test("Database Connection", False, f"Connection failed: {e}")
            return False
    
    def test_database_schema(self):
        """Test that all required tables exist"""
        try:
            conn = psycopg2.connect(self.connection_string)
            with conn.cursor() as cursor:
                # Check all required tables
                required_tables = [
                    'enhanced_users',
                    'payment_transactions', 
                    'questionnaire_responses',
                    'user_dashboard_data',
                    'signal_tracking'
                ]
                
                for table in required_tables:
                    cursor.execute("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_name = %s
                        );
                    """, (table,))
                    
                    exists = cursor.fetchone()[0]
                    if not exists:
                        self.log_test("Database Schema", False, f"Table {table} does not exist")
                        return False
                
                # Check views
                required_views = [
                    'user_complete_profile',
                    'dashboard_overview',
                    'signal_performance_by_milestone'
                ]
                
                for view in required_views:
                    cursor.execute("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.views 
                            WHERE table_name = %s
                        );
                    """, (view,))
                    
                    exists = cursor.fetchone()[0]
                    if not exists:
                        self.log_test("Database Schema", False, f"View {view} does not exist")
                        return False
                        
            conn.close()
            self.log_test("Database Schema", True, "All required tables and views exist")
            return True
            
        except Exception as e:
            self.log_test("Database Schema", False, f"Schema check failed: {e}")
            return False
    
    def test_api_health(self):
        """Test API health endpoint"""
        try:
            response = requests.get(f"{API_BASE_URL}/api/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'healthy':
                    self.log_test("API Health", True, "API is healthy and database connected")
                    return True
                else:
                    self.log_test("API Health", False, f"API unhealthy: {data}")
                    return False
            else:
                self.log_test("API Health", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("API Health", False, f"Health check failed: {e}")
            return False
    
    def test_signup_flow(self):
        """Test enhanced signup endpoint"""
        try:
            signup_data = {
                "first_name": "John",
                "last_name": "Doe",
                "email": self.test_user_email,
                "password": "testpassword123",
                "phone": "+1234567890",
                "company": "Test Company",
                "country": "US",
                "selected_plan_name": "Elite Plan",
                "selected_plan_price": 1299.00,
                "selected_plan_period": "month",
                "agree_to_terms": True,
                "agree_to_marketing": True
            }
            
            response = requests.post(
                f"{API_BASE_URL}/api/enhanced/signup",
                json=signup_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                if data.get('success') and data.get('user'):
                    self.user_id = data['user']['id']
                    self.access_token = data.get('access_token')
                    self.log_test("Signup Flow", True, f"User created: {data['user']['email']}")
                    return True
                else:
                    self.log_test("Signup Flow", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Signup Flow", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Signup Flow", False, f"Signup failed: {e}")
            return False
    
    def test_payment_flow(self):
        """Test enhanced payment endpoint"""
        try:
            payment_data = {
                "user_email": self.test_user_email,
                "plan_name_payment": "Elite Plan",
                "original_price": 1299.00,
                "discount_amount": 100.00,
                "final_price": 1199.00,
                "coupon_code": "SAVE100",
                "coupon_applied": True,
                "payment_method": "stripe",
                "payment_provider": "Stripe",
                "transaction_id": f"txn_{int(time.time())}",
                "payment_status": "completed",
                "stripe_payment_intent_id": f"pi_{int(time.time())}"
            }
            
            response = requests.post(
                f"{API_BASE_URL}/api/enhanced/payment",
                json=payment_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                if data.get('success'):
                    self.payment_id = data.get('payment_id')
                    self.log_test("Payment Flow", True, f"Payment recorded: {data['transaction_id']}")
                    return True
                else:
                    self.log_test("Payment Flow", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Payment Flow", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Payment Flow", False, f"Payment failed: {e}")
            return False
    
    def test_questionnaire_flow(self):
        """Test questionnaire endpoint"""
        try:
            questionnaire_data = {
                "user_email": self.test_user_email,
                "trades_per_day": "1-2",
                "trading_session": "european",
                "crypto_assets": ["BTC", "ETH", "SOL"],
                "forex_assets": ["EURUSD", "GBPUSD", "USDJPY"],
                "custom_forex_pairs": ["EURNOK"],
                "has_account": "yes",
                "account_equity": 50000.00,
                "prop_firm": "FTMO",
                "account_type": "Challenge",
                "account_size": 100000.00,
                "account_number": "FTMO123456789",
                "risk_percentage": 1.5,
                "risk_reward_ratio": "2",
                "challenge_step": 1,
                "trading_experience": "intermediate"
            }
            
            response = requests.post(
                f"{API_BASE_URL}/api/enhanced/questionnaire",
                json=questionnaire_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                if data.get('success'):
                    self.questionnaire_id = data.get('questionnaire_id')
                    self.dashboard_id = data.get('dashboard_id')
                    self.milestone_access_level = data.get('milestone_access_level')
                    self.log_test("Questionnaire Flow", True, f"Questionnaire completed, milestone level: {self.milestone_access_level}")
                    return True
                else:
                    self.log_test("Questionnaire Flow", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Questionnaire Flow", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Questionnaire Flow", False, f"Questionnaire failed: {e}")
            return False
    
    def test_dashboard_data_retrieval(self):
        """Test dashboard data retrieval"""
        try:
            response = requests.get(
                f"{API_BASE_URL}/api/enhanced/dashboard/{self.test_user_email}",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('user_profile'):
                    profile = data['user_profile']
                    self.log_test("Dashboard Data Retrieval", True, 
                                f"Retrieved profile for {profile['email']}, prop firm: {profile.get('prop_firm', 'N/A')}")
                    return True
                else:
                    self.log_test("Dashboard Data Retrieval", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Dashboard Data Retrieval", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Dashboard Data Retrieval", False, f"Dashboard retrieval failed: {e}")
            return False
    
    def test_dashboard_data_update(self):
        """Test dashboard data update"""
        try:
            update_data = {
                "user_email": self.test_user_email,
                "current_equity": 52500.00,
                "total_pnl": 2500.00,
                "total_trades": 15,
                "winning_trades": 9,
                "losing_trades": 6,
                "win_rate": 60.0,
                "signals_won": 5,
                "signals_lost": 2
            }
            
            response = requests.post(
                f"{API_BASE_URL}/api/enhanced/dashboard/update",
                json=update_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_test("Dashboard Data Update", True, f"Updated dashboard data, rows affected: {data.get('rows_affected')}")
                    return True
                else:
                    self.log_test("Dashboard Data Update", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Dashboard Data Update", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Dashboard Data Update", False, f"Dashboard update failed: {e}")
            return False
    
    def test_signal_tracking(self):
        """Test signal tracking endpoint"""
        try:
            signal_data = {
                "user_email": self.test_user_email,
                "signal_id": f"signal_{int(time.time())}",
                "signal_symbol": "EURUSD",
                "signal_type": "BUY",
                "signal_price": 1.0850,
                "signal_milestone": "M1",
                "confidence_score": 85.5,
                "taken_by_user": True,
                "outcome": "win",
                "pnl": 150.00,
                "risk_amount": 1000.00
            }
            
            response = requests.post(
                f"{API_BASE_URL}/api/enhanced/signals/track",
                json=signal_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                if data.get('success'):
                    self.log_test("Signal Tracking", True, f"Signal tracked: {signal_data['signal_id']}")
                    return True
                else:
                    self.log_test("Signal Tracking", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Signal Tracking", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Signal Tracking", False, f"Signal tracking failed: {e}")
            return False
    
    def test_admin_endpoints(self):
        """Test admin endpoints"""
        try:
            # Test user list
            response = requests.get(f"{API_BASE_URL}/api/enhanced/admin/users", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    user_count = data.get('total_count', 0)
                    self.log_test("Admin Users List", True, f"Retrieved {user_count} users")
                else:
                    self.log_test("Admin Users List", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Admin Users List", False, f"HTTP {response.status_code}")
                return False
            
            # Test admin stats
            response = requests.get(f"{API_BASE_URL}/api/enhanced/admin/stats", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    user_stats = data.get('user_stats', {})
                    total_users = user_stats.get('total_users', 0)
                    self.log_test("Admin Statistics", True, f"Stats retrieved, total users: {total_users}")
                    return True
                else:
                    self.log_test("Admin Statistics", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Admin Statistics", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Admin Endpoints", False, f"Admin endpoints failed: {e}")
            return False
    
    def test_data_relationships(self):
        """Test that data relationships are working correctly"""
        try:
            conn = psycopg2.connect(self.connection_string)
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                # Test user complete profile view
                cursor.execute(
                    "SELECT * FROM user_complete_profile WHERE email = %s",
                    (self.test_user_email,)
                )
                profile = cursor.fetchone()
                
                if profile:
                    # Check that all data is properly joined
                    required_fields = ['first_name', 'last_name', 'email', 'prop_firm', 'account_type', 'payment_method']
                    missing_fields = [field for field in required_fields if not profile.get(field)]
                    
                    if missing_fields:
                        self.log_test("Data Relationships", False, f"Missing fields in profile: {missing_fields}")
                        return False
                    else:
                        self.log_test("Data Relationships", True, "All data properly joined in user profile view")
                        return True
                else:
                    self.log_test("Data Relationships", False, "User profile not found in view")
                    return False
                    
            conn.close()
            
        except Exception as e:
            self.log_test("Data Relationships", False, f"Relationship test failed: {e}")
            return False
    
    def cleanup_test_data(self):
        """Clean up test data"""
        try:
            conn = psycopg2.connect(self.connection_string)
            with conn.cursor() as cursor:
                # Delete in reverse order of dependencies
                cursor.execute("DELETE FROM signal_tracking WHERE user_id IN (SELECT id FROM enhanced_users WHERE email = %s)", (self.test_user_email,))
                cursor.execute("DELETE FROM user_dashboard_data WHERE user_id IN (SELECT id FROM enhanced_users WHERE email = %s)", (self.test_user_email,))
                cursor.execute("DELETE FROM questionnaire_responses WHERE user_id IN (SELECT id FROM enhanced_users WHERE email = %s)", (self.test_user_email,))
                cursor.execute("DELETE FROM payment_transactions WHERE user_id IN (SELECT id FROM enhanced_users WHERE email = %s)", (self.test_user_email,))
                cursor.execute("DELETE FROM enhanced_users WHERE email = %s", (self.test_user_email,))
                conn.commit()
            conn.close()
            self.log_test("Cleanup", True, "Test data cleaned up successfully")
        except Exception as e:
            self.log_test("Cleanup", False, f"Cleanup failed: {e}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Enhanced Database System Tests")
        print("=" * 60)
        
        # Initialize test variables
        self.user_id = None
        self.access_token = None
        self.payment_id = None
        self.questionnaire_id = None
        self.dashboard_id = None
        self.milestone_access_level = None
        
        # Run tests in order
        tests = [
            self.test_database_connection,
            self.test_database_schema,
            self.test_api_health,
            self.test_signup_flow,
            self.test_payment_flow,
            self.test_questionnaire_flow,
            self.test_dashboard_data_retrieval,
            self.test_dashboard_data_update,
            self.test_signal_tracking,
            self.test_admin_endpoints,
            self.test_data_relationships
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL {test.__name__}: Unexpected error: {e}")
                failed += 1
            
            # Small delay between tests
            time.sleep(0.5)
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {failed}")
        print(f"📈 SUCCESS RATE: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            print("\n🎉 ALL TESTS PASSED! Database system is working correctly.")
            print("\n📋 NEXT STEPS:")
            print("1. Deploy the API to your production server")
            print("2. Update frontend components to use the new API endpoints")
            print("3. Run the database schema migration script")
            print("4. Update environment variables with the correct API URLs")
        else:
            print(f"\n⚠️  {failed} tests failed. Please check the issues above.")
        
        return failed == 0

def main():
    """Main test function"""
    print("Enhanced Database System Test Suite")
    print("Testing PostgreSQL database and API endpoints")
    print(f"API Base URL: {API_BASE_URL}")
    print(f"Database: {DATABASE_CONFIG['host']}/{DATABASE_CONFIG['database']}")
    print()
    
    tester = DatabaseTester()
    success = tester.run_all_tests()
    
    # Save test results to file
    with open('test_results.json', 'w') as f:
        json.dump({
            'test_run': datetime.now().isoformat(),
            'success': success,
            'results': tester.test_results
        }, f, indent=2)
    
    print(f"\n📄 Test results saved to test_results.json")
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())

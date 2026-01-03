#!/usr/bin/env python3
"""
Test Enhanced Data Capture Integration
Tests that data from payment-enhanced, questionnaire, and dashboard is properly captured
"""

import requests
import json
import time
import uuid
from datetime import datetime

class EnhancedDataCaptureTest:
    def __init__(self):
        # Use localhost for testing or the production URL
        self.signup_url = "http://localhost:5001"
        self.capture_url = "http://localhost:5003/api/data-capture" 
        # For production testing, use:
        # self.capture_url = "https://traderedgepro.com/api/data-capture"
        self.test_email = f"test_{int(time.time())}@example.com"
        self.test_user_id = None
        
    def test_signup_integration(self):
        """Test that signup-enhanced is working"""
        print("🧪 Testing signup-enhanced integration...")
        
        signup_data = {
            "email": self.test_email,
            "password": "testpassword123",
            "firstName": "Test",
            "lastName": "User",
            "plan_type": "premium"
        }
        
        try:
            response = requests.post(f"{self.signup_url}/api/auth/register", json=signup_data)
            
            if response.status_code == 201:
                result = response.json()
                self.test_user_id = result.get('user', {}).get('id')
                print(f"✅ Signup successful: {self.test_email}")
                print(f"📝 User ID: {self.test_user_id}")
                return True
            else:
                print(f"❌ Signup failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Signup error: {str(e)}")
            return False

    def test_payment_capture(self):
        """Test payment data capture"""
        print("\n🧪 Testing payment data capture...")
        
        payment_data = {
            "user_email": self.test_email,
            "user_name": "Test User",
            "plan_name_payment": "Premium Plan",
            "original_price": 99.99,
            "discount_amount": 10.00,
            "final_price": 89.99,
            "coupon_code": "TEST10",
            "payment_method": "paypal",
            "transaction_id": f"TXN-{uuid.uuid4().hex[:8]}",
            "payment_status": "completed",
            "payment_processor": "PayPal",
            "crypto_transaction_hash": f"NON-CRYPTO-{int(time.time())}",
            "crypto_from_address": "N/A",
            "crypto_amount": "0"
        }
        
        try:
            response = requests.post(f"{self.capture_url}/payment", json=payment_data)
            
            if response.status_code == 201:
                result = response.json()
                print(f"✅ Payment capture successful: Payment ID {result.get('payment_id')}")
                return True
            else:
                print(f"❌ Payment capture failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Payment capture error: {str(e)}")
            return False

    def test_questionnaire_capture(self):
        """Test questionnaire data capture"""
        print("\n🧪 Testing questionnaire data capture...")
        
        questionnaire_data = {
            "user_email": self.test_email,
            "user_name": "Test User",
            "tradesPerDay": "1-5",
            "tradingSession": "london",
            "cryptoAssets": ["BTC/USD", "ETH/USD"],
            "forexAssets": ["EUR/USD", "GBP/USD"],
            "customForexPairs": [],
            "hasAccount": "yes",
            "accountEquity": 50000,
            "propFirm": "FTMO",
            "accountType": "Challenge",
            "accountSize": 100000,
            "riskPercentage": 1.5,
            "riskRewardRatio": "1:2.5",
            "accountScreenshot": "",
            "screenshot_filename": "",
            "screenshot_size": 0,
            "screenshot_type": ""
        }
        
        try:
            response = requests.post(f"{self.capture_url}/questionnaire", json=questionnaire_data)
            
            if response.status_code == 201:
                result = response.json()
                print(f"✅ Questionnaire capture successful: ID {result.get('questionnaire_id')}")
                return True
            else:
                print(f"❌ Questionnaire capture failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Questionnaire capture error: {str(e)}")
            return False

    def test_dashboard_capture(self):
        """Test dashboard data capture"""
        print("\n🧪 Testing dashboard data capture...")
        
        dashboard_data = {
            "user_email": self.test_email,
            "user_name": "Test User",
            "dashboardData": {
                "account": {
                    "balance": 102500.75,
                    "equity": 102500.75
                },
                "performance": {
                    "totalPnl": 2500.75,
                    "winRate": 68.5,
                    "totalTrades": 25
                }
            },
            "tradingState": {
                "initialEquity": 100000,
                "currentEquity": 102500.75,
                "performanceMetrics": {
                    "totalPnl": 2500.75,
                    "winRate": 68.5,
                    "totalTrades": 25,
                    "winningTrades": 17,
                    "losingTrades": 8,
                    "averageWin": 250.50,
                    "averageLoss": -120.25,
                    "profitFactor": 1.85,
                    "maxDrawdown": 500.00,
                    "currentDrawdown": 0,
                    "grossProfit": 4258.50,
                    "grossLoss": -1757.75,
                    "consecutiveWins": 3,
                    "consecutiveLosses": 0
                },
                "riskSettings": {
                    "riskPerTrade": 1.5,
                    "dailyLossLimit": 5,
                    "consecutiveLossesLimit": 3
                }
            },
            "theme": "dark"
        }
        
        try:
            response = requests.post(f"{self.capture_url}/dashboard", json=dashboard_data)
            
            if response.status_code == 201:
                result = response.json()
                print(f"✅ Dashboard capture successful: ID {result.get('dashboard_id')}")
                return True
            else:
                print(f"❌ Dashboard capture failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Dashboard capture error: {str(e)}")
            return False

    def test_user_stats(self):
        """Test user statistics retrieval"""
        print("\n🧪 Testing user statistics...")
        
        try:
            response = requests.get(f"{self.capture_url}/stats/{self.test_email}")
            
            if response.status_code == 200:
                stats = response.json()
                print("✅ User statistics retrieved successfully:")
                print(f"   📊 Data counts: {stats.get('data_counts', {})}")
                print(f"   📈 Total data points: {stats.get('total_data_points', 0)}")
                return True
            else:
                print(f"❌ Stats retrieval failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Stats retrieval error: {str(e)}")
            return False

    def test_health_checks(self):
        """Test health check endpoints"""
        print("\n🧪 Testing health checks...")
        
        endpoints = [
            ("Enhanced Data Capture", f"{self.capture_url}/health")
        ]
        
        all_healthy = True
        
        for name, url in endpoints:
            try:
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    print(f"✅ {name}: Healthy")
                else:
                    print(f"⚠️ {name}: Responding but not healthy")
                    all_healthy = False
            except Exception as e:
                print(f"❌ {name}: Not responding ({str(e)})")
                all_healthy = False
        
        return all_healthy

    def test_database_integrity(self):
        """Test database integrity"""
        print("\n🧪 Testing database integrity...")
        
        import sqlite3
        
        try:
            conn = sqlite3.connect("trading_bots.db")
            cursor = conn.cursor()
            
            # Check if test user exists
            cursor.execute("SELECT id FROM users WHERE email = ?", (self.test_email,))
            user = cursor.fetchone()
            
            if user:
                print(f"✅ Test user found in database: ID {user[0]}")
            else:
                print("⚠️ Test user not found in users table")
                conn.close()
                return False
            
            # Check captured data
            tables_to_check = [
                ("payment_data", "Payment"),
                ("questionnaire_data", "Questionnaire"),
                ("dashboard_data", "Dashboard")
            ]
            
            for table, name in tables_to_check:
                cursor.execute(f"SELECT COUNT(*) FROM {table} WHERE user_email = ?", (self.test_email,))
                count = cursor.fetchone()[0]
                print(f"✅ {name} data records: {count}")
            
            # Check audit trail
            cursor.execute("SELECT COUNT(*) FROM data_capture_audit WHERE user_email = ?", (self.test_email,))
            audit_count = cursor.fetchone()[0]
            print(f"✅ Audit trail records: {audit_count}")
            
            conn.close()
            return True
            
        except Exception as e:
            print(f"❌ Database integrity check failed: {str(e)}")
            return False

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        try:
            import sqlite3
            conn = sqlite3.connect("trading_bots.db")
            cursor = conn.cursor()
            
            # Delete test data
            tables = [
                "data_capture_audit",
                "dashboard_data", 
                "questionnaire_data",
                "payment_data",
                "users"
            ]
            
            for table in tables:
                cursor.execute(f"DELETE FROM {table} WHERE user_email = ? OR email = ?", 
                             (self.test_email, self.test_email))
            
            conn.commit()
            conn.close()
            print(f"✅ Test data cleaned up for {self.test_email}")
            
        except Exception as e:
            print(f"⚠️ Cleanup error: {str(e)}")

    def run_full_test(self):
        """Run all tests"""
        print("🚀 Enhanced Data Capture Integration Test")
        print("=" * 50)
        
        tests = [
            ("Health Checks", self.test_health_checks),
            ("Signup Integration", self.test_signup_integration),
            ("Payment Capture", self.test_payment_capture),
            ("Questionnaire Capture", self.test_questionnaire_capture),
            ("Dashboard Capture", self.test_dashboard_capture),
            ("User Statistics", self.test_user_stats),
            ("Database Integrity", self.test_database_integrity)
        ]
        
        results = []
        
        for test_name, test_func in tests:
            print(f"\n{'='*20} {test_name} {'='*20}")
            try:
                result = test_func()
                results.append((test_name, result))
                if result:
                    print(f"✅ {test_name}: PASSED")
                else:
                    print(f"❌ {test_name}: FAILED")
            except Exception as e:
                print(f"❌ {test_name}: ERROR - {str(e)}")
                results.append((test_name, False))
        
        # Summary
        print("\n" + "="*50)
        print("📊 TEST SUMMARY")
        print("="*50)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {test_name:<25} {status}")
        
        print(f"\n🎯 Overall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! Enhanced data capture is working perfectly.")
        else:
            print("⚠️ Some tests failed. Please check the output above.")
        
        # Cleanup
        self.cleanup_test_data()
        
        return passed == total

def main():
    """Main test function"""
    test = EnhancedDataCaptureTest()
    success = test.run_full_test()
    return 0 if success else 1

if __name__ == '__main__':
    import sys
    sys.exit(main())

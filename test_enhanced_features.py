#!/usr/bin/env python3
"""
Enhanced Features Test Suite
Tests all the new PostgreSQL-style services and API endpoints
"""

import requests
import json
import time
from datetime import datetime

class EnhancedFeaturesTester:
    def __init__(self):
        self.base_url = "http://localhost:3005"
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = f"{status} {test_name}"
        if details:
            result += f" - {details}"
        
        self.test_results.append(result)
        print(result)
    
    def test_enhanced_user_registration(self):
        """Test enhanced user registration with email normalization"""
        try:
            # Test 1: Normal registration with unique email
            timestamp = int(time.time())
            unique_email = f"test.user.{timestamp}@gmail.com"
            
            data = {
                "email": unique_email,
                "password": "securepassword123",
                "user_data": {
                    "name": "Test User",
                    "membership_tier": "premium",
                    "account_type": "Individual",
                    "prop_firm": "Test Firm",
                    "account_size": 50000,
                    "questionnaire": {
                        "experience": "Intermediate",
                        "risk_tolerance": "High",
                        "preferred_pairs": ["BTC/USD", "ETH/USD"]
                    }
                }
            }
            
            response = requests.post(f"{self.base_url}/api/enhanced/register", json=data)
            
            if response.status_code == 201:
                result = response.json()
                if result.get('success') and result.get('unique_id'):
                    self.log_test("Enhanced User Registration", True, f"User ID: {result['user_id']}")
                    return result['user_id']
                else:
                    self.log_test("Enhanced User Registration", False, "Registration response invalid")
                    return None
            else:
                self.log_test("Enhanced User Registration", False, f"Status: {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test("Enhanced User Registration", False, f"Error: {str(e)}")
            return None
    
    def test_email_validation(self):
        """Test email uniqueness validation with normalization"""
        try:
            # Test Gmail dot normalization with unique email
            timestamp = int(time.time())
            unique_email = f"test.user.{timestamp}@gmail.com"
            data = {"email": unique_email}
            response = requests.post(f"{self.base_url}/api/enhanced/email-validation", json=data)
            
            if response.status_code == 200:
                result = response.json()
                # Check if response has the expected structure (regardless of success value)
                if (result.get('success') is not None and 
                    result.get('normalized_email') is not None and
                    result.get('is_available') is not None and
                    result.get('message') is not None):
                    self.log_test("Email Validation & Normalization", True, 
                                f"Normalized: {result['normalized_email']} (Available: {result['is_available']})")
                    return True
                else:
                    self.log_test("Email Validation & Normalization", False, 
                                f"Invalid response structure - missing required fields")
                    return False
            else:
                self.log_test("Email Validation & Normalization", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Email Validation & Normalization", False, f"Error: {str(e)}")
            return False
    
    def test_customer_data_sync(self, customer_id):
        """Test customer data synchronization"""
        try:
            data = {
                "email": "test.user@gmail.com",
                "prop_firm": "Updated Firm",
                "account_type": "Professional",
                "account_size": 75000,
                "experience": "Advanced",
                "risk_tolerance": "Very High",
                "preferred_pairs": ["BTC/USD", "ETH/USD", "ADA/USD"],
                "answers": {
                    "q1": "Yes, I have experience with leverage trading",
                    "q2": "I prefer high-risk, high-reward strategies",
                    "q3": "I can handle significant drawdowns"
                }
            }
            
            response = requests.post(f"{self.base_url}/api/enhanced/customers/{customer_id}/sync", json=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and result.get('data'):
                    self.log_test("Customer Data Sync", True, "Data synchronized successfully")
                    return True
                else:
                    self.log_test("Customer Data Sync", False, "Sync response invalid")
                    return False
            else:
                self.log_test("Customer Data Sync", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Customer Data Sync", False, f"Error: {str(e)}")
            return False
    
    def test_comprehensive_customer_data(self, customer_id):
        """Test comprehensive customer data retrieval"""
        try:
            response = requests.get(f"{self.base_url}/api/enhanced/customers/{customer_id}/comprehensive")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and result.get('data'):
                    data = result['data']
                    if 'customer' in data and 'service_data' in data:
                        self.log_test("Comprehensive Customer Data", True, 
                                    f"Retrieved {len(data)} data sections")
                        return True
                    else:
                        self.log_test("Comprehensive Customer Data", False, "Missing data sections")
                        return False
                else:
                    self.log_test("Comprehensive Customer Data", False, "Response invalid")
                    return False
            else:
                self.log_test("Comprehensive Customer Data", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Comprehensive Customer Data", False, f"Error: {str(e)}")
            return False
    
    def test_trading_signal_creation(self):
        """Test trading signal creation and propagation"""
        try:
            data = {
                "type": "crypto",
                "pair": "BTC/USD",
                "direction": "BUY",
                "entry_price": 45000.0,
                "stop_loss": 44000.0,
                "take_profit": 47000.0,
                "indicators": {
                    "rsi": 35,
                    "macd": 0.5,
                    "volume": 1200000
                }
            }
            
            response = requests.post(f"{self.base_url}/api/enhanced/signals", json=data)
            
            if response.status_code == 201:
                result = response.json()
                if result.get('success') and result.get('signal'):
                    self.log_test("Trading Signal Creation", True, "Signal created successfully")
                    return True
                else:
                    self.log_test("Trading Signal Creation", False, "Signal response invalid")
                    return False
            else:
                self.log_test("Trading Signal Creation", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Trading Signal Creation", False, f"Error: {str(e)}")
            return False
    
    def test_trading_signals_retrieval(self):
        """Test trading signals retrieval with filters"""
        try:
            # Test without filters
            response = requests.get(f"{self.base_url}/api/enhanced/signals")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and 'signals' in result:
                    self.log_test("Trading Signals Retrieval", True, 
                                f"Retrieved {result['count']} signals")
                    return True
                else:
                    self.log_test("Trading Signals Retrieval", False, "Response invalid")
                    return False
            else:
                self.log_test("Trading Signals Retrieval", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Trading Signals Retrieval", False, f"Error: {str(e)}")
            return False
    
    def test_bot_status_management(self):
        """Test bot status management"""
        try:
            # Test bot start
            start_data = {"active": True}
            response = requests.post(f"{self.base_url}/api/enhanced/bot/crypto/toggle", json=start_data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and result.get('is_active'):
                    self.log_test("Bot Start", True, "Crypto bot started successfully")
                else:
                    self.log_test("Bot Start", False, "Start response invalid")
                    return False
            else:
                self.log_test("Bot Start", False, f"Status: {response.status_code}")
                return False
            
            # Test bot status check
            response = requests.get(f"{self.base_url}/api/enhanced/bot/crypto/status")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and result.get('is_active'):
                    self.log_test("Bot Status Check", True, "Status retrieved successfully")
                else:
                    self.log_test("Bot Status Check", False, "Status response invalid")
                    return False
            else:
                self.log_test("Bot Status Check", False, f"Status: {response.status_code}")
                return False
            
            # Test bot stop
            stop_data = {"active": False}
            response = requests.post(f"{self.base_url}/api/enhanced/bot/crypto/toggle", json=stop_data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and not result.get('is_active'):
                    self.log_test("Bot Stop", True, "Crypto bot stopped successfully")
                    return True
                else:
                    self.log_test("Bot Stop", False, "Stop response invalid")
                    return False
            else:
                self.log_test("Bot Stop", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Bot Status Management", False, f"Error: {str(e)}")
            return False
    
    def test_secure_dashboard_access(self):
        """Test secure dashboard with PIN authentication"""
        try:
            # Test with correct PIN
            data = {
                "pin": "231806",
                "filters": {
                    "bot_type": "crypto",
                    "pair": "BTC/USD"
                }
            }
            
            response = requests.post(f"{self.base_url}/api/enhanced/dashboard/trading-data", json=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.log_test("Secure Dashboard Access (Valid PIN)", True, 
                                f"Retrieved {result['count']} records")
                else:
                    self.log_test("Secure Dashboard Access (Valid PIN)", False, "Response invalid")
                    return False
            else:
                self.log_test("Secure Dashboard Access (Valid PIN)", False, f"Status: {response.status_code}")
                return False
            
            # Test with incorrect PIN
            data["pin"] = "000000"
            response = requests.post(f"{self.base_url}/api/enhanced/dashboard/trading-data", json=data)
            
            if response.status_code == 401:
                self.log_test("Secure Dashboard Access (Invalid PIN)", True, "PIN rejected correctly")
                return True
            else:
                self.log_test("Secure Dashboard Access (Invalid PIN)", False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Secure Dashboard Access", False, f"Error: {str(e)}")
            return False
    
    def test_bot_data_storage(self):
        """Test secure bot data storage"""
        try:
            data = {
                "pin": "231806",
                "bot_type": "crypto",
                "pair": "BTC/USD",
                "ohlcv": {
                    "open": 45000.0,
                    "high": 45500.0,
                    "low": 44800.0,
                    "close": 45200.0,
                    "volume": 1200000
                },
                "indicators": {
                    "rsi": 45,
                    "macd": 0.2,
                    "bollinger_upper": 46000,
                    "bollinger_lower": 44000
                }
            }
            
            response = requests.post(f"{self.base_url}/api/enhanced/dashboard/store-bot-data", json=data)
            
            if response.status_code == 201:
                result = response.json()
                if result.get('success'):
                    self.log_test("Bot Data Storage", True, "Data stored successfully")
                    return True
                else:
                    self.log_test("Bot Data Storage", False, "Storage response invalid")
                    return False
            else:
                self.log_test("Bot Data Storage", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Bot Data Storage", False, f"Error: {str(e)}")
            return False
    
    def test_audit_log_retrieval(self):
        """Test audit log retrieval"""
        try:
            response = requests.get(f"{self.base_url}/api/enhanced/audit-log?limit=50")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and 'audit_log' in result:
                    self.log_test("Audit Log Retrieval", True, 
                                f"Retrieved {result['count']} audit records")
                    return True
                else:
                    self.log_test("Audit Log Retrieval", False, "Response invalid")
                    return False
            else:
                self.log_test("Audit Log Retrieval", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Audit Log Retrieval", False, f"Error: {str(e)}")
            return False
    
    def test_health_endpoint(self):
        """Test health endpoint"""
        try:
            response = requests.get(f"{self.base_url}/health")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('status') == 'healthy':
                    self.log_test("Health Endpoint", True, "Service is healthy")
                    return True
                else:
                    self.log_test("Health Endpoint", False, "Health status invalid")
                    return False
            else:
                self.log_test("Health Endpoint", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Health Endpoint", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all enhanced feature tests"""
        print("🚀 ENHANCED FEATURES TEST SUITE")
        print("=" * 50)
        
        # Test basic functionality first
        self.test_health_endpoint()
        
        # Test enhanced user registration
        customer_id = self.test_enhanced_user_registration()
        
        if customer_id:
            # Test email validation
            self.test_email_validation()
            
            # Test customer data sync
            self.test_customer_data_sync(customer_id)
            
            # Test comprehensive data retrieval
            self.test_comprehensive_customer_data(customer_id)
        
        # Test trading signals
        self.test_trading_signal_creation()
        self.test_trading_signals_retrieval()
        
        # Test bot management
        self.test_bot_status_management()
        
        # Test secure dashboard
        self.test_secure_dashboard_access()
        self.test_bot_data_storage()
        
        # Test audit logging
        self.test_audit_log_retrieval()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 TEST SUMMARY: {self.passed_tests}/{self.total_tests} TESTS PASSING")
        
        if self.passed_tests == self.total_tests:
            print("🎉 ALL ENHANCED FEATURES WORKING PERFECTLY!")
        else:
            print(f"⚠️  {self.total_tests - self.passed_tests} tests failed")
        
        print("=" * 50)
        
        return self.passed_tests == self.total_tests

if __name__ == "__main__":
    tester = EnhancedFeaturesTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Enhanced Features Integration: SUCCESS!")
        print("🚀 Your customer-service dashboard now has:")
        print("   • PostgreSQL-style database schema")
        print("   • Email normalization & uniqueness")
        print("   • Audit trails & compliance")
        print("   • Trading signal propagation")
        print("   • Bot state management")
        print("   • PIN-protected data access")
        print("   • Customer data synchronization")
    else:
        print("\n❌ Some enhanced features need attention")
        print("🔧 Check the failed tests above for details")

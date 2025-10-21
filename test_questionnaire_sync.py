#!/usr/bin/env python3
"""
Test Questionnaire Synchronization
This script tests the complete questionnaire to dashboard synchronization flow.
"""

import sqlite3
import json
from datetime import datetime
import requests
import time

class QuestionnaireSyncTester:
    def __init__(self, db_path="trading_bots.db", api_base_url="http://localhost:5000"):
        self.db_path = db_path
        self.api_base_url = api_base_url
        
    def setup_test_database(self):
        """Set up test database with sample data"""
        print("🔧 Setting up test database...")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create customer_service_data table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customer_service_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                account_type TEXT NOT NULL,
                package_value INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create users table for testing
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert test users
        test_users = [
            (1, "testuser1", "test1@example.com"),
            (2, "testuser2", "test2@example.com"),
            (3, "testuser3", "test3@example.com")
        ]
        
        for user_id, username, email in test_users:
            cursor.execute('''
                INSERT OR IGNORE INTO users (id, username, email)
                VALUES (?, ?, ?)
            ''', (user_id, username, email))
        
        conn.commit()
        conn.close()
        
        print("✅ Test database setup complete")
    
    def test_questionnaire_submission(self, user_id, account_type):
        """Test questionnaire submission via API"""
        print(f"\n📝 Testing questionnaire submission for user {user_id}")
        print(f"   Account Type: {account_type}")
        
        try:
            # Test data
            test_data = {
                "userId": user_id,
                "accountType": account_type,
                "package": None  # Will be mapped by the API
            }
            
            # Make API call
            response = requests.post(
                f"{self.api_base_url}/api/questionnaire",
                json=test_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ API call successful")
                print(f"   Response: {result}")
                
                # Verify the data was saved correctly
                if self.verify_database_data(user_id, account_type):
                    print(f"✅ Database verification successful")
                    return True
                else:
                    print(f"❌ Database verification failed")
                    return False
            else:
                print(f"❌ API call failed with status {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ API request failed: {e}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return False
    
    def verify_database_data(self, user_id, account_type):
        """Verify that data was saved correctly in the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT account_type, package_value
                FROM customer_service_data
                WHERE user_id = ?
            ''', (user_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if not result:
                print(f"   ❌ No data found in database for user {user_id}")
                return False
            
            db_account_type, db_package_value = result
            
            # Expected package values
            expected_values = {
                "QuantTekel Instant": 10450,
                "QuantTekel 2-Step": 10448,
                "QuantTekel Pro": 10452,
                "QuantTekel Premium": 10455
            }
            
            expected_value = expected_values.get(account_type)
            
            if db_account_type != account_type:
                print(f"   ❌ Account type mismatch: expected {account_type}, got {db_account_type}")
                return False
            
            if db_package_value != expected_value:
                print(f"   ❌ Package value mismatch: expected {expected_value}, got {db_package_value}")
                return False
            
            print(f"   ✅ Database data verified: {account_type} = {db_package_value}")
            return True
            
        except Exception as e:
            print(f"   ❌ Database verification error: {e}")
            return False
    
    def test_dashboard_data_retrieval(self, user_id):
        """Test dashboard data retrieval via API"""
        print(f"\n📊 Testing dashboard data retrieval for user {user_id}")
        
        try:
            # Get questionnaire data
            response = requests.get(
                f"{self.api_base_url}/api/questionnaire/{user_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Dashboard data retrieved successfully")
                print(f"   Account Type: {result['data']['account_type']}")
                print(f"   Package Value: {result['data']['package_value']}")
                print(f"   Updated At: {result['data']['updated_at']}")
                return True
            else:
                print(f"❌ Dashboard data retrieval failed with status {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ API request failed: {e}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return False
    
    def test_data_consistency(self):
        """Test data consistency across all users"""
        print(f"\n🔍 Testing data consistency across all users...")
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT user_id, account_type, package_value
                FROM customer_service_data
                ORDER BY user_id
            ''')
            
            results = cursor.fetchall()
            conn.close()
            
            if not results:
                print("   ⚠️ No questionnaire data found")
                return False
            
            # Expected package values
            expected_values = {
                "QuantTekel Instant": 10450,
                "QuantTekel 2-Step": 10448,
                "QuantTekel Pro": 10452,
                "QuantTekel Premium": 10455
            }
            
            inconsistencies = []
            
            for user_id, account_type, package_value in results:
                expected_value = expected_values.get(account_type)
                
                if expected_value and package_value != expected_value:
                    inconsistencies.append({
                        "user_id": user_id,
                        "account_type": account_type,
                        "expected": expected_value,
                        "actual": package_value
                    })
            
            if inconsistencies:
                print(f"   ❌ Found {len(inconsistencies)} data inconsistencies:")
                for inc in inconsistencies:
                    print(f"      User {inc['user_id']}: {inc['account_type']} - Expected {inc['expected']}, Got {inc['actual']}")
                return False
            else:
                print(f"   ✅ All data is consistent across {len(results)} users")
                return True
                
        except Exception as e:
            print(f"   ❌ Data consistency check failed: {e}")
            return False
    
    def run_comprehensive_test(self):
        """Run comprehensive test suite"""
        print("🧪 Comprehensive Questionnaire Synchronization Test")
        print("=" * 60)
        
        # Setup
        self.setup_test_database()
        
        # Test cases
        test_cases = [
            (1, "QuantTekel Instant"),
            (2, "QuantTekel 2-Step"),
            (3, "QuantTekel Pro")
        ]
        
        success_count = 0
        total_tests = len(test_cases) * 2  # submission + retrieval
        
        print(f"\n📋 Running {len(test_cases)} test cases...")
        
        for user_id, account_type in test_cases:
            # Test questionnaire submission
            if self.test_questionnaire_submission(user_id, account_type):
                success_count += 1
            
            # Test dashboard data retrieval
            if self.test_dashboard_data_retrieval(user_id):
                success_count += 1
        
        # Test data consistency
        print(f"\n🔍 Testing overall data consistency...")
        if self.test_data_consistency():
            success_count += 1
        total_tests += 1
        
        # Results
        print(f"\n📊 Test Results Summary")
        print("-" * 40)
        print(f"Tests Passed: {success_count}/{total_tests}")
        print(f"Success Rate: {(success_count/total_tests)*100:.1f}%")
        
        if success_count == total_tests:
            print("🎉 All tests passed! Questionnaire synchronization is working correctly.")
        else:
            print("⚠️ Some tests failed. Please check the errors above.")
        
        return success_count == total_tests

def main():
    """Main function to run the comprehensive test"""
    print("🚀 Starting Questionnaire Synchronization Test Suite")
    
    # Check if API server is running
    try:
        response = requests.get("http://localhost:5000/api/questionnaire", timeout=5)
        print("✅ API server is running")
    except:
        print("⚠️ API server is not running. Please start it first:")
        print("   python questionnaire_api_fixed.py")
        return
    
    # Run tests
    tester = QuestionnaireSyncTester()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🎯 Next Steps:")
        print("1. Your questionnaire synchronization is working correctly!")
        print("2. The dashboard will now properly display user data")
        print("3. Package values are correctly mapped (10450 for Instant, 10448 for 2-Step)")
        print("4. Account types are properly synchronized")
    else:
        print("\n🔧 Issues Found:")
        print("1. Check the error messages above")
        print("2. Verify your database connection")
        print("3. Ensure the API server is running")
        print("4. Check that all tables exist")

if __name__ == "__main__":
    main()

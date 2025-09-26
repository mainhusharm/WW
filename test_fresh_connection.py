#!/usr/bin/env python3
"""
Test Script for Fresh Database Connection
Tests the complete data flow from frontend to PostgreSQL database
"""

import requests
import json
import uuid
import time
from datetime import datetime

class FreshConnectionTester:
    def __init__(self, api_base_url="http://localhost:10000"):
        self.api_base_url = api_base_url
        self.test_results = []
        
    def log_test(self, test_name, success, message, data=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'data': data
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {message}")
        if data and not success:
            print(f"   Data: {data}")
    
    def test_health_check(self):
        """Test API health endpoint"""
        try:
            response = requests.get(f"{self.api_base_url}/api/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'healthy':
                    self.log_test("Health Check", True, "API is healthy and database connected")
                    return True
                else:
                    self.log_test("Health Check", False, f"API unhealthy: {data}", data)
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Connection failed: {e}")
            return False
    
    def test_user_registration(self):
        """Test user registration with all form fields"""
        test_user = {
            "firstName": "Test",
            "lastName": "User",
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "password": "testpassword123",
            "phone": "+1234567890",
            "company": "Test Company Inc",
            "country": "US",
            "terms": True,
            "newsletter": False,
            "plan_type": "Standard",
            "plan_price": 99.00
        }
        
        try:
            response = requests.post(
                f"{self.api_base_url}/api/user/register",
                json=test_user,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 201:
                data = response.json()
                if data.get('success') and data.get('user_id'):
                    self.log_test("User Registration", True, 
                                f"User created successfully with ID: {data['user_id']}")
                    return data
                else:
                    self.log_test("User Registration", False, 
                                f"Registration failed: {data}", data)
                    return None
            else:
                self.log_test("User Registration", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("User Registration", False, f"Registration error: {e}")
            return None
    
    def test_duplicate_user(self, email):
        """Test duplicate user registration"""
        duplicate_user = {
            "firstName": "Duplicate",
            "lastName": "User",
            "email": email,
            "password": "testpassword123",
            "phone": "+1234567890",
            "country": "US",
            "terms": True,
            "newsletter": False
        }
        
        try:
            response = requests.post(
                f"{self.api_base_url}/api/user/register",
                json=duplicate_user,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 409:
                self.log_test("Duplicate User Check", True, 
                            "Correctly rejected duplicate email")
                return True
            else:
                self.log_test("Duplicate User Check", False, 
                            f"Should have returned 409, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Duplicate User Check", False, f"Error: {e}")
            return False
    
    def test_get_user(self, user_id):
        """Test retrieving user data"""
        try:
            response = requests.get(
                f"{self.api_base_url}/api/user/{user_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('user'):
                    self.log_test("Get User", True, 
                                f"Successfully retrieved user data")
                    return data['user']
                else:
                    self.log_test("Get User", False, f"Invalid response: {data}", data)
                    return None
            else:
                self.log_test("Get User", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("Get User", False, f"Error: {e}")
            return None
    
    def test_get_all_users(self):
        """Test retrieving all users"""
        try:
            response = requests.get(f"{self.api_base_url}/api/users", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'users' in data:
                    user_count = len(data['users'])
                    self.log_test("Get All Users", True, 
                                f"Retrieved {user_count} users")
                    return data['users']
                else:
                    self.log_test("Get All Users", False, f"Invalid response: {data}", data)
                    return None
            else:
                self.log_test("Get All Users", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("Get All Users", False, f"Error: {e}")
            return None
    
    def test_get_stats(self):
        """Test getting database statistics"""
        try:
            response = requests.get(f"{self.api_base_url}/api/stats", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'stats' in data:
                    stats = data['stats']
                    self.log_test("Get Stats", True, 
                                f"Total users: {stats.get('total_users', 0)}")
                    return stats
                else:
                    self.log_test("Get Stats", False, f"Invalid response: {data}", data)
                    return None
            else:
                self.log_test("Get Stats", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("Get Stats", False, f"Error: {e}")
            return None
    
    def test_field_validation(self):
        """Test form field validation"""
        # Test missing required fields
        incomplete_user = {
            "firstName": "Test",
            # Missing lastName, email, password
            "phone": "+1234567890",
            "terms": True
        }
        
        try:
            response = requests.post(
                f"{self.api_base_url}/api/user/register",
                json=incomplete_user,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 400:
                self.log_test("Field Validation", True, 
                            "Correctly rejected incomplete form")
                return True
            else:
                self.log_test("Field Validation", False, 
                            f"Should have returned 400, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Field Validation", False, f"Error: {e}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Fresh Connection Tests")
        print("=" * 50)
        
        # Test 1: Health Check
        if not self.test_health_check():
            print("❌ Health check failed. Cannot continue with other tests.")
            return self.generate_report()
        
        # Test 2: User Registration
        user_data = self.test_user_registration()
        if not user_data:
            print("❌ User registration failed. Cannot continue with user-specific tests.")
            return self.generate_report()
        
        user_id = user_data.get('user_id')
        user_email = user_data.get('user', {}).get('email')
        
        # Test 3: Duplicate User Check
        if user_email:
            self.test_duplicate_user(user_email)
        
        # Test 4: Get User
        if user_id:
            self.test_get_user(user_id)
        
        # Test 5: Get All Users
        self.test_get_all_users()
        
        # Test 6: Get Stats
        self.test_get_stats()
        
        # Test 7: Field Validation
        self.test_field_validation()
        
        return self.generate_report()
    
    def generate_report(self):
        """Generate test report"""
        print("\n" + "=" * 50)
        print("📊 TEST REPORT")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
        
        # Save results to file
        with open('fresh_connection_test_results.json', 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\n💾 Results saved to: fresh_connection_test_results.json")
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'success_rate': (passed_tests/total_tests)*100,
            'results': self.test_results
        }

def main():
    """Main test function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Test Fresh Database Connection')
    parser.add_argument('--url', default='http://localhost:10000', 
                       help='API base URL (default: http://localhost:10000)')
    
    args = parser.parse_args()
    
    print(f"🔗 Testing API at: {args.url}")
    
    tester = FreshConnectionTester(args.url)
    report = tester.run_all_tests()
    
    if report['failed'] == 0:
        print("\n🎉 ALL TESTS PASSED! Fresh connection is working perfectly!")
        exit(0)
    else:
        print(f"\n⚠️  {report['failed']} tests failed. Please check the issues above.")
        exit(1)

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Test Script for Fresh Database Connection - Fixed for existing backend
Tests the complete data flow from frontend to existing backend API
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
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                
                # Handle both response formats
                is_success = (data.get('success') == True or 
                            data.get('msg') == 'User registered successfully' or
                            data.get('message') == 'User registered successfully')
                
                user_id = data.get('user_id') or data.get('id')
                
                if is_success and user_id:
                    # Normalize the response for downstream tests
                    normalized_data = {
                        'success': True,
                        'user_id': user_id,
                        'user': {
                            'id': user_id,
                            'email': test_user['email'],
                            'firstName': test_user['firstName'],
                            'lastName': test_user['lastName']
                        }
                    }
                    
                    self.log_test("User Registration", True, 
                                f"User created successfully with ID: {user_id}")
                    return normalized_data
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
            
            # Handle different error response formats
            if response.status_code == 409:
                self.log_test("Duplicate User Check", True, 
                            "Correctly rejected duplicate email")
                return True
            elif response.status_code == 400:
                data = response.json()
                if 'already exists' in str(data).lower() or 'duplicate' in str(data).lower():
                    self.log_test("Duplicate User Check", True, 
                                "Correctly rejected duplicate email")
                    return True
                else:
                    self.log_test("Duplicate User Check", False, 
                                f"Got 400 but not for duplicate: {data}")
                    return False
            else:
                self.log_test("Duplicate User Check", False, 
                            f"Should have returned 409/400, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Duplicate User Check", False, f"Error: {e}")
            return False
    
    def run_basic_tests(self):
        """Run basic tests suitable for any backend"""
        print("🚀 Starting Fresh Connection Tests (Basic)")
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
        
        user_email = user_data.get('user', {}).get('email')
        
        # Test 3: Duplicate User Check (if email available)
        if user_email:
            self.test_duplicate_user(user_email)
        
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
    report = tester.run_basic_tests()
    
    if report['failed'] == 0:
        print("\n🎉 ALL TESTS PASSED! Fresh connection is working perfectly!")
        exit(0)
    else:
        print(f"\n⚠️  {report['failed']} tests failed. Please check the issues above.")
        exit(1)

if __name__ == "__main__":
    main()

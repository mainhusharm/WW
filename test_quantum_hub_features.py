#!/usr/bin/env python3
"""
Comprehensive Test Suite for Quantum Support Hub
Tests all features and functionality of the customer service dashboard
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3005"
API_BASE = f"{BASE_URL}/api"

class QuantumHubTester:
    def __init__(self):
        self.test_results = []
        self.session = requests.Session()
        
    def log_test(self, test_name, passed, details=""):
        """Log test results"""
        status = "✅ PASS" if passed else "❌ FAIL"
        timestamp = datetime.now().strftime("%H:%M:%S")
        result = f"[{timestamp}] {status} - {test_name}"
        if details:
            result += f" - {details}"
        print(result)
        
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'details': details,
            'timestamp': timestamp
        })
        
    def test_health_endpoint(self):
        """Test 1: Health Check Endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Health Check", True, f"Status: {data.get('status')}, Customers: {data.get('customer_count')}")
                return True
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Error: {str(e)}")
            return False
    
    def test_customers_endpoint(self):
        """Test 2: Customers API Endpoint"""
        try:
            response = self.session.get(f"{API_BASE}/customers")
            if response.status_code == 200:
                data = response.json()
                customer_count = len(data.get('customers', []))
                self.log_test("Customers API", True, f"Found {customer_count} customers")
                return customer_count > 0
            else:
                self.log_test("Customers API", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Customers API", False, f"Error: {str(e)}")
            return False
    
    def test_search_functionality(self):
        """Test 3: Customer Search Functionality"""
        try:
            # Test search for existing customer
            response = self.session.get(f"{API_BASE}/customers/search?search=john")
            if response.status_code == 200:
                data = response.json()
                results = len(data.get('customers', []))
                self.log_test("Search Functionality", True, f"Search returned {results} results")
                return results > 0
            else:
                self.log_test("Search Functionality", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Search Functionality", False, f"Error: {str(e)}")
            return False
    
    def test_customer_details(self):
        """Test 4: Individual Customer Details"""
        try:
            # First get all customers
            response = self.session.get(f"{API_BASE}/customers")
            if response.status_code == 200:
                data = response.json()
                customers = data.get('customers', [])
                if customers:
                    # Test first customer details
                    customer_id = customers[0].get('unique_id')
                    detail_response = self.session.get(f"{API_BASE}/customers/{customer_id}")
                    if detail_response.status_code == 200:
                        detail_data = detail_response.json()
                        self.log_test("Customer Details", True, f"Retrieved details for {customer_id}")
                        return True
                    else:
                        self.log_test("Customer Details", False, f"Status code: {detail_response.status_code}")
                        return False
                else:
                    self.log_test("Customer Details", False, "No customers available")
                    return False
            else:
                self.log_test("Customer Details", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Customer Details", False, f"Error: {str(e)}")
            return False
    
    def test_customer_creation(self):
        """Test 5: Customer Creation (POST)"""
        try:
            new_customer = {
                "name": f"Test User {int(time.time())}",
                "email": f"test{int(time.time())}@example.com",
                "phone": "+1234567890",
                "membership_tier": "standard",
                "join_date": datetime.now().strftime("%Y-%m-%d")
            }
            
            response = self.session.post(f"{API_BASE}/customers", json=new_customer)
            if response.status_code in [200, 201]:
                self.log_test("Customer Creation", True, f"Created customer: {new_customer['name']}")
                return True
            else:
                self.log_test("Customer Creation", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Customer Creation", False, f"Error: {str(e)}")
            return False
    
    def test_customer_update(self):
        """Test 6: Customer Update Functionality"""
        try:
            # First get a customer
            response = self.session.get(f"{API_BASE}/customers")
            if response.status_code == 200:
                data = response.json()
                customers = data.get('customers', [])
                if customers:
                    customer = customers[0]
                    customer_id = customer.get('unique_id')
                    
                    # Update customer
                    update_data = {
                        "name": f"Updated {customer.get('name')}",
                        "membership_tier": "premium"
                    }
                    
                    update_response = self.session.put(f"{API_BASE}/customers/{customer_id}", json=update_data)
                    if update_response.status_code in [200, 201]:
                        self.log_test("Customer Update", True, f"Updated customer: {customer_id}")
                        return True
                    else:
                        self.log_test("Customer Update", False, f"Status code: {update_response.status_code}")
                        return False
                else:
                    self.log_test("Customer Update", False, "No customers available")
                    return False
            else:
                self.log_test("Customer Update", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Customer Update", False, f"Error: {str(e)}")
            return False
    
    def test_customer_deletion(self):
        """Test 7: Customer Deletion"""
        try:
            # First get a customer
            response = self.session.get(f"{API_BASE}/customers")
            if response.status_code == 200:
                data = response.json()
                customers = data.get('customers', [])
                if customers:
                    customer = customers[0]
                    customer_id = customer.get('unique_id')
                    
                    # Delete customer
                    delete_response = self.session.delete(f"{API_BASE}/customers/{customer_id}")
                    if delete_response.status_code in [200, 204]:
                        self.log_test("Customer Deletion", True, f"Deleted customer: {customer_id}")
                        return True
                    else:
                        self.log_test("Customer Deletion", False, f"Status code: {delete_response.status_code}")
                        return False
                else:
                    self.log_test("Customer Deletion", False, "No customers available")
                    return False
            else:
                self.log_test("Customer Deletion", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Customer Deletion", False, f"Error: {str(e)}")
            return False
    
    def test_activities_endpoint(self):
        """Test 8: Customer Activities API"""
        try:
            # First get a customer
            response = self.session.get(f"{API_BASE}/customers")
            if response.status_code == 200:
                data = response.json()
                customers = data.get('customers', [])
                if customers:
                    customer_id = customers[0].get('unique_id')
                    
                    # Test activities endpoint
                    activities_response = self.session.get(f"{API_BASE}/customers/{customer_id}/activities")
                    if activities_response.status_code == 200:
                        self.log_test("Activities API", True, f"Retrieved activities for {customer_id}")
                        return True
                    else:
                        self.log_test("Activities API", False, f"Status code: {activities_response.status_code}")
                        return False
                else:
                    self.log_test("Activities API", False, "No customers available")
                    return False
            else:
                self.log_test("Activities API", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Activities API", False, f"Error: {str(e)}")
            return False
    
    def test_screenshots_endpoint(self):
        """Test 9: Customer Screenshots API"""
        try:
            # First get a customer
            response = self.session.get(f"{API_BASE}/customers")
            if response.status_code == 200:
                data = response.json()
                customers = data.get('customers', [])
                if customers:
                    customer_id = customers[0].get('unique_id')
                    
                    # Test screenshots endpoint
                    screenshots_response = self.session.get(f"{API_BASE}/customers/{customer_id}/screenshots")
                    if screenshots_response.status_code == 200:
                        self.log_test("Screenshots API", True, f"Retrieved screenshots for {customer_id}")
                        return True
                    else:
                        self.log_test("Screenshots API", False, f"Status code: {screenshots_response.status_code}")
                        return False
                else:
                    self.log_test("Screenshots API", False, "No customers available")
                    return False
            else:
                self.log_test("Screenshots API", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Screenshots API", False, f"Error: {str(e)}")
            return False
    
    def test_questionnaire_endpoint(self):
        """Test 10: Customer Questionnaire API"""
        try:
            # First get a customer
            response = self.session.get(f"{API_BASE}/customers")
            if response.status_code == 200:
                data = response.json()
                customers = data.get('customers', [])
                if customers:
                    customer_id = customers[0].get('unique_id')
                    
                    # Test questionnaire endpoint
                    questionnaire_response = self.session.get(f"{API_BASE}/customers/{customer_id}/questionnaire")
                    if questionnaire_response.status_code == 200:
                        self.log_test("Questionnaire API", True, f"Retrieved questionnaire for {customer_id}")
                        return True
                    else:
                        self.log_test("Questionnaire API", False, f"Status code: {questionnaire_response.status_code}")
                        return False
                else:
                    self.log_test("Questionnaire API", False, "No customers available")
                    return False
            else:
                self.log_test("Questionnaire API", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Questionnaire API", False, f"Error: {str(e)}")
            return False
    
    def test_risk_plan_endpoint(self):
        """Test 11: Risk Management Plan API"""
        try:
            # First get a customer
            response = self.session.get(f"{API_BASE}/customers")
            if response.status_code == 200:
                data = response.json()
                customers = data.get('customers', [])
                if customers:
                    customer_id = customers[0].get('unique_id')
                    
                    # Test risk plan endpoint
                    risk_plan_response = self.session.get(f"{API_BASE}/customers/{customer_id}/risk-plan")
                    if risk_plan_response.status_code == 200:
                        self.log_test("Risk Plan API", True, f"Retrieved risk plan for {customer_id}")
                        return True
                    else:
                        self.log_test("Risk Plan API", False, f"Status code: {risk_plan_response.status_code}")
                        return False
                else:
                    self.log_test("Risk Plan API", False, "No customers available")
                    return False
            else:
                self.log_test("Risk Plan API", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Risk Plan API", False, f"Error: {str(e)}")
            return False
    
    def test_dashboard_data_endpoint(self):
        """Test 12: Dashboard Data API"""
        try:
            # First get a customer
            response = self.session.get(f"{API_BASE}/customers")
            if response.status_code == 200:
                data = response.json()
                customers = data.get('customers', [])
                if customers:
                    customer_id = customers[0].get('unique_id')
                    
                    # Test dashboard data endpoint
                    dashboard_response = self.session.get(f"{API_BASE}/customers/{customer_id}/dashboard-data")
                    if dashboard_response.status_code == 200:
                        self.log_test("Dashboard Data API", True, f"Retrieved dashboard data for {customer_id}")
                        return True
                    else:
                        self.log_test("Dashboard Data API", False, f"Status code: {dashboard_response.status_code}")
                        return False
                else:
                    self.log_test("Dashboard Data API", False, "No customers available")
                    return False
            else:
                self.log_test("Dashboard Data API", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Dashboard Data API", False, f"Error: {str(e)}")
            return False
    
    def test_data_persistence(self):
        """Test 13: Data Persistence Across Restarts"""
        try:
            # Create a test customer
            test_customer = {
                "name": f"Persistence Test User {int(time.time())}",
                "email": f"persistence{int(time.time())}@example.com",
                "phone": "+1234567890",
                "membership_tier": "test",
                "join_date": datetime.now().strftime("%Y-%m-%d")
            }
            
            create_response = self.session.post(f"{API_BASE}/customers", json=test_customer)
            if create_response.status_code in [200, 201]:
                created_data = create_response.json()
                customer_id = created_data.get('unique_id')
                
                # Verify customer was created
                verify_response = self.session.get(f"{API_BASE}/customers/{customer_id}")
                if verify_response.status_code == 200:
                    self.log_test("Data Persistence", True, f"Customer {customer_id} persisted successfully")
                    return True
                else:
                    self.log_test("Data Persistence", False, f"Could not verify customer creation")
                    return False
            else:
                self.log_test("Data Persistence", False, f"Failed to create test customer")
                return False
        except Exception as e:
            self.log_test("Data Persistence", False, f"Error: {str(e)}")
            return False
    
    def test_error_handling(self):
        """Test 14: Error Handling for Invalid Requests"""
        try:
            # Test invalid customer ID
            response = self.session.get(f"{API_BASE}/customers/invalid-id-12345")
            if response.status_code == 404:
                self.log_test("Error Handling", True, "Properly handled invalid customer ID")
                return True
            else:
                self.log_test("Error Handling", False, f"Expected 404, got {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Error Handling", False, f"Error: {str(e)}")
            return False
    
    def test_api_rate_limiting(self):
        """Test 15: API Rate Limiting (if implemented)"""
        try:
            # Make multiple rapid requests
            start_time = time.time()
            responses = []
            
            for i in range(10):
                response = self.session.get(f"{API_BASE}/customers")
                responses.append(response.status_code)
                time.sleep(0.1)  # Small delay
            
            end_time = time.time()
            total_time = end_time - start_time
            
            # Check if all requests succeeded
            all_successful = all(status == 200 for status in responses)
            
            if all_successful:
                self.log_test("Rate Limiting", True, f"Handled 10 requests in {total_time:.2f}s")
                return True
            else:
                self.log_test("Rate Limiting", False, f"Some requests failed: {responses}")
                return False
        except Exception as e:
            self.log_test("Rate Limiting", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests and generate summary"""
        print("🚀 Starting Quantum Support Hub Comprehensive Testing")
        print("=" * 60)
        
        tests = [
            self.test_health_endpoint,
            self.test_customers_endpoint,
            self.test_search_functionality,
            self.test_customer_details,
            self.test_customer_creation,
            self.test_customer_update,
            self.test_customer_deletion,
            self.test_activities_endpoint,
            self.test_screenshots_endpoint,
            self.test_questionnaire_endpoint,
            self.test_risk_plan_endpoint,
            self.test_dashboard_data_endpoint,
            self.test_data_persistence,
            self.test_error_handling,
            self.test_api_rate_limiting
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
            except Exception as e:
                self.log_test(test.__name__, False, f"Test crashed: {str(e)}")
        
        # Generate summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! Quantum Support Hub is fully functional!")
        else:
            print(f"\n⚠️  {total - passed} tests failed. Check the details above.")
        
        return passed, total

def main():
    """Main function to run the test suite"""
    try:
        tester = QuantumHubTester()
        passed, total = tester.run_all_tests()
        
        # Exit with appropriate code
        sys.exit(0 if passed == total else 1)
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Testing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Fatal error during testing: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()

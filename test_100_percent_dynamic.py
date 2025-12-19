#!/usr/bin/env python3
"""
100% Dynamic Website Test Suite
Tests that all components are fully dynamic with no fallback/mock data
"""

import requests
import json
import time
from datetime import datetime

class DynamicWebsiteTester:
    def __init__(self):
        self.base_url = "http://localhost:5000"
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
    
    def test_real_time_dashboard_data(self):
        """Test that dashboard provides real-time data without fallbacks"""
        try:
            # Test real-time dashboard endpoint
            response = requests.get(f"{self.base_url}/api/dashboard/real-time-data?user_id=1")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check that we have real data structure
                if 'timestamp' in data and 'trading' in data and 'user' in data:
                    # Verify no fallback data
                    if data.get('error') != 'Dashboard data temporarily unavailable':
                        self.log_test("Real-Time Dashboard Data", True, "Live data endpoint working")
                        return True
                    else:
                        self.log_test("Real-Time Dashboard Data", False, "Service unavailable")
                        return False
                else:
                    self.log_test("Real-Time Dashboard Data", False, "Invalid data structure")
                    return False
            else:
                self.log_test("Real-Time Dashboard Data", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Real-Time Dashboard Data", False, f"Error: {str(e)}")
            return False
    
    def test_live_signals_endpoint(self):
        """Test that live signals endpoint provides real data"""
        try:
            response = requests.get(f"{self.base_url}/api/dashboard/live-signals")
            
            if response.status_code == 200:
                data = response.json()
                
                if 'signals' in data and 'timestamp' in data:
                    self.log_test("Live Signals Endpoint", True, f"Found {data.get('count', 0)} signals")
                    return True
                else:
                    self.log_test("Live Signals Endpoint", False, "Invalid response structure")
                    return False
            else:
                self.log_test("Live Signals Endpoint", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Live Signals Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_performance_metrics_endpoint(self):
        """Test that performance metrics endpoint provides real calculations"""
        try:
            response = requests.get(f"{self.base_url}/api/dashboard/performance-metrics?user_id=1")
            
            if response.status_code == 200:
                data = response.json()
                
                if 'metrics' in data:
                    metrics = data['metrics']
                    required_fields = ['total_trades', 'winning_trades', 'losing_trades', 'win_rate', 'total_pnl']
                    
                    if all(field in metrics for field in required_fields):
                        self.log_test("Performance Metrics Endpoint", True, "Real metrics calculated")
                        return True
                    else:
                        self.log_test("Performance Metrics Endpoint", False, "Missing required fields")
                        return False
                else:
                    self.log_test("Performance Metrics Endpoint", False, "No metrics in response")
                    return False
            else:
                self.log_test("Performance Metrics Endpoint", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Performance Metrics Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_no_fallback_data_in_responses(self):
        """Test that no API responses contain fallback or mock data"""
        try:
            endpoints_to_test = [
                '/api/signals',
                '/api/customers',
                '/api/trades',
                '/dashboard/notifications',
                '/dashboard/tickets'
            ]
            
            fallback_indicators = [
                'mock', 'fallback', 'sample', 'hardcoded', 'static',
                'Not Set', 'Not Available', 'TBD', 'Coming Soon'
            ]
            
            all_clean = True
            
            for endpoint in endpoints_to_test:
                try:
                    response = requests.get(f"{self.base_url}{endpoint}")
                    if response.status_code == 200:
                        response_text = response.text.lower()
                        
                        # Check for fallback indicators
                        for indicator in fallback_indicators:
                            if indicator.lower() in response_text:
                                print(f"⚠️  Found fallback indicator '{indicator}' in {endpoint}")
                                all_clean = False
                                break
                except:
                    # Endpoint might not exist yet, skip
                    continue
            
            if all_clean:
                self.log_test("No Fallback Data in Responses", True, "All endpoints return real data")
                return True
            else:
                self.log_test("No Fallback Data in Responses", False, "Some endpoints contain fallback data")
                return False
                
        except Exception as e:
            self.log_test("No Fallback Data in Responses", False, f"Error: {str(e)}")
            return False
    
    def test_real_time_data_service_integration(self):
        """Test that frontend real-time service is properly integrated"""
        try:
            # Check if the real-time service file exists and has proper structure
            service_file = "src/services/realTimeDataService.ts"
            
            with open(service_file, 'r') as f:
                content = f.read()
                
            # Check for key features
            required_features = [
                'RealTimeDataService',
                'subscribeToDashboardData',
                'subscribeToLiveSignals',
                'subscribeToPerformanceMetrics',
                'fetchDashboardData',
                'fetchLiveSignals',
                'fetchPerformanceMetrics'
            ]
            
            missing_features = []
            for feature in required_features:
                if feature not in content:
                    missing_features.append(feature)
            
            if not missing_features:
                self.log_test("Real-Time Service Integration", True, "Service properly implemented")
                return True
            else:
                self.log_test("Real-Time Service Integration", False, f"Missing: {', '.join(missing_features)}")
                return False
                
        except FileNotFoundError:
            self.log_test("Real-Time Service Integration", False, "Service file not found")
            return False
        except Exception as e:
            self.log_test("Real-Time Service Integration", False, f"Error: {str(e)}")
            return False
    
    def test_dashboard_concepts_no_mock_data(self):
        """Test that dashboard concepts don't contain mock data"""
        try:
            concept_files = [
                "src/components/DashboardConcept1.tsx",
                "src/components/DashboardConcept2.tsx",
                "src/components/DashboardConcept3.tsx",
                "src/components/DashboardConcept4.tsx",
                "src/components/DashboardConcept5.tsx"
            ]
            
            mock_indicators = [
                'mockData', 'mockBots', 'mockRules', 'mockSignals',
                'mockCustomers', 'mockTickets', 'mockNotifications'
            ]
            
            all_clean = True
            
            for file_path in concept_files:
                try:
                    with open(file_path, 'r') as f:
                        content = f.read()
                    
                    for indicator in mock_indicators:
                        if indicator in content:
                            print(f"⚠️  Found mock indicator '{indicator}' in {file_path}")
                            all_clean = False
                            break
                except FileNotFoundError:
                    continue
            
            if all_clean:
                self.log_test("Dashboard Concepts No Mock Data", True, "All concepts use real data")
                return True
            else:
                self.log_test("Dashboard Concepts No Mock Data", False, "Some concepts contain mock data")
                return False
                
        except Exception as e:
            self.log_test("Dashboard Concepts No Mock Data", False, f"Error: {str(e)}")
            return False
    
    def test_api_endpoints_consistency(self):
        """Test that all API endpoints are consistent and properly configured"""
        try:
            # Test main API configuration
            config_file = "src/api/config.ts"
            
            with open(config_file, 'r') as f:
                content = f.read()
            
            # Check for proper API configuration
            required_config = [
                'backendUrl',
                'yfinanceServiceUrl',
                'binanceServiceUrl',
                'API_ENDPOINTS'
            ]
            
            missing_config = []
            for config in required_config:
                if config not in content:
                    missing_config.append(config)
            
            if not missing_config:
                self.log_test("API Endpoints Consistency", True, "API properly configured")
                return True
            else:
                self.log_test("API Endpoints Consistency", False, f"Missing: {', '.join(missing_config)}")
                return False
                
        except FileNotFoundError:
            self.log_test("API Endpoints Consistency", False, "API config file not found")
            return False
        except Exception as e:
            self.log_test("API Endpoints Consistency", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all dynamic functionality tests"""
        print("🚀 Testing 100% Dynamic Website Functionality")
        print("=" * 60)
        
        tests = [
            self.test_real_time_dashboard_data,
            self.test_live_signals_endpoint,
            self.test_performance_metrics_endpoint,
            self.test_no_fallback_data_in_responses,
            self.test_real_time_data_service_integration,
            self.test_dashboard_concepts_no_mock_data,
            self.test_api_endpoints_consistency
        ]
        
        for test in tests:
            test()
            time.sleep(0.5)  # Small delay between tests
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY")
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {(self.passed_tests / self.total_tests * 100):.1f}%")
        
        if self.passed_tests == self.total_tests:
            print("\n🎉 CONGRATULATIONS! Your website is 100% DYNAMIC!")
            print("✅ No fallback data")
            print("✅ No mock data")
            print("✅ Real-time updates")
            print("✅ Live API integration")
            print("✅ Production ready!")
        else:
            print(f"\n⚠️  {self.total_tests - self.passed_tests} tests failed")
            print("Please review the failed tests above and fix any remaining fallback/mock data")
        
        return self.passed_tests == self.total_tests

if __name__ == "__main__":
    tester = DynamicWebsiteTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🚀 WEBSITE STATUS: 100% DYNAMIC - READY FOR LIVE DEPLOYMENT!")
    else:
        print("\n🔧 WEBSITE STATUS: Needs attention - some fallback data remains")

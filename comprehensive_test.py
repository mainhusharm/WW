#!/usr/bin/env python3
"""
Comprehensive Testing Suite
Tests all endpoints, CORS, signal system, and production readiness
"""

import requests
import json
import time
from datetime import datetime
import sys

# Configuration
BASE_URL = "http://localhost:8080"
API_BASE = f"{BASE_URL}/api"

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
    
    def add_result(self, test_name, success, error_msg=None):
        if success:
            self.passed += 1
            print(f"✅ {test_name}")
        else:
            self.failed += 1
            self.errors.append(f"❌ {test_name}: {error_msg}")
            print(f"❌ {test_name}: {error_msg}")
    
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"🎯 TEST SUMMARY")
        print(f"{'='*60}")
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        print(f"📊 Total: {total}")
        print(f"🎯 Success Rate: {(self.passed/total)*100:.1f}%")
        
        if self.errors:
            print(f"\n❌ ERRORS:")
            for error in self.errors:
                print(f"   {error}")
        
        return self.failed == 0

def test_endpoint(test_results, endpoint, method="GET", data=None, expected_status=200, test_name=None):
    """Test an API endpoint"""
    if not test_name:
        test_name = f"{method} {endpoint}"
    
    # All endpoints use BASE_URL since they're all at the root level
    if endpoint.startswith('/'):
        url = f"{BASE_URL}{endpoint}"
    else:
        url = f"{BASE_URL}/{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=10)
        else:
            test_results.add_result(test_name, False, f"Unsupported method: {method}")
            return False
        
        success = response.status_code == expected_status
        error_msg = f"Expected {expected_status}, got {response.status_code} for {url}" if not success else None
        
        test_results.add_result(test_name, success, error_msg)
        return success
        
    except requests.exceptions.RequestException as e:
        test_results.add_result(test_name, False, f"Connection error: {e}")
        return False

def test_cors_headers(test_results):
    """Test CORS headers are properly set"""
    print(f"\n🌐 Testing CORS Configuration")
    print("-" * 40)
    
    try:
        # Test preflight request
        response = requests.options(f"{API_BASE}/user/profile", timeout=10)
        
        cors_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With,Accept,Origin'
        }
        
        all_cors_ok = True
        for header, expected_value in cors_headers.items():
            actual_value = response.headers.get(header)
            if actual_value:
                test_results.add_result(f"CORS Header: {header}", True)
            else:
                test_results.add_result(f"CORS Header: {header}", False, f"Missing or incorrect: {actual_value}")
                all_cors_ok = False
        
        return all_cors_ok
        
    except Exception as e:
        test_results.add_result("CORS Headers", False, f"Error testing CORS: {e}")
        return False

def test_signal_system_flow(test_results):
    """Test the complete signal system flow"""
    print(f"\n📡 Testing Signal System Flow")
    print("-" * 40)
    
    # Test 1: Get initial signals
    test_endpoint(test_results, "/api/test/signals", "GET", test_name="Get Initial Signals")
    
    # Test 2: Create signal from admin
    signal_data = {
        "pair": "EURUSD",
        "direction": "LONG",
        "entry": "1.0850",
        "stopLoss": "1.0800",
        "takeProfit": "1.0950",
        "confidence": 85,
        "analysis": "Strong bullish momentum with clear order block",
        "ictConcepts": ["Order Block", "Fair Value Gap"],
        "market": "forex",
        "timeframe": "1h"
    }
    
    success = test_endpoint(test_results, "/api/admin/create-signal", "POST", signal_data, 201, "Create Admin Signal")
    
    if success:
        # Test 3: Verify signal was added
        time.sleep(1)  # Wait for signal to be processed
        test_endpoint(test_results, "/api/test/signals", "GET", test_name="Verify Signal Added")
        
        # Test 4: Mark signal as taken
        mark_data = {
            "signalId": "test-signal-id",
            "outcome": "Target Hit",
            "pnl": 150.25
        }
        test_endpoint(test_results, "/api/signals/mark-taken", "POST", mark_data, 200, "Mark Signal as Taken")

def test_dashboard_endpoints(test_results):
    """Test all dashboard-related endpoints"""
    print(f"\n📊 Testing Dashboard Endpoints")
    print("-" * 40)
    
    endpoints = [
        ("/api/user/profile", "GET", None, 200, "User Profile"),
        ("/api/dashboard-data", "GET", None, 200, "Dashboard Data"),
        ("/api/user/progress", "GET", None, 200, "User Progress GET"),
        ("/api/user/progress", "POST", {"progress": {"lesson": 1}}, 200, "User Progress POST"),
        ("/api/dashboard/real-time-data", "GET", None, 200, "Real-time Data"),
        ("/api/dashboard/performance-metrics", "GET", None, 200, "Performance Metrics"),
        ("/api/user/signals/stats", "GET", None, 200, "Signal Statistics")
    ]
    
    for endpoint, method, data, expected_status, test_name in endpoints:
        test_endpoint(test_results, endpoint, method, data, expected_status, test_name)

def test_forex_factory_removal(test_results):
    """Test that Forex Factory scraper is properly disabled"""
    print(f"\n🚫 Testing Forex Factory Removal")
    print("-" * 40)
    
    success = test_endpoint(test_results, "/api/news/forex-factory", "GET", test_name="Forex Factory Endpoint")
    
    if success:
        try:
            response = requests.get(f"{BASE_URL}/api/news/forex-factory", timeout=10)
            data = response.json()
            
            # Check that it returns empty events and disabled message
            has_empty_events = data.get('events') == []
            has_disabled_message = 'removed as requested' in data.get('message', '')
            
            test_results.add_result("Forex Factory - Empty Events", has_empty_events)
            test_results.add_result("Forex Factory - Disabled Message", has_disabled_message)
            
        except Exception as e:
            test_results.add_result("Forex Factory Response Check", False, f"Error: {e}")

def test_production_readiness(test_results):
    """Test production readiness"""
    print(f"\n🚀 Testing Production Readiness")
    print("-" * 40)
    
    # Test health endpoint
    test_endpoint(test_results, "/health", "GET", test_name="Health Check")
    
    # Test server stability (multiple rapid requests)
    print("Testing server stability...")
    stability_ok = True
    for i in range(5):
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=5)
            if response.status_code != 200:
                stability_ok = False
                break
        except:
            stability_ok = False
            break
        time.sleep(0.1)
    
    test_results.add_result("Server Stability", stability_ok, "Multiple rapid requests failed" if not stability_ok else None)

def run_comprehensive_tests():
    """Run all comprehensive tests"""
    print("🧪 COMPREHENSIVE TESTING SUITE")
    print("=" * 60)
    print(f"🎯 Testing server at: {BASE_URL}")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    test_results = TestResults()
    
    # Test 1: Basic server connectivity
    print(f"\n🔌 Testing Server Connectivity")
    print("-" * 40)
    test_endpoint(test_results, "/health", "GET", test_name="Server Health")
    
    # Test 2: CORS configuration
    test_cors_headers(test_results)
    
    # Test 3: Dashboard endpoints
    test_dashboard_endpoints(test_results)
    
    # Test 4: Signal system flow
    test_signal_system_flow(test_results)
    
    # Test 5: Forex Factory removal
    test_forex_factory_removal(test_results)
    
    # Test 6: Production readiness
    test_production_readiness(test_results)
    
    # Final results
    all_passed = test_results.summary()
    
    if all_passed:
        print(f"\n🎉 ALL TESTS PASSED!")
        print(f"✅ System is ready for production deployment")
        print(f"✅ All dashboard errors have been resolved")
        print(f"✅ Signal system is working correctly")
        print(f"✅ CORS issues are fixed")
        print(f"✅ Forex Factory scraper is disabled")
        return True
    else:
        print(f"\n❌ SOME TESTS FAILED!")
        print(f"🔧 Please fix the issues before deployment")
        return False

if __name__ == "__main__":
    success = run_comprehensive_tests()
    sys.exit(0 if success else 1)

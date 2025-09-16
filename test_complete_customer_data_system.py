#!/usr/bin/env python3
"""
Comprehensive Test Script for Enhanced Customer Data Capture System
This script tests the complete data capture and display system
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5004"
ADMIN_MPIN = "180623"
CUSTOMER_SERVICE_MPIN = "123456"

def print_status(message, status="INFO"):
    """Print colored status messages"""
    colors = {
        "INFO": "\033[94m",
        "SUCCESS": "\033[92m",
        "WARNING": "\033[93m",
        "ERROR": "\033[91m",
        "RESET": "\033[0m"
    }
    
    status_symbols = {
        "INFO": "ℹ️",
        "SUCCESS": "✅",
        "WARNING": "⚠️",
        "ERROR": "❌"
    }
    
    print(f"{colors[status]}{status_symbols[status]} {message}{colors['RESET']}")

def test_health_endpoint():
    """Test the health endpoint"""
    print_status("Testing health endpoint...", "INFO")
    
    try:
        response = requests.get(f"{BASE_URL}/healthz", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "ok":
                print_status("Health check passed", "SUCCESS")
                return True
            else:
                print_status(f"Health check failed: {data}", "ERROR")
                return False
        else:
            print_status(f"Health check failed with status {response.status_code}", "ERROR")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"Health check failed: {e}", "ERROR")
        return False

def test_signup_data_capture():
    """Test signup data capture"""
    print_status("Testing signup data capture...", "INFO")
    
    test_data = {
        "firstName": "Test",
        "lastName": "User",
        "email": f"test_{int(time.time())}@example.com",
        "password": "TestPassword123!",
        "plan_type": "premium",
        "phone": "+1234567890",
        "signup_source": "test",
        "referral_code": "TEST123"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/customer-data/capture-signup",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            if data.get("success"):
                print_status("Signup data capture test passed", "SUCCESS")
                return data.get("customer_id")
            else:
                print_status(f"Signup data capture failed: {data}", "ERROR")
                return None
        else:
            print_status(f"Signup data capture failed with status {response.status_code}: {response.text}", "ERROR")
            return None
    except requests.exceptions.RequestException as e:
        print_status(f"Signup data capture failed: {e}", "ERROR")
        return None

def test_payment_data_capture(email):
    """Test payment data capture"""
    print_status("Testing payment data capture...", "INFO")
    
    test_data = {
        "email": email,
        "status": "completed",
        "payment_method": "stripe",
        "amount": 99.99,
        "transaction_id": f"txn_test_{int(time.time())}"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/customer-data/capture-payment",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print_status("Payment data capture test passed", "SUCCESS")
                return True
            else:
                print_status(f"Payment data capture failed: {data}", "ERROR")
                return False
        else:
            print_status(f"Payment data capture failed with status {response.status_code}: {response.text}", "ERROR")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"Payment data capture failed: {e}", "ERROR")
        return False

def test_questionnaire_data_capture(email):
    """Test questionnaire data capture"""
    print_status("Testing questionnaire data capture...", "INFO")
    
    test_data = {
        "email": email,
        "questionnaire_data": {
            "experience": "advanced",
            "goals": "profit",
            "risk_tolerance": "high",
            "trading_style": "scalping"
        },
        "account_type": "personal",
        "prop_firm": "Test Firm",
        "account_size": 10000,
        "trading_experience": "advanced",
        "risk_tolerance": "high",
        "trading_goals": "profit"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/customer-data/capture-questionnaire",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print_status("Questionnaire data capture test passed", "SUCCESS")
                return True
            else:
                print_status(f"Questionnaire data capture failed: {data}", "ERROR")
                return False
        else:
            print_status(f"Questionnaire data capture failed with status {response.status_code}: {response.text}", "ERROR")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"Questionnaire data capture failed: {e}", "ERROR")
        return False

def test_admin_access_protection():
    """Test admin access protection"""
    print_status("Testing admin access protection...", "INFO")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/customer-data/get-all",
            timeout=10
        )
        
        if response.status_code == 403:
            data = response.json()
            if "Admin access required" in data.get("error", ""):
                print_status("Admin access protection working", "SUCCESS")
                return True
            else:
                print_status(f"Admin access protection failed: {data}", "ERROR")
                return False
        else:
            print_status(f"Admin access protection failed with status {response.status_code}", "ERROR")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"Admin access protection test failed: {e}", "ERROR")
        return False

def test_admin_access_with_credentials():
    """Test admin access with credentials"""
    print_status("Testing admin access with credentials...", "INFO")
    
    headers = {
        "Content-Type": "application/json",
        "X-Admin-MPIN": ADMIN_MPIN,
        "X-Admin-Username": "admin"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/customer-data/get-all",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print_status("Admin access with credentials working", "SUCCESS")
                return data.get("customers", [])
            else:
                print_status(f"Admin access with credentials failed: {data}", "ERROR")
                return None
        else:
            print_status(f"Admin access with credentials failed with status {response.status_code}: {response.text}", "ERROR")
            return None
    except requests.exceptions.RequestException as e:
        print_status(f"Admin access with credentials test failed: {e}", "ERROR")
        return None

def test_customer_service_access():
    """Test customer service access"""
    print_status("Testing customer service access...", "INFO")
    
    headers = {
        "Content-Type": "application/json",
        "X-Admin-MPIN": CUSTOMER_SERVICE_MPIN,
        "X-Admin-Username": "customer-service"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/customer-data/get-all",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print_status("Customer service access working", "SUCCESS")
                return True
            else:
                print_status(f"Customer service access failed: {data}", "ERROR")
                return False
        else:
            print_status(f"Customer service access failed with status {response.status_code}: {response.text}", "ERROR")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"Customer service access test failed: {e}", "ERROR")
        return False

def test_data_export():
    """Test data export functionality"""
    print_status("Testing data export functionality...", "INFO")
    
    headers = {
        "Content-Type": "application/json",
        "X-Admin-MPIN": ADMIN_MPIN,
        "X-Admin-Username": "admin"
    }
    
    export_data = {
        "export_type": "all",
        "export_format": "json"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/customer-data/export",
            json=export_data,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print_status("Data export test passed", "SUCCESS")
                return True
            else:
                print_status(f"Data export failed: {data}", "ERROR")
                return False
        else:
            print_status(f"Data export failed with status {response.status_code}: {response.text}", "ERROR")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"Data export test failed: {e}", "ERROR")
        return False

def test_statistics():
    """Test statistics endpoint"""
    print_status("Testing statistics endpoint...", "INFO")
    
    headers = {
        "Content-Type": "application/json",
        "X-Admin-MPIN": ADMIN_MPIN,
        "X-Admin-Username": "admin"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/customer-data/stats",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                stats = data.get("stats", {})
                print_status("Statistics test passed", "SUCCESS")
                print_status(f"Total customers: {stats.get('total_customers', 0)}", "INFO")
                print_status(f"Payment verified: {stats.get('payment_verified', 0)}", "INFO")
                print_status(f"Data complete: {stats.get('data_capture_complete', 0)}", "INFO")
                return True
            else:
                print_status(f"Statistics test failed: {data}", "ERROR")
                return False
        else:
            print_status(f"Statistics test failed with status {response.status_code}: {response.text}", "ERROR")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"Statistics test failed: {e}", "ERROR")
        return False

def test_specific_customer_access(customer_id):
    """Test specific customer data access"""
    print_status("Testing specific customer data access...", "INFO")
    
    headers = {
        "Content-Type": "application/json",
        "X-Admin-MPIN": ADMIN_MPIN,
        "X-Admin-Username": "admin"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/customer-data/get/{customer_id}",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                customer = data.get("customer", {})
                print_status("Specific customer access test passed", "SUCCESS")
                print_status(f"Customer: {customer.get('name', 'Unknown')} ({customer.get('email', 'Unknown')})", "INFO")
                return True
            else:
                print_status(f"Specific customer access failed: {data}", "ERROR")
                return False
        else:
            print_status(f"Specific customer access failed with status {response.status_code}: {response.text}", "ERROR")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"Specific customer access test failed: {e}", "ERROR")
        return False

def main():
    """Main test function"""
    print_status("🧪 Starting Comprehensive Customer Data Capture System Tests", "INFO")
    print_status("=" * 60, "INFO")
    
    # Test results tracking
    tests_passed = 0
    tests_failed = 0
    total_tests = 0
    
    def run_test(test_func, *args):
        nonlocal tests_passed, tests_failed, total_tests
        total_tests += 1
        try:
            result = test_func(*args)
            if result:
                tests_passed += 1
                return result
            else:
                tests_failed += 1
                return None
        except Exception as e:
            print_status(f"Test failed with exception: {e}", "ERROR")
            tests_failed += 1
            return None
    
    # Run all tests
    print_status("Running system tests...", "INFO")
    
    # 1. Health check
    if not run_test(test_health_endpoint):
        print_status("Health check failed. Please ensure the service is running.", "ERROR")
        sys.exit(1)
    
    # 2. Signup data capture
    customer_id = run_test(test_signup_data_capture)
    if not customer_id:
        print_status("Signup data capture failed. Cannot continue with other tests.", "ERROR")
        sys.exit(1)
    
    # 3. Payment data capture
    test_email = f"test_{int(time.time())}@example.com"
    run_test(test_payment_data_capture, test_email)
    
    # 4. Questionnaire data capture
    run_test(test_questionnaire_data_capture, test_email)
    
    # 5. Admin access protection
    run_test(test_admin_access_protection)
    
    # 6. Admin access with credentials
    customers = run_test(test_admin_access_with_credentials)
    
    # 7. Customer service access
    run_test(test_customer_service_access)
    
    # 8. Data export
    run_test(test_data_export)
    
    # 9. Statistics
    run_test(test_statistics)
    
    # 10. Specific customer access
    if customer_id:
        run_test(test_specific_customer_access, customer_id)
    
    # Print test results
    print_status("=" * 60, "INFO")
    print_status("🎉 Test Results Summary", "INFO")
    print_status(f"Total Tests: {total_tests}", "INFO")
    print_status(f"Passed: {tests_passed}", "SUCCESS")
    print_status(f"Failed: {tests_failed}", "ERROR" if tests_failed > 0 else "SUCCESS")
    
    if tests_failed == 0:
        print_status("🎉 All tests passed! Enhanced Customer Data Capture System is working correctly.", "SUCCESS")
        print_status("", "INFO")
        print_status("🔐 Admin Access Information:", "INFO")
        print_status(f"   Admin MPIN: {ADMIN_MPIN}", "INFO")
        print_status(f"   Customer Service MPIN: {CUSTOMER_SERVICE_MPIN}", "INFO")
        print_status(f"   Service URL: {BASE_URL}", "INFO")
        print_status("", "INFO")
        print_status("📊 System Features Verified:", "SUCCESS")
        print_status("   ✅ Comprehensive data capture (signup, payment, questionnaire)", "SUCCESS")
        print_status("   ✅ Admin-only access controls", "SUCCESS")
        print_status("   ✅ Data export functionality", "SUCCESS")
        print_status("   ✅ Statistics and reporting", "SUCCESS")
        print_status("   ✅ Customer service access", "SUCCESS")
        print_status("   ✅ Security and authentication", "SUCCESS")
        return True
    else:
        print_status(f"❌ {tests_failed} test(s) failed. Please check the system configuration.", "ERROR")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

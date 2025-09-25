#!/usr/bin/env python3
"""
Frontend-Backend Connection Diagnostic Tool
This script will test all aspects of the frontend-backend connection
"""

import requests
import json
import time
import sys
from datetime import datetime

def print_header(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_result(test_name, success, message, details=None):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"\n{test_name}: {status}")
    print(f"  {message}")
    if details:
        print(f"  Details: {details}")

def test_backend_health():
    """Test if backend is running and responding"""
    print_header("BACKEND HEALTH CHECK")
    
    try:
        response = requests.get('http://localhost:8080/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_result("Backend Health", True, "Backend is running and healthy", 
                        f"Service: {data.get('service')}, Version: {data.get('version')}")
            return True
        else:
            print_result("Backend Health", False, f"Backend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_result("Backend Health", False, "Cannot connect to backend", 
                    "Make sure backend is running on port 8080")
        return False
    except Exception as e:
        print_result("Backend Health", False, f"Unexpected error: {str(e)}")
        return False

def test_cors_configuration():
    """Test CORS configuration"""
    print_header("CORS CONFIGURATION TEST")
    
    try:
        # Test OPTIONS request (preflight)
        response = requests.options('http://localhost:8080/api/user/register', 
                                  headers={
                                      'Origin': 'http://localhost:3000',
                                      'Access-Control-Request-Method': 'POST',
                                      'Access-Control-Request-Headers': 'Content-Type'
                                  }, timeout=5)
        
        if response.status_code == 200:
            cors_headers = {k: v for k, v in response.headers.items() 
                          if k.lower().startswith('access-control')}
            
            if cors_headers:
                print_result("CORS Preflight", True, "CORS preflight successful", 
                           f"Headers: {cors_headers}")
                return True
            else:
                print_result("CORS Preflight", False, "No CORS headers found")
                return False
        else:
            print_result("CORS Preflight", False, f"OPTIONS request failed with status {response.status_code}")
            return False
    except Exception as e:
        print_result("CORS Preflight", False, f"Error testing CORS: {str(e)}")
        return False

def test_api_endpoints():
    """Test API endpoints"""
    print_header("API ENDPOINTS TEST")
    
    # Test user registration
    try:
        test_data = {
            'firstName': 'Diagnostic',
            'lastName': 'Test',
            'email': f'diagnostic_test_{int(time.time())}@example.com',
            'password': 'test123',
            'phone': '1234567890',
            'company': 'Test Company',
            'country': 'US',
            'terms': True,
            'newsletter': False
        }
        
        response = requests.post('http://localhost:8080/api/user/register',
                               headers={'Content-Type': 'application/json'},
                               data=json.dumps(test_data), timeout=10)
        
        if response.status_code in [200, 201]:
            data = response.json()
            print_result("User Registration API", True, "Registration endpoint working", 
                        f"User ID: {data.get('user_id')}")
            return True
        else:
            print_result("User Registration API", False, 
                        f"Registration failed with status {response.status_code}", 
                        response.text[:200])
            return False
    except Exception as e:
        print_result("User Registration API", False, f"Error testing registration: {str(e)}")
        return False

def test_database_connection():
    """Test database connection"""
    print_header("DATABASE CONNECTION TEST")
    
    try:
        response = requests.get('http://localhost:8080/api/simple/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get('database') == 'connected':
                print_result("Database Connection", True, "Database is connected and healthy")
                return True
            else:
                print_result("Database Connection", False, "Database status indicates disconnection")
                return False
        else:
            print_result("Database Connection", False, f"Database health check failed with status {response.status_code}")
            return False
    except Exception as e:
        print_result("Database Connection", False, f"Error testing database: {str(e)}")
        return False

def test_frontend_backend_integration():
    """Test complete frontend-backend integration"""
    print_header("FRONTEND-BACKEND INTEGRATION TEST")
    
    try:
        # Simulate a frontend request with proper headers
        test_data = {
            'firstName': 'Integration',
            'lastName': 'Test',
            'email': f'integration_test_{int(time.time())}@example.com',
            'password': 'test123',
            'phone': '1234567890',
            'company': 'Test Company',
            'country': 'US',
            'terms': True,
            'newsletter': False
        }
        
        response = requests.post('http://localhost:8080/api/user/register',
                               headers={
                                   'Content-Type': 'application/json',
                                   'Origin': 'http://localhost:3000',
                                   'User-Agent': 'Mozilla/5.0 (Frontend Test)'
                               },
                               data=json.dumps(test_data), timeout=10)
        
        if response.status_code in [200, 201]:
            data = response.json()
            print_result("Frontend-Backend Integration", True, 
                        "Complete integration test successful", 
                        f"User created with ID: {data.get('user_id')}")
            return True
        else:
            print_result("Frontend-Backend Integration", False, 
                        f"Integration test failed with status {response.status_code}")
            return False
    except Exception as e:
        print_result("Frontend-Backend Integration", False, f"Integration test error: {str(e)}")
        return False

def main():
    """Run all diagnostic tests"""
    print("🔍 Frontend-Backend Connection Diagnostic Tool")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Run all tests
    results['backend_health'] = test_backend_health()
    results['cors_config'] = test_cors_configuration()
    results['api_endpoints'] = test_api_endpoints()
    results['database_connection'] = test_database_connection()
    results['integration'] = test_frontend_backend_integration()
    
    # Summary
    print_header("DIAGNOSTIC SUMMARY")
    
    passed_tests = sum(1 for result in results.values() if result)
    total_tests = len(results)
    
    print(f"\nTest Results: {passed_tests}/{total_tests} tests passed")
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name.replace('_', ' ').title()}: {status}")
    
    if passed_tests == total_tests:
        print(f"\n🎉 ALL TESTS PASSED!")
        print("✅ Frontend-Backend connection is working perfectly!")
        print("\nRecommendations:")
        print("• Your application is ready for use")
        print("• All API endpoints are functional")
        print("• CORS is properly configured")
        print("• Database connection is stable")
    else:
        print(f"\n❌ {total_tests - passed_tests} TESTS FAILED")
        print("⚠️  Frontend-Backend connection has issues")
        print("\nRecommendations:")
        print("• Check the failed tests above for specific issues")
        print("• Ensure backend server is running: python3 app.py")
        print("• Verify database connection and configuration")
        print("• Check CORS settings in backend configuration")
        print("• Review API endpoint implementations")
    
    print(f"\nDiagnostic completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

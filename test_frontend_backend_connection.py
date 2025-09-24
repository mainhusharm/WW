#!/usr/bin/env python3
"""
Test Frontend-Backend Connection
Tests if the frontend can properly connect to the backend API endpoints
"""

import requests
import json
import time

def test_backend_endpoints():
    """Test all backend API endpoints"""
    base_url = "http://localhost:8080"
    
    print("🔍 Testing Frontend-Backend Connection...")
    print("=" * 50)
    
    # Test endpoints
    endpoints = [
        ("/health", "GET", "Health Check"),
        ("/api/user/register", "POST", "User Registration"),
        ("/api/user/questionnaire", "POST", "Questionnaire Submission"),
        ("/api/payment/verify-payment", "POST", "Payment Processing"),
        ("/api/customers", "GET", "Get Customers"),
        ("/api/user/health", "GET", "User Health Check")
    ]
    
    results = []
    
    for endpoint, method, description in endpoints:
        url = f"{base_url}{endpoint}"
        print(f"\n🔍 Testing {description}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        
        try:
            if method == "GET":
                response = requests.get(url, timeout=10)
            elif method == "POST":
                # Test with sample data
                test_data = {
                    "email": f"test_{int(time.time())}@example.com",
                    "password": "test123",
                    "firstName": "Test",
                    "lastName": "User"
                }
                response = requests.post(url, json=test_data, timeout=10)
            
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            
            if response.status_code in [200, 201, 400, 409]:  # Valid responses
                results.append((endpoint, "✅ Success", response.status_code))
            else:
                results.append((endpoint, "❌ Error", response.status_code))
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Connection Error: Cannot connect to {url}")
            results.append((endpoint, "❌ Connection Error", "N/A"))
        except requests.exceptions.Timeout:
            print(f"   ❌ Timeout: Request timed out")
            results.append((endpoint, "❌ Timeout", "N/A"))
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            results.append((endpoint, f"❌ Error: {str(e)}", "N/A"))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 CONNECTION TEST SUMMARY:")
    print("=" * 50)
    
    for endpoint, status, code in results:
        print(f"{status} {endpoint} ({code})")
    
    # Check if backend is running
    try:
        health_response = requests.get(f"{base_url}/health", timeout=5)
        if health_response.status_code == 200:
            print(f"\n✅ Backend is running and accessible at {base_url}")
        else:
            print(f"\n⚠️ Backend responded with status {health_response.status_code}")
    except:
        print(f"\n❌ Backend is not accessible at {base_url}")
        print("   Make sure the backend server is running with: python3 app.py")

def test_frontend_files():
    """Test if frontend files are properly configured"""
    print("\n🔍 Testing Frontend Configuration...")
    print("=" * 50)
    
    frontend_files = [
        "signup-enhanced.html",
        "questionnaire.html", 
        "payment.html"
    ]
    
    for file in frontend_files:
        try:
            with open(file, 'r') as f:
                content = f.read()
                
            # Check for localhost:8080
            if 'localhost:8080' in content:
                print(f"✅ {file}: Correctly configured for localhost:8080")
            elif 'localhost:5000' in content:
                print(f"⚠️ {file}: Still using localhost:5000 (needs update)")
            elif 'render.com' in content:
                print(f"❌ {file}: Still using render.com URLs (needs update)")
            else:
                print(f"❓ {file}: No clear API configuration found")
                
        except FileNotFoundError:
            print(f"❌ {file}: File not found")
        except Exception as e:
            print(f"❌ {file}: Error reading file - {str(e)}")

def main():
    """Main test function"""
    print("🚀 Frontend-Backend Connection Test")
    print("=" * 50)
    
    # Test backend endpoints
    test_backend_endpoints()
    
    # Test frontend configuration
    test_frontend_files()
    
    print("\n🎯 RECOMMENDATIONS:")
    print("=" * 50)
    print("1. Make sure backend is running: python3 app.py")
    print("2. Open frontend files in browser to test actual functionality")
    print("3. Check browser console for any JavaScript errors")
    print("4. Verify CORS is properly configured in backend")

if __name__ == "__main__":
    main()

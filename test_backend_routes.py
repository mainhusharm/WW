#!/usr/bin/env python3
"""
Test script to check if backend routes are working
"""

import requests
import time
import json

def test_backend_routes():
    """Test all backend routes"""
    base_url = 'http://localhost:8080'
    
    print("🔍 Testing Backend Routes")
    print("=" * 50)
    
    # Test health endpoint
    try:
        response = requests.get(f'{base_url}/health')
        print(f"Health: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Health: Error - {e}")
    
    # Test form routes
    form_routes = [
        '/questionnaire',
        '/payment', 
        '/test',
        '/working-signup',
        '/frontend_working_form.html'
    ]
    
    print("\n📄 Testing Form Routes:")
    for route in form_routes:
        try:
            response = requests.get(f'{base_url}{route}')
            print(f"{route}: {response.status_code}")
            if response.status_code == 200:
                print(f"  ✅ Working - Content length: {len(response.text)}")
            else:
                print(f"  ❌ Failed - {response.text[:100]}")
        except Exception as e:
            print(f"{route}: Error - {e}")
    
    # Test API endpoints
    print("\n🔌 Testing API Endpoints:")
    api_routes = [
        '/api/user/register',
        '/api/simple/questionnaire',
        '/api/simple/payments',
        '/api/simple/dashboard'
    ]
    
    for route in api_routes:
        try:
            response = requests.get(f'{base_url}{route}')
            print(f"{route}: {response.status_code}")
            if response.status_code == 405:
                print(f"  ✅ Exists (requires POST)")
            elif response.status_code == 200:
                print(f"  ✅ Working")
            else:
                print(f"  ❌ Failed - {response.text[:100]}")
        except Exception as e:
            print(f"{route}: Error - {e}")
    
    # Test actual data flow
    print("\n📊 Testing Data Flow:")
    try:
        test_data = {
            'firstName': 'Route',
            'lastName': 'Test',
            'email': f'route_test_{int(time.time())}@example.com',
            'password': 'test123',
            'phone': '1234567890',
            'company': 'Test Company',
            'country': 'US',
            'terms': True,
            'newsletter': False
        }
        
        response = requests.post(f'{base_url}/api/user/register',
                               headers={'Content-Type': 'application/json'},
                               data=json.dumps(test_data))
        print(f"Registration: {response.status_code}")
        if response.status_code in [200, 201]:
            data = response.json()
            print(f"  ✅ Success - User ID: {data.get('user_id')}")
        else:
            print(f"  ❌ Failed - {response.text[:100]}")
    except Exception as e:
        print(f"Registration: Error - {e}")

if __name__ == "__main__":
    test_backend_routes()

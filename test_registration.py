#!/usr/bin/env python3
"""
Test script to debug registration endpoint
"""

import requests
import json

def test_registration():
    """Test the registration endpoint"""
    
    # Test data
    test_data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "firstName": "Test",
        "lastName": "User",
        "phone": "1234567890",
        "company": "Test Company",
        "country": "US",
        "agreeToMarketing": True,
        "plan_type": "premium"
    }
    
    # API endpoint
    url = "https://backend-d4fm.onrender.com/api/auth/register"
    
    print("Testing registration endpoint...")
    print(f"URL: {url}")
    print(f"Data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(
            url,
            json=test_data,
            headers={
                'Content-Type': 'application/json',
            },
            timeout=30
        )
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"Response Data: {json.dumps(response_data, indent=2)}")
        except:
            print(f"Response Text: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    test_registration()

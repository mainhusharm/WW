#!/usr/bin/env python3
"""
Initialize database on Render backend
"""

import requests
import json

def init_database():
    """Initialize the database"""
    
    url = "https://backend-d4fm.onrender.com/api/init-db"
    
    print("Initializing database...")
    print(f"URL: {url}")
    
    try:
        response = requests.post(
            url,
            headers={
                'Content-Type': 'application/json',
            },
            timeout=60
        )
        
        print(f"\nResponse Status: {response.status_code}")
        
        try:
            response_data = response.json()
            print(f"Response Data: {json.dumps(response_data, indent=2)}")
        except:
            print(f"Response Text: {response.text}")
            
        if response.status_code == 200:
            print("✅ Database initialized successfully!")
        else:
            print("❌ Database initialization failed!")
            
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    init_database()
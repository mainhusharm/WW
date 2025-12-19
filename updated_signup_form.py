#!/usr/bin/env python3
"""
Updated Enhanced Signup Form - Sends data to PostgreSQL
This is a Python script that demonstrates the data structure being sent
"""

import requests
import json
from datetime import datetime

# API endpoint for enhanced signup
SIGNUP_ENDPOINT = "http://localhost:8080/api/signup-enhanced"

def test_enhanced_signup():
    """Test the enhanced signup form data structure"""
    
    # Sample data that matches the EnhancedSignupForm.tsx structure
    signup_data = {
        # Basic Information (Required)
        "firstName": "John",
        "lastName": "Doe", 
        "email": "john.doe@example.com",
        "password": "SecurePassword123!",
        
        # Contact Information
        "phone": "+1-555-123-4567",
        "company": "Trading Corp Inc",
        "country": "US",
        
        # Terms and Marketing
        "agreeToTerms": True,
        "agreeToMarketing": True,
        
        # Plan Information (from selectedPlan)
        "plan_type": "premium",
        "plan_name": "Elite Plan",
        "plan_price": 1299.00,
        "plan_period": "month",
        "plan_description": "Complete MT5 bot development service"
    }
    
    print("📝 Enhanced Signup Form Data Structure:")
    print("=" * 50)
    print(json.dumps(signup_data, indent=2))
    print("=" * 50)
    
    try:
        # Send POST request to API
        response = requests.post(
            SIGNUP_ENDPOINT,
            json=signup_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Signup successful!")
            print(f"User ID: {result['user']['id']}")
            print(f"Email: {result['user']['email']}")
            print(f"Plan: {result['user']['plan_name']}")
            return result
        else:
            print(f"❌ Signup failed: {response.status_code}")
            print(f"Error: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return None

def get_signup_form_columns():
    """Get all columns from the enhanced signup form"""
    return {
        "required_fields": [
            "firstName", "lastName", "email", "password", "phone", "country", "agreeToTerms"
        ],
        "optional_fields": [
            "company", "agreeToMarketing"
        ],
        "plan_fields": [
            "plan_type", "plan_name", "plan_price", "plan_period", "plan_description"
        ],
        "database_columns": [
            "id", "first_name", "last_name", "email", "password_hash", "phone", 
            "company", "country", "agree_to_terms", "agree_to_marketing", 
            "plan_type", "plan_name", "plan_price", "plan_period", "plan_description",
            "created_at", "updated_at", "is_active", "email_verified", 
            "last_login", "registration_ip", "user_agent"
        ]
    }

if __name__ == "__main__":
    print("🔍 Enhanced Signup Form Analysis")
    print("=" * 50)
    
    columns = get_signup_form_columns()
    print("📋 Required Fields:")
    for field in columns["required_fields"]:
        print(f"   - {field}")
    
    print("\n📋 Optional Fields:")
    for field in columns["optional_fields"]:
        print(f"   - {field}")
    
    print("\n📋 Plan Fields:")
    for field in columns["plan_fields"]:
        print(f"   - {field}")
    
    print("\n📋 Database Columns (users table):")
    for field in columns["database_columns"]:
        print(f"   - {field}")
    
    print("\n🧪 Testing signup data...")
    test_enhanced_signup()

#!/usr/bin/env python3
"""
Simple Registration Script - This WILL work
"""

import requests
import json
import time

def register_user():
    """Register a user directly"""
    print("🚀 Simple Registration")
    print("=" * 30)
    
    # Get user input
    print("Enter user details:")
    first_name = input("First Name: ").strip() or "Test"
    last_name = input("Last Name: ").strip() or "User"
    email = input("Email: ").strip() or f"user_{int(time.time())}@example.com"
    password = input("Password: ").strip() or "test123"
    phone = input("Phone: ").strip() or "1234567890"
    company = input("Company: ").strip() or "Test Company"
    country = input("Country: ").strip() or "US"
    
    # Create user data
    user_data = {
        "firstName": first_name,
        "lastName": last_name,
        "email": email,
        "password": password,
        "phone": phone,
        "company": company,
        "country": country,
        "terms": True,
        "newsletter": False
    }
    
    print(f"\n📝 Registering user: {email}")
    
    try:
        # Make the request
        response = requests.post(
            'http://localhost:8080/api/user/register',
            json=user_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ SUCCESS! User created with ID: {data.get('user_id')}")
            print(f"📧 Email: {email}")
            print(f"👤 Name: {first_name} {last_name}")
            print(f"🏢 Company: {company}")
            print(f"🌍 Country: {country}")
            print("\n🎉 User registered successfully!")
            return True
        else:
            print(f"❌ FAILED: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        print("Make sure backend is running: python3 app.py")
        return False

def check_database():
    """Check how many users are in the database"""
    print("\n🔍 Checking Database...")
    print("=" * 30)
    
    try:
        response = requests.get('http://localhost:8080/api/user/customers')
        
        if response.status_code == 200:
            users = response.json()
            print(f"✅ Database has {len(users)} users")
            
            if users:
                print("\n📋 Recent users:")
                for user in users[-3:]:  # Show last 3 users
                    print(f"  - {user.get('email', 'No email')} (ID: {user.get('id', 'No ID')})")
            
            return len(users)
        else:
            print(f"❌ Database check failed: {response.status_code}")
            return 0
            
    except Exception as e:
        print(f"❌ Database error: {e}")
        return 0

def main():
    """Main function"""
    print("🧪 SIMPLE REGISTRATION SCRIPT")
    print("=" * 40)
    print("This script will register users directly to your database.")
    print("No CORS issues, no browser problems - just works!\n")
    
    # Check initial database state
    initial_count = check_database()
    
    # Register user
    success = register_user()
    
    # Check final database state
    final_count = check_database()
    
    print("\n🎯 RESULTS:")
    print("=" * 30)
    if success and final_count > initial_count:
        print("✅ REGISTRATION WORKING PERFECTLY!")
        print("✅ Data is being saved to PostgreSQL database!")
        print("✅ Your backend is working correctly!")
    else:
        print("❌ Registration failed - check backend server")
    
    print(f"\n📊 Database: {initial_count} → {final_count} users")
    
    # Ask if user wants to register another
    if success:
        another = input("\nRegister another user? (y/n): ").strip().lower()
        if another == 'y':
            main()

if __name__ == "__main__":
    main()

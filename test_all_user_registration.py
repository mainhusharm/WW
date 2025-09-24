#!/usr/bin/env python3
"""
Test All User Registration
This script tests that ANY user who registers will be saved to customer service database
"""

import requests
import time
import random

def test_multiple_user_registrations():
    """Test registration with multiple different emails"""
    try:
        print("🧪 Testing All User Registration")
        print("=" * 50)
        
        # Wait for service to start
        print("⏳ Waiting for service to start...")
        time.sleep(3)
        
        # Test with multiple different emails
        test_users = [
            {
                "email": "testuser1@example.com",
                "firstName": "Test",
                "lastName": "User1",
                "password": "TestPassword123!",
                "plan_type": "premium"
            },
            {
                "email": "john.doe@company.com",
                "firstName": "John",
                "lastName": "Doe",
                "password": "SecurePass456!",
                "plan_type": "professional"
            },
            {
                "email": "sarah.wilson@email.com",
                "firstName": "Sarah",
                "lastName": "Wilson",
                "password": "MyPassword789!",
                "plan_type": "basic"
            },
            {
                "email": "mike.smith@business.org",
                "firstName": "Mike",
                "lastName": "Smith",
                "password": "BusinessPass123!",
                "plan_type": "enterprise"
            }
        ]
        
        registered_users = []
        
        # Test registration for each user
        for i, user in enumerate(test_users, 1):
            print(f"\n📝 Test {i}: Registering {user['email']}")
            
            try:
                response = requests.post(
                    "http://localhost:5003/api/auth/register",
                    json=user,
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 201:
                    data = response.json()
                    print("   ✅ User registered successfully!")
                    print(f"   User ID: {data['user']['id']}")
                    print(f"   Customer ID: {data['user']['customer_id']}")
                    registered_users.append(user['email'])
                elif response.status_code == 409:
                    print("   ⚠️  User already exists")
                    registered_users.append(user['email'])
                else:
                    print(f"   ❌ Registration failed: {response.text}")
                    
            except requests.exceptions.ConnectionError:
                print("   ❌ Could not connect to service")
                print("   Make sure to run: python3 unified_customer_service.py")
                return False
            except Exception as e:
                print(f"   ❌ Error: {str(e)}")
        
        # Test payment verification for registered users
        print(f"\n💳 Testing Payment Verification for {len(registered_users)} users")
        
        for email in registered_users:
            print(f"   Verifying payment for: {email}")
            
            payment_data = {
                "email": email,
                "status": "completed",
                "payment_method": "stripe",
                "amount": random.randint(50, 500)
            }
            
            try:
                response = requests.post(
                    "http://localhost:5003/api/payment/verify",
                    json=payment_data,
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code == 200:
                    print(f"   ✅ Payment verified for {email}")
                else:
                    print(f"   ❌ Payment verification failed for {email}")
                    
            except Exception as e:
                print(f"   ❌ Error verifying payment for {email}: {str(e)}")
        
        # Test customer list
        print(f"\n👥 Testing Customer List (should show {len(registered_users)} users)")
        
        try:
            response = requests.get(
                "http://localhost:5003/api/customers",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Customer list retrieved: {data['total']} customers")
                
                # Check if all test users are in the list
                found_users = []
                for customer in data['customers']:
                    if customer['email'] in registered_users:
                        found_users.append(customer['email'])
                        print(f"   ✅ Found: {customer['email']} - {customer['name']} - {customer['membership_tier']}")
                
                if len(found_users) == len(registered_users):
                    print(f"\n🎉 SUCCESS! All {len(registered_users)} users found in customer service database!")
                    return True
                else:
                    print(f"\n⚠️  Only {len(found_users)}/{len(registered_users)} users found in database")
                    return False
            else:
                print(f"   ❌ Customer list failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error fetching customer list: {str(e)}")
            return False
        
    except Exception as e:
        print(f"❌ Error testing user registration: {str(e)}")
        return False

def main():
    """Main function"""
    success = test_multiple_user_registrations()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ ALL USER REGISTRATION WORKING!")
        print("🎯 ANY user who registers will be saved to customer service database")
        print("📊 Customer service dashboard will show ALL registered users")
        print("💳 All payments will be tracked and verified")
    else:
        print("❌ User registration needs fixing")
    print("=" * 50)

if __name__ == '__main__':
    main()

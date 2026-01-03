#!/usr/bin/env python3
"""
Test Customer Service Integration
"""

import requests
import time

def test_customer_service():
    """Test the customer service integration"""
    try:
        print("🧪 Testing Customer Service Integration")
        print("=" * 50)
        
        # Wait for service to start
        print("⏳ Waiting for service to start...")
        time.sleep(5)
        
        # Test 1: Register user
        print("📝 Test 1: User Registration")
        test_user = {
            "email": "anchalw11@gmail.com",
            "password": "TestPassword123!",
            "firstName": "Anchal",
            "lastName": "Sharma",
            "plan_type": "premium"
        }
        
        try:
            response = requests.post(
                "http://localhost:5003/api/auth/register",
                json=test_user,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 201:
                data = response.json()
                print("   ✅ User registered successfully!")
                print(f"   User ID: {data['user']['id']}")
                print(f"   Customer ID: {data['user']['customer_id']}")
                customer_id = data['user']['customer_id']
            elif response.status_code == 409:
                print("   ⚠️  User already exists")
                customer_id = "existing"
            else:
                print(f"   ❌ Registration failed: {response.text}")
                return False
                
        except requests.exceptions.ConnectionError:
            print("   ❌ Could not connect to service")
            print("   Make sure to run: python3 unified_customer_service.py")
            return False
        
        # Test 2: Verify payment
        print("\n💳 Test 2: Payment Verification")
        payment_data = {
            "email": "anchalw11@gmail.com",
            "status": "completed",
            "payment_method": "stripe",
            "amount": 99
        }
        
        try:
            response = requests.post(
                "http://localhost:5003/api/payment/verify",
                json=payment_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                print("   ✅ Payment verified successfully!")
            else:
                print(f"   ❌ Payment verification failed: {response.text}")
                return False
                
        except requests.exceptions.ConnectionError:
            print("   ❌ Could not connect to service")
            return False
        
        # Test 3: Get customers list
        print("\n👥 Test 3: Customer List")
        try:
            response = requests.get(
                "http://localhost:5003/api/customers",
                timeout=10
            )
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Customer list retrieved: {data['total']} customers")
                
                # Check if our test user is in the list
                test_customer = None
                for customer in data['customers']:
                    if customer['email'] == 'anchalw11@gmail.com':
                        test_customer = customer
                        break
                
                if test_customer:
                    print("   ✅ Test user found in customer list!")
                    print(f"   Name: {test_customer['name']}")
                    print(f"   Status: {test_customer['status']}")
                    print(f"   Payment Status: {test_customer['payment_status']}")
                    print(f"   Membership: {test_customer['membership_tier']}")
                    return True
                else:
                    print("   ❌ Test user not found in customer list")
                    return False
            else:
                print(f"   ❌ Customer list failed: {response.text}")
                return False
                
        except requests.exceptions.ConnectionError:
            print("   ❌ Could not connect to service")
            return False
        
    except Exception as e:
        print(f"❌ Error testing customer service: {str(e)}")
        return False

def main():
    """Main function"""
    success = test_customer_service()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ CUSTOMER SERVICE INTEGRATION WORKING!")
        print("🔧 Users will now be saved to customer-service database")
        print("📊 Customer-service dashboard will show all registered users")
    else:
        print("❌ Customer service integration needs fixing")
    print("=" * 50)

if __name__ == '__main__':
    main()

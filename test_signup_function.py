#!/usr/bin/env python3
"""
Test script for the signup to customer service database function
"""

import sys
import os
from signup_to_customer_service import save_signup_to_customer_service, create_customer_service_tables

def test_signup_function():
    """Test the signup function with various scenarios"""
    
    print("🧪 Testing Signup to Customer Service Database Function")
    print("=" * 60)
    
    # Test 1: Valid signup
    print("\n1️⃣ Testing valid signup...")
    result1 = save_signup_to_customer_service(
        email="test1@example.com",
        password="password123",
        firstName="John",
        lastName="Doe",
        plan_type="premium"
    )
    
    if result1["success"]:
        print(f"✅ Valid signup successful!")
        print(f"   Customer ID: {result1['customer_id']}")
        print(f"   Unique ID: {result1['unique_id']}")
        print(f"   Username: {result1['username']}")
    else:
        print(f"❌ Valid signup failed: {result1['error']}")
    
    # Test 2: Duplicate email
    print("\n2️⃣ Testing duplicate email...")
    result2 = save_signup_to_customer_service(
        email="test1@example.com",  # Same email as above
        password="password456",
        firstName="Jane",
        lastName="Smith",
        plan_type="basic"
    )
    
    if not result2["success"] and "already exists" in result2["error"]:
        print("✅ Duplicate email correctly rejected!")
    else:
        print(f"❌ Duplicate email test failed: {result2}")
    
    # Test 3: Different user
    print("\n3️⃣ Testing different user...")
    result3 = save_signup_to_customer_service(
        email="test2@example.com",
        password="password789",
        firstName="Alice",
        lastName="Johnson",
        plan_type="free"
    )
    
    if result3["success"]:
        print(f"✅ Different user signup successful!")
        print(f"   Customer ID: {result3['customer_id']}")
        print(f"   Username: {result3['username']}")
    else:
        print(f"❌ Different user signup failed: {result3['error']}")
    
    # Test 4: Empty fields (should be handled by caller)
    print("\n4️⃣ Testing edge cases...")
    result4 = save_signup_to_customer_service(
        email="test3@example.com",
        password="password",
        firstName="",  # Empty first name
        lastName="",   # Empty last name
        plan_type="premium"
    )
    
    if result4["success"]:
        print(f"✅ Empty names handled correctly!")
        print(f"   Username: {result4['username']}")
    else:
        print(f"❌ Empty names test failed: {result4['error']}")
    
    # Test 5: Check database tables
    print("\n5️⃣ Checking database tables...")
    try:
        import sqlite3
        conn = sqlite3.connect("trading_platform.db")
        cursor = conn.cursor()
        
        # Check customers table
        cursor.execute("SELECT COUNT(*) FROM customers")
        customer_count = cursor.fetchone()[0]
        print(f"   Customers table: {customer_count} records")
        
        # Check customer_service_data table
        cursor.execute("SELECT COUNT(*) FROM customer_service_data")
        service_count = cursor.fetchone()[0]
        print(f"   Customer service data table: {service_count} records")
        
        # Show sample data
        cursor.execute("SELECT id, name, email, membership_tier, status FROM customers ORDER BY id DESC LIMIT 3")
        customers = cursor.fetchall()
        print(f"\n   Recent customers:")
        for customer in customers:
            print(f"     ID: {customer[0]}, Name: {customer[1]}, Email: {customer[2]}, Tier: {customer[3]}, Status: {customer[4]}")
        
        conn.close()
        print("✅ Database tables checked successfully!")
        
    except Exception as e:
        print(f"❌ Database check failed: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Test completed!")
    print("\nTo view the database:")
    print("   sqlite3 trading_platform.db")
    print("   .tables")
    print("   SELECT * FROM customers;")
    print("   SELECT * FROM customer_service_data;")

if __name__ == "__main__":
    test_signup_function()

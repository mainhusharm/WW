#!/usr/bin/env python3
"""
Test script for the Customer Service API
"""

import requests
import json
import time

BASE_URL = "http://localhost:3005"

def test_health_endpoint():
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health Check: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Status: {data.get('status')}")
            print(f"Database: {data.get('database')}")
            print(f"Customer Count: {data.get('customer_count')}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Health check failed: {e}")

def test_customers_endpoint():
    """Test the customers endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/customers")
        print(f"\nCustomers Endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Total customers: {data.get('total', 0)}")
            customers = data.get('customers', [])
            print(f"Customers returned: {len(customers)}")
            if customers:
                print(f"First customer: {customers[0].get('name', 'N/A')}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Customers endpoint failed: {e}")

def test_search_endpoint():
    """Test the search endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/customers/search?search=john")
        print(f"\nSearch Endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            customers = data.get('customers', [])
            print(f"Search results: {len(customers)}")
            if customers:
                print(f"Found: {customers[0].get('name', 'N/A')}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Search endpoint failed: {e}")

if __name__ == "__main__":
    print("Testing Customer Service API...")
    print("=" * 40)
    
    test_health_endpoint()
    test_customers_endpoint()
    test_search_endpoint()
    
    print("\n" + "=" * 40)
    print("Test completed!")

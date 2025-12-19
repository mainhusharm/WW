#!/usr/bin/env python3
"""
Test script to verify landing stats API returns correct numbers
"""
import requests
import json

def test_landing_stats():
    """Test the landing stats API endpoint"""
    
    # Test local development
    local_url = "http://localhost:5000/api/landing/stats"
    
    # Test Render backend
    render_url = "https://backend-u4hy.onrender.com/api/landing/stats"
    
    print("🧪 Testing Landing Stats API")
    print("=" * 50)
    
    # Test local backend
    try:
        print(f"\n📍 Testing local backend: {local_url}")
        response = requests.get(local_url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Local API Response:")
            print(f"   Funded Accounts: {data.get('funded_accounts', 'N/A')}")
            print(f"   Success Rate: {data.get('success_rate', 'N/A')}%")
            print(f"   Total Funded: ${data.get('total_funded', 'N/A')}M")
            print(f"   Prop Firms: {data.get('prop_firms', 'N/A')}")
            print(f"   Successful Traders: {data.get('successful_traders', 'N/A')}")
            print(f"   Data Source: {data.get('data_source', 'N/A')}")
        else:
            print(f"❌ Local API Error: {response.status_code}")
    except Exception as e:
        print(f"❌ Local API Failed: {str(e)}")
    
    # Test Render backend
    try:
        print(f"\n🌐 Testing Render backend: {render_url}")
        response = requests.get(render_url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Render API Response:")
            print(f"   Funded Accounts: {data.get('funded_accounts', 'N/A')}")
            print(f"   Success Rate: {data.get('success_rate', 'N/A')}%")
            print(f"   Total Funded: ${data.get('total_funded', 'N/A')}M")
            print(f"   Prop Firms: {data.get('prop_firms', 'N/A')}")
            print(f"   Successful Traders: {data.get('successful_traders', 'N/A')}")
            print(f"   Data Source: {data.get('data_source', 'N/A')}")
        else:
            print(f"❌ Render API Error: {response.status_code}")
    except Exception as e:
        print(f"❌ Render API Failed: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🎯 Expected Values:")
    print("   Funded Accounts: 2,847")
    print("   Success Rate: 86.7%")
    print("   Total Funded: $47.2M")
    print("   Prop Firms: 150")
    print("   Successful Traders: 2,847")

if __name__ == "__main__":
    test_landing_stats()

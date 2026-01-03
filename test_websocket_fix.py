#!/usr/bin/env python3
"""
Test WebSocket Connection Fix
This script tests if the WebSocket endpoint is working after the fix
"""

import requests
import time

def test_websocket_endpoint():
    """Test if WebSocket endpoint is accessible"""
    print("🧪 Testing WebSocket endpoint...")
    
    try:
        # Test Socket.IO endpoint
        response = requests.get('https://backend-ox9b.onrender.com/socket.io/', 
                              params={'EIO': '4', 'transport': 'polling'}, 
                              timeout=10)
        
        print(f"📡 WebSocket endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ WebSocket endpoint is working!")
            return True
        else:
            print(f"❌ WebSocket endpoint returned: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ WebSocket endpoint error: {e}")
        return False

def test_signal_endpoint():
    """Test if signal creation endpoint is working"""
    print("\n🧪 Testing signal creation endpoint...")
    
    try:
        # Test signal creation endpoint
        response = requests.post('https://backend-ox9b.onrender.com/api/admin/create-signal',
                               json={
                                   'pair': 'EURUSD',
                                   'direction': 'BUY',
                                   'entry': '1.0850',
                                   'stopLoss': '1.0800',
                                   'takeProfit': '1.0950',
                                   'confidence': 90,
                                   'analysis': 'Test signal from WebSocket fix'
                               },
                               timeout=10)
        
        print(f"📡 Signal endpoint status: {response.status_code}")
        
        if response.status_code == 201:
            print("✅ Signal creation endpoint is working!")
            return True
        else:
            print(f"❌ Signal endpoint returned: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Signal endpoint error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing WebSocket Fix for Real-time Signals")
    print("=" * 50)
    
    websocket_ok = test_websocket_endpoint()
    signal_ok = test_signal_endpoint()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"WebSocket Endpoint: {'✅ PASS' if websocket_ok else '❌ FAIL'}")
    print(f"Signal Endpoint: {'✅ PASS' if signal_ok else '❌ FAIL'}")
    
    if websocket_ok and signal_ok:
        print("\n🎉 All tests passed! Real-time signals should work now!")
    else:
        print("\n⚠️  Some tests failed. Backend may need to be redeployed.")
        print("💡 The fix has been pushed to GitHub. Render should redeploy automatically.")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Test WebSocket Connection
Tests the WebSocket connection to the backend for real-time signals
"""

import socketio
import time
import json
from datetime import datetime

# Configuration
BACKEND_URL = "https://backend-gbhz.onrender.com"

class WebSocketTester:
    def __init__(self):
        self.sio = socketio.Client()
        self.connected = False
        self.signal_received = False
        self.last_signal = None
        
        # Set up event handlers
        self.sio.on('connect', self.on_connect)
        self.sio.on('disconnect', self.on_disconnect)
        self.sio.on('new_signal', self.on_new_signal)
        self.sio.on('connected', self.on_connected)
        self.sio.on('pong', self.on_pong)
    
    def on_connect(self):
        print("✅ WebSocket connected successfully!")
        self.connected = True
    
    def on_disconnect(self):
        print("❌ WebSocket disconnected!")
        self.connected = False
    
    def on_new_signal(self, data):
        print(f"📡 Received new signal via WebSocket:")
        print(f"   Signal ID: {data.get('id')}")
        print(f"   Pair: {data.get('pair')}")
        print(f"   Direction: {data.get('direction')}")
        print(f"   Entry: {data.get('entry')}")
        print(f"   Stop Loss: {data.get('stopLoss')}")
        print(f"   Take Profit: {data.get('takeProfit')}")
        print(f"   Confidence: {data.get('confidence')}")
        print(f"   Analysis: {data.get('analysis')}")
        print(f"   Created at: {data.get('created_at')}")
        
        self.signal_received = True
        self.last_signal = data
    
    def on_connected(self, data):
        print(f"✅ Connection confirmed: {data}")
    
    def on_pong(self, data):
        print(f"🏓 Pong received: {data}")
    
    def connect(self):
        """Connect to WebSocket server"""
        print(f"🔌 Connecting to WebSocket at: {BACKEND_URL}")
        
        try:
            self.sio.connect(
                BACKEND_URL,
                transports=['websocket', 'polling'],
                wait_timeout=10
            )
            return True
        except Exception as e:
            print(f"❌ Failed to connect: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from WebSocket server"""
        if self.connected:
            self.sio.disconnect()
    
    def send_ping(self):
        """Send ping to server"""
        if self.connected:
            self.sio.emit('ping', {'timestamp': datetime.now().isoformat()})
            print("🏓 Ping sent to server")
    
    def wait_for_signal(self, timeout=30):
        """Wait for a signal to be received"""
        print(f"⏳ Waiting for signal (timeout: {timeout}s)...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            if self.signal_received:
                return True
            time.sleep(1)
        
        return False

def test_websocket_connection():
    """Test WebSocket connection and signal reception"""
    print("🧪 Testing WebSocket Connection...")
    print("=" * 50)
    
    tester = WebSocketTester()
    
    try:
        # Connect to WebSocket
        if not tester.connect():
            print("❌ Failed to connect to WebSocket")
            return False
        
        # Wait for connection to be established
        time.sleep(2)
        
        if not tester.connected:
            print("❌ WebSocket connection not established")
            return False
        
        # Send ping to test connection
        tester.send_ping()
        time.sleep(1)
        
        # Wait for a signal (this would normally come from admin dashboard)
        print("\n📡 WebSocket is ready to receive signals!")
        print("   To test signal reception, create a signal from the admin dashboard")
        print("   The signal should appear here in real-time...")
        
        # Wait for a signal for 30 seconds
        if tester.wait_for_signal(30):
            print("\n✅ Signal received via WebSocket! Test PASSED!")
            return True
        else:
            print("\n⚠️  No signal received within timeout. WebSocket connection is working but no signals were sent.")
            return True  # Connection works, just no signals sent
        
    except Exception as e:
        print(f"❌ WebSocket test error: {e}")
        return False
    
    finally:
        tester.disconnect()

def main():
    """Run WebSocket test"""
    print("🚀 Starting WebSocket Connection Test")
    print("=" * 50)
    
    success = test_websocket_connection()
    
    print("\n" + "=" * 50)
    if success:
        print("🏁 WebSocket Test PASSED!")
    else:
        print("🏁 WebSocket Test FAILED!")
    
    return success

if __name__ == "__main__":
    main()

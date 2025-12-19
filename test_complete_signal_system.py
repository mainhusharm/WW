#!/usr/bin/env python3
"""
Complete Signal System Test
Tests the entire signal flow from admin dashboard to user dashboard with WebSocket
"""

import requests
import json
import time
import socketio
from datetime import datetime

# Configuration
BACKEND_URL = "https://backend-bkt7.onrender.com"
ADMIN_SIGNAL_ENDPOINT = f"{BACKEND_URL}/api/admin/create-signal"
SIGNALS_ENDPOINT = f"{BACKEND_URL}/api/signals"

class SignalSystemTester:
    def __init__(self):
        self.sio = socketio.Client()
        self.websocket_connected = False
        self.signal_received_via_websocket = False
        self.last_websocket_signal = None
        
        # Set up WebSocket event handlers
        self.sio.on('connect', self.on_websocket_connect)
        self.sio.on('disconnect', self.on_websocket_disconnect)
        self.sio.on('new_signal', self.on_websocket_signal)
        self.sio.on('connected', self.on_websocket_connected)
    
    def on_websocket_connect(self):
        print("✅ WebSocket connected successfully!")
        self.websocket_connected = True
    
    def on_websocket_disconnect(self):
        print("❌ WebSocket disconnected!")
        self.websocket_connected = False
    
    def on_websocket_signal(self, data):
        print(f"📡 Signal received via WebSocket:")
        print(f"   ID: {data.get('id')}")
        print(f"   Pair: {data.get('pair')}")
        print(f"   Direction: {data.get('direction')}")
        print(f"   Entry: {data.get('entry')}")
        print(f"   Stop Loss: {data.get('stopLoss')}")
        print(f"   Take Profit: {data.get('takeProfit')}")
        print(f"   Confidence: {data.get('confidence')}")
        
        self.signal_received_via_websocket = True
        self.last_websocket_signal = data
    
    def on_websocket_connected(self, data):
        print(f"✅ WebSocket connection confirmed: {data}")
    
    def connect_websocket(self):
        """Connect to WebSocket server"""
        print(f"🔌 Connecting to WebSocket at: {BACKEND_URL}")
        
        try:
            self.sio.connect(
                BACKEND_URL,
                transports=['websocket', 'polling'],
                wait_timeout=10
            )
            time.sleep(2)  # Wait for connection to establish
            return self.websocket_connected
        except Exception as e:
            print(f"❌ WebSocket connection failed: {e}")
            return False
    
    def disconnect_websocket(self):
        """Disconnect from WebSocket server"""
        if self.websocket_connected:
            self.sio.disconnect()
    
    def test_backend_health(self):
        """Test backend health"""
        print("🧪 Testing Backend Health...")
        
        try:
            response = requests.get(f"{BACKEND_URL}/health", timeout=30)
            if response.status_code == 200:
                print("✅ Backend is healthy!")
                return True
            else:
                print(f"❌ Backend health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Backend health check error: {e}")
            return False
    
    def create_admin_signal(self):
        """Create a signal from admin dashboard"""
        print("🧪 Creating Admin Signal...")
        
        signal_data = {
            "pair": "GBPUSD",
            "direction": "LONG",
            "entry": "1.2650",
            "stopLoss": "1.2600",
            "takeProfit": "1.2750",
            "confidence": 88,
            "analysis": "Strong bullish momentum with ICT concepts: Order Block, Fair Value Gap, Liquidity Sweep",
            "ictConcepts": ["Order Block", "Fair Value Gap", "Liquidity Sweep"],
            "market": "forex",
            "timeframe": "1h"
        }
        
        try:
            response = requests.post(
                ADMIN_SIGNAL_ENDPOINT,
                json=signal_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 201:
                result = response.json()
                print(f"✅ Admin signal created successfully!")
                print(f"   Signal ID: {result.get('signal_id')}")
                print(f"   Created at: {result.get('created_at')}")
                return result.get('signal_id')
            else:
                print(f"❌ Failed to create admin signal: {response.status_code}")
                print(f"   Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error creating admin signal: {e}")
            return None
    
    def retrieve_signals(self):
        """Retrieve signals from user dashboard"""
        print("🧪 Retrieving Signals from User Dashboard...")
        
        try:
            response = requests.get(SIGNALS_ENDPOINT, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                signals = result.get('signals', [])
                print(f"✅ Retrieved {len(signals)} signals successfully!")
                
                if signals:
                    latest_signal = signals[0]
                    print(f"   Latest signal: {latest_signal.get('pair', 'N/A')} - {latest_signal.get('direction', 'N/A')}")
                    print(f"   Entry: {latest_signal.get('entry_price', 'N/A')}")
                    print(f"   Stop Loss: {latest_signal.get('stop_loss', 'N/A')}")
                    print(f"   Take Profit: {latest_signal.get('take_profit', 'N/A')}")
                
                return signals
            else:
                print(f"❌ Failed to retrieve signals: {response.status_code}")
                print(f"   Response: {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ Error retrieving signals: {e}")
            return []
    
    def wait_for_websocket_signal(self, timeout=10):
        """Wait for signal to be received via WebSocket"""
        print(f"⏳ Waiting for WebSocket signal (timeout: {timeout}s)...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            if self.signal_received_via_websocket:
                return True
            time.sleep(0.5)
        
        return False
    
    def run_complete_test(self):
        """Run the complete signal system test"""
        print("🚀 Starting Complete Signal System Test")
        print("=" * 60)
        
        # Test 1: Backend Health
        if not self.test_backend_health():
            print("\n❌ Backend is not healthy. Stopping tests.")
            return False
        
        # Test 2: WebSocket Connection
        print("\n" + "=" * 60)
        if not self.connect_websocket():
            print("⚠️  WebSocket connection failed, but continuing with HTTP tests...")
        
        # Test 3: Create Admin Signal
        print("\n" + "=" * 60)
        signal_id = self.create_admin_signal()
        
        if not signal_id:
            print("\n❌ Failed to create admin signal. Stopping tests.")
            return False
        
        # Test 4: Wait for WebSocket Signal
        if self.websocket_connected:
            print("\n" + "=" * 60)
            if self.wait_for_websocket_signal(10):
                print("✅ Signal received via WebSocket! Real-time delivery working!")
            else:
                print("⚠️  No signal received via WebSocket within timeout.")
        
        # Test 5: Retrieve Signals via HTTP
        print("\n" + "=" * 60)
        time.sleep(2)  # Wait for signal to be processed
        signals = self.retrieve_signals()
        
        # Test 6: Verify Signal in User Dashboard
        if signals:
            signal_found = any(s.get('id') == signal_id for s in signals)
            if signal_found:
                print(f"\n✅ Signal {signal_id} found in user dashboard!")
            else:
                print(f"\n⚠️  Signal {signal_id} created but not found in user dashboard.")
        
        # Test 7: Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY:")
        print(f"   Backend Health: ✅")
        print(f"   WebSocket Connection: {'✅' if self.websocket_connected else '❌'}")
        print(f"   Admin Signal Creation: {'✅' if signal_id else '❌'}")
        print(f"   WebSocket Signal Reception: {'✅' if self.signal_received_via_websocket else '❌'}")
        print(f"   HTTP Signal Retrieval: {'✅' if signals else '❌'}")
        print(f"   Signal Persistence: {'✅' if signals and len(signals) > 0 else '❌'}")
        
        # Overall result
        success_count = sum([
            True,  # Backend health
            self.websocket_connected,
            bool(signal_id),
            self.signal_received_via_websocket,
            bool(signals),
            bool(signals and len(signals) > 0)
        ])
        
        total_tests = 6
        success_rate = (success_count / total_tests) * 100
        
        print(f"\n🎯 Overall Success Rate: {success_count}/{total_tests} ({success_rate:.1f}%)")
        
        if success_rate >= 80:
            print("🏆 SIGNAL SYSTEM TEST PASSED!")
            return True
        else:
            print("❌ SIGNAL SYSTEM TEST FAILED!")
            return False

def main():
    """Run the complete signal system test"""
    tester = SignalSystemTester()
    
    try:
        success = tester.run_complete_test()
        return success
    finally:
        tester.disconnect_websocket()

if __name__ == "__main__":
    main()

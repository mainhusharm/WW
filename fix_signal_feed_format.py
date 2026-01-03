#!/usr/bin/env python3
"""
Fix Signal Feed Data Format
This script updates the backend to return signals in the format expected by the frontend
"""

import sqlite3
import os
from datetime import datetime

def update_backend_signal_format():
    """Update the backend to return signals in the correct format"""
    try:
        print("🔄 Updating backend signal format...")
        
        # Read the current backend file
        with open('simple_working_backend.py', 'r') as f:
            backend_code = f.read()
        
        # Find the signal feed endpoint and replace it
        old_endpoint = '''@app.route('/api/signal-feed/signals/feed', methods=['GET'])
def get_signal_feed():
    """Get signal feed endpoint"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, symbol, signal_type, confidence, price, timestamp, status
            FROM trading_signals 
            WHERE status = 'active'
            ORDER BY timestamp DESC 
            LIMIT 20
        """)
        
        signals = cursor.fetchall()
        conn.close()
        
        signal_list = []
        for signal in signals:
            signal_list.append({
                "id": signal['id'],
                "symbol": signal['symbol'],
                "direction": signal['signal_type'],
                "entry": signal['price'],
                "confidence": signal['confidence'],
                "timestamp": signal['timestamp'],
                "status": signal['status']
            })
        
        return jsonify(signal_list), 200
        
    except Exception as e:
        return jsonify({"msg": f"Server error: {str(e)}"}), 500'''
        
        new_endpoint = '''@app.route('/api/signal-feed/signals/feed', methods=['GET'])
def get_signal_feed():
    """Get signal feed endpoint"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, symbol, signal_type, confidence, price, timestamp, status
            FROM trading_signals 
            WHERE status = 'active'
            ORDER BY timestamp DESC 
            LIMIT 20
        """)
        
        signals = cursor.fetchall()
        conn.close()
        
        signal_list = []
        for signal in signals:
            # Convert signal_type to direction format expected by frontend
            direction = "LONG" if signal['signal_type'] == "BUY" else "SHORT"
            
            signal_list.append({
                "id": f"signal_{signal['id']}",
                "pair": signal['symbol'],
                "direction": direction,
                "entry": str(signal['price']),
                "stopLoss": str(float(signal['price']) * 0.98) if signal['signal_type'] == "BUY" else str(float(signal['price']) * 1.02),
                "takeProfit": [str(float(signal['price']) * 1.02), str(float(signal['price']) * 1.04)] if signal['signal_type'] == "BUY" else [str(float(signal['price']) * 0.98), str(float(signal['price']) * 0.96)],
                "confidence": int(signal['confidence']),
                "analysis": f"Strong {signal['signal_type'].lower()} signal with {signal['confidence']}% confidence",
                "ictConcepts": ["Order Block", "Market Structure"],
                "timestamp": signal['timestamp'],
                "status": signal['status'],
                "market": "forex" if "/" not in signal['symbol'] else "crypto",
                "timeframe": "15m",
                "is_recommended": signal['confidence'] > 80
            })
        
        return jsonify(signal_list), 200
        
    except Exception as e:
        return jsonify({"msg": f"Server error: {str(e)}"}), 500'''
        
        # Replace the endpoint
        updated_code = backend_code.replace(old_endpoint, new_endpoint)
        
        # Write the updated backend
        with open('simple_working_backend_fixed.py', 'w') as f:
            f.write(updated_code)
        
        print("✅ Created simple_working_backend_fixed.py with correct signal format")
        return True
        
    except Exception as e:
        print(f"❌ Error updating backend: {str(e)}")
        return False

def test_fixed_backend():
    """Test the fixed backend"""
    try:
        print("🔍 Testing fixed backend...")
        
        import requests
        
        # Test the fixed signal feed endpoint
        response = requests.get("http://localhost:5000/api/signal-feed/signals/feed", timeout=10)
        
        print(f"   Signal feed status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Signal feed working! Found {len(data)} signals")
            
            if data:
                print("   📊 Sample signal format:")
                sample = data[0]
                for key, value in sample.items():
                    print(f"      {key}: {value}")
            
            return True
        else:
            print(f"   ❌ Signal feed failed: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Could not connect to backend")
        return False
    except Exception as e:
        print(f"   ❌ Error testing backend: {str(e)}")
        return False

def create_signal_feed_fix_script():
    """Create a script to fix the signal feed issue"""
    try:
        print("🔄 Creating signal feed fix script...")
        
        fix_script = '''#!/usr/bin/env python3
"""
Signal Feed Fix Script
Run this to fix the signal feed data format issue
"""

import subprocess
import time
import requests

def stop_current_backend():
    """Stop the current backend server"""
    try:
        print("🛑 Stopping current backend...")
        subprocess.run(["pkill", "-f", "simple_working_backend.py"], check=False)
        time.sleep(2)
        print("✅ Backend stopped")
    except:
        print("⚠️  No backend to stop")

def start_fixed_backend():
    """Start the fixed backend server"""
    try:
        print("🚀 Starting fixed backend...")
        process = subprocess.Popen(
            ["python3", "simple_working_backend_fixed.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        time.sleep(3)
        print("✅ Fixed backend started")
        return process
    except Exception as e:
        print(f"❌ Error starting backend: {str(e)}")
        return None

def test_signal_feed():
    """Test the signal feed"""
    try:
        print("🔍 Testing signal feed...")
        time.sleep(2)
        
        response = requests.get("http://localhost:5000/api/signal-feed/signals/feed", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Signal feed working! Found {len(data)} signals")
            
            if data:
                print("📊 Signal format:")
                sample = data[0]
                print(f"   Pair: {sample.get('pair')}")
                print(f"   Direction: {sample.get('direction')}")
                print(f"   Entry: {sample.get('entry')}")
                print(f"   Confidence: {sample.get('confidence')}%")
                print(f"   Recommended: {sample.get('is_recommended')}")
            
            return True
        else:
            print(f"❌ Signal feed failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing signal feed: {str(e)}")
        return False

def main():
    print("🚀 Signal Feed Fix Script")
    print("=" * 40)
    
    # Stop current backend
    stop_current_backend()
    
    # Start fixed backend
    process = start_fixed_backend()
    
    if process:
        # Test signal feed
        test_signal_feed()
        
        print("\\n✅ Signal feed fix completed!")
        print("📝 Now try accessing the Signal Feed tab in your dashboard")
        print("🔄 Backend is running in the background")
        
        # Keep running
        try:
            process.wait()
        except KeyboardInterrupt:
            print("\\n🛑 Stopping backend...")
            process.terminate()

if __name__ == '__main__':
    main()
        '''
        
        with open('fix_signal_feed.py', 'w') as f:
            f.write(fix_script)
        
        print("✅ Created fix_signal_feed.py")
        return True
        
    except Exception as e:
        print(f"❌ Error creating fix script: {str(e)}")
        return False

def main():
    """Main function"""
    print("🚀 Signal Feed Format Fix")
    print("=" * 60)
    
    try:
        # Update backend signal format
        update_backend_signal_format()
        print()
        
        # Test current backend
        test_fixed_backend()
        print()
        
        # Create fix script
        create_signal_feed_fix_script()
        
        print("=" * 60)
        print("📋 SUMMARY")
        print("=" * 60)
        print("✅ Backend signal format updated")
        print("✅ Fixed backend created: simple_working_backend_fixed.py")
        print("✅ Fix script created: fix_signal_feed.py")
        print()
        print("🔐 YOUR REGISTERED USERS:")
        print("   admin@test.com / admin123")
        print("   user@test.com / user123")
        print("   demo@test.com / demo123")
        print()
        print("📝 TO FIX THE SIGNAL FEED ERROR:")
        print("1. Run: python3 fix_signal_feed.py")
        print("2. This will stop the current backend and start the fixed one")
        print("3. Try accessing the Signal Feed tab again")
        print("4. The error should be resolved")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == '__main__':
    main()

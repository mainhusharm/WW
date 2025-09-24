#!/usr/bin/env python3
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
        
        print("\n✅ Signal feed fix completed!")
        print("📝 Now try accessing the Signal Feed tab in your dashboard")
        print("🔄 Backend is running in the background")
        
        # Keep running
        try:
            process.wait()
        except KeyboardInterrupt:
            print("\n🛑 Stopping backend...")
            process.terminate()

if __name__ == '__main__':
    main()
        
#!/usr/bin/env python3
"""
Start Server and Run Signal Flow Tests
"""

import subprocess
import time
import sys
import os

def start_server():
    """Start the Flask server"""
    try:
        print("🚀 Starting Flask server...")
        
        # Try different ways to start the server
        server_commands = [
            ["python3", "app.py"],
            ["python3", "run.py"],
            ["python3", "simple_working_app.py"],
            ["python3", "minimal_app.py"],
            ["python3", "-m", "flask", "run"],
        ]
        
        for cmd in server_commands:
            try:
                print(f"   Trying: {' '.join(cmd)}")
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                
                # Wait a bit to see if server starts
                time.sleep(3)
                
                if process.poll() is None:
                    print("✅ Server started successfully")
                    return process
                else:
                    stdout, stderr = process.communicate()
                    print(f"   Failed: {stderr[:100]}")
                    
            except FileNotFoundError:
                print(f"   Command not found: {' '.join(cmd)}")
                continue
            except Exception as e:
                print(f"   Error: {str(e)}")
                continue
        
        print("❌ Could not start server with any method")
        return None
        
    except Exception as e:
        print(f"❌ Error starting server: {str(e)}")
        return None

def run_tests():
    """Run the signal flow tests"""
    try:
        print("🧪 Running signal flow tests...")
        
        # Wait for server to be ready
        time.sleep(5)
        
        # Run the test script
        result = subprocess.run(
            ["python3", "test_signal_flow_complete.py"],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        print("📊 Test Results:")
        print(result.stdout)
        
        if result.stderr:
            print("⚠️  Test Errors:")
            print(result.stderr)
        
        return result.returncode == 0
        
    except subprocess.TimeoutExpired:
        print("❌ Tests timed out")
        return False
    except Exception as e:
        print(f"❌ Error running tests: {str(e)}")
        return False

def main():
    """Main function"""
    print("🚀 Server and Test Launcher")
    print("=" * 60)
    
    # Start server
    server_process = start_server()
    
    if server_process:
        try:
            # Run tests
            print()
            success = run_tests()
            
            if success:
                print("✅ Tests completed successfully")
            else:
                print("❌ Tests failed")
            
        finally:
            # Stop server
            print("\n🛑 Stopping server...")
            server_process.terminate()
            server_process.wait()
            print("✅ Server stopped")
    else:
        print("❌ Could not start server")
        print("\n📝 Manual steps:")
        print("1. Start your server manually: python3 app.py")
        print("2. Run tests: python3 test_signal_flow_complete.py")
        print("3. Login with: testuser@example.com / TestPassword123!")
        print("4. Check signals in user dashboard")

if __name__ == "__main__":
    main()

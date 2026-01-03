#!/usr/bin/env python3
"""
Start Backend Server and Test Authentication
"""

import subprocess
import time
import requests
import json
import os
import sys

def start_backend_server():
    """Start the backend server"""
    try:
        print("🚀 Starting backend server...")
        
        # Try different ways to start the server
        server_commands = [
            ["python3", "app.py"],
            ["python3", "run.py"],
            ["python3", "simple_working_app.py"],
            ["python3", "minimal_app.py"],
            ["python3", "-m", "flask", "run", "--host=0.0.0.0", "--port=5000"],
        ]
        
        for cmd in server_commands:
            try:
                print(f"   Trying: {' '.join(cmd)}")
                
                # Set environment variables
                env = os.environ.copy()
                env['FLASK_ENV'] = 'development'
                env['FLASK_DEBUG'] = '1'
                env['DATABASE_URL'] = 'sqlite:///trading_bots.db'
                
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    env=env
                )
                
                # Wait a bit to see if server starts
                time.sleep(5)
                
                if process.poll() is None:
                    print("✅ Server started successfully")
                    return process
                else:
                    stdout, stderr = process.communicate()
                    print(f"   Failed: {stderr[:200]}")
                    
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

def test_local_backend():
    """Test the local backend server"""
    try:
        print("🔍 Testing local backend server...")
        
        base_url = "http://localhost:5000"
        
        # Wait for server to be ready
        time.sleep(3)
        
        # Test health endpoint
        try:
            response = requests.get(f"{base_url}/healthz", timeout=5)
            print(f"   Health check: {response.status_code}")
        except:
            print("   Health check: Not available")
        
        # Test login endpoint
        login_data = {
            "email": "testuser@example.com",
            "password": "TestPassword123!"
        }
        
        try:
            response = requests.post(
                f"{base_url}/api/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            print(f"   Login test: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Login successful!")
                if "access_token" in data:
                    print(f"   Token: {data['access_token'][:20]}...")
                return True
            else:
                print(f"   Login failed: {response.text[:200]}")
                return False
                
        except requests.exceptions.ConnectionError:
            print("   ❌ Could not connect to local server")
            return False
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing backend: {str(e)}")
        return False

def test_signal_endpoints():
    """Test signal-related endpoints"""
    try:
        print("🔍 Testing signal endpoints...")
        
        base_url = "http://localhost:5000"
        
        endpoints = [
            "/api/signals",
            "/api/signal-feed/signals/feed",
            "/api/database/signal-stats"
        ]
        
        for endpoint in endpoints:
            try:
                response = requests.get(f"{base_url}{endpoint}", timeout=5)
                print(f"   {endpoint}: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        print(f"     Found {len(data)} signals")
                    elif isinstance(data, dict):
                        print(f"     Response: {list(data.keys())}")
                        
            except Exception as e:
                print(f"   {endpoint}: Error - {str(e)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing signal endpoints: {str(e)}")
        return False

def main():
    """Main function"""
    print("🚀 Backend Server Startup and Test")
    print("=" * 60)
    
    # Start server
    server_process = start_backend_server()
    
    if server_process:
        try:
            print()
            
            # Test backend
            login_success = test_local_backend()
            print()
            
            # Test signal endpoints
            test_signal_endpoints()
            
            print()
            print("=" * 60)
            print("📋 TEST RESULTS")
            print("=" * 60)
            
            if login_success:
                print("✅ Backend server is working!")
                print("✅ Test user authentication successful!")
                print()
                print("🔐 TEST CREDENTIALS:")
                print("   Email: testuser@example.com")
                print("   Password: TestPassword123!")
                print()
                print("📝 NEXT STEPS:")
                print("1. The backend is now running on http://localhost:5000")
                print("2. Try logging in with the test credentials")
                print("3. Check if signals are visible in the user dashboard")
                print("4. Test signal flow from admin to user dashboard")
            else:
                print("❌ Backend server has issues")
                print("   Check the server logs for errors")
                print("   Database connection might be failing")
            
            print("=" * 60)
            
            # Keep server running
            print("\n🔄 Server is running... Press Ctrl+C to stop")
            try:
                server_process.wait()
            except KeyboardInterrupt:
                print("\n🛑 Stopping server...")
                server_process.terminate()
                server_process.wait()
                print("✅ Server stopped")
                
        except Exception as e:
            print(f"❌ Error during testing: {str(e)}")
            server_process.terminate()
    else:
        print("❌ Could not start backend server")
        print("\n📝 MANUAL STEPS:")
        print("1. Check if all dependencies are installed")
        print("2. Verify database file exists")
        print("3. Check for any configuration issues")
        print("4. Try starting server manually: python3 app.py")

if __name__ == '__main__':
    main()

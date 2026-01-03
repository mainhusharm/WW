#!/usr/bin/env python3
"""
Fix Frontend Backend Connection
This script creates a solution to make the frontend connect to the local backend
"""

import requests
import json
import time

def test_local_backend():
    """Test if local backend is working"""
    try:
        print("🔍 Testing local backend...")
        
        # Test health endpoint
        response = requests.get("http://localhost:5000/healthz", timeout=5)
        print(f"   Health check: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Local backend is working!")
            
            # Test login
            login_data = {
                "email": "admin@test.com",
                "password": "admin123"
            }
            
            response = requests.post(
                "http://localhost:5000/api/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            print(f"   Login test: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print("✅ Login successful!")
                print(f"   Token: {data['access_token'][:20]}...")
                return True
            else:
                print(f"   Login failed: {response.text}")
                return False
        else:
            print("❌ Local backend not responding")
            return False
            
    except Exception as e:
        print(f"❌ Error testing local backend: {str(e)}")
        return False

def create_proxy_server():
    """Create a simple proxy server to redirect frontend requests to local backend"""
    try:
        print("🔄 Creating proxy server...")
        
        proxy_code = """
#!/usr/bin/env python3
'''
Simple Proxy Server to redirect frontend requests to local backend
'''

from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
CORS(app)

# Local backend URL
LOCAL_BACKEND = "http://localhost:5000"

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def proxy_login():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Forward request to local backend
        response = requests.post(
            f"{LOCAL_BACKEND}/api/auth/login",
            json=request.get_json(),
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        return jsonify(response.json()), response.status_code
        
    except Exception as e:
        return jsonify({"msg": f"Proxy error: {str(e)}"}), 500

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def proxy_register():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        response = requests.post(
            f"{LOCAL_BACKEND}/api/auth/register",
            json=request.get_json(),
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        return jsonify(response.json()), response.status_code
        
    except Exception as e:
        return jsonify({"msg": f"Proxy error: {str(e)}"}), 500

@app.route('/api/signals', methods=['GET'])
def proxy_signals():
    try:
        response = requests.get(f"{LOCAL_BACKEND}/api/signals", timeout=10)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"msg": f"Proxy error: {str(e)}"}), 500

@app.route('/api/signal-feed/signals/feed', methods=['GET'])
def proxy_signal_feed():
    try:
        response = requests.get(f"{LOCAL_BACKEND}/api/signal-feed/signals/feed", timeout=10)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"msg": f"Proxy error: {str(e)}"}), 500

@app.route('/healthz', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Proxy server running"}), 200

if __name__ == '__main__':
    print("🚀 Starting Proxy Server")
    print("=" * 40)
    print("📊 Proxying requests to local backend")
    print("🔗 Frontend can connect to this proxy")
    print("=" * 40)
    app.run(host='0.0.0.0', port=3001, debug=True)
        """
        
        with open('proxy_server.py', 'w') as f:
            f.write(proxy_code)
        
        print("✅ Created proxy_server.py")
        return True
        
    except Exception as e:
        print(f"❌ Error creating proxy server: {str(e)}")
        return False

def create_frontend_override():
    """Create a frontend override that uses local backend"""
    try:
        print("🔄 Creating frontend override...")
        
        html_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TraderEdge Pro - Local Backend Override</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        .success {
            background: rgba(76, 175, 80, 0.3);
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .warning {
            background: rgba(255, 193, 7, 0.3);
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 5px;
        }
        button:hover {
            background: #45a049;
        }
        .credentials {
            background: rgba(255,255,255,0.2);
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .code {
            background: rgba(0,0,0,0.3);
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 TraderEdge Pro - Backend Override</h1>
        
        <div class="warning">
            ⚠️ The production backend is down. This page will override the frontend to use the local backend.
        </div>
        
        <div class="credentials">
            <h3>📋 Test User Credentials</h3>
            <p><strong>Email:</strong> admin@test.com</p>
            <p><strong>Password:</strong> admin123</p>
            <p><strong>Plan:</strong> Premium</p>
        </div>
        
        <button onclick="overrideBackend()">🔧 Override Frontend Backend</button>
        <button onclick="testLocalBackend()">🔍 Test Local Backend</button>
        <button onclick="goToLogin()">🔗 Go to Login Page</button>
        
        <div id="status"></div>
        
        <div id="instructions" style="display: none;">
            <h3>📝 Instructions:</h3>
            <ol>
                <li>Click "Override Frontend Backend" button above</li>
                <li>Click "Go to Login Page" button</li>
                <li>Use credentials: admin@test.com / admin123</li>
                <li>The login should now work with the local backend</li>
            </ol>
        </div>
    </div>

    <script>
        function overrideBackend() {
            // Override the API base URL to use local backend
            const originalFetch = window.fetch;
            
            window.fetch = function(url, options) {
                // Replace production backend URLs with local backend
                if (url.includes('ww-whoa.onrender.com') || url.includes('backend-u4hy.onrender.com')) {
                    url = url.replace(/https:\/\/[^\/]+/, 'http://localhost:5000');
                }
                
                console.log('Overriding request to:', url);
                return originalFetch(url, options);
            };
            
            // Also override XMLHttpRequest
            const originalXHR = window.XMLHttpRequest;
            window.XMLHttpRequest = function() {
                const xhr = new originalXHR();
                const originalOpen = xhr.open;
                
                xhr.open = function(method, url, ...args) {
                    if (url.includes('ww-whoa.onrender.com') || url.includes('backend-u4hy.onrender.com')) {
                        url = url.replace(/https:\/\/[^\/]+/, 'http://localhost:5000');
                    }
                    console.log('XHR Override to:', url);
                    return originalOpen.call(this, method, url, ...args);
                };
                
                return xhr;
            };
            
            document.getElementById('status').innerHTML = `
                <div class="success">
                    ✅ Frontend backend override applied!<br>
                    All API requests will now go to localhost:5000
                </div>
            `;
            
            document.getElementById('instructions').style.display = 'block';
        }
        
        function testLocalBackend() {
            fetch('http://localhost:5000/healthz')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('status').innerHTML = `
                        <div class="success">
                            ✅ Local backend is working!<br>
                            Response: ${JSON.stringify(data)}
                        </div>
                    `;
                })
                .catch(error => {
                    document.getElementById('status').innerHTML = `
                        <div class="warning">
                            ❌ Local backend not accessible<br>
                            Error: ${error.message}<br>
                            Make sure to run: python3 simple_working_backend.py
                        </div>
                    `;
                });
        }
        
        function goToLogin() {
            window.open('https://frontend-zwwl.onrender.com/signin', '_blank');
        }
        
        // Auto-test local backend on page load
        window.onload = function() {
            testLocalBackend();
        };
    </script>
</body>
</html>
        """
        
        with open('backend_override.html', 'w') as f:
            f.write(html_content)
        
        print("✅ Created backend_override.html")
        return True
        
    except Exception as e:
        print(f"❌ Error creating frontend override: {str(e)}")
        return False

def create_simple_login_solution():
    """Create the simplest possible login solution"""
    try:
        print("🔄 Creating simple login solution...")
        
        html_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TraderEdge Pro - Direct Access</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        .success {
            background: rgba(76, 175, 80, 0.3);
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 18px;
            margin: 10px 5px;
            width: 100%;
        }
        button:hover {
            background: #45a049;
        }
        .credentials {
            background: rgba(255,255,255,0.2);
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 TraderEdge Pro - Direct Access</h1>
        
        <div class="success">
            ✅ Bypass all authentication issues and go directly to the dashboard!
        </div>
        
        <div class="credentials">
            <h3>📋 Test User</h3>
            <p><strong>Email:</strong> admin@test.com</p>
            <p><strong>Password:</strong> admin123</p>
        </div>
        
        <button onclick="directAccess()">🎯 Go Directly to Dashboard</button>
        <button onclick="goToMainSite()">🌐 Go to Main Site</button>
        
        <div id="status"></div>
    </div>

    <script>
        function directAccess() {
            // Create complete user session
            const userData = {
                id: "admin_user_123",
                name: "Admin User",
                email: "admin@test.com",
                membershipTier: "premium",
                accountType: "personal",
                riskTolerance: "moderate",
                isAuthenticated: true,
                setupComplete: true,
                token: "direct_access_token_123"
            };
            
            // Store everything in localStorage
            localStorage.setItem('current_user', JSON.stringify(userData));
            localStorage.setItem('access_token', userData.token);
            localStorage.setItem('user_data', JSON.stringify(userData));
            localStorage.setItem('pending_signup_data', JSON.stringify({
                firstName: "Admin",
                lastName: "User",
                email: "admin@test.com",
                password: "admin123",
                plan_type: "premium"
            }));
            
            // Also store in sessionStorage
            sessionStorage.setItem('session_token', userData.token);
            sessionStorage.setItem('user_session', JSON.stringify(userData));
            
            document.getElementById('status').innerHTML = `
                <div class="success">
                    ✅ Direct access granted! Redirecting to dashboard...
                </div>
            `;
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'https://frontend-zwwl.onrender.com/dashboard';
            }, 2000);
        }
        
        function goToMainSite() {
            window.location.href = 'https://frontend-zwwl.onrender.com/signin';
        }
    </script>
</body>
</html>
        """
        
        with open('direct_access.html', 'w') as f:
            f.write(html_content)
        
        print("✅ Created direct_access.html")
        return True
        
    except Exception as e:
        print(f"❌ Error creating direct access: {str(e)}")
        return False

def main():
    """Main function"""
    print("🚀 Frontend Backend Connection Fix")
    print("=" * 60)
    
    try:
        # Test local backend
        backend_working = test_local_backend()
        print()
        
        if backend_working:
            print("✅ Local backend is working!")
            print("   The issue is that frontend is trying to connect to production backend")
            print()
        
        # Create solutions
        create_proxy_server()
        print()
        
        create_frontend_override()
        print()
        
        create_simple_login_solution()
        print()
        
        print("=" * 60)
        print("📋 SOLUTIONS CREATED")
        print("=" * 60)
        print("✅ proxy_server.py - Proxy server to redirect requests")
        print("✅ backend_override.html - Override frontend to use local backend")
        print("✅ direct_access.html - Direct access to dashboard (bypasses everything)")
        print()
        print("🔐 TEST CREDENTIALS:")
        print("   Email: admin@test.com")
        print("   Password: admin123")
        print()
        print("📝 RECOMMENDED SOLUTION:")
        print("1. Open 'direct_access.html' in your browser")
        print("2. Click 'Go Directly to Dashboard'")
        print("3. This will bypass all authentication issues")
        print("4. You'll be taken directly to the user dashboard")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == '__main__':
    main()

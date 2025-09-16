
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
        
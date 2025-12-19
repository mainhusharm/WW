#!/usr/bin/env python3
"""
CORS Proxy Server
Adds CORS headers to requests to node-backend-g1mk.onrender.com
"""

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests
import json

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, origins=[
    'https://frontend-tkxf.onrender.com',
    'https://frontend-i6xs.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173'
])

# Backend URL
BACKEND_URL = 'https://node-backend-g1mk.onrender.com'

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "OK", "service": "CORS Proxy"})

@app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def proxy_api(path):
    """Proxy all API requests to the backend with CORS headers"""
    
    # Handle preflight requests
    if request.method == 'OPTIONS':
        response = Response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        return response
    
    try:
        # Construct the full URL
        url = f"{BACKEND_URL}/api/{path}"
        
        # Prepare headers
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'CORS-Proxy/1.0'
        }
        
        # Add authorization header if present
        if 'Authorization' in request.headers:
            headers['Authorization'] = request.headers['Authorization']
        
        # Make the request to the backend
        if request.method == 'GET':
            response = requests.get(url, headers=headers, timeout=30)
        elif request.method == 'POST':
            response = requests.post(url, json=request.get_json(), headers=headers, timeout=30)
        elif request.method == 'PUT':
            response = requests.put(url, json=request.get_json(), headers=headers, timeout=30)
        elif request.method == 'DELETE':
            response = requests.delete(url, headers=headers, timeout=30)
        else:
            return jsonify({"error": "Method not allowed"}), 405
        
        # Create response with CORS headers
        proxy_response = Response(
            response.content,
            status=response.status_code,
            content_type=response.headers.get('content-type', 'application/json')
        )
        
        # Add CORS headers
        proxy_response.headers.add('Access-Control-Allow-Origin', '*')
        proxy_response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        proxy_response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        
        return proxy_response
        
    except requests.exceptions.Timeout:
        return jsonify({"error": "Backend timeout"}), 504
    except requests.exceptions.ConnectionError:
        return jsonify({"error": "Backend connection failed"}), 502
    except Exception as e:
        return jsonify({"error": f"Proxy error: {str(e)}"}), 500

@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def proxy_root(path):
    """Proxy root level requests"""
    return proxy_api(path)

if __name__ == '__main__':
    print("🚀 CORS Proxy Server starting...")
    print(f"📡 Proxying requests to: {BACKEND_URL}")
    print("🌐 CORS enabled for frontend domains")
    app.run(host='0.0.0.0', port=5001, debug=True)

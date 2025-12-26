#!/usr/bin/env python3
"""
CORS Proxy Fix - Temporary solution for CORS issues
This proxy adds proper CORS headers to all requests
"""

import os
import requests
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

app = Flask(__name__)

# Allow all origins for this proxy
CORS(app, origins="*")

# Backend URL
BACKEND_URL = 'https://node-backend-g1mk.onrender.com'

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "OK", "service": "CORS Proxy Fix"})

@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def proxy_api(path):
    """Proxy all requests to the backend with proper CORS headers"""
    
    # Handle preflight requests
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,X-Requested-With,Accept,Origin")
        response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
        response.headers.add('Access-Control-Max-Age', "3600")
        return response, 200
    
    # Build the full URL
    full_url = f"{BACKEND_URL}/{path}"
    if request.query_string:
        full_url += f"?{request.query_string.decode()}"
    
    # Prepare headers
    headers = {}
    for key, value in request.headers:
        if key.lower() not in ['host', 'origin']:
            headers[key] = value
    
    # Make the request to the backend
    try:
        if request.method == 'GET':
            response = requests.get(full_url, headers=headers, timeout=30)
        elif request.method == 'POST':
            response = requests.post(full_url, headers=headers, json=request.get_json(), timeout=30)
        elif request.method == 'PUT':
            response = requests.put(full_url, headers=headers, json=request.get_json(), timeout=30)
        elif request.method == 'DELETE':
            response = requests.delete(full_url, headers=headers, timeout=30)
        elif request.method == 'PATCH':
            response = requests.patch(full_url, headers=headers, json=request.get_json(), timeout=30)
        else:
            return jsonify({"error": "Method not supported"}), 405
        
        # Create response with proper CORS headers
        flask_response = Response(
            response.content,
            status=response.status_code,
            headers=dict(response.headers)
        )
        
        # Add CORS headers
        flask_response.headers['Access-Control-Allow-Origin'] = '*'
        flask_response.headers['Access-Control-Allow-Credentials'] = 'true'
        flask_response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
        flask_response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Origin, Accept'
        flask_response.headers['Access-Control-Max-Age'] = '3600'
        
        return flask_response
        
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Backend request failed: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

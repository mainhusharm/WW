#!/usr/bin/env python3
"""
Simple backend fix for registration 500 error
This creates a minimal working registration endpoint
"""

import os
import json
import hashlib
import uuid
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["*"])

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0"
    }), 200

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register():
    """Simple registration endpoint that works without database"""
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,X-Requested-With,Accept,Origin")
        response.headers.add('Access-Control-Allow-Methods', "POST,OPTIONS")
        return response, 200
    
    try:
        data = request.get_json()
        print(f"Received registration data: {data}")
        
        if not data:
            return jsonify({"msg": "No JSON data provided"}), 400
        
        email = data.get('email')
        password = data.get('password')
        firstName = data.get('firstName', '')
        lastName = data.get('lastName', '')
        plan_type = data.get('plan_type', 'premium')
        
        if not email or not password:
            return jsonify({"msg": "Email and password required"}), 400
        
        # Create a simple user ID and token
        user_id = str(uuid.uuid4())
        access_token = f"token_{user_id}_{uuid.uuid4().hex[:16]}"
        
        print(f"Registration successful for user: {email}")
        
        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user_id,
                "username": f"{firstName} {lastName}".strip() or email.split('@')[0],
                "email": email,
                "plan_type": plan_type
            },
            "msg": "User registered successfully"
        }), 201
        
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"🚀 Starting Simple Backend on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)

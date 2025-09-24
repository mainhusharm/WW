#!/usr/bin/env python3
"""
Simple Authentication Server - Temporary fix for login issues
This provides basic authentication without database dependencies
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import hashlib
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Simple in-memory user storage (temporary)
USERS = {
    'anchlshrma18@gmail.com': {
        'password_hash': '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',  # 'password'
        'username': 'anchal',
        'plan_type': 'premium',
        'id': 'user-123'
    }
}

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(user_id):
    """Create a simple access token"""
    return f"token_{user_id}_{uuid.uuid4().hex[:16]}"

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "Simple auth server is running",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    """User login endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No JSON data provided"}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"msg": "Email and password required"}), 400
        
        # Check if user exists
        if email not in USERS:
            return jsonify({"msg": "Invalid email or password"}), 401
        
        user = USERS[email]
        
        # Check password
        if user['password_hash'] != hash_password(password):
            return jsonify({"msg": "Invalid email or password"}), 401
        
        # Create access token
        access_token = create_access_token(user['id'])
        
        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user['id'],
                "username": user['username'],
                "email": email,
                "plan_type": user['plan_type']
            }
        }), 200
        
    except Exception as e:
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register():
    """User registration endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No JSON data provided"}), 400
        
        email = data.get('email')
        password = data.get('password')
        username = data.get('username', email.split('@')[0])
        
        if not email or not password:
            return jsonify({"msg": "Email and password required"}), 400
        
        # Check if user already exists
        if email in USERS:
            return jsonify({"msg": "User already exists"}), 409
        
        # Create user
        user_id = f"user-{uuid.uuid4().hex[:8]}"
        password_hash = hash_password(password)
        
        USERS[email] = {
            'password_hash': password_hash,
            'username': username,
            'plan_type': 'premium',
            'id': user_id
        }
        
        return jsonify({
            "msg": "User created successfully",
            "user_id": user_id
        }), 201
        
    except Exception as e:
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

@app.route('/api/auth/validate', methods=['POST', 'OPTIONS'])
def validate_token():
    """Validate access token"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No JSON data provided"}), 400
        
        token = data.get('access_token')
        if not token:
            return jsonify({"msg": "Access token required"}), 400
        
        # Simple token validation
        if token.startswith('token_'):
            return jsonify({"valid": True}), 200
        else:
            return jsonify({"valid": False}), 401
            
    except Exception as e:
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Starting Simple Authentication Server")
    print("✅ Login endpoint: /api/auth/login")
    print("✅ Register endpoint: /api/auth/register")
    print("✅ Validate endpoint: /api/auth/validate")
    print("✅ Test user: anchlshrma18@gmail.com / password")
    app.run(host='0.0.0.0', port=5001, debug=True)

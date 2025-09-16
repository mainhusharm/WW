#!/usr/bin/env python3
"""
Simple Authentication Backend - Working Login System
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import uuid
from datetime import datetime, timedelta
import jwt
import hashlib

# Create Flask app
app = Flask(__name__)
CORS(app, 
     origins=["*"], 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
     supports_credentials=True)

# Secret key for JWT
JWT_SECRET = "your-secret-key-change-in-production"

# Simple in-memory user storage
users = {
    "anchlshrma18@gmail.com": {
        "id": "user-1",
        "email": "anchlshrma18@gmail.com",
        "username": "anchal",
        "password": "password123",  # In production, hash this
        "plan_type": "professional",
        "created_at": datetime.now().isoformat()
    }
}

# Add CORS preflight handler
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_response("")
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,X-Requested-With,Accept,Origin")
        response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
        response.headers.add('Access-Control-Max-Age', "3600")
        return response, 200

# Add after_request handler for CORS
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

def generate_jwt_token(user_data):
    """Generate JWT token for user"""
    payload = {
        'sub': user_data['id'],
        'username': user_data['username'],
        'email': user_data['email'],
        'plan_type': user_data['plan_type'],
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

# API Endpoints
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "Authentication server is running",
        "timestamp": datetime.now().isoformat(),
        "users_count": len(users)
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No data provided"}), 400
        
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({"msg": "Email and password are required"}), 400
        
        # Check if user exists
        if email not in users:
            return jsonify({"msg": "Invalid email or password"}), 401
        
        user = users[email]
        
        # Check password (in production, use proper hashing)
        if user['password'] != password:
            return jsonify({"msg": "Invalid email or password"}), 401
        
        # Generate JWT token
        token = generate_jwt_token(user)
        
        # Return success response
        return jsonify({
            "success": True,
            "access_token": token,
            "user": {
                "id": user['id'],
                "email": user['email'],
                "username": user['username'],
                "plan_type": user['plan_type']
            }
        }), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"msg": "Server error"}), 500

@app.route('/api/auth/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No data provided"}), 400
        
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        username = data.get('username', '')
        
        if not email or not password or not username:
            return jsonify({"msg": "Email, password, and username are required"}), 400
        
        # Check if user already exists
        if email in users:
            return jsonify({"msg": "User already exists"}), 400
        
        # Create new user
        user_id = str(uuid.uuid4())
        users[email] = {
            "id": user_id,
            "email": email,
            "username": username,
            "password": password,  # In production, hash this
            "plan_type": "professional",
            "created_at": datetime.now().isoformat()
        }
        
        # Generate JWT token
        token = generate_jwt_token(users[email])
        
        return jsonify({
            "success": True,
            "access_token": token,
            "user": {
                "id": user_id,
                "email": email,
                "username": username,
                "plan_type": "professional"
            }
        }), 201
        
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({"msg": "Server error"}), 500

@app.route('/api/auth/verify', methods=['POST'])
def verify_token():
    """Verify JWT token"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"msg": "No token provided"}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = payload.get('sub')
            
            # Find user by ID
            user = None
            for email, user_data in users.items():
                if user_data['id'] == user_id:
                    user = user_data
                    break
            
            if not user:
                return jsonify({"msg": "User not found"}), 401
            
            return jsonify({
                "valid": True,
                "user": {
                    "id": user['id'],
                    "email": user['email'],
                    "username": user['username'],
                    "plan_type": user['plan_type']
                }
            }), 200
            
        except jwt.ExpiredSignatureError:
            return jsonify({"msg": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"msg": "Invalid token"}), 401
            
    except Exception as e:
        print(f"Token verification error: {e}")
        return jsonify({"msg": "Server error"}), 500

@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    """Get user profile"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"msg": "No token provided"}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = payload.get('sub')
            
            # Find user by ID
            user = None
            for email, user_data in users.items():
                if user_data['id'] == user_id:
                    user = user_data
                    break
            
            if not user:
                return jsonify({"msg": "User not found"}), 401
            
            return jsonify({
                "id": user['id'],
                "email": user['email'],
                "username": user['username'],
                "plan_type": user['plan_type'],
                "created_at": user['created_at']
            }), 200
            
        except jwt.ExpiredSignatureError:
            return jsonify({"msg": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"msg": "Invalid token"}), 401
            
    except Exception as e:
        print(f"Profile error: {e}")
        return jsonify({"msg": "Server error"}), 500

if __name__ == '__main__':
    print("🚀 Starting Simple Authentication Backend on port 5000")
    print("✅ CORS enabled for all origins")
    print("✅ JWT authentication ready")
    print("✅ Test user: anchlshrma18@gmail.com / password123")
    print("✅ Ready for login!")
    
    app.run(host='0.0.0.0', port=5000, debug=True)

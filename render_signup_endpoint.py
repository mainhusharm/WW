#!/usr/bin/env python3
"""
RENDER.COM DEPLOYMENT - SIGNUP ENDPOINT
This is the production-ready signup endpoint for Render.com
"""

import os
import json
import hashlib
import psycopg2
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def get_db_connection():
    """Get PostgreSQL database connection"""
    try:
        DATABASE_URL = os.getenv('DATABASE_URL')
        if not DATABASE_URL:
            raise Exception("DATABASE_URL not found in environment")
        
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        raise

def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

@app.route('/api/simple/signup', methods=['POST', 'OPTIONS'])
def register_user():
    """Simple signup endpoint that works"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No JSON data provided"}), 400
        
        print(f"📝 RENDER SIGNUP - Data received: {data}")
        
        # Extract data from frontend
        first_name = data.get('firstName', '')
        last_name = data.get('lastName', '')
        email = data.get('email', '')
        password = data.get('password', '')
        plan_type = data.get('plan_type', 'premium')
        
        # Validation
        if not all([first_name, last_name, email, password]):
            return jsonify({"success": False, "message": "First name, last name, email, and password are required"}), 400
        
        if len(password) < 8:
            return jsonify({"success": False, "message": "Password must be at least 8 characters"}), 400
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": "User already exists with this email"}), 409
        
        # Create user
        password_hash = hash_password(password)
        full_name = f"{first_name} {last_name}".strip()
        
        cursor.execute("""
            INSERT INTO users (
                first_name, last_name, email, password_hash, plan_type, 
                created_at, updated_at, is_active
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            first_name, last_name, email, password_hash, plan_type,
            datetime.now(), datetime.now(), True
        ))
        
        user_id = cursor.fetchone()[0]
        conn.commit()
        
        # Return success response
        response_data = {
            "success": True,
            "message": "Registration successful",
            "user": {
                "id": user_id,
                "email": email,
                "firstName": first_name,
                "lastName": last_name,
                "fullName": full_name,
                "plan_type": plan_type,
                "created_at": datetime.now().isoformat()
            },
            "access_token": f"token_{user_id}_{int(datetime.now().timestamp())}"
        }
        
        print(f"✅ RENDER SIGNUP - User registered successfully: {email} (ID: {user_id})")
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"❌ RENDER SIGNUP - Registration error: {e}")
        return jsonify({"success": False, "message": f"Registration failed: {str(e)}"}), 500
    finally:
        if 'conn' in locals():
            conn.close()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        conn.close()
        
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    print("🚀 RENDER.COM SIGNUP ENDPOINT")
    print("📍 Endpoint: /api/simple/signup")
    print("🔍 Health check: /health")
    print("📊 Database: PostgreSQL (Render.com)")
    print("🎯 This will save signup data to your database!")
    print("=" * 50)
    
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
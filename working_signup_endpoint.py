#!/usr/bin/env python3
"""
Working Signup Endpoint for Production
This endpoint matches the frontend schema and saves to PostgreSQL
"""

import os
import sys
import json
import hashlib
import psycopg2
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv('database.env')

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

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register_user():
    """Enhanced user registration endpoint that matches frontend schema"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No JSON data provided"}), 400
        
        # Extract data from frontend (matching EnhancedSignupForm schema)
        first_name = data.get('firstName', '')
        last_name = data.get('lastName', '')
        email = data.get('email', '')
        password = data.get('password', '')
        phone = data.get('phone', '')
        company = data.get('company', '')
        country = data.get('country', '')
        agree_to_marketing = data.get('agreeToMarketing', False)
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
            conn.close()
            return jsonify({"success": False, "message": "User already exists with this email"}), 409
        
        # Create user
        password_hash = hash_password(password)
        full_name = f"{first_name} {last_name}".strip()
        
        cursor.execute("""
            INSERT INTO users (
                first_name, last_name, email, password_hash, phone, company, 
                country, agree_to_marketing, plan_type, created_at, updated_at, is_active
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            first_name, last_name, email, password_hash, phone, company,
            country, agree_to_marketing, plan_type, datetime.now(), datetime.now(), True
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
        
        print(f"✅ User registered successfully: {email} (ID: {user_id})")
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"❌ Registration error: {e}")
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
    print("🚀 Starting Working Signup Endpoint Server...")
    print("📍 Endpoint: http://localhost:5001/api/auth/register")
    print("🔍 Health check: http://localhost:5001/health")
    print("📊 Database: PostgreSQL (Render.com)")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5001, debug=True)

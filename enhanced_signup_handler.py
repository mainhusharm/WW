#!/usr/bin/env python3
"""
Enhanced Signup Handler
This handles user signup and ensures proper database integration
"""

import sqlite3
import hashlib
import uuid
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect("trading_bots.db")
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password):
    """Hash password"""
    return hashlib.sha256(password.encode()).hexdigest()

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register_user():
    """Enhanced user registration with proper database integration"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No JSON data provided"}), 400
        
        email = data.get('email')
        password = data.get('password')
        firstName = data.get('firstName', '')
        lastName = data.get('lastName', '')
        plan_type = data.get('plan_type', 'premium')
        
        if not email or not password:
            return jsonify({"msg": "Email and password required"}), 400
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"msg": "User already exists"}), 409
        
        # Create user
        username = f"{firstName} {lastName}".strip() or "New User"
        password_hash = hash_password(password)
        unique_id = str(uuid.uuid4())[:8].upper()
        
        cursor.execute("""
            INSERT INTO users (
                unique_id, username, email, password_hash, plan_type, 
                normalized_email, created_at, consent_accepted, consent_timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            unique_id, username, email, password_hash, plan_type,
            email.lower().strip(), datetime.utcnow().isoformat(),
            True, datetime.utcnow().isoformat()
        ))
        
        user_id = cursor.lastrowid
        
        # Also save to customer service data
        cursor.execute("""
            INSERT OR REPLACE INTO customer_service_data (
                user_id, email, account_type, prop_firm, account_size, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id, email, plan_type, 'Unknown', 0,
            datetime.utcnow().isoformat(), datetime.utcnow().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        # Create access token
        access_token = f"token_{user_id}_{uuid.uuid4().hex[:16]}"
        
        print(f"✅ User registered: {email} (ID: {user_id})")
        
        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user_id,
                "username": username,
                "email": email,
                "plan_type": plan_type,
                "unique_id": unique_id
            }
        }), 201
        
    except Exception as e:
        print(f"❌ Error registering user: {str(e)}")
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

@app.route('/api/payment/verify', methods=['POST', 'OPTIONS'])
def verify_payment():
    """Verify payment and update user status"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        email = data.get('email')
        payment_status = data.get('status')
        
        if not email:
            return jsonify({"msg": "Email required"}), 400
        
        if payment_status == 'completed':
            # Update user status in database
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE users 
                SET plan_type = 'premium', last_login = ?
                WHERE email = ?
            """, (datetime.utcnow().isoformat(), email))
            
            # Also update customer service data
            cursor.execute("""
                UPDATE customer_service_data 
                SET account_type = 'premium', updated_at = ?
                WHERE email = ?
            """, (datetime.utcnow().isoformat(), email))
            
            conn.commit()
            conn.close()
            
            print(f"✅ Payment verified for: {email}")
            return jsonify({"msg": "Payment verified successfully"}), 200
        else:
            return jsonify({"msg": "Payment not completed"}), 400
            
    except Exception as e:
        print(f"❌ Error verifying payment: {str(e)}")
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Enhanced Signup Handler")
    app.run(host='0.0.0.0', port=5001, debug=True)
        
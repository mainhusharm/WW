#!/usr/bin/env python3
"""
CORS Proxy Service for TraderEdgePro
Handles CORS issues and provides API endpoints for production deployment
"""

import os
import json
import sqlite3
import hashlib
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests
from pathlib import Path

app = Flask(__name__)
CORS(app, origins=['*'], methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Configuration
DATABASE_PATH = "trading_bots.db"
BACKEND_URL = os.getenv('BACKEND_URL', 'https://backend-topb.onrender.com')
PORT = int(os.getenv('PORT', 5001))

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialize database with required tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unique_id TEXT UNIQUE,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            plan_type TEXT DEFAULT 'premium',
            normalized_email TEXT NOT NULL,
            created_at TEXT NOT NULL,
            consent_accepted BOOLEAN DEFAULT 1,
            consent_timestamp TEXT,
            last_login TEXT,
            status TEXT DEFAULT 'active'
        )
    """)
    
    # Create customer service data table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customer_service_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            email TEXT NOT NULL,
            account_type TEXT DEFAULT 'premium',
            prop_firm TEXT DEFAULT 'Unknown',
            account_size INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    
    conn.commit()
    conn.close()

def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health_check():
    """Health check endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    return jsonify({"status": "healthy", "service": "cors-proxy", "timestamp": datetime.utcnow().isoformat()})

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register_user():
    """Enhanced user registration with proper database integration"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        email = data.get('email')
        password = data.get('password')
        firstName = data.get('firstName', '')
        lastName = data.get('lastName', '')
        plan_type = data.get('plan_type', 'premium')
        
        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "User already exists"}), 409
        
        # Create user
        username = f"{firstName} {lastName}".strip() or "New User"
        password_hash = hash_password(password)
        unique_id = str(uuid.uuid4())[:8].upper()
        
        cursor.execute("""
            INSERT INTO users (
                unique_id, username, email, password_hash, plan_type, 
                normalized_email, created_at, consent_accepted, consent_timestamp, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            unique_id, username, email, password_hash, plan_type,
            email.lower().strip(), datetime.utcnow().isoformat(),
            True, datetime.utcnow().isoformat(), 'active'
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
            "success": True,
            "access_token": access_token,
            "user": {
                "id": user_id,
                "user_id": user_id,
                "username": username,
                "email": email,
                "plan_type": plan_type,
                "unique_id": unique_id,
                "status": "active",
                "created_at": datetime.utcnow().isoformat()
            }
        }), 201
        
    except Exception as e:
        print(f"❌ Error registering user: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

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
            return jsonify({"error": "Email required"}), 400
        
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
            return jsonify({"success": True, "message": "Payment verified successfully"}), 200
        else:
            return jsonify({"error": "Payment not completed"}), 400
            
    except Exception as e:
        print(f"❌ Error verifying payment: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/stripe/create-payment-intent', methods=['POST', 'OPTIONS'])
def create_payment_intent():
    """Create Stripe payment intent (mock for production)"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        amount = data.get('amount', 1000)
        currency = data.get('currency', 'usd')
        
        # Mock payment intent for production
        client_secret = f"pi_mock_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}_secret_{uuid.uuid4().hex[:8]}"
        
        return jsonify({
            "clientSecret": client_secret,
            "amount": amount,
            "currency": currency,
            "status": "requires_payment_method"
        }), 200
        
    except Exception as e:
        print(f"❌ Error creating payment intent: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/cryptomus/create-invoice', methods=['POST', 'OPTIONS'])
def create_cryptomus_invoice():
    """Create Cryptomus invoice (mock for production)"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        amount = data.get('amount', '100.00')
        currency = data.get('currency', 'USD')
        
        # Mock invoice for production
        invoice_uuid = f"invoice_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}"
        
        return jsonify({
            "uuid": invoice_uuid,
            "amount": amount,
            "currency": currency,
            "status": "pending",
            "url": f"https://pay.cryptomus.com/pay/{invoice_uuid}",
            "created_at": datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        print(f"❌ Error creating Cryptomus invoice: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/validate-coupon', methods=['POST', 'OPTIONS'])
def validate_coupon():
    """Validate coupon codes"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        coupon_code = data.get('coupon_code', '').upper()
        plan_id = data.get('plan_id', '')
        original_price = data.get('original_price', 0)
        
        if not coupon_code:
            return jsonify({"valid": False, "error": "Coupon code required"}), 400
        
        # Define available coupons
        coupons = {
            'FREE100': {
                'discount_percent': 100,
                'message': 'Free access granted! Enjoy your premium subscription.'
            },
            'SAVE50': {
                'discount_percent': 50,
                'message': '50% discount applied! Great savings on your subscription.'
            },
            'SAVE25': {
                'discount_percent': 25,
                'message': '25% discount applied! Thank you for choosing us.'
            },
            'WELCOME20': {
                'discount_percent': 20,
                'message': '20% welcome discount applied! Welcome to TraderEdgePro.'
            },
            'STUDENT': {
                'discount_percent': 30,
                'message': '30% student discount applied!'
            },
            'EARLY': {
                'discount_percent': 40,
                'message': '40% early bird discount applied!'
            }
        }
        
        if coupon_code in coupons:
            coupon = coupons[coupon_code]
            discount_amount = original_price * (coupon['discount_percent'] / 100)
            final_price = max(0, original_price - discount_amount)
            
            return jsonify({
                "valid": True,
                "discount_amount": discount_amount,
                "final_price": final_price,
                "message": coupon['message'],
                "discount_percent": coupon['discount_percent']
            }), 200
        else:
            return jsonify({
                "valid": False,
                "error": "Invalid coupon code. Please check and try again."
            }), 200
            
    except Exception as e:
        print(f"❌ Error validating coupon: {str(e)}")
        return jsonify({"valid": False, "error": f"Server error: {str(e)}"}), 500

@app.route('/api/proxy/<path:url>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def proxy_request(url):
    """Generic proxy for external API requests"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Construct the full URL
        target_url = f"https://{url}"
        
        # Forward the request
        response = requests.request(
            method=request.method,
            url=target_url,
            headers={key: value for key, value in request.headers if key != 'Host'},
            data=request.get_data(),
            params=request.args,
            allow_redirects=False
        )
        
        # Create response
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        headers = [(name, value) for name, value in response.raw.headers.items()
                  if name.lower() not in excluded_headers]
        
        return Response(response.content, response.status_code, headers)
        
    except Exception as e:
        print(f"❌ Proxy error for {url}: {str(e)}")
        return jsonify({"error": f"Proxy error: {str(e)}"}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    print("🚀 Starting CORS Proxy Service")
    print(f"📊 Database: {DATABASE_PATH}")
    print(f"🔗 Backend URL: {BACKEND_URL}")
    print(f"🌐 Port: {PORT}")
    
    # Initialize database
    init_database()
    print("✅ Database initialized")
    
    # Start the server
    app.run(host='0.0.0.0', port=PORT, debug=False)

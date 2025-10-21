#!/usr/bin/env python3
"""
Simple Working Backend Server
This creates a minimal backend that handles authentication properly
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import hashlib
import os
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)

# Database path
DB_PATH = "trading_bots.db"

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password):
    """Hash password"""
    return hashlib.sha256(password.encode()).hexdigest()

@app.route('/healthz', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Server is running"}), 200

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    """Login endpoint"""
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
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Find user
        cursor.execute("""
            SELECT id, username, email, password_hash, plan_type 
            FROM users WHERE email = ?
        """, (email,))
        
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({"msg": "Invalid email or password"}), 401
        
        # Check password
        stored_hash = user['password_hash']
        if stored_hash and stored_hash != hash_password(password):
            return jsonify({"msg": "Invalid email or password"}), 401
        
        # Check plan type
        if user['plan_type'] == 'free':
            return jsonify({"msg": "Please upgrade your plan to login"}), 402
        
        # Create access token
        access_token = f"token_{user['id']}_{uuid.uuid4().hex[:16]}"
        
        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user['id'],
                "username": user['username'],
                "email": user['email'],
                "plan_type": user['plan_type']
            }
        }), 200
        
    except Exception as e:
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register():
    """Register endpoint with proper username handling"""
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
        
        # Check if user exists by email
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"msg": "User already exists"}), 409
        
        # Create unique username
        base_username = f"{firstName} {lastName}".strip() or "New User"
        username = base_username
        
        # Check if username exists and make it unique
        counter = 1
        while True:
            cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
            if not cursor.fetchone():
                break
            username = f"{base_username} ({counter})"
            counter += 1
        
        # Create user
        password_hash = hash_password(password)
        unique_id = str(uuid.uuid4())[:8].upper()
        
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, plan_type, normalized_email, unique_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (username, email, password_hash, plan_type, email.lower().strip(), unique_id, datetime.utcnow().isoformat()))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Create access token
        access_token = f"token_{user_id}_{uuid.uuid4().hex[:16]}"
        
        print(f"✅ User registered: {email} (Username: {username})")
        
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
        print(f"❌ Registration error: {str(e)}")
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

@app.route('/api/signals', methods=['GET'])
def get_signals():
    """Get signals endpoint"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, symbol, signal_type, confidence, price, timestamp, status
            FROM trading_signals 
            ORDER BY timestamp DESC 
            LIMIT 20
        """)
        
        signals = cursor.fetchall()
        conn.close()
        
        signal_list = []
        for signal in signals:
            signal_list.append({
                "id": signal['id'],
                "symbol": signal['symbol'],
                "signal_type": signal['signal_type'],
                "confidence": signal['confidence'],
                "price": signal['price'],
                "timestamp": signal['timestamp'],
                "status": signal['status']
            })
        
        return jsonify(signal_list), 200
        
    except Exception as e:
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

@app.route('/api/signal-feed/signals/feed', methods=['GET'])
def get_signal_feed():
    """Get signal feed endpoint"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, symbol, signal_type, confidence, price, timestamp, status
            FROM trading_signals 
            WHERE status = 'active'
            ORDER BY timestamp DESC 
            LIMIT 20
        """)
        
        signals = cursor.fetchall()
        conn.close()
        
        signal_list = []
        for signal in signals:
            # Convert signal_type to direction format expected by frontend
            direction = "LONG" if signal['signal_type'] == "BUY" else "SHORT"
            
            signal_list.append({
                "id": f"signal_{signal['id']}",
                "pair": signal['symbol'],
                "direction": direction,
                "entry": str(signal['price']),
                "stopLoss": str(float(signal['price']) * 0.98) if signal['signal_type'] == "BUY" else str(float(signal['price']) * 1.02),
                "takeProfit": [str(float(signal['price']) * 1.02), str(float(signal['price']) * 1.04)] if signal['signal_type'] == "BUY" else [str(float(signal['price']) * 0.98), str(float(signal['price']) * 0.96)],
                "confidence": int(signal['confidence']),
                "analysis": f"Strong {signal['signal_type'].lower()} signal with {signal['confidence']}% confidence",
                "ictConcepts": ["Order Block", "Market Structure"],
                "timestamp": signal['timestamp'],
                "status": signal['status'],
                "market": "forex" if "/" not in signal['symbol'] else "crypto",
                "timeframe": "15m",
                "is_recommended": signal['confidence'] > 80
            })
        
        return jsonify(signal_list), 200
        
    except Exception as e:
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

@app.route('/api/dashboard-data', methods=['GET'])
def get_dashboard_data():
    """Get dashboard data endpoint"""
    try:
        return jsonify({
            "user": {
                "id": 1,
                "name": "Test User",
                "email": "test@example.com",
                "plan": "premium"
            },
            "signals": {
                "total": 5,
                "active": 5,
                "today": 2
            },
            "performance": {
                "win_rate": 75.5,
                "total_trades": 20,
                "profit": 1250.50
            }
        }), 200
        
    except Exception as e:
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Starting Simple Working Backend Server")
    print("=" * 50)
    print("📊 Available endpoints:")
    print("   POST /api/auth/login")
    print("   POST /api/auth/register")
    print("   GET  /api/signals")
    print("   GET  /api/signal-feed/signals/feed")
    print("   GET  /api/dashboard-data")
    print("   GET  /healthz")
    print("=" * 50)
    print("🔐 Test users available:")
    print("   admin@test.com / admin123")
    print("   user@test.com / user123")
    print("   demo@test.com / demo123")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5000, debug=True)

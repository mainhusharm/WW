#!/usr/bin/env python3
"""
Working Backend Server for TraderEdgePro
Handles all frontend-backend communication
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import psycopg2
import hashlib
import uuid
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=["*"])

# PostgreSQL connection
DATABASE_URL = "postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2"

def get_db_connection():
    """Get database connection"""
    try:
        return psycopg2.connect(DATABASE_URL)
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def create_tables():
    """Create necessary database tables"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Create enhanced_users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS enhanced_users (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                company VARCHAR(255),
                country VARCHAR(100),
                password_hash VARCHAR(255),
                plan_type VARCHAR(50),
                unique_id VARCHAR(100) UNIQUE,
                access_token VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create payment_transactions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payment_transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES enhanced_users(id),
                amount DECIMAL(10,2),
                payment_method VARCHAR(50),
                transaction_id VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create questionnaire_responses table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS questionnaire_responses (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES enhanced_users(id),
                prop_firm VARCHAR(255),
                account_type VARCHAR(100),
                account_number VARCHAR(100),
                risk_ratio VARCHAR(20),
                trading_assets TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        conn.close()
        return True
        
    except Exception as e:
        print(f"Table creation error: {e}")
        return False

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
@app.route('/api/enhanced/signup', methods=['POST', 'OPTIONS'])
def signup():
    """Handle user signup"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['firstName', 'lastName', 'email']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute("SELECT id FROM enhanced_users WHERE email = %s", (data['email'],))
        if cursor.fetchone():
            return jsonify({"error": "User already exists"}), 409
        
        # Create user
        password_hash = hashlib.sha256(data.get('password', '').encode()).hexdigest()
        unique_id = str(uuid.uuid4())
        access_token = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO enhanced_users 
            (first_name, last_name, email, phone, company, country, password_hash, unique_id, access_token)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            data['firstName'], data['lastName'], data['email'],
            data.get('phone', ''), data.get('company', ''), data.get('country', ''),
            password_hash, unique_id, access_token
        ))
        
        user_id = cursor.fetchone()[0]
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "User created successfully",
            "user_id": user_id,
            "access_token": access_token
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/payments', methods=['POST', 'OPTIONS'])
@app.route('/api/enhanced/payment', methods=['POST', 'OPTIONS'])
def process_payment():
    """Handle payment processing"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Find user by email
        cursor.execute("SELECT id FROM enhanced_users WHERE email = %s", (data.get('email', ''),))
        user_row = cursor.fetchone()
        
        if not user_row:
            return jsonify({"error": "User not found"}), 404
        
        user_id = user_row[0]
        
        # Create payment record
        cursor.execute("""
            INSERT INTO payment_transactions 
            (user_id, amount, payment_method, transaction_id, status)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id, data.get('amount', 0), data.get('payment_method', 'unknown'),
            data.get('transaction_id', str(uuid.uuid4())), 'completed'
        ))
        
        payment_id = cursor.fetchone()[0]
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Payment processed successfully",
            "payment_id": payment_id
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/questionnaire', methods=['POST', 'OPTIONS'])
@app.route('/api/enhanced/questionnaire', methods=['POST', 'OPTIONS'])
def save_questionnaire():
    """Handle questionnaire responses"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Find user by email
        cursor.execute("SELECT id FROM enhanced_users WHERE email = %s", (data.get('email', ''),))
        user_row = cursor.fetchone()
        
        if not user_row:
            return jsonify({"error": "User not found"}), 404
        
        user_id = user_row[0]
        
        # Save questionnaire
        cursor.execute("""
            INSERT INTO questionnaire_responses 
            (user_id, prop_firm, account_type, account_number, risk_ratio, trading_assets)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id, data.get('propFirm', ''), data.get('accountType', ''),
            data.get('accountNumber', ''), data.get('riskRatio', ''),
            json.dumps(data.get('tradingAssets', []))
        ))
        
        questionnaire_id = cursor.fetchone()[0]
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Questionnaire saved successfully",
            "questionnaire_id": questionnaire_id
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard/<email>', methods=['GET'])
@app.route('/api/enhanced/dashboard/<email>', methods=['GET'])
def get_dashboard_data(email):
    """Get user dashboard data"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Get user data with questionnaire
        cursor.execute("""
            SELECT u.*, q.prop_firm, q.account_type, q.risk_ratio
            FROM enhanced_users u
            LEFT JOIN questionnaire_responses q ON u.id = q.user_id
            WHERE u.email = %s
        """, (email,))
        
        user_data = cursor.fetchone()
        if not user_data:
            return jsonify({"error": "User not found"}), 404
        
        conn.close()
        
        return jsonify({
            "success": True,
            "user": {
                "email": user_data[3],
                "first_name": user_data[1],
                "last_name": user_data[2],
                "prop_firm": user_data[12] if len(user_data) > 12 else None,
                "account_type": user_data[13] if len(user_data) > 13 else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/signals', methods=['GET'])
def get_signals():
    """Get trading signals"""
    return jsonify({
        "success": True,
        "signals": [
            {"symbol": "EURUSD", "direction": "BUY", "confidence": 85},
            {"symbol": "GBPUSD", "direction": "SELL", "confidence": 78}
        ]
    })

if __name__ == '__main__':
    print("🚀 Starting TraderEdgePro Backend Server...")
    
    # Create tables
    if create_tables():
        print("✅ Database tables ready")
    else:
        print("⚠️  Database table creation failed")
    
    print("🌐 Server running on http://localhost:5000")
    print("📊 API endpoints available:")
    print("   - POST /api/auth/register")
    print("   - POST /api/payments") 
    print("   - POST /api/questionnaire")
    print("   - GET  /api/dashboard/<email>")
    print("   - GET  /api/signals")
    
    app.run(host='0.0.0.0', port=5000, debug=True)

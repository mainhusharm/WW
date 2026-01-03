#!/usr/bin/env python3
"""
Unified Customer Service Integration
This service connects signup, payment, and customer-service database
"""

import sqlite3
import hashlib
import uuid
import json
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

def create_customer_service_tables():
    """Create customer service tables if they don't exist"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create customers table for customer service
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unique_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            membership_tier TEXT DEFAULT 'free',
            join_date TEXT NOT NULL,
            last_active TEXT,
            phone TEXT,
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            payment_status TEXT DEFAULT 'pending',
            payment_date TEXT,
            questionnaire_completed BOOLEAN DEFAULT 0,
            account_type TEXT,
            prop_firm TEXT,
            account_size INTEGER DEFAULT 0
        )
    """)
    
    # Create customer_activities table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customer_activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            activity_type TEXT NOT NULL,
            activity_details TEXT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    """)
    
    # Create customer_service_data table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customer_service_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            email TEXT NOT NULL,
            questionnaire_data TEXT,
            screenshots TEXT,
            risk_management_plan TEXT,
            subscription_plan TEXT,
            account_type TEXT,
            prop_firm TEXT,
            account_size INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    """)
    
    conn.commit()
    conn.close()

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register_user():
    """Unified user registration that saves to both users and customers tables"""
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
        
        # Create tables if they don't exist
        create_customer_service_tables()
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists in either table
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"msg": "User already exists"}), 409
        
        cursor.execute("SELECT id FROM customers WHERE email = ?", (email,))
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
        
        # Create user in users table
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
        
        # Create customer in customers table
        cursor.execute("""
            INSERT INTO customers (
                unique_id, name, email, password_hash, membership_tier,
                join_date, last_active, status, payment_status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            unique_id, username, email, password_hash, plan_type,
            datetime.utcnow().isoformat(), datetime.utcnow().isoformat(),
            'active', 'pending', datetime.utcnow().isoformat(), datetime.utcnow().isoformat()
        ))
        
        customer_id = cursor.lastrowid
        
        # Create customer service data
        cursor.execute("""
            INSERT INTO customer_service_data (
                customer_id, email, account_type, prop_firm, account_size, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            customer_id, email, plan_type, 'Unknown', 0,
            datetime.utcnow().isoformat(), datetime.utcnow().isoformat()
        ))
        
        # Log the registration activity
        cursor.execute("""
            INSERT INTO customer_activities (
                customer_id, activity_type, activity_details, timestamp
            ) VALUES (?, ?, ?, ?)
        """, (
            customer_id, 'registration', f'User registered with email: {email}', datetime.utcnow().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        # Create access token
        access_token = f"token_{user_id}_{uuid.uuid4().hex[:16]}"
        
        print(f"✅ User registered in both systems: {email} (User ID: {user_id}, Customer ID: {customer_id})")
        
        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user_id,
                "username": username,
                "email": email,
                "plan_type": plan_type,
                "unique_id": unique_id,
                "customer_id": customer_id
            }
        }), 201
        
    except Exception as e:
        print(f"❌ Error registering user: {str(e)}")
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

@app.route('/api/payment/verify', methods=['POST', 'OPTIONS'])
def verify_payment():
    """Verify payment and update both user and customer status"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        email = data.get('email')
        payment_status = data.get('status')
        payment_method = data.get('payment_method', 'stripe')
        amount = data.get('amount', 0)
        
        if not email:
            return jsonify({"msg": "Email required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if payment_status == 'completed':
            # Update user status
            cursor.execute("""
                UPDATE users 
                SET plan_type = 'premium', last_login = ?
                WHERE email = ?
            """, (datetime.utcnow().isoformat(), email))
            
            # Update customer status
            cursor.execute("""
                UPDATE customers 
                SET membership_tier = 'premium', payment_status = 'completed', 
                    payment_date = ?, last_active = ?, updated_at = ?
                WHERE email = ?
            """, (datetime.utcnow().isoformat(), datetime.utcnow().isoformat(), 
                  datetime.utcnow().isoformat(), email))
            
            # Update customer service data
            cursor.execute("""
                UPDATE customer_service_data 
                SET account_type = 'premium', updated_at = ?
                WHERE email = ?
            """, (datetime.utcnow().isoformat(), email))
            
            # Get customer ID for activity log
            cursor.execute("SELECT id FROM customers WHERE email = ?", (email,))
            customer = cursor.fetchone()
            
            if customer:
                # Log payment activity
                cursor.execute("""
                    INSERT INTO customer_activities (
                        customer_id, activity_type, activity_details, timestamp
                    ) VALUES (?, ?, ?, ?)
                """, (
                    customer['id'], 'payment_completed', 
                    f'Payment completed via {payment_method}, Amount: ${amount}', 
                    datetime.utcnow().isoformat()
                ))
            
            conn.commit()
            conn.close()
            
            print(f"✅ Payment verified for: {email}")
            return jsonify({"msg": "Payment verified successfully"}), 200
        else:
            # Log failed payment
            cursor.execute("SELECT id FROM customers WHERE email = ?", (email,))
            customer = cursor.fetchone()
            
            if customer:
                cursor.execute("""
                    INSERT INTO customer_activities (
                        customer_id, activity_type, activity_details, timestamp
                    ) VALUES (?, ?, ?, ?)
                """, (
                    customer['id'], 'payment_failed', 
                    f'Payment failed via {payment_method}, Amount: ${amount}', 
                    datetime.utcnow().isoformat()
                ))
            
            conn.commit()
            conn.close()
            
            return jsonify({"msg": "Payment not completed"}), 400
            
    except Exception as e:
        print(f"❌ Error verifying payment: {str(e)}")
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

@app.route('/api/customers', methods=['GET'])
def get_customers():
    """Get all customers for customer service dashboard"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT c.*, csd.account_type, csd.prop_firm, csd.account_size,
                   csd.questionnaire_data, csd.created_at as service_created_at
            FROM customers c
            LEFT JOIN customer_service_data csd ON c.id = csd.customer_id
            ORDER BY c.created_at DESC
        """)
        
        customers = cursor.fetchall()
        conn.close()
        
        customer_list = []
        for customer in customers:
            customer_list.append({
                "id": customer['id'],
                "unique_id": customer['unique_id'],
                "name": customer['name'],
                "email": customer['email'],
                "membership_tier": customer['membership_tier'],
                "status": customer['status'],
                "payment_status": customer['payment_status'],
                "payment_date": customer['payment_date'],
                "questionnaire_completed": customer['questionnaire_completed'],
                "account_type": customer['account_type'],
                "prop_firm": customer['prop_firm'],
                "account_size": customer['account_size'],
                "join_date": customer['join_date'],
                "last_active": customer['last_active'],
                "created_at": customer['created_at']
            })
        
        return jsonify({
            "success": True,
            "customers": customer_list,
            "total": len(customer_list)
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching customers: {str(e)}")
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

@app.route('/healthz', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "service": "Unified Customer Service",
        "timestamp": datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    print("🚀 Unified Customer Service Integration")
    print("=" * 50)
    print("📊 Available endpoints:")
    print("   POST /api/auth/register - Register user (saves to both systems)")
    print("   POST /api/payment/verify - Verify payment")
    print("   GET  /api/customers - Get all customers")
    print("   GET  /healthz - Health check")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5003, debug=True)

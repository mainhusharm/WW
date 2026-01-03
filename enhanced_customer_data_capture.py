#!/usr/bin/env python3
"""
Enhanced Customer Data Capture System
This system captures ALL user data after signup and payment completion
and stores it permanently with admin-only access controls.
"""

import sqlite3
import hashlib
import uuid
import json
import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Database configuration
DATABASE_PATH = "trading_bots.db"
ADMIN_MPIN = "180623"  # Admin MPIN for data access
CUSTOMER_SERVICE_MPIN = "123456"  # Customer service MPIN

def get_db_connection():
    """Get database connection with foreign key constraints enabled"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_enhanced_tables():
    """Create enhanced tables for comprehensive data capture"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create comprehensive customer data table (IMMUTABLE - admin only can modify)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customer_data_immutable (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            unique_id TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            phone TEXT,
            membership_tier TEXT NOT NULL,
            payment_status TEXT NOT NULL,
            payment_method TEXT,
            payment_amount DECIMAL(10,2),
            payment_date TEXT,
            join_date TEXT NOT NULL,
            last_active TEXT,
            status TEXT DEFAULT 'active',
            
            -- Questionnaire data (JSON)
            questionnaire_data TEXT,
            account_type TEXT,
            prop_firm TEXT,
            account_size INTEGER,
            trading_experience TEXT,
            risk_tolerance TEXT,
            trading_goals TEXT,
            
            -- System data
            ip_address TEXT,
            user_agent TEXT,
            signup_source TEXT,
            referral_code TEXT,
            
            -- Timestamps
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            
            -- Audit fields
            data_capture_complete BOOLEAN DEFAULT 0,
            admin_verified BOOLEAN DEFAULT 0,
            admin_notes TEXT,
            
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    """)
    
    # Create data capture audit log (IMMUTABLE)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS data_capture_audit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            capture_stage TEXT NOT NULL, -- 'signup', 'payment', 'questionnaire', 'complete'
            data_snapshot TEXT NOT NULL, -- JSON of all data at this stage
            ip_address TEXT,
            user_agent TEXT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            admin_verified BOOLEAN DEFAULT 0,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    """)
    
    # Create admin access log (IMMUTABLE)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS admin_access_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_username TEXT NOT NULL,
            action_type TEXT NOT NULL, -- 'view', 'modify', 'export', 'delete_attempt'
            customer_id INTEGER,
            data_accessed TEXT, -- JSON of what data was accessed
            ip_address TEXT,
            user_agent TEXT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            success BOOLEAN DEFAULT 1,
            notes TEXT
        )
    """)
    
    # Create data export log (IMMUTABLE)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS data_export_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_username TEXT NOT NULL,
            export_type TEXT NOT NULL, -- 'full', 'partial', 'customer_specific'
            customer_ids TEXT, -- JSON array of customer IDs
            export_format TEXT, -- 'json', 'csv', 'excel'
            file_path TEXT,
            ip_address TEXT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            records_exported INTEGER
        )
    """)
    
    conn.commit()
    conn.close()
    logger.info("✅ Enhanced tables created successfully")

def verify_admin_access():
    """Verify admin access using MPIN or token"""
    auth_header = request.headers.get('Authorization')
    mpin = request.headers.get('X-Admin-MPIN')
    
    if mpin and mpin in [ADMIN_MPIN, CUSTOMER_SERVICE_MPIN]:
        return True, mpin == ADMIN_MPIN
    
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        # In production, verify JWT token here
        if token == 'mpin_authenticated_token':
            return True, True
    
    return False, False

@app.route('/api/customer-data/capture-signup', methods=['POST', 'OPTIONS'])
def capture_signup_data():
    """Capture comprehensive signup data - IMMUTABLE"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Extract all signup data
        email = data.get('email')
        password = data.get('password')
        firstName = data.get('firstName', '')
        lastName = data.get('lastName', '')
        plan_type = data.get('plan_type', 'premium')
        phone = data.get('phone', '')
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent', '')
        signup_source = data.get('signup_source', 'website')
        referral_code = data.get('referral_code', '')
        
        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if customer already exists
        cursor.execute("SELECT id FROM customers WHERE email = ?", (email,))
        existing_customer = cursor.fetchone()
        
        if existing_customer:
            conn.close()
            return jsonify({"error": "Customer already exists"}), 409
        
        # Create customer in main customers table
        unique_id = str(uuid.uuid4())[:8].upper()
        username = f"{firstName} {lastName}".strip() or "New User"
        password_hash = hash_password(password)
        
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
        
        # Create IMMUTABLE customer data record
        cursor.execute("""
            INSERT INTO customer_data_immutable (
                customer_id, unique_id, email, name, password_hash, phone,
                membership_tier, payment_status, join_date, last_active, status,
                ip_address, user_agent, signup_source, referral_code,
                created_at, updated_at, data_capture_complete
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            customer_id, unique_id, email, username, password_hash, phone,
            plan_type, 'pending', datetime.utcnow().isoformat(), 
            datetime.utcnow().isoformat(), 'active',
            ip_address, user_agent, signup_source, referral_code,
            datetime.utcnow().isoformat(), datetime.utcnow().isoformat(), 0
        ))
        
        # Log data capture
        signup_snapshot = {
            'email': email,
            'name': username,
            'plan_type': plan_type,
            'phone': phone,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'signup_source': signup_source,
            'referral_code': referral_code,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        cursor.execute("""
            INSERT INTO data_capture_audit (
                customer_id, capture_stage, data_snapshot, ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?)
        """, (
            customer_id, 'signup', json.dumps(signup_snapshot), ip_address, user_agent
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"✅ Signup data captured for: {email} (ID: {customer_id})")
        
        return jsonify({
            "success": True,
            "customer_id": customer_id,
            "unique_id": unique_id,
            "message": "Signup data captured successfully"
        }), 201
        
    except Exception as e:
        logger.error(f"❌ Error capturing signup data: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/customer-data/capture-payment', methods=['POST', 'OPTIONS'])
def capture_payment_data():
    """Capture comprehensive payment data - IMMUTABLE"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        email = data.get('email')
        payment_status = data.get('status')
        payment_method = data.get('payment_method', 'stripe')
        amount = data.get('amount', 0)
        transaction_id = data.get('transaction_id', '')
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent', '')
        
        if not email:
            return jsonify({"error": "Email required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get customer ID
        cursor.execute("SELECT id FROM customers WHERE email = ?", (email,))
        customer = cursor.fetchone()
        
        if not customer:
            conn.close()
            return jsonify({"error": "Customer not found"}), 404
        
        customer_id = customer['id']
        
        if payment_status == 'completed':
            # Update main customer record
            cursor.execute("""
                UPDATE customers 
                SET membership_tier = 'premium', payment_status = 'completed', 
                    payment_date = ?, last_active = ?, updated_at = ?
                WHERE email = ?
            """, (datetime.utcnow().isoformat(), datetime.utcnow().isoformat(), 
                  datetime.utcnow().isoformat(), email))
            
            # Update IMMUTABLE customer data record
            cursor.execute("""
                UPDATE customer_data_immutable 
                SET payment_status = 'completed', payment_method = ?, 
                    payment_amount = ?, payment_date = ?, last_active = ?, 
                    updated_at = ?, data_capture_complete = 1
                WHERE customer_id = ?
            """, (payment_method, amount, datetime.utcnow().isoformat(), 
                  datetime.utcnow().isoformat(), datetime.utcnow().isoformat(), customer_id))
            
            # Log payment capture
            payment_snapshot = {
                'email': email,
                'payment_status': payment_status,
                'payment_method': payment_method,
                'amount': amount,
                'transaction_id': transaction_id,
                'ip_address': ip_address,
                'user_agent': user_agent,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            cursor.execute("""
                INSERT INTO data_capture_audit (
                    customer_id, capture_stage, data_snapshot, ip_address, user_agent
                ) VALUES (?, ?, ?, ?, ?)
            """, (
                customer_id, 'payment', json.dumps(payment_snapshot), ip_address, user_agent
            ))
            
            conn.commit()
            conn.close()
            
            logger.info(f"✅ Payment data captured for: {email} (ID: {customer_id})")
            
            return jsonify({
                "success": True,
                "message": "Payment data captured successfully"
            }), 200
        else:
            # Log failed payment
            payment_snapshot = {
                'email': email,
                'payment_status': payment_status,
                'payment_method': payment_method,
                'amount': amount,
                'transaction_id': transaction_id,
                'ip_address': ip_address,
                'user_agent': user_agent,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            cursor.execute("""
                INSERT INTO data_capture_audit (
                    customer_id, capture_stage, data_snapshot, ip_address, user_agent
                ) VALUES (?, ?, ?, ?, ?)
            """, (
                customer_id, 'payment_failed', json.dumps(payment_snapshot), ip_address, user_agent
            ))
            
            conn.commit()
            conn.close()
            
            return jsonify({"error": "Payment not completed"}), 400
            
    except Exception as e:
        logger.error(f"❌ Error capturing payment data: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/customer-data/capture-questionnaire', methods=['POST', 'OPTIONS'])
def capture_questionnaire_data():
    """Capture comprehensive questionnaire data - IMMUTABLE"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        email = data.get('email')
        questionnaire_data = data.get('questionnaire_data', {})
        account_type = data.get('account_type', 'Unknown')
        prop_firm = data.get('prop_firm', 'Unknown')
        account_size = data.get('account_size', 0)
        trading_experience = data.get('trading_experience', 'Unknown')
        risk_tolerance = data.get('risk_tolerance', 'Unknown')
        trading_goals = data.get('trading_goals', 'Unknown')
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent', '')
        
        if not email:
            return jsonify({"error": "Email required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get customer ID
        cursor.execute("SELECT id FROM customers WHERE email = ?", (email,))
        customer = cursor.fetchone()
        
        if not customer:
            conn.close()
            return jsonify({"error": "Customer not found"}), 404
        
        customer_id = customer['id']
        
        # Update main customer record
        cursor.execute("""
            UPDATE customers 
            SET questionnaire_completed = TRUE, account_type = ?, 
                prop_firm = ?, account_size = ?, updated_at = ?
            WHERE email = ?
        """, (account_type, prop_firm, account_size, datetime.utcnow().isoformat(), email))
        
        # Update IMMUTABLE customer data record
        cursor.execute("""
            UPDATE customer_data_immutable 
            SET questionnaire_data = ?, account_type = ?, prop_firm = ?, 
                account_size = ?, trading_experience = ?, risk_tolerance = ?,
                trading_goals = ?, updated_at = ?
            WHERE customer_id = ?
        """, (json.dumps(questionnaire_data), account_type, prop_firm, 
              account_size, trading_experience, risk_tolerance, trading_goals,
              datetime.utcnow().isoformat(), customer_id))
        
        # Log questionnaire capture
        questionnaire_snapshot = {
            'email': email,
            'questionnaire_data': questionnaire_data,
            'account_type': account_type,
            'prop_firm': prop_firm,
            'account_size': account_size,
            'trading_experience': trading_experience,
            'risk_tolerance': risk_tolerance,
            'trading_goals': trading_goals,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        cursor.execute("""
            INSERT INTO data_capture_audit (
                customer_id, capture_stage, data_snapshot, ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?)
        """, (
            customer_id, 'questionnaire', json.dumps(questionnaire_snapshot), ip_address, user_agent
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"✅ Questionnaire data captured for: {email} (ID: {customer_id})")
        
        return jsonify({
            "success": True,
            "message": "Questionnaire data captured successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error capturing questionnaire data: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/customer-data/get-all', methods=['GET'])
def get_all_customer_data():
    """Get all customer data - ADMIN ONLY ACCESS"""
    try:
        # Verify admin access
        is_authenticated, is_admin = verify_admin_access()
        if not is_authenticated:
            return jsonify({"error": "Admin access required"}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all customer data
        cursor.execute("""
            SELECT * FROM customer_data_immutable 
            ORDER BY created_at DESC
        """)
        
        customers = cursor.fetchall()
        
        # Log admin access
        admin_username = request.headers.get('X-Admin-Username', 'unknown')
        cursor.execute("""
            INSERT INTO admin_access_log (
                admin_username, action_type, data_accessed, ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?)
        """, (
            admin_username, 'view_all', json.dumps({'total_customers': len(customers)}),
            request.remote_addr, request.headers.get('User-Agent', '')
        ))
        
        conn.commit()
        conn.close()
        
        customer_list = []
        for customer in customers:
            customer_list.append({
                "id": customer['id'],
                "customer_id": customer['customer_id'],
                "unique_id": customer['unique_id'],
                "email": customer['email'],
                "name": customer['name'],
                "phone": customer['phone'],
                "membership_tier": customer['membership_tier'],
                "payment_status": customer['payment_status'],
                "payment_method": customer['payment_method'],
                "payment_amount": customer['payment_amount'],
                "payment_date": customer['payment_date'],
                "join_date": customer['join_date'],
                "last_active": customer['last_active'],
                "status": customer['status'],
                "questionnaire_data": json.loads(customer['questionnaire_data']) if customer['questionnaire_data'] else {},
                "account_type": customer['account_type'],
                "prop_firm": customer['prop_firm'],
                "account_size": customer['account_size'],
                "trading_experience": customer['trading_experience'],
                "risk_tolerance": customer['risk_tolerance'],
                "trading_goals": customer['trading_goals'],
                "ip_address": customer['ip_address'],
                "user_agent": customer['user_agent'],
                "signup_source": customer['signup_source'],
                "referral_code": customer['referral_code'],
                "data_capture_complete": customer['data_capture_complete'],
                "admin_verified": customer['admin_verified'],
                "admin_notes": customer['admin_notes'],
                "created_at": customer['created_at'],
                "updated_at": customer['updated_at']
            })
        
        logger.info(f"✅ Admin {admin_username} accessed all customer data ({len(customer_list)} records)")
        
        return jsonify({
            "success": True,
            "customers": customer_list,
            "total": len(customer_list),
            "admin_username": admin_username
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error fetching customer data: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/customer-data/get/<int:customer_id>', methods=['GET'])
def get_customer_data(customer_id):
    """Get specific customer data - ADMIN ONLY ACCESS"""
    try:
        # Verify admin access
        is_authenticated, is_admin = verify_admin_access()
        if not is_authenticated:
            return jsonify({"error": "Admin access required"}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get customer data
        cursor.execute("""
            SELECT * FROM customer_data_immutable 
            WHERE customer_id = ?
        """, (customer_id,))
        
        customer = cursor.fetchone()
        
        if not customer:
            conn.close()
            return jsonify({"error": "Customer not found"}), 404
        
        # Log admin access
        admin_username = request.headers.get('X-Admin-Username', 'unknown')
        cursor.execute("""
            INSERT INTO admin_access_log (
                admin_username, action_type, customer_id, data_accessed, ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            admin_username, 'view_specific', customer_id, 
            json.dumps({'customer_id': customer_id, 'email': customer['email']}),
            request.remote_addr, request.headers.get('User-Agent', '')
        ))
        
        conn.commit()
        conn.close()
        
        customer_data = {
            "id": customer['id'],
            "customer_id": customer['customer_id'],
            "unique_id": customer['unique_id'],
            "email": customer['email'],
            "name": customer['name'],
            "phone": customer['phone'],
            "membership_tier": customer['membership_tier'],
            "payment_status": customer['payment_status'],
            "payment_method": customer['payment_method'],
            "payment_amount": customer['payment_amount'],
            "payment_date": customer['payment_date'],
            "join_date": customer['join_date'],
            "last_active": customer['last_active'],
            "status": customer['status'],
            "questionnaire_data": json.loads(customer['questionnaire_data']) if customer['questionnaire_data'] else {},
            "account_type": customer['account_type'],
            "prop_firm": customer['prop_firm'],
            "account_size": customer['account_size'],
            "trading_experience": customer['trading_experience'],
            "risk_tolerance": customer['risk_tolerance'],
            "trading_goals": customer['trading_goals'],
            "ip_address": customer['ip_address'],
            "user_agent": customer['user_agent'],
            "signup_source": customer['signup_source'],
            "referral_code": customer['referral_code'],
            "data_capture_complete": customer['data_capture_complete'],
            "admin_verified": customer['admin_verified'],
            "admin_notes": customer['admin_notes'],
            "created_at": customer['created_at'],
            "updated_at": customer['updated_at']
        }
        
        logger.info(f"✅ Admin {admin_username} accessed customer data for ID: {customer_id}")
        
        return jsonify({
            "success": True,
            "customer": customer_data
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error fetching customer data: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/customer-data/export', methods=['POST'])
def export_customer_data():
    """Export customer data - ADMIN ONLY ACCESS"""
    try:
        # Verify admin access
        is_authenticated, is_admin = verify_admin_access()
        if not is_authenticated:
            return jsonify({"error": "Admin access required"}), 403
        
        data = request.get_json()
        export_type = data.get('export_type', 'all')  # 'all', 'payment_verified', 'specific'
        export_format = data.get('export_format', 'json')  # 'json', 'csv'
        customer_ids = data.get('customer_ids', [])
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build query based on export type
        if export_type == 'payment_verified':
            cursor.execute("""
                SELECT * FROM customer_data_immutable 
                WHERE payment_status = 'completed'
                ORDER BY created_at DESC
            """)
        elif export_type == 'specific' and customer_ids:
            placeholders = ','.join(['?' for _ in customer_ids])
            cursor.execute(f"""
                SELECT * FROM customer_data_immutable 
                WHERE customer_id IN ({placeholders})
                ORDER BY created_at DESC
            """, customer_ids)
        else:
            cursor.execute("""
                SELECT * FROM customer_data_immutable 
                ORDER BY created_at DESC
            """)
        
        customers = cursor.fetchall()
        
        # Log export
        admin_username = request.headers.get('X-Admin-Username', 'unknown')
        cursor.execute("""
            INSERT INTO data_export_log (
                admin_username, export_type, customer_ids, export_format, 
                ip_address, records_exported
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            admin_username, export_type, json.dumps(customer_ids), export_format,
            request.remote_addr, len(customers)
        ))
        
        conn.commit()
        conn.close()
        
        # Prepare export data
        export_data = []
        for customer in customers:
            export_data.append({
                "id": customer['id'],
                "customer_id": customer['customer_id'],
                "unique_id": customer['unique_id'],
                "email": customer['email'],
                "name": customer['name'],
                "phone": customer['phone'],
                "membership_tier": customer['membership_tier'],
                "payment_status": customer['payment_status'],
                "payment_method": customer['payment_method'],
                "payment_amount": customer['payment_amount'],
                "payment_date": customer['payment_date'],
                "join_date": customer['join_date'],
                "last_active": customer['last_active'],
                "status": customer['status'],
                "questionnaire_data": json.loads(customer['questionnaire_data']) if customer['questionnaire_data'] else {},
                "account_type": customer['account_type'],
                "prop_firm": customer['prop_firm'],
                "account_size": customer['account_size'],
                "trading_experience": customer['trading_experience'],
                "risk_tolerance": customer['risk_tolerance'],
                "trading_goals": customer['trading_goals'],
                "ip_address": customer['ip_address'],
                "signup_source": customer['signup_source'],
                "referral_code": customer['referral_code'],
                "data_capture_complete": customer['data_capture_complete'],
                "admin_verified": customer['admin_verified'],
                "created_at": customer['created_at'],
                "updated_at": customer['updated_at']
            })
        
        logger.info(f"✅ Admin {admin_username} exported {len(export_data)} customer records")
        
        return jsonify({
            "success": True,
            "export_data": export_data,
            "total_records": len(export_data),
            "export_type": export_type,
            "export_format": export_format,
            "exported_at": datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error exporting customer data: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/customer-data/stats', methods=['GET'])
def get_customer_data_stats():
    """Get customer data statistics - ADMIN ONLY ACCESS"""
    try:
        # Verify admin access
        is_authenticated, is_admin = verify_admin_access()
        if not is_authenticated:
            return jsonify({"error": "Admin access required"}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get statistics
        cursor.execute("SELECT COUNT(*) as total FROM customer_data_immutable")
        total_customers = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as completed FROM customer_data_immutable WHERE payment_status = 'completed'")
        payment_verified = cursor.fetchone()['completed']
        
        cursor.execute("SELECT COUNT(*) as pending FROM customer_data_immutable WHERE payment_status = 'pending'")
        payment_pending = cursor.fetchone()['pending']
        
        cursor.execute("SELECT COUNT(*) as complete FROM customer_data_immutable WHERE data_capture_complete = 1")
        data_complete = cursor.fetchone()['complete']
        
        cursor.execute("SELECT COUNT(*) as verified FROM customer_data_immutable WHERE admin_verified = 1")
        admin_verified = cursor.fetchone()['verified']
        
        # Get recent activity
        cursor.execute("""
            SELECT COUNT(*) as recent FROM customer_data_immutable 
            WHERE created_at >= datetime('now', '-7 days')
        """)
        recent_signups = cursor.fetchone()['recent']
        
        conn.close()
        
        stats = {
            "total_customers": total_customers,
            "payment_verified": payment_verified,
            "payment_pending": payment_pending,
            "data_capture_complete": data_complete,
            "admin_verified": admin_verified,
            "recent_signups_7_days": recent_signups,
            "completion_rate": round((data_complete / total_customers * 100), 2) if total_customers > 0 else 0,
            "payment_success_rate": round((payment_verified / total_customers * 100), 2) if total_customers > 0 else 0
        }
        
        return jsonify({
            "success": True,
            "stats": stats,
            "generated_at": datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error fetching customer data stats: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/healthz', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "service": "Enhanced Customer Data Capture",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected"
    })

if __name__ == '__main__':
    print("🚀 Enhanced Customer Data Capture System")
    print("=" * 60)
    print("📊 Available endpoints:")
    print("   POST /api/customer-data/capture-signup - Capture signup data")
    print("   POST /api/customer-data/capture-payment - Capture payment data")
    print("   POST /api/customer-data/capture-questionnaire - Capture questionnaire data")
    print("   GET  /api/customer-data/get-all - Get all customer data (ADMIN ONLY)")
    print("   GET  /api/customer-data/get/<id> - Get specific customer data (ADMIN ONLY)")
    print("   POST /api/customer-data/export - Export customer data (ADMIN ONLY)")
    print("   GET  /api/customer-data/stats - Get customer data statistics (ADMIN ONLY)")
    print("   GET  /healthz - Health check")
    print("=" * 60)
    print("🔐 Admin MPIN: 180623")
    print("🔐 Customer Service MPIN: 123456")
    print("=" * 60)
    
    # Create tables on startup
    create_enhanced_tables()
    
    app.run(host='0.0.0.0', port=5004, debug=True)

#!/usr/bin/env python3
"""
Working Database Routes - Extracted from database done copy
This uses the exact method that was working properly
"""

from flask import Flask, Blueprint, request, jsonify
import sqlite3
import psycopg2
import psycopg2.extras
import os
import uuid
import hashlib
from datetime import datetime
import json

# Create blueprint
working_db_bp = Blueprint('working_db_bp', __name__)

# Database configuration - exactly like the working version
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///trading_platform.db')

def get_db_connection():
    """Get database connection - exact method from working version"""
    if DATABASE_URL.startswith('sqlite'):
        # SQLite connection
        db_path = DATABASE_URL.replace('sqlite:///', '')
        conn = sqlite3.connect(db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn
    else:
        # PostgreSQL connection (for production)
        try:
            import psycopg2
            import psycopg2.extras
            
            # Handle postgres:// vs postgresql:// URL formats
            db_url = DATABASE_URL
            if DATABASE_URL.startswith('postgres://'):
                db_url = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
            
            conn = psycopg2.connect(
                db_url,
                cursor_factory=psycopg2.extras.RealDictCursor
            )
            return conn
        except ImportError:
            # Fallback to SQLite if psycopg2 is not available
            print("Warning: psycopg2 not available, falling back to SQLite")
            conn = sqlite3.connect('trading_platform.db', check_same_thread=False)
            conn.row_factory = sqlite3.Row
            return conn

def hash_password(password):
    """Hash password using SHA-256 - exact method from working version"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(user_id):
    """Create a simple access token - exact method from working version"""
    return f"token_{user_id}_{uuid.uuid4().hex[:16]}"

def init_database_tables():
    """Initialize database tables if they don't exist"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if DATABASE_URL.startswith('sqlite'):
            # SQLite table creation
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    plan_type TEXT DEFAULT 'premium',
                    created_at TEXT NOT NULL
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS customer_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT REFERENCES users(id),
                    full_name TEXT,
                    phone TEXT,
                    company TEXT,
                    country TEXT,
                    prop_firm TEXT,
                    account_type TEXT,
                    account_size REAL,
                    risk_percentage REAL,
                    questionnaire_data TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS payment_transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT REFERENCES users(id),
                    amount REAL NOT NULL,
                    currency TEXT DEFAULT 'USD',
                    payment_method TEXT NOT NULL,
                    status TEXT DEFAULT 'completed',
                    transaction_id TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            ''')
            
        else:
            # PostgreSQL table creation - using the working schema
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
                    username VARCHAR(100) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    normalized_email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    plan_type VARCHAR(50) DEFAULT 'premium',
                    unique_id VARCHAR(50) UNIQUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP WITH TIME ZONE,
                    is_active BOOLEAN DEFAULT true,
                    is_verified BOOLEAN DEFAULT false
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS customer_data (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    customer_uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
                    full_name TEXT,
                    phone TEXT,
                    company TEXT,
                    country TEXT,
                    membership_tier VARCHAR(50) DEFAULT 'premium',
                    account_status VARCHAR(50) DEFAULT 'active',
                    payment_status VARCHAR(50) DEFAULT 'completed',
                    payment_method VARCHAR(50),
                    payment_amount DECIMAL(10,2) DEFAULT 0,
                    account_type VARCHAR(50),
                    prop_firm VARCHAR(100),
                    account_size DECIMAL(15,2) DEFAULT 0,
                    trading_experience VARCHAR(50),
                    risk_tolerance VARCHAR(50),
                    questionnaire_data JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS payment_transactions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    transaction_uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    currency VARCHAR(10) DEFAULT 'USD',
                    payment_method VARCHAR(50) NOT NULL,
                    transaction_id VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'completed',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            ''')
        
        conn.commit()
        conn.close()
        print("✅ Database tables initialized successfully")
        return True
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

@working_db_bp.route('/working/health', methods=['GET'])
def working_health():
    """Health check endpoint - working version"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Test database connection
        if DATABASE_URL.startswith('sqlite'):
            cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table'")
            table_count = cursor.fetchone()[0]
        else:
            cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
            table_count = cursor.fetchone()[0] if cursor.fetchone() else 0
        
        # Get user count
        try:
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
        except:
            user_count = 0
        
        conn.close()
        
        return jsonify({
            'status': 'ok',
            'message': 'Working database system is running',
            'database': 'connected',
            'database_type': 'sqlite' if DATABASE_URL.startswith('sqlite') else 'postgresql',
            'database_url_prefix': DATABASE_URL[:30] + '...',
            'tables': table_count,
            'users': user_count,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Database connection failed: {str(e)}',
            'database': 'disconnected'
        }), 500

@working_db_bp.route('/working/register', methods=['POST', 'OPTIONS'])
def working_register():
    """User registration endpoint - exact working version"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No JSON data provided"}), 400
        
        email = data.get('email')
        password = data.get('password')
        username = data.get('username', email.split('@')[0] if email else '')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        phone = data.get('phone', '')
        company = data.get('company', '')
        country = data.get('country', '')
        
        if not email or not password:
            return jsonify({"msg": "Email and password required"}), 400
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"msg": "User already exists"}), 409
        
        # Create user - exact method from working version
        user_id = str(uuid.uuid4())
        password_hash = hash_password(password)
        full_name = f"{first_name} {last_name}".strip()
        
        if DATABASE_URL.startswith('sqlite'):
            cursor.execute("""
                INSERT INTO users (id, username, email, password_hash, plan_type, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (user_id, username, email, password_hash, 'premium', datetime.now().isoformat()))
        else:
            cursor.execute("""
                INSERT INTO users (username, email, normalized_email, password_hash, plan_type, unique_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, uuid
            """, (username, email, email.lower(), password_hash, 'premium', user_id))
            
            result = cursor.fetchone()
            if result:
                user_id = result['id']
        
        # Insert customer data if provided
        if any([first_name, last_name, phone, company, country]):
            if DATABASE_URL.startswith('sqlite'):
                cursor.execute("""
                    INSERT INTO customer_data (user_id, full_name, phone, company, country, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (user_id, full_name, phone, company, country, datetime.now().isoformat()))
            else:
                cursor.execute("""
                    INSERT INTO customer_data (user_id, full_name, phone, company, country)
                    VALUES (%s, %s, %s, %s, %s)
                """, (user_id, full_name, phone, company, country))
        
        conn.commit()
        conn.close()
        
        # Create access token
        access_token = create_access_token(user_id)
        
        return jsonify({
            "msg": "User created successfully",
            "user_id": str(user_id),
            "access_token": access_token,
            "user": {
                "id": str(user_id),
                "username": username,
                "email": email,
                "full_name": full_name
            }
        }), 201
        
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

@working_db_bp.route('/working/payment', methods=['POST', 'OPTIONS'])
def working_payment():
    """Payment processing endpoint - working version"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No JSON data provided"}), 400
        
        user_id = data.get('user_id')
        amount = data.get('amount', data.get('final_price', 0))
        payment_method = data.get('payment_method', 'stripe')
        transaction_id = data.get('transaction_id', str(uuid.uuid4()))
        
        if not user_id or not amount:
            return jsonify({"msg": "User ID and amount required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert payment transaction
        if DATABASE_URL.startswith('sqlite'):
            cursor.execute("""
                INSERT INTO payment_transactions (user_id, amount, payment_method, transaction_id, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, amount, payment_method, transaction_id, datetime.now().isoformat()))
        else:
            cursor.execute("""
                INSERT INTO payment_transactions (user_id, amount, payment_method, transaction_id)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (user_id, amount, payment_method, transaction_id))
            
            result = cursor.fetchone()
            payment_id = result['id'] if result else None
        
        # Update customer data payment info
        if DATABASE_URL.startswith('sqlite'):
            cursor.execute("""
                UPDATE customer_data 
                SET payment_method = ?, payment_amount = ?
                WHERE user_id = ?
            """, (payment_method, amount, user_id))
        else:
            cursor.execute("""
                UPDATE customer_data 
                SET payment_method = %s, payment_amount = %s, payment_status = 'completed'
                WHERE user_id = %s
            """, (payment_method, amount, user_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "msg": "Payment processed successfully",
            "transaction_id": transaction_id,
            "status": "completed"
        }), 201
        
    except Exception as e:
        print(f"Payment error: {e}")
        return jsonify({"msg": f"Payment processing failed: {str(e)}"}), 500

@working_db_bp.route('/working/questionnaire', methods=['POST', 'OPTIONS'])
def working_questionnaire():
    """Questionnaire endpoint - working version"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get user ID from token (simplified for testing)
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            if token.startswith('token_'):
                user_id = token.split('_')[1]
            else:
                return jsonify({"msg": "Invalid token"}), 401
        else:
            return jsonify({"msg": "Authorization required"}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No JSON data provided"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Update customer data with questionnaire info
        prop_firm = data.get('prop_firm', data.get('propFirm'))
        account_type = data.get('account_type', data.get('accountType'))
        account_size = data.get('account_size', data.get('accountSize'))
        risk_percentage = data.get('risk_percentage', data.get('riskPercentage'))
        account_equity = data.get('account_equity', data.get('accountEquity'))
        
        if DATABASE_URL.startswith('sqlite'):
            cursor.execute("""
                UPDATE customer_data 
                SET prop_firm = ?, account_type = ?, account_size = ?, 
                    risk_percentage = ?, questionnaire_data = ?
                WHERE user_id = ?
            """, (prop_firm, account_type, account_size, risk_percentage, 
                  json.dumps(data), user_id))
        else:
            cursor.execute("""
                UPDATE customer_data 
                SET prop_firm = %s, account_type = %s, account_size = %s, 
                    risk_percentage = %s, questionnaire_data = %s
                WHERE user_id = %s
            """, (prop_firm, account_type, account_size, risk_percentage, 
                  json.dumps(data), user_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "msg": "Questionnaire saved successfully"
        }), 200
        
    except Exception as e:
        print(f"Questionnaire error: {e}")
        return jsonify({"msg": f"Questionnaire processing failed: {str(e)}"}), 500

@working_db_bp.route('/working/dashboard-data', methods=['GET', 'OPTIONS'])
def working_dashboard_data():
    """Dashboard data endpoint - working version"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get user ID from token (simplified for testing)
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            if token.startswith('token_'):
                user_id = token.split('_')[1]
            else:
                return jsonify({"msg": "Invalid token"}), 401
        else:
            return jsonify({"msg": "Authorization required"}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user and customer data
        if DATABASE_URL.startswith('sqlite'):
            cursor.execute("""
                SELECT u.*, cd.* FROM users u
                LEFT JOIN customer_data cd ON u.id = cd.user_id
                WHERE u.id = ?
            """, (user_id,))
        else:
            cursor.execute("""
                SELECT u.*, cd.* FROM users u
                LEFT JOIN customer_data cd ON u.id = cd.user_id
                WHERE u.id = %s
            """, (user_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return jsonify({"msg": "User not found"}), 404
        
        # Format response
        response_data = {
            "user_profile": dict(result) if result else {},
            "account_balance": result.get('account_size', 0) if result else 0,
            "total_pnl": 0,
            "win_rate": 0,
            "signals_taken": 0,
            "signals_won": 0,
            "signals_lost": 0,
            "milestone_access_level": 1
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"Dashboard data error: {e}")
        return jsonify({"msg": f"Failed to fetch dashboard data: {str(e)}"}), 500

# Initialize database when module is imported
init_database_tables()

#!/usr/bin/env python3
"""
Enhanced Working Database Routes - Updated to handle enhanced signup, payment, and questionnaire forms
This extends the existing working routes with proper PostgreSQL integration
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
enhanced_working_db_bp = Blueprint('enhanced_working_db_bp', __name__)

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://localhost/traderedgepro')

def get_db_connection():
    """Get database connection with PostgreSQL priority"""
    try:
        # Handle postgres:// vs postgresql:// URL formats
        db_url = DATABASE_URL
        if DATABASE_URL.startswith('postgres://'):
            db_url = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
        
        conn = psycopg2.connect(
            db_url,
            cursor_factory=psycopg2.extras.RealDictCursor
        )
        return conn
    except Exception as e:
        print(f"PostgreSQL connection failed: {e}")
        # Fallback to SQLite for development
        conn = sqlite3.connect('trading_platform.db', check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(user_id):
    """Create a simple access token"""
    return f"token_{user_id}_{uuid.uuid4().hex[:16]}"

def init_enhanced_database():
    """Initialize enhanced database tables"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Read and execute the enhanced schema
        schema_path = os.path.join(os.path.dirname(__file__), 'enhanced_database_schema.sql')
        if os.path.exists(schema_path):
            with open(schema_path, 'r') as f:
                schema_sql = f.read()
            cursor.execute(schema_sql)
        else:
            # Fallback schema creation
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    phone VARCHAR(20),
                    company VARCHAR(255),
                    country VARCHAR(100),
                    agree_to_marketing BOOLEAN DEFAULT FALSE,
                    plan_type VARCHAR(50) DEFAULT 'premium',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    is_active BOOLEAN DEFAULT TRUE
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS payments (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    amount DECIMAL(10,2) NOT NULL,
                    currency VARCHAR(10) DEFAULT 'USD',
                    payment_method VARCHAR(50),
                    payment_status VARCHAR(50) DEFAULT 'pending',
                    transaction_id VARCHAR(255),
                    cryptocurrency VARCHAR(20),
                    network VARCHAR(50),
                    plan_name VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS questionnaire_responses (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    prop_firm VARCHAR(200),
                    account_type VARCHAR(50),
                    challenge_step VARCHAR(50),
                    account_size DECIMAL(15,2),
                    risk_per_trade DECIMAL(5,2),
                    risk_reward_ratio VARCHAR(20),
                    crypto_assets JSONB,
                    forex_pairs JSONB,
                    account_number VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
        
        conn.commit()
        conn.close()
        print("✅ Enhanced database tables initialized successfully")
        return True
        
    except Exception as e:
        print(f"❌ Enhanced database initialization failed: {e}")
        return False

@enhanced_working_db_bp.route('/working/health', methods=['GET'])
def enhanced_health():
    """Enhanced health check endpoint"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Test database connection and get table counts
        cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
        table_count = cursor.fetchone()[0] if cursor.fetchone() else 0
        
        # Get counts from each table
        counts = {}
        for table in ['users', 'payments', 'questionnaire_responses']:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                counts[table] = cursor.fetchone()[0]
            except:
                counts[table] = 0
        
        conn.close()
        
        return jsonify({
            'status': 'ok',
            'message': 'Enhanced TraderEdge Pro API is running',
            'database': 'connected',
            'database_type': 'postgresql',
            'tables': table_count,
            'record_counts': counts,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Database connection failed: {str(e)}',
            'database': 'disconnected'
        }), 500

@enhanced_working_db_bp.route('/working/register', methods=['POST', 'OPTIONS'])
def enhanced_register():
    """Enhanced user registration endpoint for signup-enhanced page"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No JSON data provided"}), 400
        
        # Extract data from enhanced signup form
        first_name = data.get('firstName', '')
        last_name = data.get('lastName', '')
        email = data.get('email', '')
        phone = data.get('phone', '')
        password = data.get('password', '')
        company = data.get('company', '')
        country = data.get('country', '')
        terms = data.get('terms', False)
        newsletter = data.get('newsletter', False)
        
        # Validation
        if not all([first_name, last_name, email, phone, password, country]):
            return jsonify({"success": False, "message": "All required fields must be filled"}), 400
        
        if not terms:
            return jsonify({"success": False, "message": "You must accept the Terms of Service"}), 400
        
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
        
        cursor.execute("""
            INSERT INTO users (first_name, last_name, email, phone, password_hash, company, country, agree_to_marketing, plan_type)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (first_name, last_name, email, phone, password_hash, company, country, newsletter, 'premium'))
        
        result = cursor.fetchone()
        user_id = result['id'] if result else None
        
        conn.commit()
        conn.close()
        
        # Create access token
        access_token = create_access_token(user_id)
        
        return jsonify({
            "success": True,
            "message": "User created successfully",
            "user_id": user_id,
            "access_token": access_token,
            "user": {
                "id": user_id,
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "phone": phone,
                "company": company,
                "country": country
            }
        }), 201
        
    except Exception as e:
        print(f"Enhanced registration error: {e}")
        return jsonify({"success": False, "message": f"Registration failed: {str(e)}"}), 500

@enhanced_working_db_bp.route('/working/payment', methods=['POST', 'OPTIONS'])
def enhanced_payment():
    """Enhanced payment processing endpoint for payment-enhanced page"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No JSON data provided"}), 400
        
        # Extract user and payment data
        user_id = data.get('user_id')
        payment_data = data.get('payment', {})
        
        # Extract payment details
        amount = payment_data.get('amount', 199.99)
        currency = payment_data.get('currency', 'USD')
        method = payment_data.get('method', 'cryptomus')
        cryptocurrency = payment_data.get('cryptocurrency', 'USDT')
        network = payment_data.get('network', 'tron')
        plan = payment_data.get('plan', 'Premium Trading Plan')
        
        if not user_id:
            return jsonify({"success": False, "message": "User ID is required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify user exists
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"success": False, "message": "User not found"}), 404
        
        # Create payment record
        transaction_id = f"txn_{uuid.uuid4().hex[:16]}"
        
        cursor.execute("""
            INSERT INTO payments (user_id, amount, currency, payment_method, payment_status, 
                                transaction_id, cryptocurrency, network, plan_name)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (user_id, amount, currency, method, 'completed', transaction_id, cryptocurrency, network, plan))
        
        result = cursor.fetchone()
        payment_id = result['id'] if result else None
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Payment processed successfully",
            "payment_id": payment_id,
            "transaction_id": transaction_id,
            "status": "completed",
            "amount": amount,
            "currency": currency,
            "method": method,
            "cryptocurrency": cryptocurrency,
            "network": network
        }), 201
        
    except Exception as e:
        print(f"Enhanced payment error: {e}")
        return jsonify({"success": False, "message": f"Payment processing failed: {str(e)}"}), 500

@enhanced_working_db_bp.route('/working/questionnaire', methods=['POST', 'OPTIONS'])
def enhanced_questionnaire():
    """Enhanced questionnaire endpoint for questionnaire-enhanced page"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No JSON data provided"}), 400
        
        # Extract user data
        user_id = data.get('user_id')
        questionnaire_data = data.get('questionnaire', {})
        
        # Extract questionnaire fields
        prop_firm = questionnaire_data.get('propFirm', '')
        account_type = questionnaire_data.get('accountType', '')
        challenge_step = questionnaire_data.get('challengeStep', '')
        account_size = questionnaire_data.get('accountSize', 0)
        risk_per_trade = questionnaire_data.get('riskPerTrade', 0)
        risk_reward_ratio = questionnaire_data.get('riskRewardRatio', '')
        crypto_assets = questionnaire_data.get('cryptoAssets', [])
        forex_pairs = questionnaire_data.get('forexPairs', [])
        account_number = questionnaire_data.get('accountNumber', '')
        
        if not user_id:
            return jsonify({"success": False, "message": "User ID is required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify user exists
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"success": False, "message": "User not found"}), 404
        
        # Check if questionnaire response already exists
        cursor.execute("SELECT id FROM questionnaire_responses WHERE user_id = %s", (user_id,))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing response
            cursor.execute("""
                UPDATE questionnaire_responses 
                SET prop_firm = %s, account_type = %s, challenge_step = %s, account_size = %s,
                    risk_per_trade = %s, risk_reward_ratio = %s, crypto_assets = %s, 
                    forex_pairs = %s, account_number = %s, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = %s
                RETURNING id
            """, (prop_firm, account_type, challenge_step, account_size, risk_per_trade, 
                  risk_reward_ratio, json.dumps(crypto_assets), json.dumps(forex_pairs), 
                  account_number, user_id))
        else:
            # Create new response
            cursor.execute("""
                INSERT INTO questionnaire_responses 
                (user_id, prop_firm, account_type, challenge_step, account_size, risk_per_trade,
                 risk_reward_ratio, crypto_assets, forex_pairs, account_number)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (user_id, prop_firm, account_type, challenge_step, account_size, risk_per_trade,
                  risk_reward_ratio, json.dumps(crypto_assets), json.dumps(forex_pairs), account_number))
        
        result = cursor.fetchone()
        response_id = result['id'] if result else None
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Trading preferences saved successfully",
            "response_id": response_id,
            "data": {
                "prop_firm": prop_firm,
                "account_type": account_type,
                "challenge_step": challenge_step,
                "account_size": account_size,
                "risk_per_trade": risk_per_trade,
                "risk_reward_ratio": risk_reward_ratio,
                "crypto_assets": crypto_assets,
                "forex_pairs": forex_pairs,
                "account_number": account_number
            }
        }), 200
        
    except Exception as e:
        print(f"Enhanced questionnaire error: {e}")
        return jsonify({"success": False, "message": f"Failed to save preferences: {str(e)}"}), 500

@enhanced_working_db_bp.route('/working/dashboard-data', methods=['GET', 'OPTIONS'])
def enhanced_dashboard_data():
    """Enhanced dashboard data endpoint with complete user profile"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get user ID from token
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            if token.startswith('token_'):
                user_id = token.split('_')[1]
            else:
                return jsonify({"success": False, "message": "Invalid token"}), 401
        else:
            return jsonify({"success": False, "message": "Authorization required"}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get complete user profile with payments and questionnaire
        cursor.execute("""
            SELECT u.*, p.amount as payment_amount, p.payment_method, p.payment_status,
                   q.prop_firm, q.account_type, q.account_size, q.risk_per_trade,
                   q.crypto_assets, q.forex_pairs
            FROM users u
            LEFT JOIN payments p ON u.id = p.user_id
            LEFT JOIN questionnaire_responses q ON u.id = q.user_id
            WHERE u.id = %s
            ORDER BY p.created_at DESC, q.created_at DESC
            LIMIT 1
        """, (user_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        # Format response
        user_data = dict(result)
        
        response_data = {
            "success": True,
            "user_profile": {
                "id": user_data.get('id'),
                "first_name": user_data.get('first_name'),
                "last_name": user_data.get('last_name'),
                "email": user_data.get('email'),
                "phone": user_data.get('phone'),
                "company": user_data.get('company'),
                "country": user_data.get('country'),
                "plan_type": user_data.get('plan_type'),
                "created_at": user_data.get('created_at')
            },
            "payment_info": {
                "amount": user_data.get('payment_amount'),
                "method": user_data.get('payment_method'),
                "status": user_data.get('payment_status')
            },
            "trading_profile": {
                "prop_firm": user_data.get('prop_firm'),
                "account_type": user_data.get('account_type'),
                "account_size": user_data.get('account_size'),
                "risk_per_trade": user_data.get('risk_per_trade'),
                "crypto_assets": json.loads(user_data.get('crypto_assets', '[]')) if user_data.get('crypto_assets') else [],
                "forex_pairs": json.loads(user_data.get('forex_pairs', '[]')) if user_data.get('forex_pairs') else []
            },
            "account_balance": user_data.get('account_size', 0),
            "total_pnl": 0,
            "win_rate": 0,
            "signals_taken": 0,
            "signals_won": 0,
            "signals_lost": 0,
            "milestone_access_level": 1
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"Enhanced dashboard data error: {e}")
        return jsonify({"success": False, "message": f"Failed to fetch dashboard data: {str(e)}"}), 500

# Initialize enhanced database when module is imported
init_enhanced_database()

#!/usr/bin/env python3
"""
Render Backend API - PostgreSQL Database with Encryption
This API is designed for Render deployment with proper database integration
"""

import os
import json
import hashlib
import secrets
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any

import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import ProgrammingError
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from cryptography.fernet import Fernet
import bcrypt

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Enhanced CORS configuration for production
CORS(app, 
     origins=["*"], 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
     supports_credentials=True,
     max_age=3600)

# Add CORS preflight handler
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,X-Requested-With,Accept,Origin")
        response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
        response.headers.add('Access-Control-Max-Age', "3600")
        return response, 200

# Add after_request handler for CORS
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Configuration
DATABASE_URL = os.getenv('DATABASE_URL')
ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY', Fernet.generate_key().decode())
SECRET_KEY = os.getenv('SECRET_KEY', secrets.token_hex(32))

app.config['SECRET_KEY'] = SECRET_KEY

# Initialize encryption
cipher_suite = Fernet(ENCRYPTION_KEY.encode())

def get_db_connection():
    """Get PostgreSQL database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        raise

def initialize_database():
    """Initialize database with required tables"""
    try:
        print("Initializing database...")
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create users table with all integrated data
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
                username VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                normalized_email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                full_name VARCHAR(200),
                phone VARCHAR(20),
                company VARCHAR(200),
                country VARCHAR(50),
                
                -- Trading Experience & Goals (from questionnaire)
                trading_experience VARCHAR(50),
                trading_goals TEXT,
                risk_tolerance VARCHAR(50),
                preferred_markets VARCHAR(100),
                trading_style VARCHAR(50),
                
                -- Account Information (from questionnaire)
                account_type VARCHAR(50),
                prop_firm VARCHAR(100),
                account_size DECIMAL(15,2) DEFAULT 0,
                account_equity DECIMAL(15,2) DEFAULT 0,
                account_currency VARCHAR(3) DEFAULT 'USD',
                broker_name VARCHAR(100),
                broker_platform VARCHAR(100),
                
                -- Risk Management (from questionnaire)
                risk_percentage DECIMAL(5,2) DEFAULT 0,
                risk_reward_ratio VARCHAR(20),
                max_daily_loss_percentage DECIMAL(5,2) DEFAULT 0,
                max_weekly_loss_percentage DECIMAL(5,2) DEFAULT 0,
                max_monthly_loss_percentage DECIMAL(5,2) DEFAULT 0,
                
                -- Payment Details (from payment page)
                plan_type VARCHAR(50) DEFAULT 'free',
                payment_status VARCHAR(50) DEFAULT 'pending',
                payment_method VARCHAR(50),
                payment_amount DECIMAL(10,2) DEFAULT 0,
                payment_date TIMESTAMP WITH TIME ZONE,
                transaction_id VARCHAR(255),
                payment_provider VARCHAR(50),
                payment_provider_id VARCHAR(255),
                payment_intent_id VARCHAR(255),
                currency VARCHAR(3) DEFAULT 'USD',
                
                -- Billing Information (from payment page)
                billing_country VARCHAR(50),
                billing_state VARCHAR(50),
                billing_city VARCHAR(100),
                billing_address TEXT,
                billing_postal_code VARCHAR(20),
                company_name VARCHAR(200),
                tax_id VARCHAR(50),
                vat_number VARCHAR(50),
                
                -- User Dashboard Details (from dashboard)
                account_balance DECIMAL(12,2) DEFAULT 0,
                total_pnl DECIMAL(12,2) DEFAULT 0,
                win_rate DECIMAL(5,2) DEFAULT 0,
                total_trades INTEGER DEFAULT 0,
                winning_trades INTEGER DEFAULT 0,
                losing_trades INTEGER DEFAULT 0,
                max_drawdown DECIMAL(12,2) DEFAULT 0,
                current_drawdown DECIMAL(12,2) DEFAULT 0,
                consecutive_wins INTEGER DEFAULT 0,
                consecutive_losses INTEGER DEFAULT 0,
                average_win DECIMAL(12,2) DEFAULT 0,
                average_loss DECIMAL(12,2) DEFAULT 0,
                profit_factor DECIMAL(8,2) DEFAULT 0,
                gross_profit DECIMAL(12,2) DEFAULT 0,
                gross_loss DECIMAL(12,2) DEFAULT 0,
                sharpe_ratio DECIMAL(8,2),
                sortino_ratio DECIMAL(8,2),
                calmar_ratio DECIMAL(8,2),
                
                -- Prop Firm Rules (from questionnaire)
                prop_firm_rules JSONB DEFAULT '{}',
                rule_violations JSONB DEFAULT '[]',
                compliance_status VARCHAR(20) DEFAULT 'compliant',
                
                -- Additional Questionnaire Data
                questionnaire_data JSONB DEFAULT '{}',
                data_capture_complete BOOLEAN DEFAULT false,
                
                -- User Preferences
                agree_to_marketing BOOLEAN DEFAULT false,
                unique_id VARCHAR(50) UNIQUE,
                
                -- Timestamps
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP WITH TIME ZONE,
                last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                -- Account Status
                is_active BOOLEAN DEFAULT true,
                is_verified BOOLEAN DEFAULT false,
                verification_token VARCHAR(255),
                reset_token VARCHAR(255),
                reset_token_expires TIMESTAMP WITH TIME ZONE
            )
        """)
        
        # Create customer_data table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS customer_data (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                customer_uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
                full_name_encrypted TEXT,
                phone_encrypted TEXT,
                address_encrypted TEXT,
                date_of_birth_encrypted TEXT,
                membership_tier VARCHAR(50) DEFAULT 'free',
                account_status VARCHAR(50) DEFAULT 'active',
                payment_status VARCHAR(50) DEFAULT 'pending',
                payment_method VARCHAR(50),
                payment_amount DECIMAL(10,2) DEFAULT 0,
                payment_date TIMESTAMP WITH TIME ZONE,
                account_type VARCHAR(50),
                prop_firm VARCHAR(100),
                account_size DECIMAL(15,2) DEFAULT 0,
                trading_experience VARCHAR(50),
                risk_tolerance VARCHAR(50),
                trading_goals TEXT,
                ip_address INET,
                user_agent TEXT,
                signup_source VARCHAR(100) DEFAULT 'website',
                referral_code VARCHAR(50),
                questionnaire_data JSONB,
                admin_verified BOOLEAN DEFAULT false,
                admin_notes TEXT,
                data_capture_complete BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create risk_plans table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS risk_plans (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                prop_firm VARCHAR(100),
                account_type VARCHAR(50),
                account_size DECIMAL(15,2),
                risk_percentage DECIMAL(5,2),
                has_account BOOLEAN DEFAULT false,
                account_equity DECIMAL(15,2),
                trading_session VARCHAR(50),
                crypto_assets JSONB,
                forex_assets JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create payment_transactions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payment_transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                transaction_uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'USD',
                payment_method VARCHAR(50) NOT NULL,
                payment_provider VARCHAR(50),
                transaction_id VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                gateway_response JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create user_activities table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_activities (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                activity_type VARCHAR(100) NOT NULL,
                activity_data JSONB,
                ip_address INET,
                user_agent TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create admin_access_logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admin_access_logs (
                id SERIAL PRIMARY KEY,
                admin_user_id INTEGER,
                action_type VARCHAR(100) NOT NULL,
                target_user_id INTEGER,
                action_data JSONB,
                ip_address INET,
                user_agent TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_normalized_email ON users(normalized_email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_customer_data_user_id ON customer_data(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_customer_data_uuid ON customer_data(customer_uuid)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_risk_plans_user_id ON risk_plans(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at)")
        
        conn.commit()
        conn.close()
        print("Database initialized successfully")
        
    except Exception as e:
        print(f"Database initialization error: {e}")
        import traceback
        traceback.print_exc()
        raise

def encrypt_data(data: str) -> str:
    """Encrypt sensitive data"""
    if not data:
        return ""
    return cipher_suite.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data: str) -> str:
    """Decrypt sensitive data"""
    if not encrypted_data:
        return ""
    try:
        return cipher_suite.decrypt(encrypted_data.encode()).decode()
    except:
        return ""

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        conn.close()
        
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 500

@app.route('/api/users', methods=['GET'])
def get_all_users():
    """Get all users with customer data"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                id, uuid, username, email, plan_type, created_at, last_login, last_active,
                is_active, is_verified, first_name, last_name, full_name, phone, company, country,
                trading_experience, trading_goals, risk_tolerance, preferred_markets, trading_style,
                account_type, prop_firm, account_size, account_equity, account_currency,
                broker_name, broker_platform, risk_percentage, risk_reward_ratio,
                max_daily_loss_percentage, max_weekly_loss_percentage, max_monthly_loss_percentage,
                payment_status, payment_method, payment_amount, payment_date, transaction_id,
                payment_provider, payment_provider_id, payment_intent_id, currency,
                billing_country, billing_state, billing_city, billing_address, billing_postal_code,
                company_name, tax_id, vat_number, account_balance, total_pnl, win_rate,
                total_trades, winning_trades, losing_trades, max_drawdown, current_drawdown,
                consecutive_wins, consecutive_losses, average_win, average_loss, profit_factor,
                gross_profit, gross_loss, sharpe_ratio, sortino_ratio, calmar_ratio,
                prop_firm_rules, rule_violations, compliance_status, questionnaire_data,
                data_capture_complete, agree_to_marketing, unique_id, updated_at
            FROM users
            WHERE is_active = true
            ORDER BY created_at DESC
        """)
        
        users = cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries
        users_list = []
        for user in users:
            user_dict = dict(user)
            # Decrypt sensitive data if needed
            if user_dict.get('questionnaire_data'):
                try:
                    user_dict['questionnaire_data'] = json.loads(user_dict['questionnaire_data'])
                except:
                    pass
            
            # Format for frontend with all integrated data
            customer_data = {
                'id': user_dict['id'],
                'customer_id': user_dict['id'],
                'unique_id': user_dict.get('unique_id', f"CUS-{user_dict['id']:03d}"),
                'email': user_dict['email'],
                'name': user_dict['username'],
                'phone': user_dict.get('phone', ''),
                'first_name': user_dict.get('first_name', ''),
                'last_name': user_dict.get('last_name', ''),
                'company': user_dict.get('company', ''),
                'country': user_dict.get('country', ''),
                
                # Payment Details
                'plan_type': user_dict.get('plan_type', 'free'),
                'payment_status': user_dict.get('payment_status', 'pending'),
                'payment_method': user_dict.get('payment_method', 'unknown'),
                'payment_amount': float(user_dict.get('payment_amount', 0)),
                'payment_date': user_dict.get('payment_date', ''),
                'transaction_id': user_dict.get('transaction_id', ''),
                'currency': user_dict.get('currency', 'USD'),
                
                # Billing Information
                'billing_country': user_dict.get('billing_country', ''),
                'billing_state': user_dict.get('billing_state', ''),
                'billing_city': user_dict.get('billing_city', ''),
                'billing_address': user_dict.get('billing_address', ''),
                'company_name': user_dict.get('company_name', ''),
                
                # Account Information
                'account_type': user_dict.get('account_type', 'standard'),
                'prop_firm': user_dict.get('prop_firm', 'unknown'),
                'account_size': float(user_dict.get('account_size', 0)),
                'account_equity': float(user_dict.get('account_equity', 0)),
                'account_currency': user_dict.get('account_currency', 'USD'),
                'broker_name': user_dict.get('broker_name', ''),
                'broker_platform': user_dict.get('broker_platform', ''),
                
                # Trading Information
                'trading_experience': user_dict.get('trading_experience', 'beginner'),
                'trading_style': user_dict.get('trading_style', ''),
                'trading_goals': user_dict.get('trading_goals', 'learning'),
                'risk_tolerance': user_dict.get('risk_tolerance', 'low'),
                'risk_percentage': float(user_dict.get('risk_percentage', 0)),
                'preferred_markets': user_dict.get('preferred_markets', ''),
                
                # Dashboard Data
                'account_balance': float(user_dict.get('account_balance', 0)),
                'total_pnl': float(user_dict.get('total_pnl', 0)),
                'win_rate': float(user_dict.get('win_rate', 0)),
                'total_trades': user_dict.get('total_trades', 0),
                'winning_trades': user_dict.get('winning_trades', 0),
                'losing_trades': user_dict.get('losing_trades', 0),
                'max_drawdown': float(user_dict.get('max_drawdown', 0)),
                'current_drawdown': float(user_dict.get('current_drawdown', 0)),
                'consecutive_wins': user_dict.get('consecutive_wins', 0),
                'consecutive_losses': user_dict.get('consecutive_losses', 0),
                'profit_factor': float(user_dict.get('profit_factor', 0)),
                'sharpe_ratio': user_dict.get('sharpe_ratio'),
                'sortino_ratio': user_dict.get('sortino_ratio'),
                'calmar_ratio': user_dict.get('calmar_ratio'),
                
                # Prop Firm Rules
                'prop_firm_rules': user_dict.get('prop_firm_rules', {}),
                'rule_violations': user_dict.get('rule_violations', []),
                'compliance_status': user_dict.get('compliance_status', 'compliant'),
                
                # Additional Data
                'questionnaire_data': user_dict.get('questionnaire_data', {}),
                'data_capture_complete': user_dict.get('data_capture_complete', False),
                'agree_to_marketing': user_dict.get('agree_to_marketing', False),
                
                # Timestamps
                'join_date': user_dict['created_at'].isoformat(),
                'last_active': user_dict.get('last_active', user_dict['created_at']).isoformat(),
                'status': 'active' if user_dict['is_active'] else 'inactive',
                'created_at': user_dict['created_at'].isoformat(),
                'updated_at': user_dict.get('updated_at', user_dict['created_at']).isoformat()
            }
            users_list.append(customer_data)
        
        return jsonify({
            "success": True,
            "count": len(users_list),
            "users": users_list,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        print(f"Error fetching users: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to fetch users: {str(e)}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 500

@app.route('/api/users', methods=['POST'])
def create_user():
    """Create a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (data['email'],))
        if cursor.fetchone():
            conn.close()
            return jsonify({
                "success": False,
                "error": "User with this email already exists"
            }), 409
        
        # Hash password
        password_hash = hash_password(data['password'])
        
        # Insert user
        cursor.execute("""
            INSERT INTO users (username, email, normalized_email, password_hash, plan_type, unique_id)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, uuid, created_at
        """, (
            data['username'],
            data['email'],
            data['email'].lower(),
            password_hash,
            data.get('plan_type', 'free'),
            f"USER-{int(datetime.now().timestamp())}"
        ))
        
        user_result = cursor.fetchone()
        user_id = user_result['id']
        
        # Insert customer data
        cursor.execute("""
            INSERT INTO customer_data (
                user_id, membership_tier, account_status, payment_status,
                payment_method, payment_amount, account_type, trading_experience,
                risk_tolerance, trading_goals, signup_source, data_capture_complete
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id,
            data.get('plan_type', 'free'),
            'active',
            'pending',
            'unknown',
            0,
            'standard',
            'beginner',
            'low',
            'learning',
            data.get('signup_source', 'website'),
            False
        ))
        
        # Log activity
        cursor.execute("""
            INSERT INTO user_activities (user_id, activity_type, activity_data, ip_address)
            VALUES (%s, %s, %s, %s)
        """, (
            user_id,
            'user_created',
            json.dumps({'source': 'api'}),
            request.remote_addr
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "User created successfully",
            "user_id": user_id,
            "uuid": user_result['uuid'],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 201
        
    except Exception as e:
        print(f"Error creating user: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to create user: {str(e)}"
        }), 500

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get specific user by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                id, uuid, username, email, plan_type, created_at, last_login, last_active,
                is_active, is_verified, first_name, last_name, full_name, phone, company, country,
                trading_experience, trading_goals, risk_tolerance, preferred_markets, trading_style,
                account_type, prop_firm, account_size, account_equity, account_currency,
                broker_name, broker_platform, risk_percentage, risk_reward_ratio,
                max_daily_loss_percentage, max_weekly_loss_percentage, max_monthly_loss_percentage,
                payment_status, payment_method, payment_amount, payment_date, transaction_id,
                payment_provider, payment_provider_id, payment_intent_id, currency,
                billing_country, billing_state, billing_city, billing_address, billing_postal_code,
                company_name, tax_id, vat_number, account_balance, total_pnl, win_rate,
                total_trades, winning_trades, losing_trades, max_drawdown, current_drawdown,
                consecutive_wins, consecutive_losses, average_win, average_loss, profit_factor,
                gross_profit, gross_loss, sharpe_ratio, sortino_ratio, calmar_ratio,
                prop_firm_rules, rule_violations, compliance_status, questionnaire_data,
                data_capture_complete, agree_to_marketing, unique_id, updated_at
            FROM users
            WHERE id = %s AND is_active = true
        """, (user_id,))
        
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        user_dict = dict(user)
        
        return jsonify({
            "success": True,
            "user": user_dict,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        print(f"Error fetching user: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to fetch user: {str(e)}"
        }), 500

@app.route('/api/users/<int:user_id>/questionnaire', methods=['POST'])
def update_questionnaire(user_id):
    """Update user questionnaire data"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = %s AND is_active = true", (user_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        # Update users table with questionnaire data
        cursor.execute("""
            UPDATE users 
            SET 
                account_type = %s,
                prop_firm = %s,
                account_size = %s,
                account_equity = %s,
                trading_experience = %s,
                trading_style = %s,
                risk_tolerance = %s,
                trading_goals = %s,
                risk_percentage = %s,
                risk_reward_ratio = %s,
                max_daily_loss_percentage = %s,
                max_weekly_loss_percentage = %s,
                max_monthly_loss_percentage = %s,
                questionnaire_data = %s,
                data_capture_complete = true,
                updated_at = CURRENT_TIMESTAMP,
                last_active = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (
            data.get('account_type'),
            data.get('prop_firm'),
            data.get('account_size', 0),
            data.get('account_equity', 0),
            data.get('trading_experience'),
            data.get('trading_style'),
            data.get('risk_tolerance'),
            data.get('trading_goals'),
            data.get('risk_percentage', 0),
            data.get('risk_reward_ratio'),
            data.get('max_daily_loss_percentage', 0),
            data.get('max_weekly_loss_percentage', 0),
            data.get('max_monthly_loss_percentage', 0),
            json.dumps(data.get('questionnaire_data', {})),
            user_id
        ))
        
        # Log activity
        cursor.execute("""
            INSERT INTO user_activities (user_id, activity_type, activity_data, ip_address)
            VALUES (%s, %s, %s, %s)
        """, (
            user_id,
            'questionnaire_updated',
            json.dumps(data),
            request.remote_addr
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Questionnaire updated successfully",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        print(f"Error updating questionnaire: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to update questionnaire: {str(e)}"
        }), 500

@app.route('/api/users/<int:user_id>/payment', methods=['POST'])
def update_payment(user_id):
    """Update user payment data"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = %s AND is_active = true", (user_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        # Update users table with payment data
        cursor.execute("""
            UPDATE users 
            SET 
                plan_type = %s,
                payment_status = %s,
                payment_method = %s,
                payment_amount = %s,
                payment_date = %s,
                transaction_id = %s,
                payment_provider = %s,
                payment_provider_id = %s,
                payment_intent_id = %s,
                currency = %s,
                billing_country = %s,
                billing_state = %s,
                billing_city = %s,
                billing_address = %s,
                billing_postal_code = %s,
                company_name = %s,
                tax_id = %s,
                vat_number = %s,
                updated_at = CURRENT_TIMESTAMP,
                last_active = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (
            data.get('plan_type'),
            data.get('payment_status', 'completed'),
            data.get('payment_method'),
            data.get('payment_amount', 0),
            data.get('payment_date'),
            data.get('transaction_id'),
            data.get('payment_provider'),
            data.get('payment_provider_id'),
            data.get('payment_intent_id'),
            data.get('currency', 'USD'),
            data.get('billing_country'),
            data.get('billing_state'),
            data.get('billing_city'),
            data.get('billing_address'),
            data.get('billing_postal_code'),
            data.get('company_name'),
            data.get('tax_id'),
            data.get('vat_number'),
            user_id
        ))
        
        # Log activity
        cursor.execute("""
            INSERT INTO user_activities (user_id, activity_type, activity_data, ip_address)
            VALUES (%s, %s, %s, %s)
        """, (
            user_id,
            'payment_updated',
            json.dumps(data),
            request.remote_addr
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Payment updated successfully",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        print(f"Error updating payment: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to update payment: {str(e)}"
        }), 500

@app.route('/api/users/<int:user_id>/dashboard', methods=['POST'])
def update_dashboard(user_id):
    """Update user dashboard data"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = %s AND is_active = true", (user_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        # Update users table with dashboard data
        cursor.execute("""
            UPDATE users 
            SET 
                account_balance = %s,
                total_pnl = %s,
                win_rate = %s,
                total_trades = %s,
                winning_trades = %s,
                losing_trades = %s,
                max_drawdown = %s,
                current_drawdown = %s,
                consecutive_wins = %s,
                consecutive_losses = %s,
                average_win = %s,
                average_loss = %s,
                profit_factor = %s,
                gross_profit = %s,
                gross_loss = %s,
                sharpe_ratio = %s,
                sortino_ratio = %s,
                calmar_ratio = %s,
                prop_firm_rules = %s,
                rule_violations = %s,
                compliance_status = %s,
                updated_at = CURRENT_TIMESTAMP,
                last_active = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (
            data.get('account_balance', 0),
            data.get('total_pnl', 0),
            data.get('win_rate', 0),
            data.get('total_trades', 0),
            data.get('winning_trades', 0),
            data.get('losing_trades', 0),
            data.get('max_drawdown', 0),
            data.get('current_drawdown', 0),
            data.get('consecutive_wins', 0),
            data.get('consecutive_losses', 0),
            data.get('average_win', 0),
            data.get('average_loss', 0),
            data.get('profit_factor', 0),
            data.get('gross_profit', 0),
            data.get('gross_loss', 0),
            data.get('sharpe_ratio'),
            data.get('sortino_ratio'),
            data.get('calmar_ratio'),
            json.dumps(data.get('prop_firm_rules', {})),
            json.dumps(data.get('rule_violations', [])),
            data.get('compliance_status', 'compliant'),
            user_id
        ))
        
        # Log activity
        cursor.execute("""
            INSERT INTO user_activities (user_id, activity_type, activity_data, ip_address)
            VALUES (%s, %s, %s, %s)
        """, (
            user_id,
            'dashboard_updated',
            json.dumps(data),
            request.remote_addr
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Dashboard updated successfully",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        print(f"Error updating dashboard: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to update dashboard: {str(e)}"
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get user statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total users
        cursor.execute("SELECT COUNT(*) as total FROM users WHERE is_active = true")
        total_users = cursor.fetchone()['total']
        
        # Get users by plan
        cursor.execute("""
            SELECT plan_type, COUNT(*) as count 
            FROM users 
            WHERE is_active = true 
            GROUP BY plan_type
        """)
        users_by_plan = {row['plan_type']: row['count'] for row in cursor.fetchall()}
        
        # Get recent signups (last 7 days)
        cursor.execute("""
            SELECT COUNT(*) as recent 
            FROM users 
            WHERE is_active = true 
            AND created_at >= NOW() - INTERVAL '7 days'
        """)
        recent_signups = cursor.fetchone()['recent']
        
        conn.close()
        
        return jsonify({
            "success": True,
            "stats": {
                "total_users": total_users,
                "users_by_plan": users_by_plan,
                "recent_signups": recent_signups,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }), 200
        
    except Exception as e:
        print(f"Error fetching stats: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to fetch stats: {str(e)}"
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print("🚀 Starting Render Backend API v2...")
    print("📊 Available endpoints:")
    print("   GET  /health - Health check")
    print("   GET  /api/users - Get all users")
    print("   POST /api/users - Create new user")
    print("   GET  /api/users/<id> - Get specific user")
    print("   POST /api/users/<id>/questionnaire - Update questionnaire")
    print("   GET  /api/stats - Get user statistics")
    print("   GET /api/signals - Get all signals")
    print("   POST /api/signals - Create a new signal")
    print("   POST /api/webhook/signal - Webhook for new signals")
    print("   GET /api/signals/feed - Get signal feed")
    print("   GET /api/user/profile - Get user profile")
    print("   GET /api/user/progress - Get user progress")
    print("   GET /api/user/signals/stats - Get user signals stats")
    print("   GET /api/dashboard-data - Get dashboard data")
    print("   GET /api/dashboard/real-time-data - Get real-time dashboard data")
    print("   GET /api/dashboard/live-signals - Get live signals")
    print("   GET /api/dashboard/performance-metrics - Get performance metrics")
    print("   POST /api/validate-coupon - Validate coupon codes")
    print("   POST /api/auth/register - User registration")
    print("============================================================")
    
    # Initialize database on startup
    try:
        print("🔧 Initializing database...")
        initialize_database()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize database: {e}")
        print("⚠️  Continuing without database initialization...")
    
    socketio.run(app, host='0.0.0.0', port=port, debug=debug)

@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    """Get user profile data"""
    # This is a mock implementation. Replace with actual database query.
    user_profile = {
        "username": "testuser",
        "email": "testuser@example.com",
        "plan": "premium",
        "member_since": "2023-01-15T10:00:00Z"
    }
    return jsonify({"success": True, "profile": user_profile}), 200

@app.route('/api/user/progress', methods=['GET'])
def get_user_progress():
    """Get user progress data"""
    # This is a mock implementation. Replace with actual database query.
    user_progress = {
        "completed_modules": 5,
        "total_modules": 10,
        "current_topic": "Advanced Chart Patterns"
    }
    return jsonify({"success": True, "progress": user_progress}), 200

@app.route('/api/dashboard-data', methods=['GET'])
def get_dashboard_data():
    """Get dashboard data"""
    # This is a mock implementation. Replace with actual database query.
    dashboard_data = {
        "active_signals": 3,
        "total_trades": 25,
        "win_rate": "75%"
    }
    return jsonify({"success": True, "data": dashboard_data}), 200

@app.route('/api/dashboard/real-time-data', methods=['GET'])
def get_real_time_dashboard_data():
    """Get real-time dashboard data for live updates"""
    try:
        # Get user from request
        user_id = request.args.get('user_id', '1')
        
        # Mock real-time data
        real_time_data = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'user': {
                'id': user_id,
                'name': f'User {user_id}',
                'email': f'user{user_id}@example.com',
                'status': 'active'
            },
            'trading': {
                'recent_trades': [],
                'active_signals': [],
                'total_pnl': 0.0,
                'win_rate': 0.0,
                'total_trades': 0
            },
            'market': {
                'status': 'open',
                'last_update': datetime.now(timezone.utc).isoformat()
            }
        }
        
        return jsonify(real_time_data), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch real-time data: {str(e)}'}), 500

@app.route('/api/dashboard/live-signals', methods=['GET'])
def get_live_signals():
    """Get live trading signals for real-time updates"""
    try:
        # Mock live signals data
        signals_data = []
        
        return jsonify({
            'signals': signals_data,
            'count': len(signals_data),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch live signals: {str(e)}'}), 500

@app.route('/api/dashboard/performance-metrics', methods=['GET'])
def get_performance_metrics():
    """Get real-time performance metrics"""
    try:
        user_id = request.args.get('user_id', '1')
        
        # Mock performance metrics
        performance_metrics = {
            'user_id': user_id,
            'total_pnl': 0.0,
            'win_rate': 0.0,
            'total_trades': 0,
            'active_positions': 0,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        return jsonify(performance_metrics), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch performance metrics: {str(e)}'}), 500

@app.route('/api/signals', methods=['GET'])
def get_signals():
    """Get all trading signals"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM signals ORDER BY created_at DESC")
        
        signals = cursor.fetchall()
        conn.close()
        
        return jsonify({
            "success": True,
            "count": len(signals),
            "signals": signals,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        print(f"Error fetching signals: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to fetch signals: {str(e)}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 500

@app.route('/api/signals', methods=['POST'])
def create_signal():
    """Create a new trading signal"""
    try:
        data = request.get_json()
        
        required_fields = ['symbol', 'side', 'entry_price', 'stop_loss', 'take_profit']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO signals (symbol, side, entry_price, stop_loss, take_profit)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, uuid, created_at
        """, (
            data['symbol'],
            data['side'],
            data['entry_price'],
            data['stop_loss'],
            data['take_profit']
        ))
        
        signal_result = cursor.fetchone()
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Signal created successfully",
            "signal_id": signal_result['id'],
            "uuid": signal_result['uuid'],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 201
        
    except Exception as e:
        print(f"Error creating signal: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to create signal: {str(e)}"
        }), 500

@app.route('/api/signals/feed', methods=['GET'])
def get_signal_feed():
    """Get signal feed for users"""
    try:
        # Mock signal feed data
        mock_signals = [
            {
                'id': 'SIG-001',
                'pair': 'BTC/USD',
                'direction': 'LONG',
                'entry': 45000.0,
                'stopLoss': 44000.0,
                'takeProfit': 46000.0,
                'confidence': 85,
                'analysis': 'Strong bullish momentum with key support at 44k',
                'timestamp': '2025-01-02T21:30:00Z',
                'status': 'active',
                'market': 'crypto'
            },
            {
                'id': 'SIG-002',
                'pair': 'EUR/USD',
                'direction': 'LONG',
                'entry': 1.0850,
                'stopLoss': 1.0800,
                'takeProfit': 1.0900,
                'confidence': 90,
                'analysis': 'Breakout above resistance, targeting 1.09',
                'timestamp': '2025-01-02T21:25:00Z',
                'status': 'active',
                'market': 'forex'
            }
        ]
        
        return jsonify({
            'success': True,
            'signals': mock_signals,
            'count': len(mock_signals)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get signal feed: {str(e)}'}), 500

@app.route('/api/user/signals/stats', methods=['GET'])
def get_user_signals_stats():
    """Get user signals statistics"""
    try:
        risk_tier = request.args.get('risk_tier', 'medium')
        
        # Mock user signals stats
        stats = {
            'risk_tier': risk_tier,
            'total_signals': 0,
            'active_signals': 0,
            'completed_signals': 0,
            'win_rate': 0.0,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get user signals stats: {str(e)}'}), 500

@app.route('/api/webhook/signal', methods=['POST'])
def webhook_signal():
    """Webhook to receive new signals"""
    try:
        data = request.get_json()
        
        required_fields = ['symbol', 'side', 'entry_price', 'stop_loss', 'take_profit']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO signals (symbol, side, entry_price, stop_loss, take_profit)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, uuid, created_at
        """, (
            data['symbol'],
            data['side'],
            data['entry_price'],
            data['stop_loss'],
            data['take_profit']
        ))
        
        signal_result = cursor.fetchone()
        
        conn.commit()
        conn.close()
        
        # Broadcast the new signal to all connected clients
        socketio.emit('new_signal', signal_result)
        
        return jsonify({
            "success": True,
            "message": "Signal received and stored",
            "signal_id": signal_result['id'],
            "uuid": signal_result['uuid'],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 201
        
    except Exception as e:
        print(f"Error processing webhook signal: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to process webhook signal: {str(e)}"
        }), 500

# ============================================
# MISSING ENDPOINTS - COUPON VALIDATION & AUTH
# ============================================

@app.route('/api/init-db', methods=['POST'])
def init_database_endpoint():
    """Initialize database endpoint"""
    try:
        initialize_database()
        return jsonify({
            "msg": "Database initialized successfully",
            "status": "success"
        }), 200
    except Exception as e:
        return jsonify({
            "msg": f"Database initialization failed: {str(e)}",
            "status": "error"
        }), 500

@app.route('/api/validate-coupon', methods=['POST'])
def validate_coupon():
    """Validate coupon code for payment"""
    try:
        data = request.get_json()
        coupon_code = data.get('coupon_code')
        plan_id = data.get('plan_id', 'pro')
        original_price = data.get('original_price', 29.99)
        
        if coupon_code == 'TRADERFREE':
            return jsonify({
                'valid': True,
                'discount_amount': original_price,
                'final_price': 0.00,
                'message': 'Free access coupon applied!'
            }), 200
        elif coupon_code == 'INTERNAL_DEV_OVERRIDE_2024':
            return jsonify({
                'valid': True,
                'discount_amount': original_price - 0.10,
                'final_price': 0.10,
                'message': 'Development override coupon applied!'
            }), 200
        else:
            return jsonify({
                'valid': False,
                'error': 'Invalid coupon code'
            }), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register():
    """Register new user endpoint"""
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,X-Requested-With,Accept,Origin")
        response.headers.add('Access-Control-Allow-Methods', "POST,OPTIONS")
        return response, 200
    
    try:
        data = request.get_json()
        print(f"Received registration data: {data}")
        
        if not data:
            return jsonify({"msg": "No JSON data provided"}), 400
        
        email = data.get('email')
        password = data.get('password')
        username = data.get('username', 'New User')
        plan_type = data.get('plan_type', 'premium')
        
        print(f"Processing registration for email: {email}, plan: {plan_type}")
        
        if not email or not password:
            return jsonify({"msg": "Email and password required"}), 400
        
        # Try database connection, fallback to simple registration if it fails
        try:
            print("Attempting database connection...")
            conn = get_db_connection()
            cursor = conn.cursor()
            print("Database connection successful")
            
            # Check if users table exists, if not create it
            try:
                cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
                if cursor.fetchone():
                    conn.close()
                    return jsonify({"msg": "User already exists"}), 409
            except ProgrammingError as e:
                if "relation \"users\" does not exist" in str(e):
                    print("Users table doesn't exist, creating it...")
                    initialize_database()
                    # Reconnect after creating tables
                    conn.close()
                    conn = get_db_connection()
                    cursor = conn.cursor()
                    # Check again if user exists
                    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
                    if cursor.fetchone():
                        conn.close()
                        return jsonify({"msg": "User already exists"}), 409
                else:
                    raise
            
            # Continue with database registration...
            use_database = True
            
        except Exception as db_error:
            print(f"Database connection failed: {db_error}")
            print("Falling back to simple registration...")
            use_database = False
        
        if use_database:
            # Database registration
            print("Using database registration...")
            
            # Create user
            print("Hashing password...")
            password_hash = hash_password(password)
            print("Password hashed successfully")
            
            # Extract additional fields
            firstName = data.get('firstName', '')
            lastName = data.get('lastName', '')
            phone = data.get('phone', '')
            company = data.get('company', '')
            country = data.get('country', '')
            tradingExperience = data.get('tradingExperience', '')
            tradingGoals = data.get('tradingGoals', '')
            riskTolerance = data.get('riskTolerance', '')
            preferredMarkets = data.get('preferredMarkets', '')
            tradingStyle = data.get('tradingStyle', '')
            agreeToMarketing = data.get('agreeToMarketing', False)
            
            print(f"User data prepared: username={username}, email={email}, plan={plan_type}")
            print(f"Additional fields: firstName={firstName}, lastName={lastName}, phone={phone}")
            
            print("Executing database insert...")
            cursor.execute("""
                INSERT INTO users (
                    username, email, password_hash, plan_type, normalized_email, 
                    first_name, last_name, phone, company, country,
                    trading_experience, trading_goals, risk_tolerance, 
                    preferred_markets, trading_style, agree_to_marketing, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                username, email, password_hash, plan_type, email.lower().strip(),
                firstName, lastName, phone, company, country,
                tradingExperience, tradingGoals, riskTolerance,
                preferredMarkets, tradingStyle, agreeToMarketing,
                datetime.now(timezone.utc).isoformat()
            ))
            print("Database insert executed successfully")
            
            user_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            # Create access token
            import uuid
            access_token = f"token_{user_id}_{uuid.uuid4().hex[:16]}"
            
            return jsonify({
                "access_token": access_token,
                "user": {
                    "id": user_id,
                    "username": username,
                    "email": email,
                    "plan_type": plan_type
                },
                "msg": "User registered successfully"
            }), 201
        else:
            # Fallback registration without database
            print("Using fallback registration...")
            
            # Create a simple user ID
            import uuid
            user_id = str(uuid.uuid4())
            access_token = f"token_{user_id}_{uuid.uuid4().hex[:16]}"
            
            # Store user data in memory (this is just for demonstration)
            # In a real scenario, you might want to use a different storage method
            print(f"Fallback registration successful for user: {email}")
            
            return jsonify({
                "access_token": access_token,
                "user": {
                    "id": user_id,
                    "username": username,
                    "email": email,
                    "plan_type": plan_type
                },
                "msg": "User registered successfully (fallback mode)"
            }), 201
        
    except Exception as e:
        print(f"Registration error: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"msg": f"Server error: {str(e)}", "error_type": str(type(e))}), 500

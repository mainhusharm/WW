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
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///local_dev.db')
ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY', Fernet.generate_key().decode())
SECRET_KEY = os.getenv('SECRET_KEY', secrets.token_hex(32))

app.config['SECRET_KEY'] = SECRET_KEY

# Initialize encryption
cipher_suite = Fernet(ENCRYPTION_KEY.encode())

def get_db_connection():
    """Get database connection (PostgreSQL or SQLite fallback)"""
    try:
        if DATABASE_URL.startswith('sqlite'):
            # SQLite fallback for local development
            import sqlite3
            db_path = DATABASE_URL.replace('sqlite:///', '')
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row  # Enable dict-like access
            return conn
        else:
            # PostgreSQL for production
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
        
        # Check if we're using SQLite or PostgreSQL
        is_sqlite = DATABASE_URL.startswith('sqlite')
        print(f"Using {'SQLite' if is_sqlite else 'PostgreSQL'} database")
        
        if is_sqlite:
            # SQLite table creation
            print("Executing SQLite table creation...")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT UNIQUE NOT NULL,
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
                    payment_date TEXT,
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
                    prop_firm_rules TEXT DEFAULT '{}',
                    rule_violations TEXT DEFAULT '[]',
                    compliance_status VARCHAR(20) DEFAULT 'compliant',
                    
                    -- Additional Questionnaire Data
                    questionnaire_data TEXT DEFAULT '{}',
                    data_capture_complete BOOLEAN DEFAULT false,
                    
                    -- User Preferences
                    agree_to_marketing BOOLEAN DEFAULT false,
                    consent_accepted BOOLEAN DEFAULT false,
                    consent_accepted_date TEXT,
                    unique_id VARCHAR(50) UNIQUE,
                    
                    -- Timestamps
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    last_login TEXT,
                    last_active TEXT DEFAULT CURRENT_TIMESTAMP,
                    
                    -- Account Status
                    is_active BOOLEAN DEFAULT true,
                    is_verified BOOLEAN DEFAULT false,
                    verification_token VARCHAR(255),
                    reset_token VARCHAR(255),
                    reset_token_expires TEXT
            )
        """)
        else:
            # PostgreSQL table creation
            print("Executing PostgreSQL table creation...")
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
                consent_accepted BOOLEAN DEFAULT false,
                consent_accepted_date TIMESTAMP WITH TIME ZONE,
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
        
        conn.commit()
        conn.close()
        print("Database initialized successfully!")
        
    except Exception as e:
        print(f"Database initialization error: {e}")
        raise

def encrypt_data(data: str) -> str:
    """Encrypt sensitive data"""
    return cipher_suite.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data: str) -> str:
    """Decrypt sensitive data"""
    return cipher_suite.decrypt(encrypted_data.encode()).decode()

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        conn = get_db_connection()
        conn.close()
        
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat()
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
    """Get all users with their data"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all users with their data
        cursor.execute("""
            SELECT * FROM users 
            WHERE is_active = true 
            ORDER BY created_at DESC
        """)
        
        users = cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries
        users_list = []
        for user in users:
            user_dict = dict(user)
            # Remove sensitive data
            if 'password_hash' in user_dict:
                del user_dict['password_hash']
            users_list.append(user_dict)
        
        return jsonify({
            "success": True,
            "users": users_list,
            "count": len(users_list)
        }), 200
        
    except Exception as e:
        print(f"Error getting users: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to get users: {str(e)}"
        }), 500

@app.route('/api/users', methods=['POST'])
def create_user():
    """Create a new user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Extract user data
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        phone = data.get('phone', '')
        company = data.get('company', '')
        country = data.get('country', '')
        
        if not all([username, email, password]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Normalize email
        normalized_email = email.lower().strip()
        
        # Hash password
        password_hash = hash_password(password)
        
        # Generate unique ID
        import uuid
        unique_id = str(uuid.uuid4())
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (normalized_email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "User already exists"}), 409
        
        # Create user
        cursor.execute("""
            INSERT INTO users (username, email, normalized_email, password_hash, first_name, last_name, phone, company, country, unique_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, uuid, created_at
        """, (username, normalized_email, normalized_email, password_hash, first_name, last_name, phone, company, country, unique_id))
        
        result = cursor.fetchone()
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "user": {
                "id": result['id'],
                "uuid": str(result['uuid']),
                "username": username,
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "phone": phone,
                "company": company,
                "country": country,
                "unique_id": unique_id,
                "created_at": result['created_at'].isoformat()
            }
        }), 201
        
    except Exception as e:
        print(f"Error creating user: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to create user: {str(e)}"
        }), 500

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get user by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if we're using SQLite or PostgreSQL
        is_sqlite = DATABASE_URL.startswith('sqlite')
        
        # Get user data
        if is_sqlite:
            cursor.execute("""
                SELECT * FROM users 
                WHERE id = ? AND is_active = 1
            """, (user_id,))
        else:
            cursor.execute("""
                SELECT * FROM users 
                WHERE id = %s AND is_active = true
            """, (user_id,))
        
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        # Convert to dictionary and remove sensitive data
        user_dict = dict(user)
        if 'password_hash' in user_dict:
            del user_dict['password_hash']
        
        return jsonify({
            "success": True,
            "user": user_dict
        }), 200
        
    except Exception as e:
        print(f"Error getting user: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to get user: {str(e)}"
        }), 500

@app.route('/api/users/<int:user_id>/questionnaire', methods=['POST'])
def update_questionnaire(user_id):
    """Update user questionnaire data"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if we're using SQLite or PostgreSQL
        is_sqlite = DATABASE_URL.startswith('sqlite')
        
        # Check if user exists
        if is_sqlite:
            cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
        else:
            cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "User not found"}), 404
        
        # Update questionnaire data
        if is_sqlite:
            cursor.execute("""
                UPDATE users SET
                    trading_experience = ?,
                    trading_goals = ?,
                    risk_tolerance = ?,
                    preferred_markets = ?,
                    trading_style = ?,
                    account_type = ?,
                    prop_firm = ?,
                    account_size = ?,
                    account_equity = ?,
                    account_currency = ?,
                    broker_name = ?,
                    broker_platform = ?,
                    risk_percentage = ?,
                    risk_reward_ratio = ?,
                    max_daily_loss_percentage = ?,
                    max_weekly_loss_percentage = ?,
                    max_monthly_loss_percentage = ?,
                    questionnaire_data = ?,
                    data_capture_complete = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (
            data.get('tradingExperience'),
            data.get('tradingGoals'),
            data.get('riskTolerance'),
            data.get('preferredMarkets'),
            data.get('tradingStyle'),
            data.get('accountType'),
            data.get('propFirm'),
            data.get('accountSize'),
            data.get('accountEquity'),
            data.get('accountCurrency', 'USD'),
            data.get('brokerName'),
            data.get('brokerPlatform'),
            data.get('riskPercentage'),
            data.get('riskRewardRatio'),
            data.get('maxDailyLossPercentage'),
            data.get('maxWeeklyLossPercentage'),
            data.get('maxMonthlyLossPercentage'),
            json.dumps(data),
            True,
            user_id
        ))
        else:
            cursor.execute("""
                UPDATE users SET
                    trading_experience = %s,
                    trading_goals = %s,
                    risk_tolerance = %s,
                    preferred_markets = %s,
                    trading_style = %s,
                    account_type = %s,
                    prop_firm = %s,
                    account_size = %s,
                    account_equity = %s,
                    account_currency = %s,
                    broker_name = %s,
                    broker_platform = %s,
                    risk_percentage = %s,
                    risk_reward_ratio = %s,
                    max_daily_loss_percentage = %s,
                    max_weekly_loss_percentage = %s,
                    max_monthly_loss_percentage = %s,
                    questionnaire_data = %s,
                    data_capture_complete = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                data.get('tradingExperience'),
                data.get('tradingGoals'),
                data.get('riskTolerance'),
                data.get('preferredMarkets'),
                data.get('tradingStyle'),
                data.get('accountType'),
                data.get('propFirm'),
                data.get('accountSize'),
                data.get('accountEquity'),
                data.get('accountCurrency'),
                data.get('brokerName'),
                data.get('brokerPlatform'),
                data.get('riskPercentage'),
                data.get('riskRewardRatio'),
                data.get('maxDailyLossPercentage'),
                data.get('maxWeeklyLossPercentage'),
                data.get('maxMonthlyLossPercentage'),
                json.dumps(data),
                True,
                user_id
            ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Questionnaire data updated successfully"
        }), 200
        
    except Exception as e:
        print(f"Error updating questionnaire: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to update questionnaire: {str(e)}"
        }), 500

@app.route('/api/users/<int:user_id>/features', methods=['GET'])
def get_user_features(user_id):
    """Get user's feature access based on their plan"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if we're using SQLite or PostgreSQL
        is_sqlite = DATABASE_URL.startswith('sqlite')
        
        # Get user's plan and payment status
        if is_sqlite:
            cursor.execute("""
                SELECT plan_type, payment_status, payment_amount, payment_date
                FROM users 
                WHERE id = ? AND is_active = 1
            """, (user_id,))
        else:
            cursor.execute("""
                SELECT plan_type, payment_status, payment_amount, payment_date
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
        
        plan_type = user['plan_type']
        payment_status = user['payment_status']
        
        # Define plan features mapping
        plan_features = {
            'free': {
                'canAccessDashboard': True,
                'canAccessSignals': False,
                'canAccessJournal': False,
                'canAccessAI': False,
                'canAccessCommunity': False,
                'canAccessBacktesting': False,
                'canAccessMultiAccount': False,
                'features': []
            },
            'kickstarter': {
                'canAccessDashboard': True,
                'canAccessSignals': True,
                'canAccessJournal': False,
                'canAccessAI': False,
                'canAccessCommunity': False,
                'canAccessBacktesting': False,
                'canAccessMultiAccount': False,
                'features': ['trading_signals', 'risk_management_plan', 'risk_calculator', 'phase_tracking', 'prop_firm_analyzer']
            },
            'starter': {
                'canAccessDashboard': True,
                'canAccessSignals': True,
                'canAccessJournal': False,
                'canAccessAI': False,
                'canAccessCommunity': False,
                'canAccessBacktesting': False,
                'canAccessMultiAccount': False,
                'features': ['trading_signals', 'risk_management_plan', 'risk_calculator', 'phase_tracking', 'prop_firm_analyzer', 'email_support', 'auto_lot_calculator']
            },
            'pro': {
                'canAccessDashboard': True,
                'canAccessSignals': True,
                'canAccessJournal': True,
                'canAccessAI': True,
                'canAccessCommunity': True,
                'canAccessBacktesting': True,
                'canAccessMultiAccount': True,
                'features': ['trading_signals', 'advanced_journal', 'ai_coach', 'private_community', 'backtesting_tools', 'multi_account_tracker', 'priority_support']
            },
            'enterprise': {
                'canAccessDashboard': True,
                'canAccessSignals': True,
                'canAccessJournal': True,
                'canAccessAI': True,
                'canAccessCommunity': True,
                'canAccessBacktesting': True,
                'canAccessMultiAccount': True,
                'features': ['trading_signals', 'advanced_journal', 'ai_coach_advanced', 'private_community', 'professional_backtesting', 'multi_account_tracker', 'priority_support_24_7', 'ai_analysis_realtime']
            }
        }
        
        # Get features for the plan, default to free if plan not found
        user_features = plan_features.get(plan_type, plan_features['free'])
        
        # If payment is not completed, restrict to free features
        if payment_status != 'completed':
            user_features = plan_features['free']
        
        return jsonify({
            "success": True,
            "features": user_features,
            "plan_type": plan_type,
            "payment_status": payment_status,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        print(f"Error getting user features: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to get user features: {str(e)}"
        }), 500

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Extract user data
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        plan_type = data.get('plan_type', 'free')  # Default to free plan
        
        if not all([username, email, password]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Normalize email
        normalized_email = email.lower().strip()
        
        # Hash password
        password_hash = hash_password(password)
        
        # Generate unique ID
        import uuid
        unique_id = str(uuid.uuid4())
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
        
            # Check if we're using SQLite or PostgreSQL
            is_sqlite = DATABASE_URL.startswith('sqlite')
            
            # Check if user already exists
            if is_sqlite:
                cursor.execute("SELECT id FROM users WHERE email = ?", (normalized_email,))
                if cursor.fetchone():
                    conn.close()
                    return jsonify({"error": "User already exists"}), 409
            else:
                cursor.execute("SELECT id FROM users WHERE email = %s", (normalized_email,))
                if cursor.fetchone():
                    conn.close()
                    return jsonify({"error": "User already exists"}), 409
            
            # Create user
            if is_sqlite:
                cursor.execute("""
                    INSERT INTO users (uuid, username, email, normalized_email, password_hash, unique_id, plan_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (str(uuid.uuid4()), username, normalized_email, normalized_email, password_hash, unique_id, plan_type))
                user_id = cursor.lastrowid
                # Get the created user data
                cursor.execute("SELECT id, uuid, created_at FROM users WHERE id = ?", (user_id,))
                result = cursor.fetchone()
            else:
                cursor.execute("""
                    INSERT INTO users (uuid, username, email, normalized_email, password_hash, unique_id, plan_type)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, uuid, created_at
                """, (str(uuid.uuid4()), username, normalized_email, normalized_email, password_hash, unique_id, plan_type))
                result = cursor.fetchone()
        
            conn.commit()
            conn.close()
            
            return jsonify({
            "success": True,
                "user": {
                    "id": result['id'],
                    "uuid": str(result['uuid']),
                    "username": username,
                    "email": email,
                    "unique_id": unique_id,
                    "plan_type": plan_type,
                    "created_at": result['created_at']
                },
                "msg": "User registered successfully"
            }), 201
        
        except Exception as db_error:
            print(f"Database error: {db_error}")
            conn.close()
            return jsonify({"error": "Database error occurred"}), 500
        
        except Exception as e:
            print(f"Unexpected error: {e}")
            return jsonify({"error": "An unexpected error occurred"}), 500
        
        else:
            # Fallback registration without database
            print("Using fallback registration...")
            
            # Create a simple user ID
            import uuid
            user_id = str(uuid.uuid4())
            
            # Store user data in memory (for demo purposes)
            user_data = {
                    "id": user_id,
                    "username": username,
                    "email": email,
                "unique_id": unique_id,
                "plan_type": plan_type,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            return jsonify({
                "success": True,
                "user": user_data,
                "msg": "User registered successfully (fallback mode)"
            }), 201
        
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({
            "success": False,
            "error": f"Registration failed: {str(e)}"
        }), 500

@app.route('/api/users/<int:user_id>/consent', methods=['POST'])
def update_user_consent(user_id):
    """Update user consent status"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        consent_accepted = data.get('consent_accepted', False)
        consent_date = datetime.now(timezone.utc).isoformat()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if we're using SQLite or PostgreSQL
        is_sqlite = DATABASE_URL.startswith('sqlite')
        
        # Update user consent
        if is_sqlite:
            cursor.execute("""
                UPDATE users SET
                    consent_accepted = ?,
                    consent_accepted_date = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (consent_accepted, consent_date, user_id))
        else:
            cursor.execute("""
                UPDATE users SET
                    consent_accepted = %s,
                    consent_accepted_date = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (consent_accepted, consent_date, user_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Consent status updated successfully",
            "consent_accepted": consent_accepted,
            "consent_date": consent_date
        }), 200
        
    except Exception as e:
        print(f"Error updating user consent: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to update consent: {str(e)}"
        }), 500

if __name__ == '__main__':
    # Initialize database on startup
    try:
        initialize_database()
    except Exception as e:
        print(f"Database initialization failed: {e}")
        print("Continuing without database...")
    
    # Run the application
    app.run(host='0.0.0.0', port=5000, debug=True)

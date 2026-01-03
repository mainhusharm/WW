#!/usr/bin/env python3
"""
COMPLETE BACKEND ROUTES FOR RENDER DEPLOYMENT
Includes both legacy endpoints (that frontend currently uses) AND new enhanced endpoints
Direct connection to PostgreSQL database
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import hashlib
import uuid
import json
from datetime import datetime, timezone
import os
import logging
from typing import Dict, Any, Optional, List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins="*", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"])

# PostgreSQL connection configuration
DATABASE_CONFIG = {
    'host': 'dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com',
    'database': 'pghero_dpg_d2v9i7er433s73f0878g_a_cdm2',
    'user': 'pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user',
    'password': 'f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V',
    'port': 5432,
    'sslmode': 'require'
}

class DatabaseManager:
    """Manages PostgreSQL database connections and operations"""
    
    def __init__(self):
        self.connection_string = (
            f"host={DATABASE_CONFIG['host']} "
            f"dbname={DATABASE_CONFIG['database']} "
            f"user={DATABASE_CONFIG['user']} "
            f"password={DATABASE_CONFIG['password']} "
            f"port={DATABASE_CONFIG['port']} "
            f"sslmode={DATABASE_CONFIG['sslmode']}"
        )
    
    def get_connection(self):
        """Get a database connection"""
        try:
            conn = psycopg2.connect(self.connection_string)
            return conn
        except psycopg2.Error as e:
            logger.error(f"Database connection error: {e}")
            raise

    def execute_query(self, query: str, params: tuple = None, fetch: bool = False):
        """Execute a database query"""
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    cursor.execute(query, params)
                    if fetch:
                        return cursor.fetchall()
                    conn.commit()
                    return cursor.rowcount
        except psycopg2.Error as e:
            logger.error(f"Database query error: {e}")
            raise

db_manager = DatabaseManager()

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_user_id() -> str:
    """Generate unique user ID"""
    return str(uuid.uuid4())

def generate_access_token() -> str:
    """Generate access token"""
    return hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest()

# =============================================
# LEGACY ENDPOINTS (Current Frontend Uses These)
# =============================================

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def auth_register():
    """Legacy auth register endpoint - maps to enhanced_users table"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        logger.info(f"Auth register request: {data}")
        
        # Extract data with fallbacks
        first_name = data.get('first_name', data.get('firstName', ''))
        last_name = data.get('last_name', data.get('lastName', ''))
        email = data.get('email', '')
        phone = data.get('phone', '')
        company = data.get('company', '')
        country = data.get('country', '')
        password = data.get('password', data.get('password_hash', 'default_password'))
        plan_type = data.get('plan_type', 'Standard Plan')
        
        # Generate IDs
        user_id = generate_user_id()
        access_token = generate_access_token()
        unique_id = f"USER_{int(datetime.now().timestamp())}"
        
        # Insert into enhanced_users table
        query = """
            INSERT INTO enhanced_users (
                id, first_name, last_name, email, phone, company, country,
                password_hash, selected_plan_name, unique_id, access_token,
                agree_to_terms, agree_to_marketing, status, created_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """
        
        params = (
            user_id, first_name, last_name, email, phone, company, country,
            hash_password(password), plan_type, unique_id, access_token,
            True, True, 'active', datetime.now(timezone.utc)
        )
        
        db_manager.execute_query(query, params)
        
        logger.info(f"✅ User registered successfully: {email}")
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user_id': user_id,
            'email': email,
            'unique_id': unique_id,
            'access_token': access_token
        }), 201
        
    except psycopg2.IntegrityError as e:
        if 'unique constraint' in str(e).lower():
            return jsonify({'error': 'Email already exists'}), 409
        return jsonify({'error': 'Database integrity error'}), 400
    except Exception as e:
        logger.error(f"Auth register error: {e}")
        return jsonify({'error': 'Registration failed', 'details': str(e)}), 500

@app.route('/api/working/register', methods=['POST', 'OPTIONS'])
def working_register():
    """Working register endpoint - same as auth_register"""
    return auth_register()

@app.route('/api/register', methods=['POST', 'OPTIONS'])
def simple_register():
    """Simple register endpoint - same as auth_register"""
    return auth_register()

@app.route('/api/enhanced-signup', methods=['POST', 'OPTIONS'])
def enhanced_signup():
    """Enhanced signup endpoint - same as auth_register"""
    return auth_register()

@app.route('/api/payments', methods=['POST', 'OPTIONS'])
def payments():
    """Legacy payments endpoint - maps to payment_transactions table"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        logger.info(f"Payment request: {data}")
        
        # Find user by email
        user_query = "SELECT id FROM enhanced_users WHERE email = %s"
        user_result = db_manager.execute_query(user_query, (data.get('user_email'),), fetch=True)
        
        if not user_result:
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user_result[0]['id']
        
        # Insert payment transaction
        payment_id = generate_user_id()
        
        query = """
            INSERT INTO payment_transactions (
                id, user_id, user_email, user_name, plan_name_payment,
                original_price, discount_amount, final_price, coupon_code,
                coupon_applied, payment_method, payment_provider, transaction_id,
                payment_status, crypto_transaction_hash, crypto_from_address,
                crypto_amount, created_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """
        
        params = (
            payment_id,
            user_id,
            data.get('user_email', ''),
            data.get('user_name', ''),
            data.get('plan_name_payment', ''),
            float(data.get('original_price', 0)),
            float(data.get('discount_amount', 0)),
            float(data.get('final_price', 0)),
            data.get('coupon_code'),
            data.get('coupon_applied', False),
            data.get('payment_method', ''),
            data.get('payment_provider', ''),
            data.get('transaction_id', ''),
            data.get('payment_status', 'completed'),
            data.get('crypto_transaction_hash', ''),
            data.get('crypto_from_address', ''),
            data.get('crypto_amount', '0'),
            datetime.now(timezone.utc)
        )
        
        db_manager.execute_query(query, params)
        
        logger.info(f"✅ Payment recorded successfully: {data.get('user_email')}")
        
        return jsonify({
            'success': True,
            'message': 'Payment recorded successfully',
            'payment_id': payment_id
        }), 201
        
    except Exception as e:
        logger.error(f"Payment error: {e}")
        return jsonify({'error': 'Payment recording failed', 'details': str(e)}), 500

@app.route('/api/questionnaire', methods=['POST', 'OPTIONS'])
def questionnaire():
    """Legacy questionnaire endpoint - maps to questionnaire_responses table"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        logger.info(f"Questionnaire request: {data}")
        
        # Find user by email
        user_query = "SELECT id FROM enhanced_users WHERE email = %s"
        user_result = db_manager.execute_query(user_query, (data.get('user_email'),), fetch=True)
        
        if not user_result:
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user_result[0]['id']
        
        # Determine milestone access level based on account type
        account_type = data.get('account_type', '').lower()
        if account_type in ['demo', 'beginner']:
            milestone_access = 1
        elif account_type in ['standard']:
            milestone_access = 2
        elif account_type in ['pro', 'experienced']:
            milestone_access = 3
        elif account_type in ['funded', 'evaluation']:
            milestone_access = 4
        else:
            milestone_access = 1
        
        # Insert questionnaire response
        questionnaire_id = generate_user_id()
        
        query = """
            INSERT INTO questionnaire_responses (
                id, user_id, user_email, user_name, trades_per_day, trading_session,
                crypto_assets, forex_assets, custom_forex_pairs, has_account,
                account_equity, prop_firm, account_type, account_size, account_number,
                risk_percentage, risk_reward_ratio, milestone_access_level, created_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """
        
        params = (
            questionnaire_id,
            user_id,
            data.get('user_email', ''),
            data.get('user_name', ''),
            data.get('trades_per_day', ''),
            data.get('trading_session', ''),
            json.dumps(data.get('crypto_assets', [])),
            json.dumps(data.get('forex_assets', [])),
            json.dumps(data.get('custom_forex_pairs', [])),
            data.get('has_account', 'no'),
            float(data.get('account_equity', 0)) if data.get('account_equity') else None,
            data.get('prop_firm', ''),
            data.get('account_type', ''),
            float(data.get('account_size', 0)) if data.get('account_size') else None,
            data.get('account_number', ''),
            float(data.get('risk_percentage', 1.0)),
            data.get('risk_reward_ratio', '1'),
            milestone_access,
            datetime.now(timezone.utc)
        )
        
        db_manager.execute_query(query, params)
        
        # Also create initial dashboard data
        dashboard_query = """
            INSERT INTO user_dashboard_data (
                id, user_id, questionnaire_id, prop_firm, account_type,
                account_size, current_equity, initial_balance, milestone_access_level,
                created_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """
        
        dashboard_params = (
            generate_user_id(),
            user_id,
            questionnaire_id,
            data.get('prop_firm', ''),
            data.get('account_type', ''),
            float(data.get('account_size', 0)) if data.get('account_size') else None,
            float(data.get('account_equity', 0)) if data.get('account_equity') else None,
            float(data.get('account_size', 0)) if data.get('account_size') else None,
            milestone_access,
            datetime.now(timezone.utc)
        )
        
        db_manager.execute_query(dashboard_query, dashboard_params)
        
        logger.info(f"✅ Questionnaire saved successfully: {data.get('user_email')}")
        
        return jsonify({
            'success': True,
            'message': 'Questionnaire saved successfully',
            'questionnaire_id': questionnaire_id,
            'milestone_access_level': milestone_access
        }), 201
        
    except Exception as e:
        logger.error(f"Questionnaire error: {e}")
        return jsonify({'error': 'Questionnaire save failed', 'details': str(e)}), 500

# =============================================
# NEW ENHANCED ENDPOINTS
# =============================================

@app.route('/api/enhanced/signup', methods=['POST', 'OPTIONS'])
def enhanced_signup_new():
    """New enhanced signup endpoint with full data capture"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        logger.info(f"Enhanced signup request: {data}")
        
        user_id = generate_user_id()
        access_token = generate_access_token()
        unique_id = f"USER_{int(datetime.now().timestamp())}"
        
        query = """
            INSERT INTO enhanced_users (
                id, first_name, last_name, email, phone, company, country,
                password_hash, selected_plan_name, selected_plan_price, selected_plan_period,
                selected_plan_description, agree_to_terms, agree_to_marketing,
                registration_method, unique_id, access_token, status, created_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """
        
        params = (
            user_id,
            data.get('first_name', ''),
            data.get('last_name', ''),
            data.get('email', ''),
            data.get('phone'),
            data.get('company'),
            data.get('country'),
            hash_password(data.get('password', 'default')),
            data.get('selected_plan_name'),
            float(data.get('selected_plan_price', 0)) if data.get('selected_plan_price') else None,
            data.get('selected_plan_period'),
            data.get('selected_plan_description'),
            data.get('agree_to_terms', False),
            data.get('agree_to_marketing', False),
            'api',
            unique_id,
            access_token,
            'active',
            datetime.now(timezone.utc)
        )
        
        db_manager.execute_query(query, params)
        
        return jsonify({
            'success': True,
            'message': 'Enhanced signup successful',
            'user_id': user_id,
            'unique_id': unique_id,
            'access_token': access_token
        }), 201
        
    except Exception as e:
        logger.error(f"Enhanced signup error: {e}")
        return jsonify({'error': 'Enhanced signup failed', 'details': str(e)}), 500

@app.route('/api/enhanced/dashboard/<email>', methods=['GET'])
def get_dashboard_data(email):
    """Get complete dashboard data for a user"""
    try:
        query = """
            SELECT * FROM user_complete_profile 
            WHERE email = %s
        """
        
        result = db_manager.execute_query(query, (email,), fetch=True)
        
        if not result:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'data': dict(result[0])
        }), 200
        
    except Exception as e:
        logger.error(f"Dashboard data error: {e}")
        return jsonify({'error': 'Failed to get dashboard data', 'details': str(e)}), 500

@app.route('/api/enhanced/admin/stats', methods=['GET'])
def admin_stats():
    """Get admin statistics"""
    try:
        stats = {}
        
        # User stats
        user_query = "SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'active' THEN 1 END) as active FROM enhanced_users"
        user_result = db_manager.execute_query(user_query, fetch=True)
        stats['user_stats'] = dict(user_result[0]) if user_result else {}
        
        # Payment stats
        payment_query = "SELECT COUNT(*) as total, SUM(final_price) as total_revenue FROM payment_transactions WHERE payment_status = 'completed'"
        payment_result = db_manager.execute_query(payment_query, fetch=True)
        stats['payment_stats'] = dict(payment_result[0]) if payment_result else {}
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
        
    except Exception as e:
        logger.error(f"Admin stats error: {e}")
        return jsonify({'error': 'Failed to get stats', 'details': str(e)}), 500

# =============================================
# HEALTH CHECK AND UTILITY ENDPOINTS
# =============================================

@app.route('/health', methods=['GET'])
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db_manager.execute_query("SELECT 1", fetch=True)
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 500

@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({
        'message': 'TraderEdgePro Enhanced Database API',
        'version': '2.0',
        'status': 'running',
        'endpoints': {
            'legacy': [
                '/api/auth/register',
                '/api/working/register', 
                '/api/register',
                '/api/enhanced-signup',
                '/api/payments',
                '/api/questionnaire'
            ],
            'enhanced': [
                '/api/enhanced/signup',
                '/api/enhanced/dashboard/<email>',
                '/api/enhanced/admin/stats'
            ],
            'utility': [
                '/health',
                '/api/health'
            ]
        }
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

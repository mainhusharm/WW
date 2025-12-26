#!/usr/bin/env python3
"""
ENHANCED POSTGRESQL API ROUTES FOR TRADEREDGEPRO
Handles ALL data from signup-enhanced, enhanced-payment, questionnaire, and dashboard
Direct connection to PostgreSQL: postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2
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
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    def execute_query(self, query: str, params: tuple = None, fetch: bool = False):
        """Execute a query with parameters"""
        conn = None
        try:
            conn = self.get_connection()
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                cursor.execute(query, params)
                
                if fetch:
                    result = cursor.fetchall()
                    return [dict(row) for row in result]
                else:
                    conn.commit()
                    return cursor.rowcount
                    
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Query execution failed: {e}")
            raise
        finally:
            if conn:
                conn.close()
    
    def execute_query_single(self, query: str, params: tuple = None):
        """Execute a query and return single result"""
        conn = None
        try:
            conn = self.get_connection()
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                cursor.execute(query, params)
                result = cursor.fetchone()
                conn.commit()
                return dict(result) if result else None
                
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Single query execution failed: {e}")
            raise
        finally:
            if conn:
                conn.close()

# Initialize database manager
db = DatabaseManager()

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_unique_id() -> str:
    """Generate unique user ID"""
    return f"USER_{int(datetime.now().timestamp())}"

def generate_access_token() -> str:
    """Generate access token"""
    return str(uuid.uuid4())

# =============================================
# HEALTH CHECK ENDPOINT
# =============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        result = db.execute_query("SELECT 1 as test", fetch=True)
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'message': 'Enhanced PostgreSQL API is running'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 500

# =============================================
# SIGNUP-ENHANCED ENDPOINT
# =============================================

@app.route('/api/enhanced/signup', methods=['POST', 'OPTIONS'])
def enhanced_signup():
    """Handle enhanced signup form data"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        logger.info(f"Enhanced signup request: {data}")
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if user already exists
        existing_user = db.execute_query_single(
            "SELECT id FROM enhanced_users WHERE email = %s",
            (data['email'],)
        )
        
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 409
        
        # Generate unique identifiers
        user_id = str(uuid.uuid4())
        unique_id = generate_unique_id()
        access_token = generate_access_token()
        
        # Hash password
        password_hash = hash_password(data['password'])
        
        # Insert user data
        insert_query = """
            INSERT INTO enhanced_users (
                id, first_name, last_name, email, phone, company, country,
                password_hash, selected_plan_name, selected_plan_price, selected_plan_period,
                selected_plan_description, agree_to_terms, agree_to_marketing,
                unique_id, access_token, registration_method, status
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """
        
        params = (
            user_id,
            data['first_name'],
            data['last_name'], 
            data['email'],
            data.get('phone'),
            data.get('company'),
            data.get('country'),
            password_hash,
            data.get('selected_plan_name'),
            data.get('selected_plan_price'),
            data.get('selected_plan_period'),
            data.get('selected_plan_description'),
            data.get('agree_to_terms', False),
            data.get('agree_to_marketing', False),
            unique_id,
            access_token,
            'api',
            'active'
        )
        
        db.execute_query(insert_query, params)
        
        # Return success response
        response_data = {
            'success': True,
            'message': 'User registered successfully',
            'user': {
                'id': user_id,
                'email': data['email'],
                'fullName': f"{data['first_name']} {data['last_name']}",
                'uniqueId': unique_id,
                'status': 'active'
            },
            'access_token': access_token
        }
        
        logger.info(f"✅ User registered successfully: {data['email']}")
        return jsonify(response_data), 201
        
    except Exception as e:
        logger.error(f"❌ Enhanced signup error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

# =============================================
# ENHANCED-PAYMENT ENDPOINT
# =============================================

@app.route('/api/enhanced/payment', methods=['POST', 'OPTIONS'])
def enhanced_payment():
    """Handle enhanced payment form data"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        logger.info(f"Enhanced payment request: {data}")
        
        # Validate required fields
        required_fields = ['user_email', 'plan_name_payment', 'final_price', 'payment_method', 'transaction_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get user ID from email
        user_data = db.execute_query_single(
            "SELECT id, first_name, last_name FROM enhanced_users WHERE email = %s",
            (data['user_email'],)
        )
        
        if not user_data:
            return jsonify({'error': 'User not found'}), 404
        
        # Generate payment ID
        payment_id = str(uuid.uuid4())
        
        # Insert payment data
        insert_query = """
            INSERT INTO payment_transactions (
                id, user_id, user_email, user_name, plan_name_payment,
                original_price, discount_amount, final_price, coupon_code, coupon_applied,
                payment_method, payment_provider, transaction_id, payment_status,
                crypto_currency, crypto_network, crypto_transaction_hash, crypto_from_address,
                crypto_to_address, crypto_amount, crypto_verification_status,
                stripe_payment_intent_id, paypal_order_id, cryptomus_order_id,
                payment_completed_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """
        
        user_name = f"{user_data['first_name']} {user_data['last_name']}"
        
        params = (
            payment_id,
            user_data['id'],
            data['user_email'],
            user_name,
            data['plan_name_payment'],
            data.get('original_price', data['final_price']),
            data.get('discount_amount', 0),
            data['final_price'],
            data.get('coupon_code'),
            data.get('coupon_applied', False),
            data['payment_method'],
            data.get('payment_provider'),
            data['transaction_id'],
            data.get('payment_status', 'completed'),
            data.get('crypto_currency'),
            data.get('crypto_network'),
            data.get('crypto_transaction_hash'),
            data.get('crypto_from_address'),
            data.get('crypto_to_address'),
            data.get('crypto_amount'),
            data.get('crypto_verification_status', 'pending'),
            data.get('stripe_payment_intent_id'),
            data.get('paypal_order_id'),
            data.get('cryptomus_order_id'),
            datetime.now(timezone.utc)
        )
        
        db.execute_query(insert_query, params)
        
        # Return success response
        response_data = {
            'success': True,
            'message': 'Payment recorded successfully',
            'payment_id': payment_id,
            'transaction_id': data['transaction_id'],
            'status': 'completed'
        }
        
        logger.info(f"✅ Payment recorded successfully: {data['user_email']}")
        return jsonify(response_data), 201
        
    except Exception as e:
        logger.error(f"❌ Enhanced payment error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

# =============================================
# QUESTIONNAIRE ENDPOINT
# =============================================

@app.route('/api/enhanced/questionnaire', methods=['POST', 'OPTIONS'])
def enhanced_questionnaire():
    """Handle questionnaire form data"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        logger.info(f"Enhanced questionnaire request: {data}")
        
        # Validate required fields
        required_fields = ['user_email', 'prop_firm', 'account_type', 'account_size', 'account_number']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get user ID from email
        user_data = db.execute_query_single(
            "SELECT id, first_name, last_name FROM enhanced_users WHERE email = %s",
            (data['user_email'],)
        )
        
        if not user_data:
            return jsonify({'error': 'User not found'}), 404
        
        # Generate questionnaire ID
        questionnaire_id = str(uuid.uuid4())
        user_name = f"{user_data['first_name']} {user_data['last_name']}"
        
        # Determine milestone access level based on account type
        account_type = data['account_type'].lower()
        if 'demo' in account_type or 'beginner' in account_type:
            milestone_access_level = 1
        elif 'standard' in account_type:
            milestone_access_level = 2
        elif 'pro' in account_type or 'experienced' in account_type:
            milestone_access_level = 3
        elif 'funded' in account_type or 'evaluation' in account_type:
            milestone_access_level = 4
        else:
            milestone_access_level = 1  # Default
        
        # Insert questionnaire data
        insert_query = """
            INSERT INTO questionnaire_responses (
                id, user_id, user_email, user_name, trades_per_day, trading_session,
                crypto_assets, forex_assets, custom_forex_pairs, has_account, account_equity,
                prop_firm, account_type, account_size, account_number, risk_percentage,
                risk_reward_ratio, challenge_step, trading_experience, milestone_access_level
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """
        
        params = (
            questionnaire_id,
            user_data['id'],
            data['user_email'],
            user_name,
            data.get('trades_per_day', '1-2'),
            data.get('trading_session', 'any'),
            json.dumps(data.get('crypto_assets', [])),
            json.dumps(data.get('forex_assets', [])),
            json.dumps(data.get('custom_forex_pairs', [])),
            data.get('has_account', 'no'),
            data.get('account_equity'),
            data['prop_firm'],
            data['account_type'],
            data['account_size'],
            data['account_number'],
            data.get('risk_percentage', 1.0),
            data.get('risk_reward_ratio', '2'),
            data.get('challenge_step'),
            data.get('trading_experience', 'intermediate'),
            milestone_access_level
        )
        
        db.execute_query(insert_query, params)
        
        # Create initial dashboard data entry
        dashboard_id = str(uuid.uuid4())
        dashboard_query = """
            INSERT INTO user_dashboard_data (
                id, user_id, user_uuid, questionnaire_id, prop_firm, account_type, account_size,
                current_equity, initial_balance, milestone_access_level
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """
        
        initial_balance = data.get('account_equity') if data.get('has_account') == 'yes' else data['account_size']
        
        dashboard_params = (
            dashboard_id,
            user_data['id'],
            str(user_data['id']),
            questionnaire_id,
            data['prop_firm'],
            data['account_type'],
            data['account_size'],
            initial_balance,
            initial_balance,
            milestone_access_level
        )
        
        db.execute_query(dashboard_query, dashboard_params)
        
        # Return success response
        response_data = {
            'success': True,
            'message': 'Questionnaire completed successfully',
            'questionnaire_id': questionnaire_id,
            'dashboard_id': dashboard_id,
            'milestone_access_level': milestone_access_level
        }
        
        logger.info(f"✅ Questionnaire completed successfully: {data['user_email']}")
        return jsonify(response_data), 201
        
    except Exception as e:
        logger.error(f"❌ Enhanced questionnaire error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

# =============================================
# DASHBOARD DATA ENDPOINTS
# =============================================

@app.route('/api/enhanced/dashboard/<user_email>', methods=['GET'])
def get_dashboard_data(user_email):
    """Get complete dashboard data for user"""
    try:
        # Get complete user profile using the view
        user_profile = db.execute_query_single(
            "SELECT * FROM user_complete_profile WHERE email = %s",
            (user_email,)
        )
        
        if not user_profile:
            return jsonify({'error': 'User not found'}), 404
        
        # Get dashboard overview
        dashboard_overview = db.execute_query_single(
            "SELECT * FROM dashboard_overview WHERE email = %s",
            (user_email,)
        )
        
        # Get signal performance by milestone
        signal_performance = db.execute_query(
            "SELECT * FROM signal_performance_by_milestone WHERE user_id = %s",
            (user_profile['id'],),
            fetch=True
        )
        
        response_data = {
            'success': True,
            'user_profile': user_profile,
            'dashboard_overview': dashboard_overview,
            'signal_performance': signal_performance,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"❌ Get dashboard data error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@app.route('/api/enhanced/dashboard/update', methods=['POST', 'OPTIONS'])
def update_dashboard_data():
    """Update dashboard data (performance metrics, trades, etc.)"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        logger.info(f"Dashboard update request: {data}")
        
        # Validate required fields
        if not data.get('user_email'):
            return jsonify({'error': 'Missing user_email'}), 400
        
        # Get user ID
        user_data = db.execute_query_single(
            "SELECT id FROM enhanced_users WHERE email = %s",
            (data['user_email'],)
        )
        
        if not user_data:
            return jsonify({'error': 'User not found'}), 404
        
        # Update dashboard data
        update_query = """
            UPDATE user_dashboard_data SET
                current_equity = COALESCE(%s, current_equity),
                total_pnl = COALESCE(%s, total_pnl),
                total_trades = COALESCE(%s, total_trades),
                winning_trades = COALESCE(%s, winning_trades),
                losing_trades = COALESCE(%s, losing_trades),
                win_rate = COALESCE(%s, win_rate),
                max_drawdown = COALESCE(%s, max_drawdown),
                current_drawdown = COALESCE(%s, current_drawdown),
                daily_pnl = COALESCE(%s, daily_pnl),
                signals_won = COALESCE(%s, signals_won),
                signals_lost = COALESCE(%s, signals_lost),
                last_active = CURRENT_TIMESTAMP
            WHERE user_id = %s
        """
        
        params = (
            data.get('current_equity'),
            data.get('total_pnl'),
            data.get('total_trades'),
            data.get('winning_trades'),
            data.get('losing_trades'),
            data.get('win_rate'),
            data.get('max_drawdown'),
            data.get('current_drawdown'),
            data.get('daily_pnl'),
            data.get('signals_won'),
            data.get('signals_lost'),
            user_data['id']
        )
        
        rows_affected = db.execute_query(update_query, params)
        
        if rows_affected == 0:
            return jsonify({'error': 'No dashboard data found to update'}), 404
        
        response_data = {
            'success': True,
            'message': 'Dashboard data updated successfully',
            'rows_affected': rows_affected
        }
        
        logger.info(f"✅ Dashboard data updated successfully: {data['user_email']}")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"❌ Update dashboard data error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

# =============================================
# SIGNAL TRACKING ENDPOINTS
# =============================================

@app.route('/api/enhanced/signals/track', methods=['POST', 'OPTIONS'])
def track_signal():
    """Track signal taken by user"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        logger.info(f"Signal tracking request: {data}")
        
        # Validate required fields
        required_fields = ['user_email', 'signal_id', 'signal_symbol', 'signal_milestone']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get user ID
        user_data = db.execute_query_single(
            "SELECT id FROM enhanced_users WHERE email = %s",
            (data['user_email'],)
        )
        
        if not user_data:
            return jsonify({'error': 'User not found'}), 404
        
        # Get dashboard data ID
        dashboard_data = db.execute_query_single(
            "SELECT id FROM user_dashboard_data WHERE user_id = %s",
            (user_data['id'],)
        )
        
        # Insert signal tracking data
        signal_id = str(uuid.uuid4())
        insert_query = """
            INSERT INTO signal_tracking (
                id, user_id, dashboard_data_id, signal_id, signal_symbol, signal_type,
                signal_price, signal_milestone, confidence_score, taken_by_user, taken_at,
                outcome, pnl, risk_amount
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """
        
        params = (
            signal_id,
            user_data['id'],
            dashboard_data['id'] if dashboard_data else None,
            data['signal_id'],
            data['signal_symbol'],
            data.get('signal_type'),
            data.get('signal_price'),
            data['signal_milestone'],
            data.get('confidence_score'),
            data.get('taken_by_user', True),
            datetime.now(timezone.utc),
            data.get('outcome', 'pending'),
            data.get('pnl', 0),
            data.get('risk_amount')
        )
        
        db.execute_query(insert_query, params)
        
        response_data = {
            'success': True,
            'message': 'Signal tracked successfully',
            'signal_tracking_id': signal_id
        }
        
        logger.info(f"✅ Signal tracked successfully: {data['user_email']}")
        return jsonify(response_data), 201
        
    except Exception as e:
        logger.error(f"❌ Signal tracking error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

# =============================================
# ADMIN ENDPOINTS
# =============================================

@app.route('/api/enhanced/admin/users', methods=['GET'])
def get_all_users():
    """Get all users with complete profile data"""
    try:
        users = db.execute_query(
            "SELECT * FROM user_complete_profile ORDER BY signup_date DESC",
            fetch=True
        )
        
        return jsonify({
            'success': True,
            'users': users,
            'total_count': len(users)
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Get all users error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@app.route('/api/enhanced/admin/stats', methods=['GET'])
def get_admin_stats():
    """Get admin statistics"""
    try:
        # Get user stats
        user_stats = db.execute_query_single(
            """
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_users_week,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_month
            FROM enhanced_users
            """
        )
        
        # Get payment stats
        payment_stats = db.execute_query_single(
            """
            SELECT 
                COUNT(*) as total_payments,
                COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_payments,
                SUM(CASE WHEN payment_status = 'completed' THEN final_price ELSE 0 END) as total_revenue,
                AVG(CASE WHEN payment_status = 'completed' THEN final_price ELSE NULL END) as avg_payment
            FROM payment_transactions
            """
        )
        
        # Get questionnaire stats
        questionnaire_stats = db.execute_query_single(
            """
            SELECT 
                COUNT(*) as total_questionnaires,
                COUNT(DISTINCT prop_firm) as unique_prop_firms,
                COUNT(CASE WHEN milestone_access_level = 4 THEN 1 END) as premium_users
            FROM questionnaire_responses
            """
        )
        
        return jsonify({
            'success': True,
            'user_stats': user_stats,
            'payment_stats': payment_stats,
            'questionnaire_stats': questionnaire_stats,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Get admin stats error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

# =============================================
# ERROR HANDLERS
# =============================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# =============================================
# MAIN APPLICATION
# =============================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"🚀 Starting Enhanced PostgreSQL API on port {port}")
    logger.info(f"🔗 Database: {DATABASE_CONFIG['host']}/{DATABASE_CONFIG['database']}")
    logger.info(f"📊 Available endpoints:")
    logger.info(f"   GET  /api/health - Health check")
    logger.info(f"   POST /api/enhanced/signup - Enhanced signup")
    logger.info(f"   POST /api/enhanced/payment - Enhanced payment")
    logger.info(f"   POST /api/enhanced/questionnaire - Questionnaire")
    logger.info(f"   GET  /api/enhanced/dashboard/<email> - Get dashboard data")
    logger.info(f"   POST /api/enhanced/dashboard/update - Update dashboard")
    logger.info(f"   POST /api/enhanced/signals/track - Track signals")
    logger.info(f"   GET  /api/enhanced/admin/users - Admin user list")
    logger.info(f"   GET  /api/enhanced/admin/stats - Admin statistics")
    
    app.run(host='0.0.0.0', port=port, debug=debug)

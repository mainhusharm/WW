"""
Simple API routes that work with the existing database structure
"""

import os
import json
import psycopg2
from flask import Blueprint, request, jsonify
from datetime import datetime
import logging

simple_api_bp = Blueprint('simple_api', __name__)

def get_db_connection():
    """Get PostgreSQL database connection"""
    try:
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise Exception("DATABASE_URL not found in environment variables")
        
        conn = psycopg2.connect(database_url)
        return conn
    except Exception as e:
        logging.error(f"Database connection error: {e}")
        raise e

@simple_api_bp.route('/simple/payments', methods=['POST', 'OPTIONS'])
def handle_simple_payments():
    """Handle payment data with simple database structure"""
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        return response, 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        logging.info(f"Simple payment data received: {data}")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Simple payment insertion using existing table structure
        payment_query = """
            INSERT INTO payment_details (
                user_id, user_email, user_name, plan_name_payment, original_price,
                discount_amount, final_price, payment_method, transaction_id,
                payment_status, payment_provider, crypto_transaction_hash, 
                crypto_from_address, crypto_amount, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        
        payment_values = (
            data.get('user_id'),
            data.get('user_email'),
            data.get('user_name'),
            data.get('plan_name_payment'),
            data.get('original_price'),
            data.get('discount_amount'),
            data.get('final_price'),
            data.get('payment_method'),
            data.get('transaction_id'),
            data.get('payment_status', 'completed'),
            data.get('payment_provider'),
            data.get('crypto_transaction_hash'),
            data.get('crypto_from_address'),
            data.get('crypto_amount'),
            data.get('created_at', datetime.now().isoformat()),
            data.get('updated_at', datetime.now().isoformat())
        )
        
        cur.execute(payment_query, payment_values)
        payment_id = cur.fetchone()[0]
        
        conn.commit()
        cur.close()
        conn.close()
        
        logging.info(f"Simple payment data saved successfully with ID: {payment_id}")
        return jsonify({
            "success": True,
            "message": "Payment data saved successfully",
            "payment_id": payment_id
        }), 201
        
    except Exception as e:
        logging.error(f"Simple payment processing error: {e}")
        return jsonify({"error": f"Payment processing failed: {str(e)}"}), 500

@simple_api_bp.route('/simple/questionnaire', methods=['POST', 'OPTIONS'])
def handle_simple_questionnaire():
    """Handle questionnaire data with simple database structure"""
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        return response, 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        logging.info(f"Simple questionnaire data received: {data}")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Simple questionnaire insertion
        questionnaire_query = """
            INSERT INTO questionnaire_details (
                user_id, user_email, user_name, trades_per_day, trading_session,
                crypto_assets, forex_assets, has_account, account_equity, prop_firm,
                account_type, account_size, risk_percentage, risk_reward_ratio,
                trading_experience, risk_tolerance, trading_goals, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                trades_per_day = EXCLUDED.trades_per_day,
                trading_session = EXCLUDED.trading_session,
                crypto_assets = EXCLUDED.crypto_assets,
                forex_assets = EXCLUDED.forex_assets,
                has_account = EXCLUDED.has_account,
                account_equity = EXCLUDED.account_equity,
                prop_firm = EXCLUDED.prop_firm,
                account_type = EXCLUDED.account_type,
                account_size = EXCLUDED.account_size,
                risk_percentage = EXCLUDED.risk_percentage,
                risk_reward_ratio = EXCLUDED.risk_reward_ratio,
                trading_experience = EXCLUDED.trading_experience,
                risk_tolerance = EXCLUDED.risk_tolerance,
                trading_goals = EXCLUDED.trading_goals,
                updated_at = EXCLUDED.updated_at
            RETURNING id
        """
        
        questionnaire_values = (
            data.get('user_id'),
            data.get('user_email'),
            data.get('user_name'),
            data.get('trades_per_day'),
            data.get('trading_session'),
            json.dumps(data.get('crypto_assets', [])),
            json.dumps(data.get('forex_assets', [])),
            data.get('has_account'),
            data.get('account_equity'),
            data.get('prop_firm'),
            data.get('account_type'),
            data.get('account_size'),
            data.get('risk_percentage'),
            data.get('risk_reward_ratio'),
            data.get('trading_experience'),
            data.get('risk_tolerance'),
            data.get('trading_goals'),
            data.get('created_at', datetime.now().isoformat()),
            data.get('updated_at', datetime.now().isoformat())
        )
        
        cur.execute(questionnaire_query, questionnaire_values)
        questionnaire_id = cur.fetchone()[0]
        
        conn.commit()
        cur.close()
        conn.close()
        
        logging.info(f"Simple questionnaire data saved successfully with ID: {questionnaire_id}")
        return jsonify({
            "success": True,
            "message": "Questionnaire data saved successfully",
            "questionnaire_id": questionnaire_id
        }), 201
        
    except Exception as e:
        logging.error(f"Simple questionnaire processing error: {e}")
        return jsonify({"error": f"Questionnaire processing failed: {str(e)}"}), 500

@simple_api_bp.route('/simple/dashboard', methods=['POST', 'OPTIONS'])
def handle_simple_dashboard():
    """Handle dashboard data with simple database structure"""
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        return response, 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        logging.info(f"Simple dashboard data received: {data}")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Simple dashboard insertion
        dashboard_query = """
            INSERT INTO user_dashboard (
                user_id, user_email, user_name, current_equity, initial_equity,
                total_pnl, win_rate, total_trades, winning_trades, losing_trades,
                account_balance, daily_pnl, last_activity, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                current_equity = EXCLUDED.current_equity,
                total_pnl = EXCLUDED.total_pnl,
                win_rate = EXCLUDED.win_rate,
                total_trades = EXCLUDED.total_trades,
                winning_trades = EXCLUDED.winning_trades,
                losing_trades = EXCLUDED.losing_trades,
                account_balance = EXCLUDED.account_balance,
                daily_pnl = EXCLUDED.daily_pnl,
                last_activity = EXCLUDED.last_activity,
                updated_at = EXCLUDED.updated_at
            RETURNING id
        """
        
        dashboard_values = (
            data.get('user_id'),
            data.get('user_email'),
            data.get('user_name'),
            data.get('current_equity'),
            data.get('initial_equity'),
            data.get('total_pnl'),
            data.get('win_rate'),
            data.get('total_trades'),
            data.get('winning_trades'),
            data.get('losing_trades'),
            data.get('account_balance'),
            data.get('daily_pnl'),
            data.get('last_activity', datetime.now().isoformat()),
            data.get('created_at', datetime.now().isoformat()),
            data.get('updated_at', datetime.now().isoformat())
        )
        
        cur.execute(dashboard_query, dashboard_values)
        dashboard_id = cur.fetchone()[0]
        
        conn.commit()
        cur.close()
        conn.close()
        
        logging.info(f"Simple dashboard data saved successfully with ID: {dashboard_id}")
        return jsonify({
            "success": True,
            "message": "Dashboard data saved successfully",
            "dashboard_id": dashboard_id
        }), 201
        
    except Exception as e:
        logging.error(f"Simple dashboard processing error: {e}")
        return jsonify({"error": f"Dashboard processing failed: {str(e)}"}), 500

@simple_api_bp.route('/simple/health', methods=['GET'])
def simple_health_check():
    """Simple health check endpoint"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        conn.close()
        
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@simple_api_bp.route('/simple/signup', methods=['POST', 'OPTIONS'])
def handle_simple_signup():
    """Handle user signup and save to PostgreSQL users table"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No JSON data provided"}), 400
        
        logging.info(f"Simple signup data received: {data}")
        
        # Extract data from frontend
        first_name = data.get('firstName', '')
        last_name = data.get('lastName', '')
        email = data.get('email', '')
        password = data.get('password', '')
        plan_type = data.get('plan_type', 'premium')
        
        # Validation
        if not all([first_name, last_name, email, password]):
            return jsonify({"success": False, "message": "First name, last name, email, and password are required"}), 400
        
        if len(password) < 8:
            return jsonify({"success": False, "message": "Password must be at least 8 characters"}), 400
        
        # Connect to database
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if user already exists
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"success": False, "message": "User already exists with this email"}), 409
        
        # Create user
        import hashlib
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        full_name = f"{first_name} {last_name}".strip()
        
        cur.execute("""
            INSERT INTO users (
                first_name, last_name, email, password_hash, plan_type, 
                created_at, updated_at, is_active
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            first_name, last_name, email, password_hash, plan_type,
            datetime.now(), datetime.now(), True
        ))
        
        user_id = cur.fetchone()[0]
        conn.commit()
        
        # Return success response
        response_data = {
            "success": True,
            "message": "Registration successful",
            "user": {
                "id": user_id,
                "email": email,
                "firstName": first_name,
                "lastName": last_name,
                "fullName": full_name,
                "plan_type": plan_type,
                "created_at": datetime.now().isoformat()
            },
            "access_token": f"token_{user_id}_{int(datetime.now().timestamp())}"
        }
        
        logging.info(f"Simple signup data saved successfully with ID: {user_id}")
        return jsonify(response_data), 200
        
    except Exception as e:
        logging.error(f"Simple signup processing error: {e}")
        return jsonify({
            "success": False,
            "message": f"Simple signup processing failed: {str(e)}"
        }), 500
    finally:
        if 'conn' in locals():
            conn.close()

#!/usr/bin/env python3
"""
Complete API Server for TraderEdge Pro
Handles all data from signup-enhanced, payment-enhanced, questionnaire, and dashboard pages
"""

import os
import json
import hashlib
import uuid
from datetime import datetime, timezone
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Database configuration
DATABASE_URL = "postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73f0878g-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2"

def get_db_connection():
    """Get database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise

def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_user_id():
    """Generate unique user ID"""
    return str(uuid.uuid4())

# =============================================
# 1. ENHANCED SIGNUP ENDPOINT
# =============================================

@app.route('/api/signup-enhanced', methods=['POST', 'OPTIONS'])
def handle_enhanced_signup():
    """Handle enhanced signup form data"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No JSON data provided"}), 400
        
        logger.info(f"Enhanced signup data received: {data}")
        
        # Extract data from frontend
        first_name = data.get('firstName', '').strip()
        last_name = data.get('lastName', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        phone = data.get('phone', '').strip()
        company = data.get('company', '').strip()
        country = data.get('country', '').strip()
        agree_to_terms = data.get('agreeToTerms', False)
        agree_to_marketing = data.get('agreeToMarketing', False)
        plan_type = data.get('plan_type', 'premium')
        plan_name = data.get('plan_name', 'Elite Plan')
        plan_price = data.get('plan_price', 1299.00)
        plan_period = data.get('plan_period', 'month')
        plan_description = data.get('plan_description', 'Complete MT5 bot development service')
        
        # Validation
        if not all([first_name, last_name, email, password]):
            return jsonify({"success": False, "message": "First name, last name, email, and password are required"}), 400
        
        if len(password) < 8:
            return jsonify({"success": False, "message": "Password must be at least 8 characters"}), 400
        
        if not email or '@' not in email:
            return jsonify({"success": False, "message": "Valid email is required"}), 400
        
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
        user_id = generate_user_id()
        password_hash = hash_password(password)
        full_name = f"{first_name} {last_name}".strip()
        
        cur.execute("""
            INSERT INTO users (
                id, first_name, last_name, email, password_hash, phone, company, country,
                agree_to_terms, agree_to_marketing, plan_type, plan_name, plan_price,
                plan_period, plan_description, created_at, updated_at, is_active
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id, first_name, last_name, email, password_hash, phone, company, country,
            agree_to_terms, agree_to_marketing, plan_type, plan_name, plan_price,
            plan_period, plan_description, datetime.now(timezone.utc), datetime.now(timezone.utc), True
        ))
        
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
                "plan_name": plan_name,
                "plan_price": float(plan_price),
                "plan_period": plan_period,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            "access_token": f"token_{user_id}_{int(datetime.now().timestamp())}"
        }
        
        logger.info(f"Enhanced signup data saved successfully with ID: {user_id}")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Enhanced signup processing error: {e}")
        return jsonify({
            "success": False,
            "message": f"Enhanced signup processing failed: {str(e)}"
        }), 500
    finally:
        if 'conn' in locals():
            conn.close()

# =============================================
# 2. ENHANCED PAYMENT ENDPOINT
# =============================================

@app.route('/api/payment-enhanced', methods=['POST', 'OPTIONS'])
def handle_enhanced_payment():
    """Handle enhanced payment page data"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No JSON data provided"}), 400
        
        logger.info(f"Enhanced payment data received: {data}")
        
        # Extract data from frontend
        user_id = data.get('user_id', '')
        user_email = data.get('user_email', '').strip().lower()
        user_name = data.get('user_name', '').strip()
        plan_name_payment = data.get('plan_name_payment', '').strip()
        original_price = Decimal(str(data.get('original_price', 0)))
        discount_amount = Decimal(str(data.get('discount_amount', 0)))
        final_price = Decimal(str(data.get('final_price', 0)))
        coupon_code = data.get('coupon_code', '').strip()
        coupon_applied = data.get('coupon_applied', False)
        payment_method = data.get('payment_method', '').strip()
        payment_provider = data.get('payment_provider', '').strip()
        transaction_id = data.get('transaction_id', '').strip()
        payment_status = data.get('payment_status', 'pending')
        crypto_transaction_hash = data.get('crypto_transaction_hash', '')
        crypto_from_address = data.get('crypto_from_address', '')
        crypto_amount = data.get('crypto_amount', '')
        crypto_verification_data = data.get('crypto_verification_data', {})
        
        # Validation
        if not all([user_id, user_email, user_name, plan_name_payment, transaction_id]):
            return jsonify({"success": False, "message": "Required fields missing"}), 400
        
        # Connect to database
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"success": False, "message": "User not found"}), 404
        
        # Create payment record
        payment_id = generate_user_id()
        
        cur.execute("""
            INSERT INTO payments (
                id, user_id, user_email, user_name, plan_name_payment, original_price,
                discount_amount, final_price, coupon_code, coupon_applied, payment_method,
                payment_provider, transaction_id, payment_status, crypto_transaction_hash,
                crypto_from_address, crypto_amount, crypto_verification_data, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            payment_id, user_id, user_email, user_name, plan_name_payment, original_price,
            discount_amount, final_price, coupon_code, coupon_applied, payment_method,
            payment_provider, transaction_id, payment_status, crypto_transaction_hash,
            crypto_from_address, crypto_amount, json.dumps(crypto_verification_data),
            datetime.now(timezone.utc), datetime.now(timezone.utc)
        ))
        
        conn.commit()
        
        # Return success response
        response_data = {
            "success": True,
            "message": "Payment processed successfully",
            "payment": {
                "id": payment_id,
                "user_id": user_id,
                "plan_name": plan_name_payment,
                "final_price": float(final_price),
                "payment_method": payment_method,
                "transaction_id": transaction_id,
                "status": payment_status,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        }
        
        logger.info(f"Enhanced payment data saved successfully with ID: {payment_id}")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Enhanced payment processing error: {e}")
        return jsonify({
            "success": False,
            "message": f"Enhanced payment processing failed: {str(e)}"
        }), 500
    finally:
        if 'conn' in locals():
            conn.close()

# =============================================
# 3. QUESTIONNAIRE ENDPOINT
# =============================================

@app.route('/api/questionnaire', methods=['POST', 'OPTIONS'])
def handle_questionnaire():
    """Handle questionnaire page data"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No JSON data provided"}), 400
        
        logger.info(f"Questionnaire data received: {data}")
        
        # Extract data from frontend
        user_id = data.get('user_id', '')
        user_email = data.get('user_email', '').strip().lower()
        user_name = data.get('user_name', '').strip()
        trades_per_day = data.get('trades_per_day', '1-2')
        trading_session = data.get('trading_session', 'any')
        crypto_assets = data.get('crypto_assets', [])
        forex_assets = data.get('forex_assets', [])
        custom_forex_pairs = data.get('custom_forex_pairs', [])
        has_account = data.get('has_account', 'no')
        account_equity = data.get('account_equity')
        prop_firm = data.get('prop_firm', '').strip()
        account_type = data.get('account_type', '').strip()
        account_size = data.get('account_size')
        risk_percentage = data.get('risk_percentage', 1.0)
        risk_reward_ratio = data.get('risk_reward_ratio', '2')
        account_number = data.get('account_number', '').strip()
        
        # Validation
        if not all([user_id, user_email, user_name, prop_firm, account_type, account_size, account_number]):
            return jsonify({"success": False, "message": "Required fields missing"}), 400
        
        # Convert account_size to Decimal
        try:
            account_size = Decimal(str(account_size)) if account_size else None
        except:
            return jsonify({"success": False, "message": "Invalid account size"}), 400
        
        # Convert account_equity to Decimal if provided
        try:
            account_equity = Decimal(str(account_equity)) if account_equity else None
        except:
            account_equity = None
        
        # Connect to database
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"success": False, "message": "User not found"}), 404
        
        # Create questionnaire record
        questionnaire_id = generate_user_id()
        
        cur.execute("""
            INSERT INTO questionnaire (
                id, user_id, user_email, user_name, trades_per_day, trading_session,
                crypto_assets, forex_assets, custom_forex_pairs, has_account, account_equity,
                prop_firm, account_type, account_size, risk_percentage, risk_reward_ratio,
                account_number, created_at, updated_at, completed_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            questionnaire_id, user_id, user_email, user_name, trades_per_day, trading_session,
            crypto_assets, forex_assets, custom_forex_pairs, has_account, account_equity,
            prop_firm, account_type, account_size, risk_percentage, risk_reward_ratio,
            account_number, datetime.now(timezone.utc), datetime.now(timezone.utc), datetime.now(timezone.utc)
        ))
        
        conn.commit()
        
        # Return success response
        response_data = {
            "success": True,
            "message": "Questionnaire completed successfully",
            "questionnaire": {
                "id": questionnaire_id,
                "user_id": user_id,
                "prop_firm": prop_firm,
                "account_type": account_type,
                "account_size": float(account_size) if account_size else None,
                "risk_percentage": risk_percentage,
                "trades_per_day": trades_per_day,
                "trading_session": trading_session,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
        }
        
        logger.info(f"Questionnaire data saved successfully with ID: {questionnaire_id}")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Questionnaire processing error: {e}")
        return jsonify({
            "success": False,
            "message": f"Questionnaire processing failed: {str(e)}"
        }), 500
    finally:
        if 'conn' in locals():
            conn.close()

# =============================================
# 4. USER DASHBOARD ENDPOINT
# =============================================

@app.route('/api/user-dashboard', methods=['POST', 'OPTIONS'])
def handle_user_dashboard():
    """Handle user dashboard data (based on questionnaire)"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No JSON data provided"}), 400
        
        logger.info(f"User dashboard data received: {data}")
        
        # Extract data from frontend
        user_id = data.get('user_id', '')
        user_email = data.get('user_email', '').strip().lower()
        user_name = data.get('user_name', '').strip()
        
        # User Profile Data
        prop_firm = data.get('prop_firm')
        account_type = data.get('account_type')
        account_size = data.get('account_size')
        risk_per_trade = data.get('risk_per_trade')
        experience = data.get('experience')
        unique_id = data.get('unique_id')
        
        # Performance Metrics
        account_balance = data.get('account_balance')
        total_pnl = data.get('total_pnl', 0)
        win_rate = data.get('win_rate', 0)
        total_trades = data.get('total_trades', 0)
        winning_trades = data.get('winning_trades', 0)
        losing_trades = data.get('losing_trades', 0)
        average_win = data.get('average_win', 0)
        average_loss = data.get('average_loss', 0)
        profit_factor = data.get('profit_factor', 0)
        max_drawdown = data.get('max_drawdown', 0)
        current_drawdown = data.get('current_drawdown', 0)
        gross_profit = data.get('gross_profit', 0)
        gross_loss = data.get('gross_loss', 0)
        consecutive_wins = data.get('consecutive_wins', 0)
        consecutive_losses = data.get('consecutive_losses', 0)
        sharpe_ratio = data.get('sharpe_ratio')
        
        # Risk Protocol
        max_daily_risk = data.get('max_daily_risk')
        risk_per_trade_amount = data.get('risk_per_trade_amount')
        max_drawdown_limit = data.get('max_drawdown_limit')
        
        # Trading State
        initial_equity = data.get('initial_equity')
        current_equity = data.get('current_equity')
        daily_pnl = data.get('daily_pnl', 0)
        daily_trades = data.get('daily_trades', 0)
        daily_initial_equity = data.get('daily_initial_equity')
        
        # Risk Settings
        risk_per_trade_percentage = data.get('risk_per_trade_percentage')
        daily_loss_limit = data.get('daily_loss_limit')
        consecutive_losses_limit = data.get('consecutive_losses_limit')
        
        # Dashboard Settings
        selected_theme = data.get('selected_theme', 'concept1')
        notifications_enabled = data.get('notifications_enabled', True)
        auto_refresh = data.get('auto_refresh', True)
        refresh_interval = data.get('refresh_interval', 5000)
        language = data.get('language', 'en')
        timezone = data.get('timezone', 'UTC')
        
        # Real-time Data
        real_time_data = data.get('real_time_data', {})
        last_signal = data.get('last_signal')
        market_status = data.get('market_status', 'open')
        connection_status = data.get('connection_status', 'online')
        
        # Trading Data
        open_positions = data.get('open_positions', [])
        trade_history = data.get('trade_history', [])
        signals = data.get('signals', [])
        
        # User Preferences
        dashboard_layout = data.get('dashboard_layout')
        widget_settings = data.get('widget_settings')
        alert_settings = data.get('alert_settings')
        
        # Validation
        if not all([user_id, user_email, user_name]):
            return jsonify({"success": False, "message": "Required fields missing"}), 400
        
        # Connect to database
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"success": False, "message": "User not found"}), 404
        
        # Create or update dashboard record
        dashboard_id = generate_user_id()
        
        # Check if dashboard already exists for this user
        cur.execute("SELECT id FROM user_dashboard WHERE user_id = %s", (user_id,))
        existing_dashboard = cur.fetchone()
        
        if existing_dashboard:
            # Update existing dashboard
            cur.execute("""
                UPDATE user_dashboard SET
                    prop_firm = %s, account_type = %s, account_size = %s, risk_per_trade = %s,
                    experience = %s, unique_id = %s, account_balance = %s, total_pnl = %s,
                    win_rate = %s, total_trades = %s, winning_trades = %s, losing_trades = %s,
                    average_win = %s, average_loss = %s, profit_factor = %s, max_drawdown = %s,
                    current_drawdown = %s, gross_profit = %s, gross_loss = %s,
                    consecutive_wins = %s, consecutive_losses = %s, sharpe_ratio = %s,
                    max_daily_risk = %s, risk_per_trade_amount = %s, max_drawdown_limit = %s,
                    initial_equity = %s, current_equity = %s, daily_pnl = %s, daily_trades = %s,
                    daily_initial_equity = %s, risk_per_trade_percentage = %s,
                    daily_loss_limit = %s, consecutive_losses_limit = %s,
                    selected_theme = %s, notifications_enabled = %s, auto_refresh = %s,
                    refresh_interval = %s, language = %s, timezone = %s,
                    real_time_data = %s, last_signal = %s, market_status = %s,
                    connection_status = %s, open_positions = %s, trade_history = %s,
                    signals = %s, dashboard_layout = %s, widget_settings = %s,
                    alert_settings = %s, last_activity = %s, updated_at = %s
                WHERE user_id = %s
            """, (
                prop_firm, account_type, account_size, risk_per_trade, experience, unique_id,
                account_balance, total_pnl, win_rate, total_trades, winning_trades, losing_trades,
                average_win, average_loss, profit_factor, max_drawdown, current_drawdown,
                gross_profit, gross_loss, consecutive_wins, consecutive_losses, sharpe_ratio,
                max_daily_risk, risk_per_trade_amount, max_drawdown_limit, initial_equity,
                current_equity, daily_pnl, daily_trades, daily_initial_equity,
                risk_per_trade_percentage, daily_loss_limit, consecutive_losses_limit,
                selected_theme, notifications_enabled, auto_refresh, refresh_interval,
                language, timezone, json.dumps(real_time_data), json.dumps(last_signal),
                market_status, connection_status, json.dumps(open_positions),
                json.dumps(trade_history), json.dumps(signals), json.dumps(dashboard_layout),
                json.dumps(widget_settings), json.dumps(alert_settings),
                datetime.now(timezone.utc), datetime.now(timezone.utc), user_id
            ))
        else:
            # Create new dashboard
            cur.execute("""
                INSERT INTO user_dashboard (
                    id, user_id, user_email, user_name, prop_firm, account_type, account_size,
                    risk_per_trade, experience, unique_id, account_balance, total_pnl, win_rate,
                    total_trades, winning_trades, losing_trades, average_win, average_loss,
                    profit_factor, max_drawdown, current_drawdown, gross_profit, gross_loss,
                    consecutive_wins, consecutive_losses, sharpe_ratio, max_daily_risk,
                    risk_per_trade_amount, max_drawdown_limit, initial_equity, current_equity,
                    daily_pnl, daily_trades, daily_initial_equity, risk_per_trade_percentage,
                    daily_loss_limit, consecutive_losses_limit, selected_theme,
                    notifications_enabled, auto_refresh, refresh_interval, language, timezone,
                    real_time_data, last_signal, market_status, connection_status,
                    open_positions, trade_history, signals, dashboard_layout,
                    widget_settings, alert_settings, created_at, updated_at, last_activity
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                dashboard_id, user_id, user_email, user_name, prop_firm, account_type, account_size,
                risk_per_trade, experience, unique_id, account_balance, total_pnl, win_rate,
                total_trades, winning_trades, losing_trades, average_win, average_loss,
                profit_factor, max_drawdown, current_drawdown, gross_profit, gross_loss,
                consecutive_wins, consecutive_losses, sharpe_ratio, max_daily_risk,
                risk_per_trade_amount, max_drawdown_limit, initial_equity, current_equity,
                daily_pnl, daily_trades, daily_initial_equity, risk_per_trade_percentage,
                daily_loss_limit, consecutive_losses_limit, selected_theme,
                notifications_enabled, auto_refresh, refresh_interval, language, timezone,
                json.dumps(real_time_data), json.dumps(last_signal), market_status,
                connection_status, json.dumps(open_positions), json.dumps(trade_history),
                json.dumps(signals), json.dumps(dashboard_layout), json.dumps(widget_settings),
                json.dumps(alert_settings), datetime.now(timezone.utc), datetime.now(timezone.utc),
                datetime.now(timezone.utc)
            ))
        
        conn.commit()
        
        # Return success response
        response_data = {
            "success": True,
            "message": "Dashboard data saved successfully",
            "dashboard": {
                "id": dashboard_id if not existing_dashboard else existing_dashboard[0],
                "user_id": user_id,
                "prop_firm": prop_firm,
                "account_type": account_type,
                "account_size": account_size,
                "current_equity": current_equity,
                "total_pnl": total_pnl,
                "total_trades": total_trades,
                "win_rate": win_rate,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
        
        logger.info(f"User dashboard data saved successfully for user: {user_id}")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"User dashboard processing error: {e}")
        return jsonify({
            "success": False,
            "message": f"User dashboard processing failed: {str(e)}"
        }), 500
    finally:
        if 'conn' in locals():
            conn.close()

# =============================================
# 5. GET DASHBOARD DATA ENDPOINT
# =============================================

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    """Get dashboard data for a user"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"success": False, "message": "User ID required"}), 400
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get dashboard data
        cur.execute("""
            SELECT * FROM user_dashboard 
            WHERE user_id = %s 
            ORDER BY updated_at DESC 
            LIMIT 1
        """, (user_id,))
        
        dashboard_data = cur.fetchone()
        
        if not dashboard_data:
            cur.close()
            conn.close()
            return jsonify({"success": False, "message": "Dashboard data not found"}), 404
        
        # Convert to dict and handle JSON fields
        result = dict(dashboard_data)
        for key in ['real_time_data', 'last_signal', 'open_positions', 'trade_history', 'signals', 'dashboard_layout', 'widget_settings', 'alert_settings']:
            if result.get(key):
                try:
                    result[key] = json.loads(result[key]) if isinstance(result[key], str) else result[key]
                except:
                    result[key] = None
        
        cur.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "data": result
        }), 200
        
    except Exception as e:
        logger.error(f"Get dashboard data error: {e}")
        return jsonify({
            "success": False,
            "message": f"Failed to get dashboard data: {str(e)}"
        }), 500

# =============================================
# 6. HEALTH CHECK ENDPOINT
# =============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        conn.close()
        
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "database": "connected"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "database": "disconnected",
            "error": str(e)
        }), 500

# =============================================
# 7. COUPON VALIDATION ENDPOINT
# =============================================

@app.route('/api/validate-coupon', methods=['POST', 'OPTIONS'])
def validate_coupon():
    """Validate coupon code"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No JSON data provided"}), 400
        
        coupon_code = data.get('coupon_code', '').strip().upper()
        original_price = Decimal(str(data.get('original_price', 0)))
        
        if not coupon_code:
            return jsonify({"success": False, "message": "Coupon code required"}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get coupon details
        cur.execute("""
            SELECT discount_type, discount_value, max_uses, used_count, valid_from, valid_until, is_active
            FROM coupons 
            WHERE code = %s
        """, (coupon_code,))
        
        coupon = cur.fetchone()
        
        if not coupon:
            cur.close()
            conn.close()
            return jsonify({
                "success": False,
                "valid": False,
                "message": "Invalid coupon code"
            }), 400
        
        discount_type, discount_value, max_uses, used_count, valid_from, valid_until, is_active = coupon
        
        # Check if coupon is active
        if not is_active:
            cur.close()
            conn.close()
            return jsonify({
                "success": False,
                "valid": False,
                "message": "Coupon is not active"
            }), 400
        
        # Check if coupon has expired
        now = datetime.now(timezone.utc)
        if valid_until and now > valid_until:
            cur.close()
            conn.close()
            return jsonify({
                "success": False,
                "valid": False,
                "message": "Coupon has expired"
            }), 400
        
        # Check if coupon has reached max uses
        if max_uses and used_count >= max_uses:
            cur.close()
            conn.close()
            return jsonify({
                "success": False,
                "valid": False,
                "message": "Coupon usage limit reached"
            }), 400
        
        # Calculate discount
        if discount_type == 'percentage':
            discount_amount = original_price * (discount_value / 100)
        elif discount_type == 'fixed':
            discount_amount = min(discount_value, original_price)
        elif discount_type == 'free':
            discount_amount = original_price
        else:
            discount_amount = 0
        
        final_price = max(0, original_price - discount_amount)
        
        # Return success response
        response_data = {
            "success": True,
            "valid": True,
            "coupon_code": coupon_code,
            "discount_type": discount_type,
            "discount_value": float(discount_value),
            "discount_amount": float(discount_amount),
            "original_price": float(original_price),
            "final_price": float(final_price),
            "message": f"Coupon applied successfully! {discount_type.title()} discount of ${discount_amount:.2f}"
        }
        
        cur.close()
        conn.close()
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Coupon validation error: {e}")
        return jsonify({
            "success": False,
            "message": f"Coupon validation failed: {str(e)}"
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)

"""
Comprehensive API routes for frontend components
Handles all data flow to PostgreSQL database
"""

import os
import json
import psycopg2
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import logging

api_bp = Blueprint('api', __name__)

def get_db_connection():
    """Get PostgreSQL database connection"""
    try:
        # Use the database URL from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise Exception("DATABASE_URL not found in environment variables")
        
        conn = psycopg2.connect(database_url)
        return conn
    except Exception as e:
        logging.error(f"Database connection error: {e}")
        raise e

@api_bp.route('/payments', methods=['POST', 'OPTIONS'])
def handle_payments():
    """Handle payment data from frontend components"""
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        return response, 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        logging.info(f"Payment data received: {data}")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Insert payment data
        payment_query = """
            INSERT INTO payment_details (
                user_id, user_email, user_name, plan_name_payment, original_price,
                discount_amount, final_price, coupon_code, payment_method, transaction_id,
                payment_status, payment_provider, crypto_transaction_hash, crypto_from_address,
                crypto_amount, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
            data.get('coupon_code'),
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
        
        logging.info(f"Payment data saved successfully with ID: {payment_id}")
        return jsonify({
            "success": True,
            "message": "Payment data saved successfully",
            "payment_id": payment_id
        }), 201
        
    except Exception as e:
        logging.error(f"Payment processing error: {e}")
        return jsonify({"error": f"Payment processing failed: {str(e)}"}), 500

@api_bp.route('/questionnaire', methods=['POST', 'OPTIONS'])
def handle_questionnaire():
    """Handle questionnaire data from frontend components"""
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        return response, 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        logging.info(f"Questionnaire data received: {data}")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Insert questionnaire data
        questionnaire_query = """
            INSERT INTO questionnaire_details (
                user_id, user_email, user_name, trades_per_day, trading_session,
                crypto_assets, forex_assets, custom_forex_pairs, has_account,
                account_equity, prop_firm, account_type, account_size, account_number,
                risk_percentage, risk_reward_ratio, trading_experience, risk_tolerance,
                trading_goals, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                trades_per_day = EXCLUDED.trades_per_day,
                trading_session = EXCLUDED.trading_session,
                crypto_assets = EXCLUDED.crypto_assets,
                forex_assets = EXCLUDED.forex_assets,
                custom_forex_pairs = EXCLUDED.custom_forex_pairs,
                has_account = EXCLUDED.has_account,
                account_equity = EXCLUDED.account_equity,
                prop_firm = EXCLUDED.prop_firm,
                account_type = EXCLUDED.account_type,
                account_size = EXCLUDED.account_size,
                account_number = EXCLUDED.account_number,
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
            json.dumps(data.get('custom_forex_pairs', [])),
            data.get('has_account'),
            data.get('account_equity'),
            data.get('prop_firm'),
            data.get('account_type'),
            data.get('account_size'),
            data.get('account_number'),
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
        
        logging.info(f"Questionnaire data saved successfully with ID: {questionnaire_id}")
        return jsonify({
            "success": True,
            "message": "Questionnaire data saved successfully",
            "questionnaire_id": questionnaire_id
        }), 201
        
    except Exception as e:
        logging.error(f"Questionnaire processing error: {e}")
        return jsonify({"error": f"Questionnaire processing failed: {str(e)}"}), 500

@api_bp.route('/dashboard', methods=['GET', 'POST', 'OPTIONS'])
def handle_dashboard():
    """Handle dashboard data from frontend components"""
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        return response, 200
    
    if request.method == 'GET':
        # Get dashboard data
        try:
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({"error": "user_id parameter is required"}), 400
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Get dashboard data
            cur.execute("""
                SELECT * FROM user_dashboard 
                WHERE user_id = %s 
                ORDER BY updated_at DESC 
                LIMIT 1
            """, (user_id,))
            
            dashboard_data = cur.fetchone()
            
            cur.close()
            conn.close()
            
            if dashboard_data:
                return jsonify({
                    "success": True,
                    "data": dashboard_data
                }), 200
            else:
                return jsonify({
                    "success": True,
                    "data": None,
                    "message": "No dashboard data found"
                }), 200
                
        except Exception as e:
            logging.error(f"Dashboard GET error: {e}")
            return jsonify({"error": f"Failed to fetch dashboard data: {str(e)}"}), 500
    
    elif request.method == 'POST':
        # Save dashboard data
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "No JSON data provided"}), 400
            
            logging.info(f"Dashboard data received: {data}")
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Insert/Update dashboard data
            dashboard_query = """
                INSERT INTO user_dashboard (
                    user_id, user_email, user_name, current_equity, initial_equity,
                    total_pnl, win_rate, total_trades, winning_trades, losing_trades,
                    average_win, average_loss, profit_factor, max_drawdown, current_drawdown,
                    gross_profit, gross_loss, consecutive_wins, consecutive_losses,
                    sharpe_ratio, account_balance, daily_pnl, daily_trades,
                    last_activity, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id) DO UPDATE SET
                    current_equity = EXCLUDED.current_equity,
                    total_pnl = EXCLUDED.total_pnl,
                    win_rate = EXCLUDED.win_rate,
                    total_trades = EXCLUDED.total_trades,
                    winning_trades = EXCLUDED.winning_trades,
                    losing_trades = EXCLUDED.losing_trades,
                    average_win = EXCLUDED.average_win,
                    average_loss = EXCLUDED.average_loss,
                    profit_factor = EXCLUDED.profit_factor,
                    max_drawdown = EXCLUDED.max_drawdown,
                    current_drawdown = EXCLUDED.current_drawdown,
                    gross_profit = EXCLUDED.gross_profit,
                    gross_loss = EXCLUDED.gross_loss,
                    consecutive_wins = EXCLUDED.consecutive_wins,
                    consecutive_losses = EXCLUDED.consecutive_losses,
                    sharpe_ratio = EXCLUDED.sharpe_ratio,
                    account_balance = EXCLUDED.account_balance,
                    daily_pnl = EXCLUDED.daily_pnl,
                    daily_trades = EXCLUDED.daily_trades,
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
                data.get('average_win'),
                data.get('average_loss'),
                data.get('profit_factor'),
                data.get('max_drawdown'),
                data.get('current_drawdown'),
                data.get('gross_profit'),
                data.get('gross_loss'),
                data.get('consecutive_wins'),
                data.get('consecutive_losses'),
                data.get('sharpe_ratio'),
                data.get('account_balance'),
                data.get('daily_pnl'),
                data.get('daily_trades'),
                data.get('last_activity', datetime.now().isoformat()),
                data.get('created_at', datetime.now().isoformat()),
                data.get('updated_at', datetime.now().isoformat())
            )
            
            cur.execute(dashboard_query, dashboard_values)
            dashboard_id = cur.fetchone()[0]
            
            conn.commit()
            cur.close()
            conn.close()
            
            logging.info(f"Dashboard data saved successfully with ID: {dashboard_id}")
            return jsonify({
                "success": True,
                "message": "Dashboard data saved successfully",
                "dashboard_id": dashboard_id
            }), 201
            
        except Exception as e:
            logging.error(f"Dashboard POST error: {e}")
            return jsonify({"error": f"Dashboard processing failed: {str(e)}"}), 500

@api_bp.route('/dashboard/equity', methods=['PUT', 'OPTIONS'])
def handle_dashboard_equity():
    """Handle dashboard equity updates"""
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        return response, 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        user_id = data.get('user_id')
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400
        
        logging.info(f"Dashboard equity update received for user {user_id}: {data}")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Update equity data
        equity_query = """
            UPDATE user_dashboard 
            SET current_equity = %s, total_pnl = %s, account_balance = %s,
                last_activity = %s, updated_at = %s
            WHERE user_id = %s
            RETURNING id, current_equity, total_pnl
        """
        
        equity_values = (
            data.get('current_equity'),
            data.get('total_pnl'),
            data.get('account_balance'),
            data.get('last_activity', datetime.now().isoformat()),
            data.get('updated_at', datetime.now().isoformat()),
            user_id
        )
        
        cur.execute(equity_query, equity_values)
        result = cur.fetchone()
        
        if result:
            conn.commit()
            cur.close()
            conn.close()
            
            logging.info(f"Dashboard equity updated successfully for user {user_id}")
            return jsonify({
                "success": True,
                "message": "Dashboard equity updated successfully",
                "current_equity": result[1],
                "total_pnl": result[2]
            }), 200
        else:
            cur.close()
            conn.close()
            return jsonify({"error": "User dashboard not found"}), 404
            
    except Exception as e:
        logging.error(f"Dashboard equity update error: {e}")
        return jsonify({"error": f"Dashboard equity update failed: {str(e)}"}), 500

@api_bp.route('/health', methods=['GET'])
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

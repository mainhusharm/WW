#!/usr/bin/env python3
"""
Enhanced Data Capture System
Captures data from payment-enhanced, questionnaire, and dashboard endpoints
Stores all data in the same database as signup-enhanced (trading_bots.db)
WITHOUT modifying the existing signup-enhanced functionality
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

# Use the same database as signup-enhanced
DATABASE_PATH = "trading_bots.db"

def get_db_connection():
    """Get database connection - same as signup-enhanced"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def create_enhanced_data_tables():
    """Create additional tables for payment, questionnaire, and dashboard data"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Payment data table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS payment_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            user_email TEXT NOT NULL,
            user_name TEXT,
            plan_name TEXT,
            original_price DECIMAL(10,2),
            discount_amount DECIMAL(10,2),
            final_price DECIMAL(10,2),
            coupon_code TEXT,
            payment_method TEXT,
            transaction_id TEXT,
            payment_status TEXT,
            payment_processor TEXT,
            crypto_transaction_hash TEXT,
            crypto_from_address TEXT,
            crypto_amount TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            -- FOREIGN KEY (user_email) REFERENCES users (email)
        )
    """)
    
    # Questionnaire data table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS questionnaire_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            user_email TEXT NOT NULL,
            user_name TEXT,
            trades_per_day TEXT,
            trading_session TEXT,
            crypto_assets TEXT, -- JSON array
            forex_assets TEXT, -- JSON array
            custom_forex_pairs TEXT, -- JSON array
            has_account TEXT,
            account_equity DECIMAL(12,2),
            prop_firm TEXT,
            account_type TEXT,
            account_size DECIMAL(12,2),
            risk_percentage DECIMAL(5,2),
            risk_reward_ratio TEXT,
            account_screenshot TEXT, -- base64 encoded
            screenshot_filename TEXT,
            screenshot_size INTEGER,
            screenshot_type TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            -- FOREIGN KEY (user_email) REFERENCES users (email)
        )
    """)
    
    # Dashboard data table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS dashboard_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            user_email TEXT NOT NULL,
            user_name TEXT,
            
            -- Trading State Data
            initial_equity DECIMAL(12,2),
            current_equity DECIMAL(12,2),
            total_pnl DECIMAL(12,2),
            win_rate DECIMAL(5,2),
            total_trades INTEGER,
            winning_trades INTEGER,
            losing_trades INTEGER,
            average_win DECIMAL(10,2),
            average_loss DECIMAL(10,2),
            profit_factor DECIMAL(10,4),
            max_drawdown DECIMAL(10,2),
            current_drawdown DECIMAL(10,2),
            gross_profit DECIMAL(12,2),
            gross_loss DECIMAL(12,2),
            consecutive_wins INTEGER,
            consecutive_losses INTEGER,
            
            -- Risk Settings
            risk_per_trade DECIMAL(5,2),
            daily_loss_limit DECIMAL(5,2),
            consecutive_losses_limit INTEGER,
            
            -- Account Balance Info
            account_balance DECIMAL(12,2),
            account_equity_dash DECIMAL(12,2),
            
            -- Theme and UI
            theme TEXT DEFAULT 'dark',
            
            -- Complete dashboard state (JSON)
            dashboard_state TEXT, -- JSON
            trading_state TEXT, -- JSON
            
            ip_address TEXT,
            user_agent TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            -- FOREIGN KEY (user_email) REFERENCES users (email)
        )
    """)
    
    # Trading activity audit log
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trading_activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            activity_type TEXT NOT NULL, -- 'trade', 'signal', 'risk_adjustment'
            activity_data TEXT, -- JSON
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT,
            -- FOREIGN KEY (user_email) REFERENCES users (email)
        )
    """)
    
    # Data capture audit trail
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS data_capture_audit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            capture_type TEXT NOT NULL, -- 'payment', 'questionnaire', 'dashboard'
            data_snapshot TEXT, -- JSON snapshot of captured data
            source_endpoint TEXT, -- which endpoint the data came from
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT,
            status TEXT DEFAULT 'success', -- 'success', 'error', 'partial'
            error_details TEXT,
            -- FOREIGN KEY (user_email) REFERENCES users (email)
        )
    """)
    
    conn.commit()
    conn.close()
    logger.info("✅ Enhanced data capture tables created successfully")

# Initialize tables on import
create_enhanced_data_tables()

@app.route('/api/data-capture/payment', methods=['POST', 'OPTIONS'])
def capture_payment_data():
    """Capture payment data from payment-enhanced endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_email = data.get('user_email') or data.get('email')
        if not user_email:
            return jsonify({"error": "User email required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user ID if exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (user_email,))
        user_row = cursor.fetchone()
        user_id = user_row['id'] if user_row else None
        
        # Extract payment data
        payment_data = {
            'user_id': user_id,
            'user_email': user_email,
            'user_name': data.get('user_name', ''),
            'plan_name': data.get('plan_name_payment', ''),
            'original_price': data.get('original_price', 0),
            'discount_amount': data.get('discount_amount', 0),
            'final_price': data.get('final_price', 0),
            'coupon_code': data.get('coupon_code'),
            'payment_method': data.get('payment_method', ''),
            'transaction_id': data.get('transaction_id', ''),
            'payment_status': data.get('payment_status', 'pending'),
            'payment_processor': data.get('payment_processor', ''),
            'crypto_transaction_hash': data.get('crypto_transaction_hash', ''),
            'crypto_from_address': data.get('crypto_from_address', ''),
            'crypto_amount': data.get('crypto_amount', '0'),
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', ''),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Insert payment data
        cursor.execute("""
            INSERT INTO payment_data (
                user_id, user_email, user_name, plan_name, original_price, 
                discount_amount, final_price, coupon_code, payment_method, 
                transaction_id, payment_status, payment_processor, 
                crypto_transaction_hash, crypto_from_address, crypto_amount,
                ip_address, user_agent, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            payment_data['user_id'], payment_data['user_email'], payment_data['user_name'],
            payment_data['plan_name'], payment_data['original_price'], payment_data['discount_amount'],
            payment_data['final_price'], payment_data['coupon_code'], payment_data['payment_method'],
            payment_data['transaction_id'], payment_data['payment_status'], payment_data['payment_processor'],
            payment_data['crypto_transaction_hash'], payment_data['crypto_from_address'], payment_data['crypto_amount'],
            payment_data['ip_address'], payment_data['user_agent'], payment_data['created_at'], payment_data['updated_at']
        ))
        
        payment_id = cursor.lastrowid
        
        # Audit trail
        cursor.execute("""
            INSERT INTO data_capture_audit (
                user_email, capture_type, data_snapshot, source_endpoint, 
                timestamp, ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            user_email, 'payment', json.dumps(data), '/api/data-capture/payment',
            datetime.utcnow().isoformat(), request.remote_addr, request.headers.get('User-Agent', '')
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"✅ Payment data captured for {user_email}")
        return jsonify({
            "success": True,
            "payment_id": payment_id,
            "message": "Payment data captured successfully"
        }), 201
        
    except Exception as e:
        logger.error(f"❌ Error capturing payment data: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/data-capture/questionnaire', methods=['POST', 'OPTIONS'])
def capture_questionnaire_data():
    """Capture questionnaire data from questionnaire endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_email = data.get('user_email') or data.get('email')
        if not user_email:
            return jsonify({"error": "User email required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user ID if exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (user_email,))
        user_row = cursor.fetchone()
        user_id = user_row['id'] if user_row else None
        
        # Extract questionnaire data
        questionnaire_data = {
            'user_id': user_id,
            'user_email': user_email,
            'user_name': data.get('user_name', ''),
            'trades_per_day': data.get('tradesPerDay', ''),
            'trading_session': data.get('tradingSession', ''),
            'crypto_assets': json.dumps(data.get('cryptoAssets', [])),
            'forex_assets': json.dumps(data.get('forexAssets', [])),
            'custom_forex_pairs': json.dumps(data.get('customForexPairs', [])),
            'has_account': data.get('hasAccount', 'no'),
            'account_equity': data.get('accountEquity', 0),
            'prop_firm': data.get('propFirm', ''),
            'account_type': data.get('accountType', ''),
            'account_size': data.get('accountSize', 0),
            'risk_percentage': data.get('riskPercentage', 1),
            'risk_reward_ratio': data.get('riskRewardRatio', '1:2'),
            'account_screenshot': data.get('accountScreenshot', ''),
            'screenshot_filename': data.get('screenshot_filename', ''),
            'screenshot_size': data.get('screenshot_size', 0),
            'screenshot_type': data.get('screenshot_type', ''),
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', ''),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Insert questionnaire data
        cursor.execute("""
            INSERT INTO questionnaire_data (
                user_id, user_email, user_name, trades_per_day, trading_session,
                crypto_assets, forex_assets, custom_forex_pairs, has_account,
                account_equity, prop_firm, account_type, account_size,
                risk_percentage, risk_reward_ratio, account_screenshot,
                screenshot_filename, screenshot_size, screenshot_type,
                ip_address, user_agent, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            questionnaire_data['user_id'], questionnaire_data['user_email'], questionnaire_data['user_name'],
            questionnaire_data['trades_per_day'], questionnaire_data['trading_session'],
            questionnaire_data['crypto_assets'], questionnaire_data['forex_assets'], questionnaire_data['custom_forex_pairs'],
            questionnaire_data['has_account'], questionnaire_data['account_equity'], questionnaire_data['prop_firm'],
            questionnaire_data['account_type'], questionnaire_data['account_size'], questionnaire_data['risk_percentage'],
            questionnaire_data['risk_reward_ratio'], questionnaire_data['account_screenshot'],
            questionnaire_data['screenshot_filename'], questionnaire_data['screenshot_size'], questionnaire_data['screenshot_type'],
            questionnaire_data['ip_address'], questionnaire_data['user_agent'], questionnaire_data['created_at'], questionnaire_data['updated_at']
        ))
        
        questionnaire_id = cursor.lastrowid
        
        # Audit trail
        cursor.execute("""
            INSERT INTO data_capture_audit (
                user_email, capture_type, data_snapshot, source_endpoint, 
                timestamp, ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            user_email, 'questionnaire', json.dumps(data), '/api/data-capture/questionnaire',
            datetime.utcnow().isoformat(), request.remote_addr, request.headers.get('User-Agent', '')
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"✅ Questionnaire data captured for {user_email}")
        return jsonify({
            "success": True,
            "questionnaire_id": questionnaire_id,
            "message": "Questionnaire data captured successfully"
        }), 201
        
    except Exception as e:
        logger.error(f"❌ Error capturing questionnaire data: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/data-capture/dashboard', methods=['POST', 'OPTIONS'])
def capture_dashboard_data():
    """Capture dashboard data from dashboard endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_email = data.get('user_email') or data.get('email')
        if not user_email:
            return jsonify({"error": "User email required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user ID if exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (user_email,))
        user_row = cursor.fetchone()
        user_id = user_row['id'] if user_row else None
        
        # Extract dashboard/trading state data
        trading_state = data.get('tradingState', {})
        dashboard_data_obj = data.get('dashboardData', {})
        performance = trading_state.get('performanceMetrics', {})
        risk_settings = trading_state.get('riskSettings', {})
        
        # Prepare dashboard data for insertion
        dashboard_data = {
            'user_id': user_id,
            'user_email': user_email,
            'user_name': data.get('user_name', ''),
            'initial_equity': trading_state.get('initialEquity', 0),
            'current_equity': trading_state.get('currentEquity', 0),
            'total_pnl': performance.get('totalPnl', 0),
            'win_rate': performance.get('winRate', 0),
            'total_trades': performance.get('totalTrades', 0),
            'winning_trades': performance.get('winningTrades', 0),
            'losing_trades': performance.get('losingTrades', 0),
            'average_win': performance.get('averageWin', 0),
            'average_loss': performance.get('averageLoss', 0),
            'profit_factor': performance.get('profitFactor', 0),
            'max_drawdown': performance.get('maxDrawdown', 0),
            'current_drawdown': performance.get('currentDrawdown', 0),
            'gross_profit': performance.get('grossProfit', 0),
            'gross_loss': performance.get('grossLoss', 0),
            'consecutive_wins': performance.get('consecutiveWins', 0),
            'consecutive_losses': performance.get('consecutiveLosses', 0),
            'risk_per_trade': risk_settings.get('riskPerTrade', 1),
            'daily_loss_limit': risk_settings.get('dailyLossLimit', 5),
            'consecutive_losses_limit': risk_settings.get('consecutiveLossesLimit', 3),
            'account_balance': dashboard_data_obj.get('account', {}).get('balance', 0),
            'account_equity_dash': dashboard_data_obj.get('account', {}).get('equity', 0),
            'theme': data.get('theme', 'dark'),
            'dashboard_state': json.dumps(dashboard_data_obj),
            'trading_state': json.dumps(trading_state),
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', ''),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Check if dashboard data already exists for this user
        cursor.execute("SELECT id FROM dashboard_data WHERE user_email = ?", (user_email,))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing record
            cursor.execute("""
                UPDATE dashboard_data SET
                    user_id = ?, user_name = ?, initial_equity = ?, current_equity = ?,
                    total_pnl = ?, win_rate = ?, total_trades = ?, winning_trades = ?,
                    losing_trades = ?, average_win = ?, average_loss = ?, profit_factor = ?,
                    max_drawdown = ?, current_drawdown = ?, gross_profit = ?, gross_loss = ?,
                    consecutive_wins = ?, consecutive_losses = ?, risk_per_trade = ?,
                    daily_loss_limit = ?, consecutive_losses_limit = ?, account_balance = ?,
                    account_equity_dash = ?, theme = ?, dashboard_state = ?, trading_state = ?,
                    ip_address = ?, user_agent = ?, updated_at = ?
                WHERE user_email = ?
            """, (
                dashboard_data['user_id'], dashboard_data['user_name'], dashboard_data['initial_equity'],
                dashboard_data['current_equity'], dashboard_data['total_pnl'], dashboard_data['win_rate'],
                dashboard_data['total_trades'], dashboard_data['winning_trades'], dashboard_data['losing_trades'],
                dashboard_data['average_win'], dashboard_data['average_loss'], dashboard_data['profit_factor'],
                dashboard_data['max_drawdown'], dashboard_data['current_drawdown'], dashboard_data['gross_profit'],
                dashboard_data['gross_loss'], dashboard_data['consecutive_wins'], dashboard_data['consecutive_losses'],
                dashboard_data['risk_per_trade'], dashboard_data['daily_loss_limit'], dashboard_data['consecutive_losses_limit'],
                dashboard_data['account_balance'], dashboard_data['account_equity_dash'], dashboard_data['theme'],
                dashboard_data['dashboard_state'], dashboard_data['trading_state'], dashboard_data['ip_address'],
                dashboard_data['user_agent'], dashboard_data['updated_at'], user_email
            ))
            dashboard_id = existing['id']
        else:
            # Insert new record
            cursor.execute("""
                INSERT INTO dashboard_data (
                    user_id, user_email, user_name, initial_equity, current_equity,
                    total_pnl, win_rate, total_trades, winning_trades, losing_trades,
                    average_win, average_loss, profit_factor, max_drawdown, current_drawdown,
                    gross_profit, gross_loss, consecutive_wins, consecutive_losses,
                    risk_per_trade, daily_loss_limit, consecutive_losses_limit,
                    account_balance, account_equity_dash, theme, dashboard_state, trading_state,
                    ip_address, user_agent, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                dashboard_data['user_id'], dashboard_data['user_email'], dashboard_data['user_name'],
                dashboard_data['initial_equity'], dashboard_data['current_equity'], dashboard_data['total_pnl'],
                dashboard_data['win_rate'], dashboard_data['total_trades'], dashboard_data['winning_trades'],
                dashboard_data['losing_trades'], dashboard_data['average_win'], dashboard_data['average_loss'],
                dashboard_data['profit_factor'], dashboard_data['max_drawdown'], dashboard_data['current_drawdown'],
                dashboard_data['gross_profit'], dashboard_data['gross_loss'], dashboard_data['consecutive_wins'],
                dashboard_data['consecutive_losses'], dashboard_data['risk_per_trade'], dashboard_data['daily_loss_limit'],
                dashboard_data['consecutive_losses_limit'], dashboard_data['account_balance'], dashboard_data['account_equity_dash'],
                dashboard_data['theme'], dashboard_data['dashboard_state'], dashboard_data['trading_state'],
                dashboard_data['ip_address'], dashboard_data['user_agent'], dashboard_data['created_at'], dashboard_data['updated_at']
            ))
            dashboard_id = cursor.lastrowid
        
        # Audit trail
        cursor.execute("""
            INSERT INTO data_capture_audit (
                user_email, capture_type, data_snapshot, source_endpoint, 
                timestamp, ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            user_email, 'dashboard', json.dumps(data), '/api/data-capture/dashboard',
            datetime.utcnow().isoformat(), request.remote_addr, request.headers.get('User-Agent', '')
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"✅ Dashboard data captured for {user_email}")
        return jsonify({
            "success": True,
            "dashboard_id": dashboard_id,
            "message": "Dashboard data captured successfully"
        }), 201
        
    except Exception as e:
        logger.error(f"❌ Error capturing dashboard data: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/data-capture/activity', methods=['POST', 'OPTIONS'])
def capture_trading_activity():
    """Capture real-time trading activity"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_email = data.get('user_email') or data.get('email')
        if not user_email:
            return jsonify({"error": "User email required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert activity log
        cursor.execute("""
            INSERT INTO trading_activity_log (
                user_email, activity_type, activity_data, timestamp, ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            user_email,
            data.get('activity_type', 'unknown'),
            json.dumps(data.get('activity_data', {})),
            datetime.utcnow().isoformat(),
            request.remote_addr,
            request.headers.get('User-Agent', '')
        ))
        
        activity_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "activity_id": activity_id
        }), 201
        
    except Exception as e:
        logger.error(f"❌ Error capturing activity: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/data-capture/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Enhanced Data Capture System",
        "database": DATABASE_PATH,
        "timestamp": datetime.utcnow().isoformat()
    }), 200

@app.route('/api/data-capture/stats/<user_email>', methods=['GET'])
def get_user_data_stats(user_email):
    """Get comprehensive data statistics for a user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get counts of captured data
        cursor.execute("SELECT COUNT(*) as count FROM payment_data WHERE user_email = ?", (user_email,))
        payment_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM questionnaire_data WHERE user_email = ?", (user_email,))
        questionnaire_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM dashboard_data WHERE user_email = ?", (user_email,))
        dashboard_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM trading_activity_log WHERE user_email = ?", (user_email,))
        activity_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM data_capture_audit WHERE user_email = ?", (user_email,))
        audit_count = cursor.fetchone()['count']
        
        # Get latest data timestamps
        cursor.execute("SELECT MAX(created_at) as latest FROM payment_data WHERE user_email = ?", (user_email,))
        latest_payment = cursor.fetchone()['latest']
        
        cursor.execute("SELECT MAX(created_at) as latest FROM questionnaire_data WHERE user_email = ?", (user_email,))
        latest_questionnaire = cursor.fetchone()['latest']
        
        cursor.execute("SELECT MAX(updated_at) as latest FROM dashboard_data WHERE user_email = ?", (user_email,))
        latest_dashboard = cursor.fetchone()['latest']
        
        conn.close()
        
        return jsonify({
            "user_email": user_email,
            "data_counts": {
                "payments": payment_count,
                "questionnaires": questionnaire_count,
                "dashboard_updates": dashboard_count,
                "activities": activity_count,
                "audit_records": audit_count
            },
            "latest_timestamps": {
                "payment": latest_payment,
                "questionnaire": latest_questionnaire,
                "dashboard": latest_dashboard
            },
            "total_data_points": payment_count + questionnaire_count + dashboard_count + activity_count,
            "timestamp": datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting user stats: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Enhanced Data Capture System")
    print(f"📊 Database: {DATABASE_PATH}")
    print("🔄 Tables initialized")
    app.run(host='0.0.0.0', port=5003, debug=True)

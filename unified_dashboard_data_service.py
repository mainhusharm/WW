#!/usr/bin/env python3
"""
Unified Dashboard Data Service
Provides dashboard data from the unified trading_bots.db database
Replaces customer-service-dashboard database dependencies
"""

import sqlite3
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Use the unified database
DATABASE_PATH = "trading_bots.db"

def get_db_connection():
    """Get database connection to unified trading_bots.db"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/dashboard/user/<user_email>', methods=['GET', 'OPTIONS'])
def get_unified_dashboard_data(user_email):
    """Get comprehensive dashboard data from unified database"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        logger.info(f"📊 Getting dashboard data for: {user_email}")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user data from signup-enhanced
        cursor.execute("SELECT * FROM users WHERE email = ?", (user_email,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get payment data from enhanced capture
        cursor.execute("""
            SELECT * FROM payment_capture 
            WHERE user_email = ? 
            ORDER BY captured_at DESC LIMIT 1
        """, (user_email,))
        payment = cursor.fetchone()
        
        # Get questionnaire data from enhanced capture
        cursor.execute("""
            SELECT * FROM questionnaire_capture 
            WHERE user_email = ? 
            ORDER BY captured_at DESC LIMIT 1
        """, (user_email,))
        questionnaire = cursor.fetchone()
        
        # Get dashboard data from enhanced capture
        cursor.execute("""
            SELECT * FROM dashboard_capture 
            WHERE user_email = ? 
            ORDER BY captured_at DESC LIMIT 1
        """, (user_email,))
        dashboard = cursor.fetchone()
        
        conn.close()
        
        # Build unified dashboard response
        dashboard_data = {
            "userProfile": {
                "email": user['email'],
                "username": user['username'],
                "planType": user['plan_type'],
                "createdAt": user['created_at'],
                "propFirm": questionnaire['prop_firm'] if questionnaire else 'Not Set',
                "accountType": 'Not Set',
                "accountSize": questionnaire['account_size'] if questionnaire else 'Not Set',
                "experience": 'Not Set',
                "tradesPerDay": questionnaire['trades_per_day'] if questionnaire else 'Not Set',
                "riskPerTrade": f"{questionnaire['risk_percentage']}%" if questionnaire else '1.0%',
                "riskReward": '1:2.5',
                "session": 'Not Set'
            },
            "performance": {
                "accountBalance": dashboard['current_equity'] if dashboard else 0,
                "currentEquity": dashboard['current_equity'] if dashboard else 0,
                "totalPnL": dashboard['total_pnl'] if dashboard else 0,
                "winRate": dashboard['win_rate'] if dashboard else 0,
                "totalTrades": dashboard['total_trades'] if dashboard else 0
            },
            "paymentInfo": {
                "planName": payment['plan_name'] if payment else 'No Payment',
                "finalPrice": payment['final_price'] if payment else 0,
                "paymentMethod": payment['payment_method'] if payment else 'N/A',
                "paymentStatus": payment['payment_status'] if payment else 'pending',
                "transactionId": payment['transaction_id'] if payment else 'N/A'
            },
            "tradingSetup": {
                "propFirm": questionnaire['prop_firm'] if questionnaire else 'Not Set',
                "accountSize": questionnaire['account_size'] if questionnaire else 0,
                "riskPercentage": questionnaire['risk_percentage'] if questionnaire else 1.0,
                "tradesPerDay": questionnaire['trades_per_day'] if questionnaire else 'Not Set'
            },
            "propFirmRules": {},
            "riskProtocol": {},
            "assets": {"crypto": [], "forex": []},
            "dataSource": "unified_trading_bots_db",
            "lastUpdated": datetime.utcnow().isoformat()
        }
        
        # Add questionnaire assets if available
        if questionnaire and questionnaire['data_json']:
            try:
                questionnaire_json = json.loads(questionnaire['data_json'])
                dashboard_data["assets"] = {
                    "crypto": questionnaire_json.get('cryptoAssets', []),
                    "forex": questionnaire_json.get('forexAssets', [])
                }
            except:
                pass
        
        # Add dashboard trading state if available
        if dashboard and dashboard['data_json']:
            try:
                dashboard_json = json.loads(dashboard['data_json'])
                if 'tradingState' in dashboard_json:
                    trading_state = dashboard_json['tradingState']
                    dashboard_data["tradingState"] = trading_state
                    
                    # Update performance with detailed metrics
                    if 'performanceMetrics' in trading_state:
                        metrics = trading_state['performanceMetrics']
                        dashboard_data["performance"].update({
                            "winningTrades": metrics.get('winningTrades', 0),
                            "losingTrades": metrics.get('losingTrades', 0),
                            "averageWin": metrics.get('averageWin', 0),
                            "averageLoss": metrics.get('averageLoss', 0),
                            "profitFactor": metrics.get('profitFactor', 0),
                            "maxDrawdown": metrics.get('maxDrawdown', 0),
                            "currentDrawdown": metrics.get('currentDrawdown', 0),
                            "grossProfit": metrics.get('grossProfit', 0),
                            "grossLoss": metrics.get('grossLoss', 0),
                            "consecutiveWins": metrics.get('consecutiveWins', 0),
                            "consecutiveLosses": metrics.get('consecutiveLosses', 0)
                        })
            except:
                pass
        
        logger.info(f"✅ Dashboard data retrieved for {user_email}")
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting dashboard data for {user_email}: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/dashboard/users', methods=['GET', 'OPTIONS'])
def get_all_users_dashboard():
    """Get dashboard data for all users"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all users with their latest data
        cursor.execute("""
            SELECT 
                u.email,
                u.username,
                u.plan_type,
                u.created_at,
                p.plan_name,
                p.final_price,
                p.payment_status,
                q.prop_firm,
                q.account_size,
                q.risk_percentage,
                d.current_equity,
                d.total_pnl,
                d.win_rate,
                d.total_trades
            FROM users u
            LEFT JOIN (
                SELECT user_email, plan_name, final_price, payment_status,
                       ROW_NUMBER() OVER (PARTITION BY user_email ORDER BY captured_at DESC) as rn
                FROM payment_capture
            ) p ON u.email = p.user_email AND p.rn = 1
            LEFT JOIN (
                SELECT user_email, prop_firm, account_size, risk_percentage,
                       ROW_NUMBER() OVER (PARTITION BY user_email ORDER BY captured_at DESC) as rn
                FROM questionnaire_capture
            ) q ON u.email = q.user_email AND q.rn = 1
            LEFT JOIN (
                SELECT user_email, current_equity, total_pnl, win_rate, total_trades,
                       ROW_NUMBER() OVER (PARTITION BY user_email ORDER BY captured_at DESC) as rn
                FROM dashboard_capture
            ) d ON u.email = d.user_email AND d.rn = 1
            ORDER BY u.created_at DESC
        """)
        
        users = cursor.fetchall()
        conn.close()
        
        users_data = []
        for user in users:
            user_data = {
                "email": user[0],
                "username": user[1],
                "planType": user[2],
                "createdAt": user[3],
                "paymentInfo": {
                    "planName": user[4] or 'No Payment',
                    "finalPrice": user[5] or 0,
                    "paymentStatus": user[6] or 'pending'
                },
                "tradingSetup": {
                    "propFirm": user[7] or 'Not Set',
                    "accountSize": user[8] or 0,
                    "riskPercentage": user[9] or 1.0
                },
                "performance": {
                    "currentEquity": user[10] or 0,
                    "totalPnL": user[11] or 0,
                    "winRate": user[12] or 0,
                    "totalTrades": user[13] or 0
                }
            }
            users_data.append(user_data)
        
        return jsonify({
            "success": True,
            "users": users_data,
            "count": len(users_data),
            "dataSource": "unified_trading_bots_db"
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting all users dashboard data: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/dashboard/stats', methods=['GET', 'OPTIONS'])
def get_dashboard_stats():
    """Get overall dashboard statistics"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get overall statistics
        cursor.execute("SELECT COUNT(*) FROM users")
        total_users = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM payment_capture")
        total_payments = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM questionnaire_capture")
        total_questionnaires = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM dashboard_capture")
        total_dashboard_updates = cursor.fetchone()[0]
        
        # Get payment statistics
        cursor.execute("SELECT SUM(final_price) FROM payment_capture WHERE payment_status = 'completed'")
        total_revenue = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT COUNT(DISTINCT user_email) FROM payment_capture WHERE payment_status = 'completed'")
        paid_users = cursor.fetchone()[0]
        
        # Get trading statistics
        cursor.execute("SELECT AVG(current_equity), AVG(total_pnl), AVG(win_rate) FROM dashboard_capture")
        trading_stats = cursor.fetchone()
        
        conn.close()
        
        stats = {
            "totalUsers": total_users,
            "totalPayments": total_payments,
            "totalQuestionnaires": total_questionnaires,
            "totalDashboardUpdates": total_dashboard_updates,
            "totalRevenue": float(total_revenue),
            "paidUsers": paid_users,
            "averageEquity": float(trading_stats[0]) if trading_stats[0] else 0,
            "averagePnL": float(trading_stats[1]) if trading_stats[1] else 0,
            "averageWinRate": float(trading_stats[2]) if trading_stats[2] else 0,
            "dataSource": "unified_trading_bots_db",
            "lastUpdated": datetime.utcnow().isoformat()
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting dashboard stats: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/dashboard/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Unified Dashboard Data Service",
        "database": DATABASE_PATH,
        "timestamp": datetime.utcnow().isoformat()
    }), 200

if __name__ == '__main__':
    print("🚀 Unified Dashboard Data Service")
    print(f"📊 Database: {DATABASE_PATH}")
    print("🔄 Using unified trading_bots.db for all dashboard data")
    app.run(host='0.0.0.0', port=5004, debug=True)

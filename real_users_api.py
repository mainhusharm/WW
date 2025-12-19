#!/usr/bin/env python3
"""
Real Users API - Fetches actual users from trading_bots.db
This API provides real-time access to user data from the database
"""

from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

DATABASE = 'trading_bots.db'

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok", 
        "message": "Real Users API is running",
        "database": DATABASE,
        "timestamp": datetime.now().isoformat()
    }), 200

@app.route('/api/real-users', methods=['GET'])
def get_real_users():
    """Get all real users from the database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch all users from the database
        cursor.execute("""
            SELECT id, username, email, created_at, plan_type, unique_id, normalized_email
            FROM users 
            ORDER BY created_at DESC
        """)
        users = cursor.fetchall()

        # Transform users to customer format
        customers_data = []
        for user_row in users:
            user = dict(user_row)
            
            # Check if risk_plan table exists and fetch questionnaire data
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='risk_plan'")
            risk_plan_exists = cursor.fetchone() is not None
            
            questionnaire_data = {}
            if risk_plan_exists:
                cursor.execute("""
                    SELECT prop_firm, account_type, account_size, risk_percentage, has_account, 
                           account_equity, trading_session, crypto_assets, forex_assets 
                    FROM risk_plan 
                    WHERE user_id = ?
                """, (user['id'],))
                risk_plan_row = cursor.fetchone()
                if risk_plan_row:
                    risk_plan = dict(risk_plan_row)
                    # Parse JSON fields if they exist
                    if risk_plan.get('crypto_assets'):
                        try:
                            risk_plan['crypto_assets'] = json.loads(risk_plan['crypto_assets'])
                        except:
                            pass
                    if risk_plan.get('forex_assets'):
                        try:
                            risk_plan['forex_assets'] = json.loads(risk_plan['forex_assets'])
                        except:
                            pass
                    questionnaire_data = risk_plan

            # Determine payment status based on plan type
            payment_status = 'completed' if user['plan_type'] in ['premium', 'Basic'] else 'pending'
            payment_amount = 199.99 if user['plan_type'] == 'premium' else (99.99 if user['plan_type'] == 'Basic' else 0)
            
            customer_data = {
                'id': user['id'],
                'customer_id': user['id'],
                'unique_id': user['unique_id'] or f"CUS-{user['id']:03d}",
                'email': user['email'],
                'name': user['username'],
                'phone': '',
                'membership_tier': user['plan_type'] or 'free',
                'payment_status': payment_status,
                'payment_method': 'credit_card' if payment_status == 'completed' else 'unknown',
                'payment_amount': payment_amount,
                'payment_date': user['created_at'][:10] if payment_status == 'completed' else '',
                'join_date': user['created_at'],
                'last_active': user['created_at'],
                'status': 'active',
                'questionnaire_data': questionnaire_data,
                'account_type': questionnaire_data.get('account_type', 'standard'),
                'prop_firm': questionnaire_data.get('prop_firm', 'unknown'),
                'account_size': questionnaire_data.get('account_size', 0),
                'trading_experience': 'intermediate' if user['plan_type'] == 'premium' else 'beginner',
                'risk_tolerance': 'medium' if user['plan_type'] == 'premium' else 'low',
                'trading_goals': 'income generation' if user['plan_type'] == 'premium' else 'learning',
                'ip_address': '192.168.1.100',
                'signup_source': 'website',
                'referral_code': '',
                'data_capture_complete': bool(questionnaire_data),
                'admin_verified': user['plan_type'] in ['premium', 'Basic'],
                'admin_notes': f'Real user from database - {user["plan_type"]} plan',
                'created_at': user['created_at'],
                'updated_at': user['created_at']
            }
            customers_data.append(customer_data)

        conn.close()
        
        print(f"📊 Fetched {len(customers_data)} real users from database")
        return jsonify({
            "success": True,
            "count": len(customers_data),
            "users": customers_data,
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching real users: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"Failed to fetch users: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/real-users/count', methods=['GET'])
def get_user_count():
    """Get count of users in database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM users")
        result = cursor.fetchone()
        conn.close()
        
        return jsonify({
            "success": True,
            "count": result['count'],
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to get user count: {str(e)}"
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Real Users API...")
    print("📊 Available endpoints:")
    print("   GET /api/real-users - Get all real users from database")
    print("   GET /api/real-users/count - Get user count")
    print("   GET /health - Health check")
    print("============================================================")
    app.run(host='0.0.0.0', port=5005, debug=True)

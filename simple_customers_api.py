#!/usr/bin/env python3
"""
Simple customers API that directly reads from SQLite database
"""

import sqlite3
import json
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def get_customers_from_db():
    """Get all customers from the SQLite database"""
    try:
        print("🔍 Connecting to database...")
        conn = sqlite3.connect('trading_bots.db')
        cursor = conn.cursor()
        
        # Get all users
        print("📊 Fetching users from database...")
        cursor.execute("""
            SELECT id, username, email, created_at, plan_type, unique_id, normalized_email
            FROM users
            ORDER BY created_at DESC
        """)
        
        users = cursor.fetchall()
        print(f"✅ Found {len(users)} users in database")
        customers_data = []
        
        for user in users:
            user_id, username, email, created_at, plan_type, unique_id, normalized_email = user
            print(f"👤 Processing user: {username} (ID: {user_id})")
            
            # Check if risk_plans table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='risk_plans'")
            risk_plans_exists = cursor.fetchone() is not None
            
            questionnaire_data = {}
            
            if risk_plans_exists:
                # Get risk plan data if exists
                cursor.execute("""
                    SELECT prop_firm, account_type, account_size, risk_percentage, 
                           has_account, account_equity, trading_session, crypto_assets, forex_assets
                    FROM risk_plans 
                    WHERE user_id = ?
                """, (user_id,))
                
                risk_plan = cursor.fetchone()
                
                if risk_plan:
                    prop_firm, account_type, account_size, risk_percentage, has_account, account_equity, trading_session, crypto_assets, forex_assets = risk_plan
                    questionnaire_data = {
                        'prop_firm': prop_firm or 'unknown',
                        'account_type': account_type or 'unknown',
                        'account_size': account_size or 0,
                        'risk_percentage': risk_percentage or 0,
                        'has_account': has_account or False,
                        'account_equity': account_equity or 0,
                        'trading_session': trading_session or 'unknown',
                        'crypto_assets': json.loads(crypto_assets) if crypto_assets else [],
                        'forex_assets': json.loads(forex_assets) if forex_assets else []
                    }
                    print(f"📋 Found questionnaire data for {username}")
                else:
                    print(f"⚠️ No questionnaire data for {username}")
            else:
                print(f"⚠️ risk_plans table doesn't exist, skipping questionnaire data for {username}")
            
            customer_data = {
                'id': user_id,
                'unique_id': unique_id or f'CUS-{user_id}',
                'username': username,
                'email': email,
                'plan_type': plan_type or 'free',
                'created_at': created_at.isoformat() if created_at else None,
                'last_login': None,  # Not available in current schema
                'questionnaire_data': questionnaire_data
            }
            
            customers_data.append(customer_data)
        
        conn.close()
        print(f"🎉 Successfully processed {len(customers_data)} customers")
        return customers_data
        
    except Exception as e:
        print(f"❌ Error fetching customers: {e}")
        import traceback
        traceback.print_exc()
        return []

@app.route('/api/customers', methods=['GET'])
def get_customers():
    """Get all customers endpoint"""
    try:
        customers = get_customers_from_db()
        print(f"✅ Returning {len(customers)} customers")
        return jsonify(customers), 200
    except Exception as e:
        print(f"❌ Error in get_customers: {e}")
        return jsonify({"error": f"Failed to fetch customers: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "Simple customers API is running"}), 200

if __name__ == '__main__':
    print("🚀 Starting Simple Customers API...")
    print("📊 Available endpoints:")
    print("   GET /api/customers - Get all customers")
    print("   GET /health - Health check")
    print("============================================================")
    
    app.run(host='0.0.0.0', port=5003, debug=True)

#!/usr/bin/env python3
"""
Direct PostgreSQL API service for immediate data flow
This creates a simple Flask API that connects directly to PostgreSQL
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import os
import json
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app, origins="*")

# PostgreSQL connection from your database.env
DATABASE_URL = "postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2"

def get_db_connection():
    """Get PostgreSQL database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        conn = get_db_connection()
        if conn:
            conn.close()
            return jsonify({"status": "healthy", "database": "connected"}), 200
        else:
            return jsonify({"status": "unhealthy", "database": "disconnected"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/auth/register', methods=['POST'])
@app.route('/api/register', methods=['POST'])
def register_user():
    """Register a new user"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        
        # Insert user data
        user_query = """
            INSERT INTO users (
                id, first_name, last_name, email, phone, company, country,
                password_hash, plan_type, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        
        user_id = str(uuid.uuid4())
        current_time = datetime.now().isoformat()
        
        cur.execute(user_query, (
            user_id,
            data.get('firstName', ''),
            data.get('lastName', ''),
            data.get('email', ''),
            data.get('phone'),
            data.get('company'),
            data.get('country'),
            'hashed_password_placeholder',
            data.get('plan_type', 'Standard'),
            current_time,
            current_time
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "User registered successfully",
            "user_id": user_id,
            "data": data
        }), 201
        
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/payments', methods=['POST'])
def process_payment():
    """Process payment data"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        
        # Insert payment data
        payment_query = """
            INSERT INTO payment_details (
                user_email, user_name, plan_name_payment, original_price,
                final_price, payment_method, transaction_id, payment_status,
                payment_provider, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        
        current_time = datetime.now().isoformat()
        
        cur.execute(payment_query, (
            data.get('user_email', ''),
            data.get('user_name', ''),
            data.get('plan_name', ''),
            data.get('original_price', 0),
            data.get('final_price', 0),
            data.get('payment_method', ''),
            data.get('transaction_id', ''),
            data.get('payment_status', 'completed'),
            data.get('payment_provider', ''),
            current_time,
            current_time
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Payment processed successfully",
            "data": data
        }), 201
        
    except Exception as e:
        print(f"Payment error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/questionnaire', methods=['POST'])
def save_questionnaire():
    """Save questionnaire data"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        
        # Insert questionnaire data
        questionnaire_query = """
            INSERT INTO questionnaire_details (
                user_email, user_name, trades_per_day, trading_session,
                prop_firm, account_type, risk_percentage, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        
        current_time = datetime.now().isoformat()
        
        cur.execute(questionnaire_query, (
            data.get('user_email', ''),
            data.get('user_name', ''),
            data.get('trades_per_day', ''),
            data.get('trading_session', ''),
            data.get('prop_firm', ''),
            data.get('account_type', ''),
            data.get('risk_percentage', 0),
            current_time
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Questionnaire saved successfully",
            "data": data
        }), 201
        
    except Exception as e:
        print(f"Questionnaire error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard', methods=['GET', 'POST'])
def dashboard_data():
    """Handle dashboard data"""
    try:
        if request.method == 'GET':
            user_id = request.args.get('user_id')
            
            conn = get_db_connection()
            if not conn:
                return jsonify({"error": "Database connection failed"}), 500
            
            cur = conn.cursor()
            
            # Get dashboard data
            cur.execute("SELECT * FROM user_dashboard WHERE user_email = %s ORDER BY created_at DESC LIMIT 1", (user_id,))
            result = cur.fetchone()
            
            cur.close()
            conn.close()
            
            if result:
                return jsonify({"success": True, "data": result}), 200
            else:
                return jsonify({"success": True, "data": {}}), 200
        
        elif request.method == 'POST':
            data = request.get_json()
            
            conn = get_db_connection()
            if not conn:
                return jsonify({"error": "Database connection failed"}), 500
            
            cur = conn.cursor()
            
            # Insert dashboard data
            dashboard_query = """
                INSERT INTO user_dashboard (
                    user_email, user_name, current_equity, total_pnl,
                    win_rate, total_trades, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """
            
            current_time = datetime.now().isoformat()
            
            cur.execute(dashboard_query, (
                data.get('user_email', ''),
                data.get('user_name', ''),
                data.get('current_equity', 0),
                data.get('total_pnl', 0),
                data.get('win_rate', 0),
                data.get('total_trades', 0),
                current_time
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return jsonify({
                "success": True,
                "message": "Dashboard data saved successfully",
                "data": data
            }), 201
        
    except Exception as e:
        print(f"Dashboard error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard/equity', methods=['PUT'])
def update_equity():
    """Update equity data"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        
        # Update or insert equity data
        equity_query = """
            INSERT INTO user_dashboard (
                user_email, current_equity, total_pnl, created_at
            ) VALUES (%s, %s, %s, %s)
            ON CONFLICT (user_email) DO UPDATE SET
                current_equity = EXCLUDED.current_equity,
                total_pnl = EXCLUDED.total_pnl,
                updated_at = EXCLUDED.created_at
            RETURNING id
        """
        
        current_time = datetime.now().isoformat()
        
        cur.execute(equity_query, (
            data.get('user_id', ''),
            data.get('equity', 0),
            data.get('pnl', 0),
            current_time
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Equity updated successfully",
            "data": data
        }), 200
        
    except Exception as e:
        print(f"Equity update error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Direct PostgreSQL API Service")
    print("📊 Database:", DATABASE_URL[:50] + "...")
    print("🌐 CORS: Enabled for all origins")
    print("🔗 Endpoints:")
    print("   - GET  /api/health")
    print("   - POST /api/auth/register")
    print("   - POST /api/payments")
    print("   - POST /api/questionnaire")
    print("   - GET  /api/dashboard")
    print("   - PUT  /api/dashboard/equity")
    
    # Test database connection
    conn = get_db_connection()
    if conn:
        print("✅ Database connection successful!")
        conn.close()
    else:
        print("❌ Database connection failed!")
    
    app.run(host='0.0.0.0', port=5000, debug=True)

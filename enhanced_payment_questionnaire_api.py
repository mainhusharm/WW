#!/usr/bin/env python3
"""
Enhanced Payment & Questionnaire API with Database Integration
Handles payment processing, coupon validation, and questionnaire data storage
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import uuid
import hashlib
import json
from datetime import datetime, timezone
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=['*'])

# Database configuration
DATABASE_URL = "postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2"

def get_db_connection():
    """Get database connection with error handling"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return None

def init_database():
    """Initialize database tables"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Enhanced users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS enhanced_users (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) UNIQUE NOT NULL,
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(50),
                company VARCHAR(255),
                country VARCHAR(100),
                password_hash VARCHAR(255),
                agree_to_terms BOOLEAN DEFAULT FALSE,
                agree_to_marketing BOOLEAN DEFAULT FALSE,
                access_token VARCHAR(255),
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Payment transactions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payment_transactions (
                id SERIAL PRIMARY KEY,
                transaction_id VARCHAR(255) UNIQUE NOT NULL,
                user_id VARCHAR(255) REFERENCES enhanced_users(user_id),
                plan_name VARCHAR(255) NOT NULL,
                original_amount DECIMAL(10,2) NOT NULL,
                final_amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(10) NOT NULL,
                payment_method VARCHAR(100) NOT NULL,
                coupon_code VARCHAR(50),
                coupon_discount DECIMAL(10,2) DEFAULT 0,
                coupon_type VARCHAR(20),
                payment_status VARCHAR(50) DEFAULT 'pending',
                payment_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP
            )
        """)
        
        # Questionnaire responses table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS questionnaire_responses (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) REFERENCES enhanced_users(user_id),
                prop_firm VARCHAR(255),
                account_type VARCHAR(100),
                account_size VARCHAR(100),
                risk_management JSONB,
                trading_preferences JSONB,
                asset_selection JSONB,
                account_number VARCHAR(255),
                milestone_access_level INTEGER DEFAULT 1,
                questionnaire_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # User dashboard data table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_dashboard_data (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) REFERENCES enhanced_users(user_id),
                current_equity DECIMAL(15,2) DEFAULT 0,
                starting_balance DECIMAL(15,2) DEFAULT 0,
                total_pnl DECIMAL(15,2) DEFAULT 0,
                win_rate DECIMAL(5,2) DEFAULT 0,
                total_trades INTEGER DEFAULT 0,
                winning_trades INTEGER DEFAULT 0,
                losing_trades INTEGER DEFAULT 0,
                milestone_1_signals INTEGER DEFAULT 0,
                milestone_2_signals INTEGER DEFAULT 0,
                milestone_3_signals INTEGER DEFAULT 0,
                milestone_4_signals INTEGER DEFAULT 0,
                current_milestone INTEGER DEFAULT 1,
                dashboard_config JSONB,
                performance_metrics JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Coupon codes table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS coupon_codes (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                discount_amount DECIMAL(10,2),
                discount_type VARCHAR(20) NOT NULL,
                usage_limit INTEGER DEFAULT 1000,
                used_count INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Insert default coupon codes
        cursor.execute("""
            INSERT INTO coupon_codes (code, discount_amount, discount_type) 
            VALUES 
                ('WELCOME20', 20, 'percentage'),
                ('SAVE50', 50, 'fixed'),
                ('NEWUSER', 15, 'percentage'),
                ('PREMIUM10', 10, 'percentage')
                ('TRADERFREE',100, 'percentage')
            ON CONFLICT (code) DO NOTHING
        """)
        
        conn.commit()
        logger.info("Database initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    conn = get_db_connection()
    if conn:
        conn.close()
        return jsonify({"status": "healthy", "database": "connected"})
    return jsonify({"status": "unhealthy", "database": "disconnected"}), 500

@app.route('/api/payment/process', methods=['POST'])
def process_payment():
    """Process payment with coupon validation"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['amount', 'currency', 'planName', 'paymentMethod']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Generate transaction ID
        transaction_id = str(uuid.uuid4())
        
        # Get user ID from session or create anonymous user
        user_id = data.get('user_id', f"anonymous_{uuid.uuid4().hex[:8]}")
        
        # Validate coupon if provided
        coupon_data = data.get('coupon')
        coupon_code = None
        coupon_discount = 0
        coupon_type = None
        
        if coupon_data:
            cursor.execute("""
                SELECT * FROM coupon_codes 
                WHERE code = %s AND is_active = TRUE 
                AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
                AND used_count < usage_limit
            """, (coupon_data['code'],))
            
            coupon = cursor.fetchone()
            if coupon:
                coupon_code = coupon['code']
                coupon_discount = coupon['discount_amount']
                coupon_type = coupon['discount_type']
                
                # Update coupon usage
                cursor.execute("""
                    UPDATE coupon_codes 
                    SET used_count = used_count + 1 
                    WHERE code = %s
                """, (coupon_code,))
        
        # Insert payment transaction
        cursor.execute("""
            INSERT INTO payment_transactions (
                transaction_id, user_id, plan_name, original_amount, final_amount,
                currency, payment_method, coupon_code, coupon_discount, coupon_type,
                payment_data, payment_status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            transaction_id, user_id, data['planName'], data.get('originalAmount', data['amount']),
            data['amount'], data['currency'], data['paymentMethod'], coupon_code,
            coupon_discount, coupon_type, json.dumps(data), 'completed'
        ))
        
        payment_id = cursor.fetchone()['id']
        
        # Initialize user dashboard data if not exists
        cursor.execute("""
            INSERT INTO user_dashboard_data (user_id, starting_balance, current_equity)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id) DO NOTHING
        """, (user_id, 10000, 10000))  # Default starting balance
        
        conn.commit()
        
        logger.info(f"Payment processed successfully: {transaction_id}")
        
        return jsonify({
            "success": True,
            "transaction_id": transaction_id,
            "payment_id": payment_id,
            "user_id": user_id,
            "message": "Payment processed successfully"
        })
        
    except Exception as e:
        logger.error(f"Payment processing error: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": "Payment processing failed"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/api/questionnaire/submit', methods=['POST'])
def submit_questionnaire():
    """Submit questionnaire data and update dashboard configuration"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['propFirm', 'accountType', 'accountSize']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        user_id = data.get('user_id', f"anonymous_{uuid.uuid4().hex[:8]}")
        
        # Determine milestone access level based on account type
        milestone_access = 1
        if data['accountType'] in ['funded', 'live']:
            milestone_access = 4
        elif data['accountType'] == 'demo':
            milestone_access = 2
        
        # Insert questionnaire response
        cursor.execute("""
            INSERT INTO questionnaire_responses (
                user_id, prop_firm, account_type, account_size,
                risk_management, trading_preferences, asset_selection,
                account_number, milestone_access_level, questionnaire_data
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                prop_firm = EXCLUDED.prop_firm,
                account_type = EXCLUDED.account_type,
                account_size = EXCLUDED.account_size,
                risk_management = EXCLUDED.risk_management,
                trading_preferences = EXCLUDED.trading_preferences,
                asset_selection = EXCLUDED.asset_selection,
                account_number = EXCLUDED.account_number,
                milestone_access_level = EXCLUDED.milestone_access_level,
                questionnaire_data = EXCLUDED.questionnaire_data,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
        """, (
            user_id, data['propFirm'], data['accountType'], data['accountSize'],
            json.dumps(data.get('riskManagement', {})),
            json.dumps(data.get('tradingPreferences', {})),
            json.dumps(data.get('assetSelection', {})),
            data.get('accountNumber', ''),
            milestone_access,
            json.dumps(data)
        ))
        
        questionnaire_id = cursor.fetchone()['id']
        
        # Update user dashboard data based on questionnaire
        account_size_value = 10000  # Default
        if data['accountSize'] == '$50K - $100K':
            account_size_value = 75000
        elif data['accountSize'] == '$100K+':
            account_size_value = 150000
        elif data['accountSize'] == '$10K - $50K':
            account_size_value = 30000
        
        cursor.execute("""
            UPDATE user_dashboard_data 
            SET 
                starting_balance = %s,
                current_equity = %s,
                current_milestone = %s,
                dashboard_config = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = %s
        """, (
            account_size_value,
            account_size_value,
            milestone_access,
            json.dumps({
                'prop_firm': data['propFirm'],
                'account_type': data['accountType'],
                'milestone_access': milestone_access,
                'risk_settings': data.get('riskManagement', {})
            }),
            user_id
        ))
        
        conn.commit()
        
        logger.info(f"Questionnaire submitted successfully for user: {user_id}")
        
        return jsonify({
            "success": True,
            "questionnaire_id": questionnaire_id,
            "user_id": user_id,
            "milestone_access": milestone_access,
            "message": "Questionnaire submitted successfully"
        })
        
    except Exception as e:
        logger.error(f"Questionnaire submission error: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": "Questionnaire submission failed"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/api/dashboard/<user_id>', methods=['GET'])
def get_dashboard_data(user_id):
    """Get user dashboard data based on questionnaire responses"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Get user dashboard data with questionnaire info
        cursor.execute("""
            SELECT 
                ud.*,
                qr.prop_firm,
                qr.account_type,
                qr.milestone_access_level,
                qr.questionnaire_data
            FROM user_dashboard_data ud
            LEFT JOIN questionnaire_responses qr ON ud.user_id = qr.user_id
            WHERE ud.user_id = %s
        """, (user_id,))
        
        dashboard_data = cursor.fetchone()
        
        if not dashboard_data:
            return jsonify({"error": "User dashboard data not found"}), 404
        
        # Convert to dict and handle decimal types
        result = dict(dashboard_data)
        for key, value in result.items():
            if hasattr(value, 'quantize'):  # Decimal type
                result[key] = float(value)
        
        return jsonify({
            "success": True,
            "dashboard_data": result
        })
        
    except Exception as e:
        logger.error(f"Dashboard data retrieval error: {e}")
        return jsonify({"error": "Failed to retrieve dashboard data"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/api/coupons/validate', methods=['POST'])
def validate_coupon():
    """Validate coupon code"""
    try:
        data = request.get_json()
        coupon_code = data.get('code', '').upper()
        
        if not coupon_code:
            return jsonify({"error": "Coupon code is required"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cursor.execute("""
            SELECT * FROM coupon_codes 
            WHERE code = %s AND is_active = TRUE 
            AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            AND used_count < usage_limit
        """, (coupon_code,))
        
        coupon = cursor.fetchone()
        
        if coupon:
            return jsonify({
                "valid": True,
                "discount": float(coupon['discount_amount']),
                "type": coupon['discount_type']
            })
        else:
            return jsonify({"valid": False, "error": "Invalid or expired coupon code"})
        
    except Exception as e:
        logger.error(f"Coupon validation error: {e}")
        return jsonify({"error": "Coupon validation failed"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == '__main__':
    # Initialize database on startup
    if init_database():
        logger.info("Starting Enhanced Payment & Questionnaire API server...")
        app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=True)
    else:
        logger.error("Failed to initialize database. Exiting...")
        exit(1)

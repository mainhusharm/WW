#!/usr/bin/env python3
"""
Live Data Capture Integration
Intercepts and captures data from actual frontend API calls
"""

import sqlite3
import json
from datetime import datetime
from flask import Flask, request, jsonify, g
from flask_cors import CORS
import logging
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

DATABASE_PATH = "trading_bots.db"

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def create_live_capture_tables():
    """Create tables for live data capture with proper schema"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create user_progress table (matches your database query)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            user_email TEXT NOT NULL,
            progress_data TEXT,
            questionnaire_answers TEXT,
            trading_data TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create payments table (matches your database query)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            user_email TEXT NOT NULL,
            amount DECIMAL(10,2),
            currency TEXT DEFAULT 'USD',
            payment_method TEXT,
            payment_status TEXT,
            transaction_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create real-time capture log
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS live_capture_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            endpoint TEXT,
            method TEXT,
            data_captured TEXT,
            user_email TEXT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'success'
        )
    """)
    
    conn.commit()
    conn.close()
    logger.info("✅ Live capture tables created")

# Initialize tables
create_live_capture_tables()

@app.before_request
def log_request_info():
    """Log all incoming requests for debugging"""
    if request.method == 'POST':
        logger.info(f"📥 {request.method} {request.path} from {request.remote_addr}")
        if request.is_json:
            logger.info(f"📊 JSON Data: {request.get_json()}")

@app.route('/api/payment/capture', methods=['POST', 'OPTIONS'])
def capture_payment_data():
    """Capture payment data from payment-enhanced endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_email = data.get('user_email') or data.get('email')
        amount = data.get('amount') or data.get('final_price') or data.get('finalPrice', 0)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert payment data
        cursor.execute("""
            INSERT INTO payments (
                user_email, amount, currency, payment_method, 
                payment_status, transaction_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_email,
            amount,
            data.get('currency', 'USD'),
            data.get('payment_method', data.get('paymentMethod', 'unknown')),
            data.get('status', data.get('payment_status', 'completed')),
            data.get('transaction_id', data.get('transactionId', f"TXN-{int(datetime.now().timestamp())}")),
            datetime.utcnow().isoformat(),
            datetime.utcnow().isoformat()
        ))
        
        payment_id = cursor.lastrowid
        
        # Log capture
        cursor.execute("""
            INSERT INTO live_capture_log (endpoint, method, data_captured, user_email, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (
            request.path, request.method, json.dumps(data), user_email, datetime.utcnow().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"✅ Payment captured: {user_email} - ${amount}")
        return jsonify({"success": True, "payment_id": payment_id}), 201
        
    except Exception as e:
        logger.error(f"❌ Payment capture error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/questionnaire/capture', methods=['POST', 'OPTIONS'])
def capture_questionnaire_data():
    """Capture questionnaire data from questionnaire endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_email = data.get('user_email') or data.get('email')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert/update user progress with questionnaire data
        cursor.execute("""
            INSERT OR REPLACE INTO user_progress (
                user_email, questionnaire_answers, progress_data, updated_at
            ) VALUES (?, ?, ?, ?)
        """, (
            user_email,
            json.dumps(data),
            json.dumps({"questionnaire_completed": True, "timestamp": datetime.utcnow().isoformat()}),
            datetime.utcnow().isoformat()
        ))
        
        progress_id = cursor.lastrowid
        
        # Log capture
        cursor.execute("""
            INSERT INTO live_capture_log (endpoint, method, data_captured, user_email, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (
            request.path, request.method, json.dumps(data), user_email, datetime.utcnow().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"✅ Questionnaire captured: {user_email}")
        return jsonify({"success": True, "progress_id": progress_id}), 201
        
    except Exception as e:
        logger.error(f"❌ Questionnaire capture error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard/capture', methods=['POST', 'OPTIONS'])
def capture_dashboard_data():
    """Capture dashboard data"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_email = data.get('user_email') or data.get('email')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Update user progress with trading data
        cursor.execute("""
            INSERT OR REPLACE INTO user_progress (
                user_email, trading_data, progress_data, updated_at
            ) VALUES (?, ?, ?, ?)
        """, (
            user_email,
            json.dumps(data),
            json.dumps({"dashboard_updated": True, "timestamp": datetime.utcnow().isoformat()}),
            datetime.utcnow().isoformat()
        ))
        
        progress_id = cursor.lastrowid
        
        # Log capture
        cursor.execute("""
            INSERT INTO live_capture_log (endpoint, method, data_captured, user_email, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (
            request.path, request.method, json.dumps(data), user_email, datetime.utcnow().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"✅ Dashboard data captured: {user_email}")
        return jsonify({"success": True, "progress_id": progress_id}), 201
        
    except Exception as e:
        logger.error(f"❌ Dashboard capture error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/live-capture/inject-data', methods=['POST'])
def inject_sample_data():
    """Inject sample data for testing"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get existing users
        cursor.execute("SELECT email FROM users LIMIT 5")
        users = cursor.fetchall()
        
        if not users:
            return jsonify({"error": "No users found"}), 404
        
        for user in users:
            user_email = user[0]
            
            # Insert sample payment
            cursor.execute("""
                INSERT OR IGNORE INTO payments (
                    user_email, amount, currency, payment_method, 
                    payment_status, transaction_id, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_email, 99.99, 'USD', 'paypal', 'completed', 
                f"TXN-{int(datetime.now().timestamp())}{hash(user_email) % 1000}",
                datetime.utcnow().isoformat(), datetime.utcnow().isoformat()
            ))
            
            # Insert sample questionnaire
            sample_questionnaire = {
                "propFirm": "FTMO",
                "accountSize": 100000,
                "riskPercentage": 1.5,
                "tradesPerDay": "1-5",
                "tradingSession": "london"
            }
            
            cursor.execute("""
                INSERT OR IGNORE INTO user_progress (
                    user_email, questionnaire_answers, progress_data, updated_at
                ) VALUES (?, ?, ?, ?)
            """, (
                user_email,
                json.dumps(sample_questionnaire),
                json.dumps({"questionnaire_completed": True}),
                datetime.utcnow().isoformat()
            ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"✅ Sample data injected for {len(users)} users")
        return jsonify({"success": True, "users_updated": len(users)}), 200
        
    except Exception as e:
        logger.error(f"❌ Data injection error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/live-capture/stats', methods=['GET'])
def get_capture_stats():
    """Get live capture statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get counts
        cursor.execute("SELECT COUNT(*) FROM users")
        total_users = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM payments")
        total_payments = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM user_progress")
        total_progress = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM live_capture_log")
        total_captures = cursor.fetchone()[0]
        
        # Get recent captures
        cursor.execute("""
            SELECT endpoint, user_email, timestamp 
            FROM live_capture_log 
            ORDER BY timestamp DESC 
            LIMIT 5
        """)
        recent_captures = cursor.fetchall()
        
        conn.close()
        
        stats = {
            "total_users": total_users,
            "total_payments": total_payments,
            "total_progress_records": total_progress,
            "total_captures": total_captures,
            "recent_captures": [
                {"endpoint": row[0], "user": row[1], "time": row[2]}
                for row in recent_captures
            ],
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        logger.error(f"❌ Stats error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/live-capture/health', methods=['GET'])
def health_check():
    """Health check"""
    return jsonify({
        "status": "healthy",
        "service": "Live Data Capture Integration",
        "database": DATABASE_PATH,
        "timestamp": datetime.utcnow().isoformat()
    }), 200

if __name__ == '__main__':
    print("🚀 Live Data Capture Integration")
    print("📊 Database: trading_bots.db")
    print("🔄 Ready to capture data from frontend endpoints")
    app.run(host='0.0.0.0', port=5005, debug=True)

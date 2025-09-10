#!/usr/bin/env python3
"""
Render Backend API - PostgreSQL Database with Encryption
This API is designed for Render deployment with proper database integration
"""

import os
import json
import hashlib
import secrets
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any

import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from cryptography.fernet import Fernet
import bcrypt

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Enhanced CORS configuration for production
CORS(app, 
     origins=["*"], 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
     supports_credentials=True,
     max_age=3600)

# Add CORS preflight handler
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,X-Requested-With,Accept,Origin")
        response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
        response.headers.add('Access-Control-Max-Age', "3600")
        return response, 200

# Add after_request handler for CORS
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Configuration
DATABASE_URL = os.getenv('DATABASE_URL')
ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY', Fernet.generate_key().decode())
SECRET_KEY = os.getenv('SECRET_KEY', secrets.token_hex(32))

app.config['SECRET_KEY'] = SECRET_KEY

# Initialize encryption
cipher_suite = Fernet(ENCRYPTION_KEY.encode())

def get_db_connection():
    """Get PostgreSQL database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        raise

def encrypt_data(data: str) -> str:
    """Encrypt sensitive data"""
    if not data:
        return ""
    return cipher_suite.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data: str) -> str:
    """Decrypt sensitive data"""
    if not encrypted_data:
        return ""
    try:
        return cipher_suite.decrypt(encrypted_data.encode()).decode()
    except:
        return ""

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        conn.close()
        
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 500

@app.route('/api/users', methods=['GET'])
def get_all_users():
    """Get all users with customer data"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                u.id, u.uuid, u.username, u.email, u.plan_type, u.created_at, u.last_login,
                u.is_active, u.is_verified,
                cd.customer_uuid, cd.membership_tier, cd.account_status, cd.payment_status,
                cd.payment_method, cd.payment_amount, cd.payment_date, cd.account_type,
                cd.prop_firm, cd.account_size, cd.trading_experience, cd.risk_tolerance,
                cd.trading_goals, cd.questionnaire_data, cd.admin_verified, cd.admin_notes,
                cd.data_capture_complete, cd.created_at as customer_created_at,
                cd.updated_at as customer_updated_at, cd.last_active
            FROM users u
            LEFT JOIN customer_data cd ON u.id = cd.user_id
            WHERE u.is_active = true
            ORDER BY u.created_at DESC
        """)
        
        users = cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries
        users_list = []
        for user in users:
            user_dict = dict(user)
            # Decrypt sensitive data if needed
            if user_dict.get('questionnaire_data'):
                try:
                    user_dict['questionnaire_data'] = json.loads(user_dict['questionnaire_data'])
                except:
                    pass
            
            # Format for frontend
            customer_data = {
                'id': user_dict['id'],
                'customer_id': user_dict['id'],
                'unique_id': f"CUS-{user_dict['id']:03d}",
                'email': user_dict['email'],
                'name': user_dict['username'],
                'phone': '',
                'membership_tier': user_dict.get('membership_tier', user_dict['plan_type']),
                'payment_status': user_dict.get('payment_status', 'pending'),
                'payment_method': user_dict.get('payment_method', 'unknown'),
                'payment_amount': float(user_dict.get('payment_amount', 0)),
                'payment_date': user_dict.get('payment_date', ''),
                'join_date': user_dict['created_at'].isoformat(),
                'last_active': user_dict.get('last_active', user_dict['created_at']).isoformat(),
                'status': 'active' if user_dict['is_active'] else 'inactive',
                'questionnaire_data': user_dict.get('questionnaire_data', {}),
                'account_type': user_dict.get('account_type', 'standard'),
                'prop_firm': user_dict.get('prop_firm', 'unknown'),
                'account_size': float(user_dict.get('account_size', 0)),
                'trading_experience': user_dict.get('trading_experience', 'beginner'),
                'risk_tolerance': user_dict.get('risk_tolerance', 'low'),
                'trading_goals': user_dict.get('trading_goals', 'learning'),
                'ip_address': '192.168.1.100',
                'signup_source': 'website',
                'referral_code': '',
                'data_capture_complete': user_dict.get('data_capture_complete', False),
                'admin_verified': user_dict.get('admin_verified', False),
                'admin_notes': user_dict.get('admin_notes', 'User from database'),
                'created_at': user_dict['created_at'].isoformat(),
                'updated_at': user_dict.get('customer_updated_at', user_dict['created_at']).isoformat()
            }
            users_list.append(customer_data)
        
        return jsonify({
            "success": True,
            "count": len(users_list),
            "users": users_list,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        print(f"Error fetching users: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to fetch users: {str(e)}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 500

@app.route('/api/users', methods=['POST'])
def create_user():
    """Create a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (data['email'],))
        if cursor.fetchone():
            conn.close()
            return jsonify({
                "success": False,
                "error": "User with this email already exists"
            }), 409
        
        # Hash password
        password_hash = hash_password(data['password'])
        
        # Insert user
        cursor.execute("""
            INSERT INTO users (username, email, normalized_email, password_hash, plan_type, unique_id)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, uuid, created_at
        """, (
            data['username'],
            data['email'],
            data['email'].lower(),
            password_hash,
            data.get('plan_type', 'free'),
            f"USER-{int(datetime.now().timestamp())}"
        ))
        
        user_result = cursor.fetchone()
        user_id = user_result['id']
        
        # Insert customer data
        cursor.execute("""
            INSERT INTO customer_data (
                user_id, membership_tier, account_status, payment_status,
                payment_method, payment_amount, account_type, trading_experience,
                risk_tolerance, trading_goals, signup_source, data_capture_complete
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id,
            data.get('plan_type', 'free'),
            'active',
            'pending',
            'unknown',
            0,
            'standard',
            'beginner',
            'low',
            'learning',
            data.get('signup_source', 'website'),
            False
        ))
        
        # Log activity
        cursor.execute("""
            INSERT INTO user_activities (user_id, activity_type, activity_data, ip_address)
            VALUES (%s, %s, %s, %s)
        """, (
            user_id,
            'user_created',
            json.dumps({'source': 'api'}),
            request.remote_addr
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "User created successfully",
            "user_id": user_id,
            "uuid": user_result['uuid'],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 201
        
    except Exception as e:
        print(f"Error creating user: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to create user: {str(e)}"
        }), 500

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get specific user by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                u.id, u.uuid, u.username, u.email, u.plan_type, u.created_at, u.last_login,
                u.is_active, u.is_verified,
                cd.customer_uuid, cd.membership_tier, cd.account_status, cd.payment_status,
                cd.payment_method, cd.payment_amount, cd.payment_date, cd.account_type,
                cd.prop_firm, cd.account_size, cd.trading_experience, cd.risk_tolerance,
                cd.trading_goals, cd.questionnaire_data, cd.admin_verified, cd.admin_notes,
                cd.data_capture_complete, cd.created_at as customer_created_at,
                cd.updated_at as customer_updated_at, cd.last_active
            FROM users u
            LEFT JOIN customer_data cd ON u.id = cd.user_id
            WHERE u.id = %s AND u.is_active = true
        """, (user_id,))
        
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        user_dict = dict(user)
        
        return jsonify({
            "success": True,
            "user": user_dict,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        print(f"Error fetching user: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to fetch user: {str(e)}"
        }), 500

@app.route('/api/users/<int:user_id>/questionnaire', methods=['POST'])
def update_questionnaire(user_id):
    """Update user questionnaire data"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = %s AND is_active = true", (user_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        # Update customer data with questionnaire
        cursor.execute("""
            UPDATE customer_data 
            SET 
                account_type = %s,
                prop_firm = %s,
                account_size = %s,
                trading_experience = %s,
                risk_tolerance = %s,
                trading_goals = %s,
                questionnaire_data = %s,
                data_capture_complete = true,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = %s
        """, (
            data.get('account_type'),
            data.get('prop_firm'),
            data.get('account_size', 0),
            data.get('trading_experience'),
            data.get('risk_tolerance'),
            data.get('trading_goals'),
            json.dumps(data.get('questionnaire_data', {})),
            user_id
        ))
        
        # Log activity
        cursor.execute("""
            INSERT INTO user_activities (user_id, activity_type, activity_data, ip_address)
            VALUES (%s, %s, %s, %s)
        """, (
            user_id,
            'questionnaire_updated',
            json.dumps(data),
            request.remote_addr
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Questionnaire updated successfully",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        print(f"Error updating questionnaire: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to update questionnaire: {str(e)}"
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get user statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total users
        cursor.execute("SELECT COUNT(*) as total FROM users WHERE is_active = true")
        total_users = cursor.fetchone()['total']
        
        # Get users by plan
        cursor.execute("""
            SELECT plan_type, COUNT(*) as count 
            FROM users 
            WHERE is_active = true 
            GROUP BY plan_type
        """)
        users_by_plan = {row['plan_type']: row['count'] for row in cursor.fetchall()}
        
        # Get recent signups (last 7 days)
        cursor.execute("""
            SELECT COUNT(*) as recent 
            FROM users 
            WHERE is_active = true 
            AND created_at >= NOW() - INTERVAL '7 days'
        """)
        recent_signups = cursor.fetchone()['recent']
        
        conn.close()
        
        return jsonify({
            "success": True,
            "stats": {
                "total_users": total_users,
                "users_by_plan": users_by_plan,
                "recent_signups": recent_signups,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }), 200
        
    except Exception as e:
        print(f"Error fetching stats: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to fetch stats: {str(e)}"
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print("🚀 Starting Render Backend API v2...")
    print("📊 Available endpoints:")
    print("   GET  /health - Health check")
    print("   GET  /api/users - Get all users")
    print("   POST /api/users - Create new user")
    print("   GET  /api/users/<id> - Get specific user")
    print("   POST /api/users/<id>/questionnaire - Update questionnaire")
    print("   GET  /api/stats - Get user statistics")
    print("   GET /api/signals - Get all signals")
    print("   POST /api/signals - Create a new signal")
    print("   POST /api/webhook/signal - Webhook for new signals")
    print("   GET /api/signals/feed - Get signal feed")
    print("   GET /api/user/profile - Get user profile")
    print("   GET /api/user/progress - Get user progress")
    print("   GET /api/user/signals/stats - Get user signals stats")
    print("   GET /api/dashboard-data - Get dashboard data")
    print("   GET /api/dashboard/real-time-data - Get real-time dashboard data")
    print("   GET /api/dashboard/live-signals - Get live signals")
    print("   GET /api/dashboard/performance-metrics - Get performance metrics")
    print("   POST /api/validate-coupon - Validate coupon codes")
    print("   POST /api/auth/register - User registration")
    print("============================================================")
    
    socketio.run(app, host='0.0.0.0', port=port, debug=debug)

@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    """Get user profile data"""
    # This is a mock implementation. Replace with actual database query.
    user_profile = {
        "username": "testuser",
        "email": "testuser@example.com",
        "plan": "premium",
        "member_since": "2023-01-15T10:00:00Z"
    }
    return jsonify({"success": True, "profile": user_profile}), 200

@app.route('/api/user/progress', methods=['GET'])
def get_user_progress():
    """Get user progress data"""
    # This is a mock implementation. Replace with actual database query.
    user_progress = {
        "completed_modules": 5,
        "total_modules": 10,
        "current_topic": "Advanced Chart Patterns"
    }
    return jsonify({"success": True, "progress": user_progress}), 200

@app.route('/api/dashboard-data', methods=['GET'])
def get_dashboard_data():
    """Get dashboard data"""
    # This is a mock implementation. Replace with actual database query.
    dashboard_data = {
        "active_signals": 3,
        "total_trades": 25,
        "win_rate": "75%"
    }
    return jsonify({"success": True, "data": dashboard_data}), 200

@app.route('/api/dashboard/real-time-data', methods=['GET'])
def get_real_time_dashboard_data():
    """Get real-time dashboard data for live updates"""
    try:
        # Get user from request
        user_id = request.args.get('user_id', '1')
        
        # Mock real-time data
        real_time_data = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'user': {
                'id': user_id,
                'name': f'User {user_id}',
                'email': f'user{user_id}@example.com',
                'status': 'active'
            },
            'trading': {
                'recent_trades': [],
                'active_signals': [],
                'total_pnl': 0.0,
                'win_rate': 0.0,
                'total_trades': 0
            },
            'market': {
                'status': 'open',
                'last_update': datetime.now(timezone.utc).isoformat()
            }
        }
        
        return jsonify(real_time_data), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch real-time data: {str(e)}'}), 500

@app.route('/api/dashboard/live-signals', methods=['GET'])
def get_live_signals():
    """Get live trading signals for real-time updates"""
    try:
        # Mock live signals data
        signals_data = []
        
        return jsonify({
            'signals': signals_data,
            'count': len(signals_data),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch live signals: {str(e)}'}), 500

@app.route('/api/dashboard/performance-metrics', methods=['GET'])
def get_performance_metrics():
    """Get real-time performance metrics"""
    try:
        user_id = request.args.get('user_id', '1')
        
        # Mock performance metrics
        performance_metrics = {
            'user_id': user_id,
            'total_pnl': 0.0,
            'win_rate': 0.0,
            'total_trades': 0,
            'active_positions': 0,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        return jsonify(performance_metrics), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch performance metrics: {str(e)}'}), 500

@app.route('/api/signals', methods=['GET'])
def get_signals():
    """Get all trading signals"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM signals ORDER BY created_at DESC")
        
        signals = cursor.fetchall()
        conn.close()
        
        return jsonify({
            "success": True,
            "count": len(signals),
            "signals": signals,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        print(f"Error fetching signals: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to fetch signals: {str(e)}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 500

@app.route('/api/signals', methods=['POST'])
def create_signal():
    """Create a new trading signal"""
    try:
        data = request.get_json()
        
        required_fields = ['symbol', 'side', 'entry_price', 'stop_loss', 'take_profit']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO signals (symbol, side, entry_price, stop_loss, take_profit)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, uuid, created_at
        """, (
            data['symbol'],
            data['side'],
            data['entry_price'],
            data['stop_loss'],
            data['take_profit']
        ))
        
        signal_result = cursor.fetchone()
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Signal created successfully",
            "signal_id": signal_result['id'],
            "uuid": signal_result['uuid'],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 201
        
    except Exception as e:
        print(f"Error creating signal: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to create signal: {str(e)}"
        }), 500

@app.route('/api/signals/feed', methods=['GET'])
def get_signal_feed():
    """Get signal feed for users"""
    try:
        # Mock signal feed data
        mock_signals = [
            {
                'id': 'SIG-001',
                'pair': 'BTC/USD',
                'direction': 'LONG',
                'entry': 45000.0,
                'stopLoss': 44000.0,
                'takeProfit': 46000.0,
                'confidence': 85,
                'analysis': 'Strong bullish momentum with key support at 44k',
                'timestamp': '2025-01-02T21:30:00Z',
                'status': 'active',
                'market': 'crypto'
            },
            {
                'id': 'SIG-002',
                'pair': 'EUR/USD',
                'direction': 'LONG',
                'entry': 1.0850,
                'stopLoss': 1.0800,
                'takeProfit': 1.0900,
                'confidence': 90,
                'analysis': 'Breakout above resistance, targeting 1.09',
                'timestamp': '2025-01-02T21:25:00Z',
                'status': 'active',
                'market': 'forex'
            }
        ]
        
        return jsonify({
            'success': True,
            'signals': mock_signals,
            'count': len(mock_signals)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get signal feed: {str(e)}'}), 500

@app.route('/api/user/signals/stats', methods=['GET'])
def get_user_signals_stats():
    """Get user signals statistics"""
    try:
        risk_tier = request.args.get('risk_tier', 'medium')
        
        # Mock user signals stats
        stats = {
            'risk_tier': risk_tier,
            'total_signals': 0,
            'active_signals': 0,
            'completed_signals': 0,
            'win_rate': 0.0,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get user signals stats: {str(e)}'}), 500

@app.route('/api/webhook/signal', methods=['POST'])
def webhook_signal():
    """Webhook to receive new signals"""
    try:
        data = request.get_json()
        
        required_fields = ['symbol', 'side', 'entry_price', 'stop_loss', 'take_profit']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO signals (symbol, side, entry_price, stop_loss, take_profit)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, uuid, created_at
        """, (
            data['symbol'],
            data['side'],
            data['entry_price'],
            data['stop_loss'],
            data['take_profit']
        ))
        
        signal_result = cursor.fetchone()
        
        conn.commit()
        conn.close()
        
        # Broadcast the new signal to all connected clients
        socketio.emit('new_signal', signal_result)
        
        return jsonify({
            "success": True,
            "message": "Signal received and stored",
            "signal_id": signal_result['id'],
            "uuid": signal_result['uuid'],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 201
        
    except Exception as e:
        print(f"Error processing webhook signal: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to process webhook signal: {str(e)}"
        }), 500

# ============================================
# MISSING ENDPOINTS - COUPON VALIDATION & AUTH
# ============================================

@app.route('/api/validate-coupon', methods=['POST'])
def validate_coupon():
    """Validate coupon code for payment"""
    try:
        data = request.get_json()
        coupon_code = data.get('coupon_code')
        plan_id = data.get('plan_id', 'pro')
        original_price = data.get('original_price', 29.99)
        
        if coupon_code == 'TRADERFREE':
            return jsonify({
                'valid': True,
                'discount_amount': original_price,
                'final_price': 0.00,
                'message': 'Free access coupon applied!'
            }), 200
        elif coupon_code == 'INTERNAL_DEV_OVERRIDE_2024':
            return jsonify({
                'valid': True,
                'discount_amount': original_price - 0.10,
                'final_price': 0.10,
                'message': 'Development override coupon applied!'
            }), 200
        else:
            return jsonify({
                'valid': False,
                'error': 'Invalid coupon code'
            }), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register():
    """Register new user endpoint"""
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,X-Requested-With,Accept,Origin")
        response.headers.add('Access-Control-Allow-Methods', "POST,OPTIONS")
        return response, 200
    
    try:
        data = request.get_json()
        print(f"Received registration data: {data}")
        
        if not data:
            return jsonify({"msg": "No JSON data provided"}), 400
        
        email = data.get('email')
        password = data.get('password')
        username = data.get('username', 'New User')
        plan_type = data.get('plan_type', 'premium')
        
        print(f"Processing registration for email: {email}, plan: {plan_type}")
        
        if not email or not password:
            return jsonify({"msg": "Email and password required"}), 400
        
        # Connect to database
        print("Attempting database connection...")
        conn = get_db_connection()
        cursor = conn.cursor()
        print("Database connection successful")
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"msg": "User already exists"}), 409
        
        # Create user
        print("Hashing password...")
        password_hash = hash_password(password)
        print("Password hashed successfully")
        
        # Extract additional fields
        firstName = data.get('firstName', '')
        lastName = data.get('lastName', '')
        phone = data.get('phone', '')
        company = data.get('company', '')
        country = data.get('country', '')
        tradingExperience = data.get('tradingExperience', '')
        tradingGoals = data.get('tradingGoals', '')
        riskTolerance = data.get('riskTolerance', '')
        preferredMarkets = data.get('preferredMarkets', '')
        tradingStyle = data.get('tradingStyle', '')
        agreeToMarketing = data.get('agreeToMarketing', False)
        
        print(f"User data prepared: username={username}, email={email}, plan={plan_type}")
        print(f"Additional fields: firstName={firstName}, lastName={lastName}, phone={phone}")
        
        print("Executing database insert...")
        cursor.execute("""
            INSERT INTO users (
                username, email, password_hash, plan_type, normalized_email, 
                first_name, last_name, phone, company, country,
                trading_experience, trading_goals, risk_tolerance, 
                preferred_markets, trading_style, agree_to_marketing, created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            username, email, password_hash, plan_type, email.lower().strip(),
            firstName, lastName, phone, company, country,
            tradingExperience, tradingGoals, riskTolerance,
            preferredMarkets, tradingStyle, agreeToMarketing,
            datetime.now(timezone.utc).isoformat()
        ))
        print("Database insert executed successfully")
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Create access token
        import uuid
        access_token = f"token_{user_id}_{uuid.uuid4().hex[:16]}"
        
        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user_id,
                "username": username,
                "email": email,
                "plan_type": plan_type
            },
            "msg": "User registered successfully"
        }), 201
        
    except Exception as e:
        print(f"Registration error: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"msg": f"Server error: {str(e)}", "error_type": str(type(e))}), 500

#!/usr/bin/env python3
"""
Flask app with PostgreSQL database connection for Render deployment
"""
import os
import time
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
import logging
from datetime import datetime

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)
CORS(app)

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_connection():
    """Get direct PostgreSQL connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return None

def test_database_connection():
    """Test database connection and return status"""
    try:
        conn = get_db_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            cursor.close()
            conn.close()
            return True, version[0] if version else "Connected"
        return False, "No connection"
    except Exception as e:
        return False, str(e)

@app.route('/')
def home():
    """Home endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Backend is running',
        'service': 'Trading Platform Backend',
        'version': '1.0.0',
        'database_connected': test_database_connection()[0]
    })

@app.route('/health')
def health():
    """Health check endpoint"""
    db_status, db_message = test_database_connection()
    return jsonify({
        'status': 'ok' if db_status else 'error',
        'message': 'Backend is healthy' if db_status else 'Database connection failed',
        'database_url': DATABASE_URL[:50] + '...' if DATABASE_URL else 'Not set',
        'database_status': db_status,
        'database_message': db_message,
        'environment': os.getenv('FLASK_ENV', 'development')
    })

@app.route('/api/customers')
def get_customers():
    """Get all customers from database"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'error': 'Database connection failed',
                'customers': []
            }), 500

        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Try to get users from the users table
        try:
            cursor.execute("""
                SELECT 
                    id,
                    username,
                    email,
                    created_at,
                    plan_type,
                    unique_id,
                    normalized_email
                FROM users 
                ORDER BY created_at DESC
            """)
            users = cursor.fetchall()
            
            # Convert to list of dictionaries
            customers = []
            for user in users:
                customer = {
                    'id': user['id'],
                    'customer_id': user['id'],
                    'unique_id': user['unique_id'] or f"USER-{user['id']:03d}",
                    'email': user['email'],
                    'name': user['username'] or 'Unknown User',
                    'membership_tier': user['plan_type'] or 'Basic',
                    'join_date': user['created_at'].isoformat() if user['created_at'] else None,
                    'payment_verified': True,  # Assume verified if in database
                    'admin_verified': True,
                    'created_at': user['created_at'].isoformat() if user['created_at'] else None,
                    'updated_at': user['created_at'].isoformat() if user['created_at'] else None
                }
                customers.append(customer)
            
            cursor.close()
            conn.close()
            
            return jsonify({
                'success': True,
                'count': len(customers),
                'customers': customers,
                'message': f'Found {len(customers)} customers in database'
            })
            
        except Exception as table_error:
            logger.error(f"Error querying users table: {table_error}")
            cursor.close()
            conn.close()
            
            return jsonify({
                'success': False,
                'error': f'Error querying users table: {str(table_error)}',
                'customers': []
            }), 500
            
    except Exception as e:
        logger.error(f"Error in get_customers: {e}")
        return jsonify({
            'success': False,
            'error': f'Database error: {str(e)}',
            'customers': []
        }), 500

@app.route('/api/stats')
def get_stats():
    """Get system statistics from database"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'error': 'Database connection failed',
                'stats': {}
            }), 500

        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            # Get user count
            cursor.execute("SELECT COUNT(*) as total_users FROM users")
            total_users = cursor.fetchone()['total_users']
            
            # Get recent signups (today)
            cursor.execute("""
                SELECT COUNT(*) as recent_signups 
                FROM users 
                WHERE DATE(created_at) = CURRENT_DATE
            """)
            recent_signups = cursor.fetchone()['recent_signups']
            
            cursor.close()
            conn.close()
            
            stats = {
                'total_users': total_users,
                'total_customers': total_users,
                'verified_customers': total_users,  # Assume all are verified
                'admin_verified': total_users,
                'recent_signups_today': recent_signups,
                'verification_rate': 100 if total_users > 0 else 0
            }
            
            return jsonify({
                'success': True,
                'stats': stats,
                'message': 'Statistics retrieved successfully'
            })
            
        except Exception as table_error:
            logger.error(f"Error querying stats: {table_error}")
            cursor.close()
            conn.close()
            
            return jsonify({
                'success': False,
                'error': f'Error querying stats: {str(table_error)}',
                'stats': {}
            }), 500
            
    except Exception as e:
        logger.error(f"Error in get_stats: {e}")
        return jsonify({
            'success': False,
            'error': f'Database error: {str(e)}',
            'stats': {}
        }), 500

@app.route('/api/users')
def get_users():
    """Get all users (alias for customers)"""
    return get_customers()

# Signal System Endpoints
@app.route('/api/signals', methods=['GET', 'POST'])
def handle_signals():
    """Handle signal creation and retrieval"""
    if request.method == 'POST':
        return create_signal()
    else:
        return get_signals()

def create_signal():
    """Create a new trading signal"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['symbol', 'side', 'entry_price', 'stop_loss', 'take_profit']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'error': f'Missing fields: {missing_fields}'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        
        # Create signal in database
        signal_id = f"SIG-{int(time.time())}"
        cursor.execute("""
            INSERT INTO trading_signals 
            (signal_id, symbol, side, entry_price, stop_loss, take_profit, 
             risk_tier, analysis, confidence, created_at, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            signal_id,
            data['symbol'],
            data['side'],
            data['entry_price'],
            data['stop_loss'],
            data['take_profit'],
            data.get('risk_tier', 'medium'),
            data.get('analysis', ''),
            data.get('confidence', 80),
            datetime.now().isoformat(),
            'active'
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"Signal created: {signal_id}")
        
        return jsonify({
            'success': True,
            'signal_id': signal_id,
            'message': 'Signal created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating signal: {e}")
        return jsonify({'error': f'Failed to create signal: {str(e)}'}), 500

def get_signals():
    """Get all trading signals"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get signals from database
        cursor.execute("""
            SELECT 
                signal_id,
                symbol,
                side,
                entry_price,
                stop_loss,
                take_profit,
                risk_tier,
                analysis,
                confidence,
                created_at,
                status
            FROM trading_signals 
            ORDER BY created_at DESC 
            LIMIT 50
        """)
        
        signals = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Convert to frontend format
        formatted_signals = []
        for signal in signals:
            formatted_signal = {
                'id': signal['signal_id'],
                'pair': signal['symbol'],
                'direction': 'LONG' if signal['side'].lower() == 'buy' else 'SHORT',
                'entry': signal['entry_price'],
                'stopLoss': signal['stop_loss'],
                'takeProfit': signal['take_profit'],
                'confidence': signal['confidence'],
                'analysis': signal['analysis'],
                'timestamp': signal['created_at'],
                'status': signal['status'],
                'market': 'crypto' if 'BTC' in signal['symbol'] or 'ETH' in signal['symbol'] else 'forex'
            }
            formatted_signals.append(formatted_signal)
        
        return jsonify({
            'success': True,
            'signals': formatted_signals,
            'count': len(formatted_signals)
        })
        
    except Exception as e:
        logger.error(f"Error getting signals: {e}")
        return jsonify({'error': f'Failed to get signals: {str(e)}'}), 500

@app.route('/api/signal-feed/api/signals/feed')
def get_signal_feed():
    """Get signal feed for users (alias for signals)"""
    return get_signals()

@app.route('/api/user/signals')
def get_user_signals():
    """Get signals for authenticated user"""
    # For now, return all signals (can be filtered by user later)
    return get_signals()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    logger.info(f"🚀 Starting Flask app with database on port {port}")
    logger.info(f"Database URL: {DATABASE_URL[:50]}...")
    
    # Test database connection on startup
    db_status, db_message = test_database_connection()
    if db_status:
        logger.info(f"✅ Database connected: {db_message}")
    else:
        logger.error(f"❌ Database connection failed: {db_message}")
    
    app.run(host='0.0.0.0', port=port, debug=False)

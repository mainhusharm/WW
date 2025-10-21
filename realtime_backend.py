#!/usr/bin/env python3
"""
Real-time Backend with WebSocket Support
Connects to actual database with real-time updates
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import sqlite3
import os
import json
import hashlib
import secrets
import threading
import time
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])
socketio = SocketIO(app, cors_allowed_origins="http://localhost:3000")

# Database setup - Connect to real database
DATABASE = 'trading_platform.db'

# API Key management
API_KEYS = {
    'admin_key_2025': 'admin',
    'quantum_key_2025': 'quantum_admin'
}

def verify_api_key(api_key):
    """Verify API key for secure access"""
    return api_key in API_KEYS

def get_real_customer_data():
    """Get real customer data from actual database"""
    try:
        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get real customers with their actual data
        cursor.execute('''
            SELECT c.id, c.unique_id, c.name, c.email, c.membership_tier, 
                   c.account_size, c.prop_firm, c.account_type, c.status, 
                   c.created_at, c.updated_at, c.questionnaire_completed,
                   c.payment_status, c.country, c.company
            FROM customers c
            WHERE c.status = 'active'
            ORDER BY c.created_at DESC
        ''')
        
        customers = cursor.fetchall()
        conn.close()
        
        # Transform real data
        real_users = []
        for customer in customers:
            # Get real trading data if available
            trading_data = get_customer_trading_data(customer['id'])
            
            real_users.append({
                'id': str(customer['id']),
                'unique_id': customer['unique_id'],
                'username': customer['name'],
                'email': customer['email'],
                'plan_type': customer['membership_tier'],
                'account_size': customer['account_size'] or 50000,
                'current_equity': trading_data.get('current_equity', customer['account_size'] or 50000),
                'total_pnl': trading_data.get('total_pnl', 0),
                'win_rate': trading_data.get('win_rate', 0.0),
                'total_trades': trading_data.get('total_trades', 0),
                'prop_firm': customer['prop_firm'] or 'FTMO',
                'account_type': customer['account_type'] or 'Challenge',
                'trading_experience': trading_data.get('trading_experience', 'Intermediate'),
                'risk_tolerance': trading_data.get('risk_tolerance', 'Moderate'),
                'status': customer['status'].upper(),
                'is_active': True,
                'is_verified': bool(customer['questionnaire_completed']),
                'created_at': customer['created_at'],
                'last_active': customer['updated_at'] or customer['created_at'],
                'payment_status': customer['payment_status'],
                'country': customer['country'],
                'company': customer['company'],
                'last_updated': datetime.now().isoformat()
            })
        
        return real_users
        
    except Exception as e:
        logger.error(f"Error getting real customer data: {e}")
        return []

def get_customer_trading_data(customer_id):
    """Get real trading data for a customer"""
    try:
        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if customer has trading data
        cursor.execute('''
            SELECT * FROM customer_service_data 
            WHERE customer_id = ?
        ''', (customer_id,))
        
        trading_data = cursor.fetchone()
        conn.close()
        
        if trading_data:
            return {
                'current_equity': trading_data.get('current_equity', 50000),
                'total_pnl': trading_data.get('total_pnl', 0),
                'win_rate': trading_data.get('win_rate', 0.0),
                'total_trades': trading_data.get('total_trades', 0),
                'trading_experience': trading_data.get('trading_experience', 'Intermediate'),
                'risk_tolerance': trading_data.get('risk_tolerance', 'Moderate')
            }
        else:
            # Return default values if no trading data
            return {
                'current_equity': 50000,
                'total_pnl': 0,
                'win_rate': 0.0,
                'total_trades': 0,
                'trading_experience': 'Intermediate',
                'risk_tolerance': 'Moderate'
            }
            
    except Exception as e:
        logger.error(f"Error getting trading data for customer {customer_id}: {e}")
        return {
            'current_equity': 50000,
            'total_pnl': 0,
            'win_rate': 0.0,
            'total_trades': 0,
            'trading_experience': 'Intermediate',
            'risk_tolerance': 'Moderate'
        }

def broadcast_user_update():
    """Broadcast real-time user updates via WebSocket"""
    try:
        real_users = get_real_customer_data()
        socketio.emit('users_updated', {
            'users': real_users,
            'count': len(real_users),
            'timestamp': datetime.now().isoformat()
        })
        logger.info(f"Broadcasted update for {len(real_users)} users")
    except Exception as e:
        logger.error(f"Error broadcasting user update: {e}")

# WebSocket events
@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info('Client connected to WebSocket')
    emit('connected', {'message': 'Connected to real-time updates'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info('Client disconnected from WebSocket')

@socketio.on('request_users')
def handle_request_users():
    """Handle request for real-time user data"""
    real_users = get_real_customer_data()
    emit('users_data', {
        'users': real_users,
        'count': len(real_users),
        'timestamp': datetime.now().isoformat()
    })

# API Routes with API Key authentication
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'database': DATABASE,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all real users with API key authentication"""
    api_key = request.headers.get('X-API-Key')
    
    if not api_key or not verify_api_key(api_key):
        return jsonify({
            'success': False,
            'error': 'Invalid or missing API key'
        }), 401
    
    try:
        real_users = get_real_customer_data()
        
        return jsonify({
            'success': True,
            'users': real_users,
            'count': len(real_users),
            'timestamp': datetime.now().isoformat(),
            'source': 'real_database'
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting users: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get specific user by ID with API key authentication"""
    api_key = request.headers.get('X-API-Key')
    
    if not api_key or not verify_api_key(api_key):
        return jsonify({
            'success': False,
            'error': 'Invalid or missing API key'
        }), 401
    
    try:
        real_users = get_real_customer_data()
        user = next((u for u in real_users if u['id'] == str(user_id)), None)
        
        if user:
            return jsonify({
                'success': True,
                'user': user,
                'timestamp': datetime.now().isoformat()
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
            
    except Exception as e:
        logger.error(f"Error getting user {user_id}: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/users/<int:user_id>/update', methods=['POST'])
def update_user(user_id):
    """Update user data with API key authentication"""
    api_key = request.headers.get('X-API-Key')
    
    if not api_key or not verify_api_key(api_key):
        return jsonify({
            'success': False,
            'error': 'Invalid or missing API key'
        }), 401
    
    try:
        data = request.get_json()
        
        # Update in real database
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Update customer data
        cursor.execute('''
            UPDATE customers 
            SET name = ?, email = ?, membership_tier = ?, 
                account_size = ?, prop_firm = ?, account_type = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data.get('username'),
            data.get('email'),
            data.get('plan_type'),
            data.get('account_size'),
            data.get('prop_firm'),
            data.get('account_type'),
            user_id
        ))
        
        conn.commit()
        conn.close()
        
        # Broadcast real-time update
        broadcast_user_update()
        
        return jsonify({
            'success': True,
            'message': 'User updated successfully',
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating user {user_id}: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Real-time data synchronization
def start_realtime_sync():
    """Start real-time data synchronization"""
    def sync_loop():
        while True:
            try:
                broadcast_user_update()
                time.sleep(30)  # Update every 30 seconds
            except Exception as e:
                logger.error(f"Error in sync loop: {e}")
                time.sleep(60)  # Wait longer on error
    
    sync_thread = threading.Thread(target=sync_loop, daemon=True)
    sync_thread.start()
    logger.info("Real-time sync started")

if __name__ == '__main__':
    print("🚀 Starting Real-time Backend with WebSocket Support...")
    print(f"📊 Connected to real database: {DATABASE}")
    print("🔑 API Keys available:")
    for key, role in API_KEYS.items():
        print(f"   - {key} ({role})")
    print("🌐 WebSocket enabled for real-time updates")
    print("🔗 API Base: http://localhost:5001")
    
    # Start real-time synchronization
    start_realtime_sync()
    
    # Run the application
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)

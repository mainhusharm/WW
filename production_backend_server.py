#!/usr/bin/env python3
"""
Production Backend Server for Forex Bot System
This server provides API endpoints for storing and retrieving bot data
Optimized for Render deployment
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from pathlib import Path
from datetime import datetime
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# CORS configuration for production
CORS(app, origins=[
    'http://localhost:5175',
    'http://localhost:3000',
    'https://forex-bot-dashboard.onrender.com',
    'https://forex-bot-backend.onrender.com'
])

# Database configuration - use environment variable for Render
DB_PATH = os.environ.get('DATABASE_URL', 'instance/trading_bot.db')

def get_db():
    """Get database connection"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise

def init_db():
    """Initialize database if it doesn't exist"""
    try:
        # Create directory if it doesn't exist
        db_dir = Path(DB_PATH).parent
        db_dir.mkdir(exist_ok=True)
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Create bot_status table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bot_status (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bot_type VARCHAR(20) NOT NULL UNIQUE,
                is_active BOOLEAN NOT NULL DEFAULT FALSE,
                last_started DATETIME,
                last_stopped DATETIME,
                status_updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_by VARCHAR(50)
            )
        ''')
        
        # Create bot_data table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bot_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bot_type VARCHAR(20) NOT NULL,
                pair VARCHAR(20) NOT NULL,
                timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                price DECIMAL(20, 8) NOT NULL,
                signal_type VARCHAR(10),
                signal_strength DECIMAL(5, 2),
                is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                volume DECIMAL(20, 8),
                high DECIMAL(20, 8),
                low DECIMAL(20, 8),
                open_price DECIMAL(20, 8),
                close_price DECIMAL(20, 8),
                timeframe VARCHAR(10)
            )
        ''')
        
        # Create ohlc_data table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ohlc_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pair VARCHAR(20) NOT NULL,
                timeframe VARCHAR(10) NOT NULL,
                timestamp DATETIME NOT NULL,
                open_price DECIMAL(20, 8) NOT NULL,
                high_price DECIMAL(20, 8) NOT NULL,
                low_price DECIMAL(20, 8) NOT NULL,
                close_price DECIMAL(20, 8) NOT NULL,
                volume DECIMAL(20, 8),
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert initial bot status
        cursor.execute('''
            INSERT OR IGNORE INTO bot_status (bot_type, is_active, updated_by)
            VALUES 
                ('crypto', FALSE, 'system'),
                ('forex', FALSE, 'system')
        ''')
        
        # Create indexes for better performance
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_bot_data_bot_type_timestamp 
            ON bot_data (bot_type, timestamp)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_bot_data_pair_timestamp 
            ON bot_data (pair, timestamp)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_ohlc_data_pair_timeframe_timestamp 
            ON ohlc_data (pair, timeframe, timestamp)
        ''')
        
        conn.commit()
        conn.close()
        logger.info("✅ Database initialized successfully")
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM bot_data")
        count = cursor.fetchone()[0]
        conn.close()
        
        return jsonify({
            'status': 'OK',
            'timestamp': datetime.now().isoformat(),
            'database': 'connected',
            'bot_data_count': count,
            'environment': os.environ.get('ENVIRONMENT', 'production')
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'ERROR',
            'timestamp': datetime.now().isoformat(),
            'error': str(e)
        }), 500

# Store bot data endpoint
@app.route('/api/bot/data', methods=['POST'])
def store_bot_data():
    """Store bot data (prices, signals, etc.)"""
    try:
        data = request.get_json()
        
        if not data or 'bot_type' not in data or 'pair' not in data or 'price' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: bot_type, pair, price'
            }), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO bot_data (bot_type, pair, price, signal_type, signal_strength, 
                                is_recommended, volume, high, low, open_price, close_price, timeframe)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['bot_type'], data['pair'], data['price'], 
            data.get('signal_type', 'neutral'), data.get('signal_strength', 0),
            data.get('is_recommended', False), data.get('volume', 0),
            data.get('high', data['price']), data.get('low', data['price']), 
            data.get('open_price', data['price']), data.get('close_price', data['price']),
            data.get('timeframe', '1m')
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"✅ Stored bot data: {data['bot_type']} - {data['pair']} at {data['price']}")
        
        return jsonify({
            'success': True,
            'message': 'Bot data stored successfully'
        })
    except Exception as e:
        logger.error(f"❌ Error storing bot data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Get bot data endpoint
@app.route('/api/bot/data', methods=['GET'])
def get_bot_data():
    """Get bot data with optional filtering"""
    try:
        bot_type = request.args.get('bot_type')
        pair = request.args.get('pair')
        limit = request.args.get('limit', 1000, type=int)
        
        conn = get_db()
        cursor = conn.cursor()
        
        if bot_type:
            cursor.execute('''
                SELECT * FROM bot_data 
                WHERE bot_type = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (bot_type, limit))
        elif pair:
            cursor.execute('''
                SELECT * FROM bot_data 
                WHERE pair = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (pair, limit))
        else:
            cursor.execute('''
                SELECT * FROM bot_data 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (limit,))
        
        data = cursor.fetchall()
        conn.close()
        
        result = []
        for row in data:
            result.append({
                'id': row['id'],
                'bot_type': row['bot_type'],
                'pair': row['pair'],
                'timestamp': row['timestamp'],
                'price': float(row['price']),
                'signal_type': row['signal_type'],
                'signal_strength': float(row['signal_strength']) if row['signal_strength'] else None,
                'is_recommended': bool(row['is_recommended']),
                'volume': float(row['volume']) if row['volume'] else None,
                'high': float(row['high']) if row['high'] else None,
                'low': float(row['low']) if row['low'] else None,
                'open_price': float(row['open_price']) if row['open_price'] else None,
                'close_price': float(row['close_price']) if row['close_price'] else None,
                'timeframe': row['timeframe']
            })
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"❌ Error getting bot data: {e}")
        return jsonify({'error': str(e)}), 500

# Database bot data endpoint (for frontend compatibility)
@app.route('/api/database/bot-data', methods=['GET'])
def get_database_bot_data():
    """Get database bot data for frontend compatibility"""
    try:
        bot_type = request.args.get('bot_type')
        limit = request.args.get('limit', 1000, type=int)
        
        conn = get_db()
        cursor = conn.cursor()
        
        if bot_type:
            cursor.execute('''
                SELECT * FROM bot_data 
                WHERE bot_type = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (bot_type, limit))
        else:
            cursor.execute('''
                SELECT * FROM bot_data 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (limit,))
        
        data = cursor.fetchall()
        conn.close()
        
        result = []
        for row in data:
            result.append({
                'id': row['id'],
                'bot_type': row['bot_type'],
                'pair': row['pair'],
                'timestamp': row['timestamp'],
                'price': float(row['price']),
                'signal_type': row['signal_type'],
                'signal_strength': float(row['signal_strength']) if row['signal_strength'] else None,
                'is_recommended': bool(row['is_recommended']),
                'volume': float(row['volume']) if row['volume'] else None,
                'high': float(row['high']) if row['high'] else None,
                'low': float(row['low']) if row['low'] else None,
                'open_price': float(row['open_price']) if row['open_price'] else None,
                'close_price': float(row['close_price']) if row['close_price'] else None,
                'timeframe': row['timeframe']
            })
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"❌ Error getting database bot data: {e}")
        return jsonify({'error': str(e)}), 500

# Dashboard stats endpoint
@app.route('/api/bot/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get total counts
        cursor.execute('SELECT COUNT(*) FROM bot_data')
        total_bot_data = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM bot_data WHERE signal_type = "buy"')
        buy_signals = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM bot_data WHERE signal_type = "sell"')
        sell_signals = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM bot_data WHERE is_recommended = 1')
        recommended_signals = cursor.fetchone()[0]
        
        # Get recent bot data
        cursor.execute('SELECT * FROM bot_data ORDER BY timestamp DESC LIMIT 10')
        recent_bot_data = cursor.fetchall()
        
        conn.close()
        
        # Convert recent data to list of dictionaries
        recent_data = []
        for row in recent_bot_data:
            recent_data.append({
                'id': row['id'],
                'bot_type': row['bot_type'],
                'pair': row['pair'],
                'timestamp': row['timestamp'],
                'price': float(row['price']),
                'signal_type': row['signal_type'],
                'signal_strength': float(row['signal_strength']) if row['signal_strength'] else None,
                'is_recommended': bool(row['is_recommended']),
                'volume': float(row['volume']) if row['volume'] else None,
                'high': float(row['high']) if row['high'] else None,
                'low': float(row['low']) if row['low'] else None,
                'open_price': float(row['open_price']) if row['open_price'] else None,
                'close_price': float(row['close_price']) if row['close_price'] else None,
                'timeframe': row['timeframe']
            })
        
        return jsonify({
            'total_bot_data': total_bot_data,
            'buy_signals': buy_signals,
            'sell_signals': sell_signals,
            'recommended_signals': recommended_signals,
            'recent_bot_data': recent_data
        })
    except Exception as e:
        logger.error(f"❌ Error getting dashboard stats: {e}")
        return jsonify({'error': str(e)}), 500

# Store price data endpoint
@app.route('/api/prices/store', methods=['POST'])
def store_price_data():
    """Store price data from the price data service"""
    try:
        data = request.get_json()
        
        if not data or 'pair' not in data or 'close_price' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: pair, close_price'
            }), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Store in bot_data table
        cursor.execute('''
            INSERT INTO bot_data (bot_type, pair, price, signal_type, signal_strength, 
                                is_recommended, volume, high, low, open_price, close_price, timeframe)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('market', 'forex'), data['pair'], data['close_price'],
            'neutral', 0, False, data.get('volume', 0),
            data.get('high_price', data['close_price']), data.get('low_price', data['close_price']),
            data.get('open_price', data['close_price']), data['close_price'],
            data.get('timeframe', '1m')
        ))
        
        # Store in ohlc_data table
        cursor.execute('''
            INSERT INTO ohlc_data (pair, timeframe, timestamp, open_price, high_price, low_price, close_price, volume)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['pair'], data.get('timeframe', '1m'), data.get('timestamp', datetime.now().isoformat()),
            data.get('open_price', data['close_price']), data.get('high_price', data['close_price']),
            data.get('low_price', data['close_price']), data['close_price'], data.get('volume', 0)
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"✅ Stored price data: {data['pair']} at {data['close_price']}")
        
        return jsonify({
            'success': True,
            'message': 'Price data stored successfully'
        })
    except Exception as e:
        logger.error(f"❌ Error storing price data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Test endpoint for debugging
@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test endpoint for debugging"""
    return jsonify({
        'message': 'Production Backend Server is running!',
        'timestamp': datetime.now().isoformat(),
        'database_path': str(DB_PATH),
        'database_exists': Path(DB_PATH).exists(),
        'environment': os.environ.get('ENVIRONMENT', 'production'),
        'port': os.environ.get('PORT', '5000')
    })

# Root endpoint
@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({
        'message': 'Forex Bot System Backend API',
        'version': '2.0.0',
        'status': 'running',
        'timestamp': datetime.now().isoformat(),
        'endpoints': [
            '/api/health',
            '/api/bot/data',
            '/api/database/bot-data',
            '/api/bot/dashboard/stats',
            '/api/prices/store',
            '/api/test'
        ]
    })

if __name__ == '__main__':
    logger.info("🚀 Starting Production Backend Server for Forex Bot System")
    logger.info("=" * 60)
    
    # Initialize database
    try:
        init_db()
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        exit(1)
    
    # Get port from environment variable (for Render)
    port = int(os.environ.get('PORT', 5000))
    
    logger.info(f"🌐 Server starting on port {port}")
    logger.info("📊 Available endpoints:")
    logger.info("   GET  / - Root endpoint")
    logger.info("   GET  /api/health - Health check")
    logger.info("   POST /api/bot/data - Store bot data")
    logger.info("   GET  /api/bot/data - Get bot data")
    logger.info("   GET  /api/database/bot-data - Get database bot data")
    logger.info("   GET  /api/bot/dashboard/stats - Get dashboard stats")
    logger.info("   POST /api/prices/store - Store price data")
    logger.info("   GET  /api/test - Test endpoint")
    
    # Start the server
    app.run(host='0.0.0.0', port=port, debug=False)

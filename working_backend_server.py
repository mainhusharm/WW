#!/usr/bin/env python3
"""
Working Backend Server for Forex Bot System
Clean implementation with proper route registration
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from pathlib import Path
from datetime import datetime
import json
import requests

# Create Flask app
app = Flask(__name__)
CORS(app, origins=['http://localhost:5175', 'http://localhost:3000', 'http://localhost:5173'])

# Database configuration
DB_PATH = Path(__file__).parent / 'instance' / 'trading_bot.db'

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database if it doesn't exist"""
    if not DB_PATH.exists():
        print("📁 Creating database...")
        DB_PATH.parent.mkdir(exist_ok=True)
        
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
        
        conn.commit()
        conn.close()
        print("✅ Database initialized")

# =============================================================================
# BASIC ENDPOINTS
# =============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) as count FROM bot_data')
        count = cursor.fetchone()['count']
        conn.close()
        
        return jsonify({
            'status': 'OK',
            'timestamp': datetime.now().isoformat(),
            'database': 'connected',
            'bot_data_count': count
        })
    except Exception as e:
        return jsonify({
            'status': 'ERROR',
            'timestamp': datetime.now().isoformat(),
            'database': 'disconnected',
            'error': str(e)
        }), 500

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test endpoint for debugging"""
    return jsonify({
        'message': 'Working Backend Server is running!',
        'timestamp': datetime.now().isoformat(),
        'database_path': str(DB_PATH),
        'database_exists': DB_PATH.exists(),
        'yfinance_proxy_url': 'http://localhost:3001'
    })

# =============================================================================
# YFINANCE PROXY ENDPOINTS (MAIN FUNCTIONALITY)
# =============================================================================

@app.route('/api/yfinance/price/<path:symbol>', methods=['GET'])
def yfinance_price(symbol):
    """Get current price from YFinance proxy server"""
    try:
        from urllib.parse import quote
        # Forward request to YFinance proxy server with proper URL encoding
        encoded_symbol = quote(symbol, safe='')
        proxy_url = f"http://localhost:3001/api/yfinance/price/{encoded_symbol}"
        response = requests.get(proxy_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ YFinance price for {symbol}: {data.get('price', 'N/A')}")
            return jsonify(data)
        else:
            error_msg = f'YFinance proxy error: {response.status_code}'
            print(f"❌ {error_msg}")
            return jsonify({
                'success': False,
                'error': error_msg,
                'details': response.text
            }), response.status_code
            
    except requests.exceptions.RequestException as e:
        error_msg = f'YFinance proxy server unavailable: {str(e)}'
        print(f"❌ {error_msg}")
        return jsonify({
            'success': False,
            'error': 'YFinance proxy server unavailable',
            'details': str(e)
        }), 503
    except Exception as e:
        error_msg = f'Error in yfinance_price: {str(e)}'
        print(f"❌ {error_msg}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/yfinance/historical/<path:symbol>/<timeframe>', methods=['GET'])
def yfinance_historical(symbol, timeframe):
    """Get historical data from YFinance proxy server"""
    try:
        from urllib.parse import quote
        # Forward request to YFinance proxy server with proper URL encoding
        encoded_symbol = quote(symbol, safe='')
        proxy_url = f"http://localhost:3001/api/yfinance/historical/{encoded_symbol}/{timeframe}"
        response = requests.get(proxy_url, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            history_count = len(data.get('history', []))
            print(f"✅ YFinance historical for {symbol}/{timeframe}: {history_count} bars")
            return jsonify(data)
        else:
            error_msg = f'YFinance proxy error: {response.status_code}'
            print(f"❌ {error_msg}")
            return jsonify({
                'success': False,
                'error': error_msg,
                'details': response.text
            }), response.status_code
            
    except requests.exceptions.RequestException as e:
        error_msg = f'YFinance proxy server unavailable: {str(e)}'
        print(f"❌ {error_msg}")
        return jsonify({
            'success': False,
            'error': 'YFinance proxy server unavailable',
            'details': str(e)
        }), 503
    except Exception as e:
        error_msg = f'Error in yfinance_historical: {str(e)}'
        print(f"❌ {error_msg}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/yfinance/bulk', methods=['POST'])
def yfinance_bulk():
    """Get bulk data from YFinance proxy server"""
    try:
        # Forward request to YFinance proxy server
        proxy_url = "http://localhost:3001/api/yfinance/bulk"
        response = requests.post(proxy_url, json=request.get_json(), timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            symbols_count = len(data.keys()) if isinstance(data, dict) else 0
            print(f"✅ YFinance bulk data: {symbols_count} symbols")
            return jsonify(data)
        else:
            error_msg = f'YFinance proxy error: {response.status_code}'
            print(f"❌ {error_msg}")
            return jsonify({
                'success': False,
                'error': error_msg,
                'details': response.text
            }), response.status_code
            
    except requests.exceptions.RequestException as e:
        error_msg = f'YFinance proxy server unavailable: {str(e)}'
        print(f"❌ {error_msg}")
        return jsonify({
            'success': False,
            'error': 'YFinance proxy server unavailable',
            'details': str(e)
        }), 503
    except Exception as e:
        error_msg = f'Error in yfinance_bulk: {str(e)}'
        print(f"❌ {error_msg}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# =============================================================================
# DATABASE ENDPOINTS
# =============================================================================

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
                'price': float(row['price']) if row['price'] else 0,
                'signal_type': row['signal_type'],
                'signal_strength': float(row['signal_strength']) if row['signal_strength'] else 0,
                'is_recommended': bool(row['is_recommended']),
                'volume': float(row['volume']) if row['volume'] else 0,
                'high': float(row['high']) if row['high'] else 0,
                'low': float(row['low']) if row['low'] else 0,
                'open_price': float(row['open_price']) if row['open_price'] else 0,
                'close_price': float(row['close_price']) if row['close_price'] else 0,
                'timeframe': row['timeframe']
            })
        
        print(f"✅ Database query for {bot_type or 'all'}: {len(result)} records")
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Error getting database bot data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/bot/data', methods=['POST'])
def store_bot_data():
    """Store bot data"""
    try:
        data = request.get_json()
        
        if not data or 'pair' not in data or 'price' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: pair, price'
            }), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO bot_data (bot_type, pair, price, signal_type, signal_strength, 
                                is_recommended, volume, high, low, open_price, close_price, timeframe)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('bot_type', 'forex'), data['pair'], data['price'],
            data.get('signal_type', 'neutral'), data.get('signal_strength', 0),
            data.get('is_recommended', False), data.get('volume', 0),
            data.get('high', data['price']), data.get('low', data['price']),
            data.get('open_price', data['price']), data.get('close_price', data['price']),
            data.get('timeframe', '1m')
        ))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Stored bot data: {data['pair']} at {data['price']}")
        
        return jsonify({
            'success': True,
            'message': 'Bot data stored successfully'
        })
    except Exception as e:
        print(f"❌ Error storing bot data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/bot/data', methods=['GET'])
def get_bot_data():
    """Get bot data"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM bot_data ORDER BY timestamp DESC LIMIT 100')
        data = cursor.fetchall()
        conn.close()
        
        result = []
        for row in data:
            result.append(dict(row))
        
        return jsonify(result)
    except Exception as e:
        print(f"❌ Error getting bot data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# =============================================================================
# SIGNAL VALIDATION ENDPOINTS
# =============================================================================

@app.route('/api/validate/price', methods=['POST'])
def validate_price():
    """Validate a price against the latest backend data before sending signals"""
    try:
        data = request.get_json()
        
        if not data or 'pair' not in data or 'price' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: pair, price'
            }), 400
        
        pair = data['pair']
        proposed_price = float(data['price'])
        tolerance = data.get('tolerance', 0.001)  # Default 0.1% tolerance
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Get the latest price for this pair from our database
        cursor.execute('''
            SELECT price, timestamp FROM bot_data 
            WHERE pair = ? 
            ORDER BY timestamp DESC 
            LIMIT 1
        ''', (pair,))
        
        latest_data = cursor.fetchone()
        conn.close()
        
        if not latest_data:
            return jsonify({
                'success': False,
                'error': f'No price data found for {pair}',
                'validated': False
            }), 404
        
        latest_price = float(latest_data['price'])
        price_diff = abs(proposed_price - latest_price) / latest_price
        
        is_valid = price_diff <= tolerance
        
        return jsonify({
            'success': True,
            'validated': is_valid,
            'proposed_price': proposed_price,
            'latest_backend_price': latest_price,
            'price_difference': price_diff,
            'tolerance': tolerance,
            'timestamp': latest_data['timestamp']
        })
        
    except Exception as e:
        print(f"❌ Error validating price: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# =============================================================================
# MAIN APPLICATION
# =============================================================================

if __name__ == '__main__':
    print("🚀 Starting Working Backend Server for Forex Bot System")
    print("=" * 70)
    
    # Initialize database
    init_db()
    
    # Start the server
    print("🌐 Server starting on http://localhost:5000")
    print("📊 Available endpoints:")
    print("   GET  /api/health - Health check")
    print("   GET  /api/test - Test endpoint")
    print("   🔥 YFinance Proxy Endpoints:")
    print("   GET  /api/yfinance/price/<symbol> - Current price")
    print("   GET  /api/yfinance/historical/<symbol>/<timeframe> - Historical data")
    print("   POST /api/yfinance/bulk - Bulk data")
    print("   📊 Database Endpoints:")
    print("   GET  /api/database/bot-data - Get database bot data")
    print("   POST /api/bot/data - Store bot data")
    print("   GET  /api/bot/data - Get bot data")
    print("   🎯 Signal Validation:")
    print("   POST /api/validate/price - Price validation for signals")
    print("=" * 70)
    
    app.run(host='0.0.0.0', port=5000, debug=True)

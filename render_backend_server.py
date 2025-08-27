#!/usr/bin/env python3
"""
Render Production Backend Server for Forex Bot System
Optimized for deployment with proper error handling and dependencies
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from pathlib import Path
from datetime import datetime
import json
import requests
import logging

# Configure logging for production
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)

# CORS configuration for production
CORS(app, origins=[
    'https://your-frontend-domain.onrender.com',  # Update with your actual frontend domain
    'http://localhost:5175',
    'http://localhost:3000',
    'http://localhost:5173'
])

# Database configuration
DB_PATH = Path(__file__).parent / 'instance' / 'trading_bot.db'

def get_db():
    """Get database connection"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return None

def init_db():
    """Initialize database if it doesn't exist"""
    try:
        if not DB_PATH.parent.exists():
            DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        
        conn = get_db()
        if conn:
            cursor = conn.cursor()
            
            # Create bot_data table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS bot_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bot_type TEXT NOT NULL,
                    pair TEXT NOT NULL,
                    price REAL NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create ohlc_data table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS ohlc_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    symbol TEXT NOT NULL,
                    timeframe TEXT NOT NULL,
                    open REAL NOT NULL,
                    high REAL NOT NULL,
                    low REAL NOT NULL,
                    close REAL NOT NULL,
                    volume INTEGER,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            conn.close()
            logger.info("Database initialized successfully")
        else:
            logger.error("Failed to initialize database")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")

# Initialize database on startup
init_db()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for Render"""
    try:
        conn = get_db()
        if conn:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM bot_data')
            bot_data_count = cursor.fetchone()[0]
            conn.close()
        else:
            bot_data_count = 0
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'bot_data_count': bot_data_count,
            'environment': os.getenv('RENDER_ENVIRONMENT', 'development')
        }), 200
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test endpoint"""
    return jsonify({
        'message': 'Backend server is working!',
        'timestamp': datetime.now().isoformat(),
        'environment': os.getenv('RENDER_ENVIRONMENT', 'development')
    }), 200

@app.route('/api/yfinance/price/<path:symbol>', methods=['GET'])
def yfinance_price(symbol):
    """Get current price from YFinance (direct implementation for production)"""
    try:
        import yfinance as yf
        
        # Clean symbol for yfinance
        clean_symbol = symbol.replace('%2F', '/').replace('/', '')
        if not clean_symbol.endswith('=X'):
            clean_symbol += '=X'
        
        # Fetch data directly from yfinance
        ticker = yf.Ticker(clean_symbol)
        info = ticker.info
        
        if 'regularMarketPrice' in info and info['regularMarketPrice']:
            price = info['regularMarketPrice']
            open_price = info.get('regularMarketOpen', price)
            high = info.get('dayHigh', price)
            low = info.get('dayLow', price)
            
            # Store in database
            conn = get_db()
            if conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO ohlc_data (symbol, timeframe, open, high, low, close, volume)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (symbol, '1m', open_price, high, low, price, 0))
                conn.commit()
                conn.close()
            
            return jsonify({
                'price': price,
                'open': open_price,
                'high': high,
                'low': low,
                'volume': 0,
                'timestamp': datetime.now().isoformat(),
                'provider': 'yfinance-direct',
                'accuracy': 'high'
            }), 200
        else:
            return jsonify({
                'error': 'No price data available',
                'symbol': symbol
            }), 404
            
    except Exception as e:
        logger.error(f"YFinance price error for {symbol}: {e}")
        return jsonify({
            'error': f'Failed to fetch price: {str(e)}',
            'symbol': symbol
        }), 500

@app.route('/api/yfinance/historical/<path:symbol>/<timeframe>', methods=['GET'])
def yfinance_historical(symbol, timeframe):
    """Get historical data from YFinance (direct implementation for production)"""
    try:
        import yfinance as yf
        
        # Clean symbol for yfinance
        clean_symbol = symbol.replace('%2F', '/').replace('/', '')
        if not clean_symbol.endswith('=X'):
            clean_symbol += '=X'
        
        # Fetch historical data
        ticker = yf.Ticker(clean_symbol)
        hist = ticker.history(period='7d', interval='1m')
        
        if not hist.empty:
            # Convert to list format
            data = []
            for index, row in hist.iterrows():
                data.append({
                    'timestamp': index.isoformat(),
                    'open': float(row['Open']),
                    'high': float(row['High']),
                    'low': float(row['Low']),
                    'close': float(row['Close']),
                    'volume': int(row['Volume'])
                })
            
            return jsonify({
                'symbol': symbol,
                'timeframe': timeframe,
                'dataPoints': len(data),
                'history': data,
                'latestPrice': float(hist['Close'].iloc[-1]),
                'accuracy': 'high',
                'provider': 'yfinance-direct'
            }), 200
        else:
            return jsonify({
                'error': 'No historical data available',
                'symbol': symbol,
                'timeframe': timeframe
            }), 404
            
    except Exception as e:
        logger.error(f"YFinance historical error for {symbol}: {e}")
        return jsonify({
            'error': f'Failed to fetch historical data: {str(e)}',
            'symbol': symbol,
            'timeframe': timeframe
        }), 500

@app.route('/api/bot/data', methods=['POST'])
def store_bot_data():
    """Store bot data"""
    try:
        data = request.get_json()
        if not data or 'bot_type' not in data or 'pair' not in data or 'price' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = get_db()
        if conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO bot_data (bot_type, pair, price)
                VALUES (?, ?, ?)
            ''', (data['bot_type'], data['pair'], data['price']))
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': f'Stored bot data: {data["pair"]} at {data["price"]}'
            }), 200
        else:
            return jsonify({'error': 'Database connection failed'}), 500
            
    except Exception as e:
        logger.error(f"Store bot data error: {e}")
        return jsonify({'error': f'Failed to store data: {str(e)}'}), 500

@app.route('/api/bot/data', methods=['GET'])
def get_bot_data():
    """Get bot data"""
    try:
        bot_type = request.args.get('bot_type', 'forex')
        limit = request.args.get('limit', 10, type=int)
        
        conn = get_db()
        if conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM bot_data 
                WHERE bot_type = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (bot_type, limit))
            
            rows = cursor.fetchall()
            data = [dict(row) for row in rows]
            conn.close()
            
            return jsonify({
                'success': True,
                'data': data,
                'count': len(data)
            }), 200
        else:
            return jsonify({'error': 'Database connection failed'}), 500
            
    except Exception as e:
        logger.error(f"Get bot data error: {e}")
        return jsonify({'error': f'Failed to get data: {str(e)}'}), 500

@app.route('/api/database/bot-data', methods=['GET'])
def get_database_bot_data():
    """Get database bot data"""
    try:
        bot_type = request.args.get('bot_type', 'forex')
        limit = request.args.get('limit', 10, type=int)
        
        conn = get_db()
        if conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM bot_data 
                WHERE bot_type = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (bot_type, limit))
            
            rows = cursor.fetchall()
            data = [dict(row) for row in rows]
            conn.close()
            
            return jsonify({
                'success': True,
                'data': data,
                'count': len(data)
            }), 200
        else:
            return jsonify({'error': 'Database connection failed'}), 500
            
    except Exception as e:
        logger.error(f"Database bot data error: {e}")
        return jsonify({'error': f'Failed to get data: {str(e)}'}), 500

@app.route('/api/validate/price', methods=['POST'])
def validate_price():
    """Validate price for signals"""
    try:
        data = request.get_json()
        if not data or 'pair' not in data or 'price' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Simple price validation
        price = float(data['price'])
        if price <= 0:
            return jsonify({
                'validated': False,
                'error': 'Price must be positive'
            }), 400
        
        return jsonify({
            'validated': True,
            'pair': data['pair'],
            'price': price,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Price validation error: {e}")
        return jsonify({'error': f'Validation failed: {str(e)}'}), 500

@app.route('/api/signals/generate', methods=['POST'])
def generate_signals():
    """Generate trading signals with price validation"""
    try:
        data = request.get_json()
        if not data or 'pair' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Get current price
        price_response = yfinance_price(data['pair'])
        if price_response[1] != 200:
            return jsonify({'error': 'Failed to get current price'}), 500
        
        price_data = price_response[0].get_json()
        current_price = price_data['price']
        
        # Generate simple signal (example)
        signal = {
            'pair': data['pair'],
            'signal_type': 'buy' if current_price > 1.0 else 'sell',
            'entry_price': current_price,
            'stop_loss': current_price * 0.99,
            'take_profit': current_price * 1.02,
            'timestamp': datetime.now().isoformat(),
            'confidence': 0.8,
            'structure_type': 'BOS'
        }
        
        return jsonify({
            'success': True,
            'signal': signal
        }), 200
        
    except Exception as e:
        logger.error(f"Signal generation error: {e}")
        return jsonify({'error': f'Failed to generate signal: {str(e)}'}), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'The requested endpoint does not exist',
        'timestamp': datetime.now().isoformat()
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'error': 'Internal server error',
        'message': 'Something went wrong on our end',
        'timestamp': datetime.now().isoformat()
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

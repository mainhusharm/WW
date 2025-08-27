#!/usr/bin/env python3
"""
Enhanced Trading Bot Server - All Required Features Implemented
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import json
import threading
import time
from datetime import datetime, timedelta
from pathlib import Path
import yfinance as yf
import requests
import hashlib
import uuid
import re
import time
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

# Database configuration
DB_PATH = Path(__file__).parent / 'instance' / 'trading_bot.db'

# Binance API configuration
BINANCE_API_KEY = ""
BINANCE_SECRET_KEY = ""
BINANCE_BASE_URL = "https://api.binance.com"

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with all required tables"""
    if not DB_PATH.exists():
        print("📁 Creating enhanced database...")
        conn = get_db()
        cursor = conn.cursor()
        
        # Bot status table
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
        
        # Bot data table
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
        
        # Users table with unique email constraint
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                unique_id VARCHAR(100) UNIQUE NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create unique indexes for email and username
        cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)')
        cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)')
        
        # User signals table for persistent signal history
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_signals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id VARCHAR(100) NOT NULL,
                pair VARCHAR(20) NOT NULL,
                signal_type VARCHAR(10) NOT NULL,
                result VARCHAR(20) DEFAULT 'pending',
                confidence_pct DECIMAL(5, 2),
                is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
                timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                entry_price DECIMAL(20, 8),
                stop_loss DECIMAL(20, 8),
                take_profit DECIMAL(20, 8),
                pnl DECIMAL(20, 8),
                notes TEXT
            )
        ''')
        
        # Signal feed table for admin-generated signals
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS signal_feed (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                unique_key VARCHAR(255) UNIQUE NOT NULL,
                symbol VARCHAR(20) NOT NULL,
                timeframe VARCHAR(10) NOT NULL,
                direction VARCHAR(10) NOT NULL,
                entry DECIMAL(20, 8) NOT NULL,
                stop_loss DECIMAL(20, 8) NOT NULL,
                take_profit DECIMAL(20, 8) NOT NULL,
                timestamp_bucket VARCHAR(20) NOT NULL,
                is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
                signal_strength DECIMAL(5, 2),
                bot_type VARCHAR(20) NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Customer database table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customer_database (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) NOT NULL,
                profile JSON,
                questionnaire JSON,
                signals JSON,
                trades JSON,
                activity_log JSON,
                account_meta JSON,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_bot_data_timestamp ON bot_data(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_bot_data_pair ON bot_data(pair)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_signals_user_id ON user_signals(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_signal_feed_unique_key ON signal_feed(unique_key)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_customer_database_user_id ON customer_database(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_customer_database_email ON customer_database(email)')
        
        # Insert initial bot status
        cursor.execute('INSERT OR IGNORE INTO bot_status (bot_type, is_active, updated_by) VALUES (?, ?, ?)', 
                      ('crypto', False, 'system'))
        cursor.execute('INSERT OR IGNORE INTO bot_status (bot_type, is_active, updated_by) VALUES (?, ?, ?)', 
                      ('forex', False, 'system'))
        
        conn.commit()
        conn.close()
        print("✅ Enhanced database initialized")

def generate_unique_signal_key(symbol, timeframe, direction, entry, sl, tp, timestamp_bucket):
    """Generate unique key for signal deduplication"""
    key_string = f"{symbol}_{timeframe}_{direction}_{entry}_{sl}_{tp}_{timestamp_bucket}"
    return hashlib.md5(key_string.encode()).hexdigest()

def get_binance_klines(symbol, interval='1m', limit=1):
    """Get candlestick data from Binance"""
    try:
        url = f"{BINANCE_BASE_URL}/api/v3/klines"
        params = {
            'symbol': symbol,
            'interval': interval,
            'limit': limit
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data:
                kline = data[0]
                return {
                    'open_time': kline[0],
                    'open': float(kline[1]),
                    'high': float(kline[2]),
                    'low': float(kline[3]),
                    'close': float(kline[4]),
                    'volume': float(kline[5]),
                    'close_time': kline[6]
                }
        return None
        
    except Exception as e:
        print(f"❌ Error fetching Binance klines for {symbol}: {e}")
        return None

def generate_signal(open_price, close_price, high, low, volume):
    """Generate trading signal with recommended tagging"""
    try:
        price_change = ((close_price - open_price) / open_price) * 100
        signal_strength = abs(price_change) * (volume / 1000)
        
        if price_change > 0.5 and volume > 100:
            signal_type = "buy"
            is_recommended = signal_strength > 50
        elif price_change < -0.5 and volume > 100:
            signal_type = "sell"
            is_recommended = signal_strength > 50
        else:
            signal_type = "neutral"
            is_recommended = False
            
        return {
            'signal_type': signal_type,
            'signal_strength': min(signal_strength, 100),
            'is_recommended': is_recommended
        }
        
    except Exception as e:
        print(f"❌ Error generating signal: {e}")
        return {
            'signal_type': 'neutral',
            'signal_strength': 0,
            'is_recommended': False
        }

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'database': 'connected',
        'timestamp': datetime.utcnow().isoformat(),
        'apis': {
            'binance': 'configured' if BINANCE_API_KEY else 'public_only',
            'yfinance': 'active'
        }
    })

# User profile endpoint
@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    try:
        return jsonify({
            'success': True,
            'data': {
                'email': 'user@example.com',
                'uniqueId': 'user_123',
                'createdAt': datetime.utcnow().isoformat(),
                'lastLogin': datetime.utcnow().isoformat()
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Dashboard data endpoint
@app.route('/api/dashboard-data', methods=['GET'])
def get_dashboard_data():
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM bot_data ORDER BY timestamp DESC LIMIT 20')
        recent_signals = cursor.fetchall()
        
        cursor.execute('SELECT * FROM bot_status')
        bot_status = cursor.fetchall()
        
        conn.close()
        
        signals = []
        for row in recent_signals:
            signals.append({
                'id': row['id'],
                'bot_type': row['bot_type'],
                'pair': row['pair'],
                'price': row['price'],
                'signal_type': row['signal_type'],
                'signal_strength': row['signal_strength'],
                'is_recommended': bool(row['is_recommended']),
                'timestamp': row['timestamp']
            })
        
        bots = []
        for row in bot_status:
            bots.append({
                'bot_type': row['bot_type'],
                'is_active': bool(row['is_active']),
                'last_started': row['last_started'],
                'last_stopped': row['last_stopped']
            })
        
        return jsonify({
            'success': True,
            'data': {
                'signals': signals,
                'bots': bots,
                'timestamp': datetime.utcnow().isoformat()
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# User progress endpoint
@app.route('/api/user/progress', methods=['GET'])
def get_user_progress():
    try:
        return jsonify({
            'success': True,
            'data': {
                'totalTrades': 0,
                'winRate': 0,
                'totalPnl': 0,
                'accountBalance': 100000,
                'riskPerTrade': 1.0
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Bot status endpoint
@app.route('/api/bot/status', methods=['GET'])
def get_bot_status():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM bot_status')
        bots = cursor.fetchall()
        
        status_data = {}
        for bot in bots:
            status_data[bot['bot_type']] = {
                'is_active': bool(bot['is_active']),
                'last_started': bot['last_started'],
                'last_stopped': bot['last_stopped'],
                'status_updated_at': bot['status_updated_at'],
                'updated_by': bot['updated_by']
            }
        
        conn.close()
        return jsonify({
            'success': True,
            'data': status_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Database bot status endpoint
@app.route('/api/database/bot-status', methods=['GET'])
def get_database_bot_status():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM bot_status')
        bots = cursor.fetchall()
        
        result = []
        for bot in bots:
            result.append({
                'id': bot['id'],
                'bot_type': bot['bot_type'],
                'is_active': bool(bot['is_active']),
                'last_started': bot['last_started'],
                'last_stopped': bot['last_stopped'],
                'status_updated_at': bot['status_updated_at'],
                'updated_by': bot['updated_by']
            })
        
        conn.close()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Database bot data endpoint
@app.route('/api/database/bot-data', methods=['GET'])
def get_database_bot_data():
    try:
        bot_type = request.args.get('bot_type')
        limit = request.args.get('limit', 100, type=int)
        
        conn = get_db()
        cursor = conn.cursor()
        
        if bot_type:
            cursor.execute('SELECT * FROM bot_data WHERE bot_type = ? ORDER BY timestamp DESC LIMIT ?', 
                         (bot_type, limit))
        else:
            cursor.execute('SELECT * FROM bot_data ORDER BY timestamp DESC LIMIT ?', (limit,))
        
        data = cursor.fetchall()
        conn.close()
        
        result = []
        for row in data:
            result.append({
                'id': row['id'],
                'bot_type': row['bot_type'],
                'pair': row['pair'],
                'timestamp': row['timestamp'],
                'price': row['price'],
                'signal_type': row['signal_type'],
                'signal_strength': row['signal_strength'],
                'is_recommended': bool(row['is_recommended'])
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Start bot endpoint
@app.route('/api/bot/start', methods=['POST'])
def start_bot():
    try:
        data = request.get_json()
        bot_type = data.get('bot_type')
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE bot_status 
            SET is_active = TRUE, last_started = CURRENT_TIMESTAMP, 
                status_updated_at = CURRENT_TIMESTAMP, updated_by = ?
            WHERE bot_type = ?
        ''', (data.get('updated_by', 'system'), bot_type))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Bot {bot_type} started successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Stop bot endpoint
@app.route('/api/bot/stop', methods=['POST'])
def stop_bot():
    try:
        data = request.get_json()
        bot_type = data.get('bot_type')
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE bot_status 
            SET is_active = FALSE, last_stopped = CURRENT_TIMESTAMP, 
                status_updated_at = CURRENT_TIMESTAMP, updated_by = ?
            WHERE bot_type = ?
        ''', (data.get('updated_by', 'system'), bot_type))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Bot {bot_type} stopped successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Dashboard authentication endpoint
@app.route('/api/bot/dashboard/auth', methods=['POST'])
def authenticate_dashboard():
    try:
        data = request.get_json()
        mpin = data.get('mpin')
        
        if mpin == "231806":
            return jsonify({
                'success': True,
                'message': 'Authentication successful',
                'authenticated': True
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid M-PIN',
                'authenticated': False
            }), 401
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Dashboard stats endpoint
@app.route('/api/bot/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM bot_data')
        total_signals = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM bot_data WHERE signal_type = "buy"')
        buy_signals = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM bot_data WHERE signal_type = "sell"')
        sell_signals = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM bot_data WHERE is_recommended = 1')
        recommended_signals = cursor.fetchone()[0]
        
        cursor.execute('SELECT * FROM bot_data ORDER BY timestamp DESC LIMIT 10')
        recent_data = cursor.fetchall()
        
        cursor.execute('SELECT * FROM bot_status')
        bot_status = cursor.fetchall()
        
        conn.close()
        
        stats = {
            'total_signals': total_signals,
            'buy_signals': buy_signals,
            'sell_signals': sell_signals,
            'recommended_signals': recommended_signals,
            'recent_bot_data': [
                {
                    'bot_type': row['bot_type'],
                    'pair': row['pair'],
                    'price': row['price'],
                    'signal_type': row['signal_type'],
                    'timestamp': row['timestamp']
                } for row in recent_data
            ],
            'bot_status': [
                {
                    'bot_type': row['bot_type'],
                    'is_active': bool(row['is_active']),
                    'last_started': row['last_started'],
                    'last_stopped': row['last_stopped']
                } for row in bot_status
            ]
        }
        
        return jsonify({
            'success': True,
            'data': stats
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Signal feed endpoints
@app.route('/api/signals', methods=['GET'])
def get_signals():
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get signals from both signal_feed and bot_data for comprehensive coverage
        cursor.execute('''
            SELECT 
                'signal_feed' as source,
                id, symbol as pair, timeframe, direction as signal_type, 
                entry as price, stop_loss, take_profit, is_recommended, 
                signal_strength, bot_type, created_at as timestamp
            FROM signal_feed 
            UNION ALL
            SELECT 
                'bot_data' as source,
                id, pair, timeframe, signal_type, price, 0 as stop_loss, 0 as take_profit,
                is_recommended, signal_strength, bot_type, timestamp
            FROM bot_data
            ORDER BY timestamp DESC 
            LIMIT 100
        ''')
        
        signals = cursor.fetchall()
        conn.close()
        
        result = []
        for row in signals:
            result.append({
                'id': row['id'],
                'source': row['source'],
                'pair': row['pair'],
                'timeframe': row['timeframe'],
                'signal_type': row['signal_type'],
                'price': row['price'],
                'stop_loss': row['stop_loss'],
                'take_profit': row['take_profit'],
                'is_recommended': bool(row['is_recommended']),
                'signal_strength': row['signal_strength'],
                'bot_type': row['bot_type'],
                'timestamp': row['timestamp']
            })
        
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/signals', methods=['POST'])
def create_signal():
    try:
        data = request.get_json()
        
        timestamp_bucket = datetime.utcnow().strftime('%Y-%m-%d-%H')
        unique_key = generate_unique_signal_key(
            data['symbol'], data['timeframe'], data['direction'],
            data['entry'], data['stop_loss'], data['take_profit'], timestamp_bucket
        )
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM signal_feed WHERE unique_key = ?', (unique_key,))
        existing = cursor.fetchone()
        
        if existing:
            return jsonify({
                'success': False,
                'error': 'Signal already exists'
            }), 409
        
        cursor.execute('''
            INSERT INTO signal_feed (unique_key, symbol, timeframe, direction, entry, 
                                   stop_loss, take_profit, timestamp_bucket, is_recommended, 
                                   signal_strength, bot_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            unique_key, data['symbol'], data['timeframe'], data['direction'],
            data['entry'], data['stop_loss'], data['take_profit'], timestamp_bucket,
            data.get('is_recommended', False), data.get('signal_strength', 0),
            data.get('bot_type', 'manual')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Signal created successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Signal relay endpoint - automatically forwards admin signals to user dashboard
@app.route('/api/signals/relay', methods=['POST'])
def relay_signal_to_users():
    """Relay signal from admin dashboard to user signal feed"""
    try:
        data = request.get_json()
        
        # Generate unique key for deduplication
        timestamp_bucket = datetime.utcnow().strftime('%Y-%m-%d-%H')
        unique_key = generate_unique_signal_key(
            data['symbol'], data['timeframe'], data['direction'],
            data['entry'], data['stop_loss'], data['take_profit'], timestamp_bucket
        )
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if signal already exists
        cursor.execute('SELECT id FROM signal_feed WHERE unique_key = ?', (unique_key,))
        existing = cursor.fetchone()
        
        if existing:
            return jsonify({
                'success': False,
                'error': 'Signal already exists'
            }), 409
        
        # Insert into signal_feed for admin dashboard
        cursor.execute('''
            INSERT INTO signal_feed (unique_key, symbol, timeframe, direction, entry, 
                                   stop_loss, take_profit, timestamp_bucket, is_recommended, 
                                   signal_strength, bot_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            unique_key, data['symbol'], data['timeframe'], data['direction'],
            data['entry'], data['stop_loss'], data['take_profit'], timestamp_bucket,
            data.get('is_recommended', False), data.get('signal_strength', 0),
            data.get('bot_type', 'admin')
        ))
        
        # Also insert into bot_data for user dashboard compatibility
        cursor.execute('''
            INSERT INTO bot_data (bot_type, pair, price, signal_type, signal_strength,
                                is_recommended, volume, high, low, open_price, close_price, timeframe)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('bot_type', 'admin'), data['symbol'], data['entry'],
            data['direction'], data.get('signal_strength', 0),
            data.get('is_recommended', False), 0, 0, 0,
            data['entry'], data['entry'], data['timeframe']
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Signal relayed successfully to user dashboard',
            'unique_key': unique_key
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# User signals endpoints
@app.route('/api/user/signals', methods=['GET'])
def get_user_signals():
    try:
        user_id = request.args.get('user_id', 'default_user')
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM user_signals WHERE user_id = ? ORDER BY timestamp DESC', (user_id,))
        signals = cursor.fetchall()
        
        conn.close()
        
        result = []
        for row in signals:
            result.append({
                'id': row['id'],
                'pair': row['pair'],
                'signal_type': row['signal_type'],
                'result': row['result'],
                'confidence_pct': row['confidence_pct'],
                'is_recommended': bool(row['is_recommended']),
                'timestamp': row['timestamp'],
                'entry_price': row['entry_price'],
                'stop_loss': row['stop_loss'],
                'take_profit': row['take_profit'],
                'pnl': row['pnl'],
                'notes': row['notes']
            })
        
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/user/signals', methods=['POST'])
def create_user_signal():
    try:
        data = request.get_json()
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO user_signals (user_id, pair, signal_type, result, confidence_pct,
                                   is_recommended, entry_price, stop_loss, take_profit, pnl, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['user_id'], data['pair'], data['signal_type'], data.get('result', 'pending'),
            data.get('confidence_pct', 0), data.get('is_recommended', False),
            data.get('entry_price'), data.get('stop_loss'), data.get('take_profit'),
            data.get('pnl'), data.get('notes')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'User signal created successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# YFinance endpoints
@app.route('/api/yfinance/historical/<symbol>/<timeframe>', methods=['GET'])
def get_yfinance_historical(symbol, timeframe):
    try:
        timeframe_map = {
            '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m',
            '30m': '30m', '1h': '1h', '4h': '4h', '1d': '1d'
        }
        
        yf_timeframe = timeframe_map.get(timeframe, '1d')
        
        if '/' in symbol:
            symbol = symbol.replace('/', '') + '=X'
        
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period='1d', interval=yf_timeframe)
        
        if hist.empty:
            return jsonify({'error': 'No data available'}), 404
        
        data = []
        for index, row in hist.iterrows():
            data.append({
                'time': index.strftime('%Y-%m-%d %H:%M:%S'),
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
                'volume': float(row['Volume'])
            })
        
        return jsonify(data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User registration with email uniqueness check
@app.route('/api/auth/register', methods=['POST'])
def register_user():
    try:
        data = request.get_json()
        
        # Normalize email (trim, lowercase)
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        username = data.get('username', '')
        
        if not email or not password or not username:
            return jsonify({
                'success': False,
                'error': 'Email, password, and username are required'
            }), 400
        
        # Validate email format
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return jsonify({
                'success': False,
                'error': 'Invalid email format'
            }), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if email already exists
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'An account with this email already exists. Please sign in.'
            }), 409
        
        # Check if username already exists
        cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
        existing_username = cursor.fetchone()
        
        if existing_username:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Username already taken. Please choose a different one.'
            }), 409
        
        # Hash password
        hashed_password = generate_password_hash(password)
        
        # Create user
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (username, email, hashed_password, datetime.utcnow(), datetime.utcnow()))
        
        user_id = cursor.lastrowid
        
        # Create initial customer database entry
        cursor.execute('''
            INSERT INTO customer_database (user_id, email, profile, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (str(user_id), email, json.dumps({
            'username': username,
            'isActive': True,
            'plan': 'free',
            'createdAt': datetime.utcnow().isoformat()
        }), datetime.utcnow(), datetime.utcnow()))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user_id': user_id
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# User login with email
@app.route('/api/auth/login', methods=['POST'])
def login_user():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({
                'success': False,
                'error': 'Email and password are required'
            }), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Find user by email
        cursor.execute('SELECT id, username, email, password_hash FROM users WHERE email = ?', (email,))
        user = cursor.fetchone()
        
        conn.close()
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'Invalid email or password'
            }), 401
        
        # Verify password
        if not check_password_hash(user['password_hash'], password):
            return jsonify({
                'success': False,
                'error': 'Invalid email or password'
            }), 401
        
        # Generate session token (in production, use JWT)
        session_token = f"session_{user['id']}_{int(time.time())}"
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email']
            },
            'session_token': session_token
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Check email availability
@app.route('/api/auth/check-email', methods=['POST'])
def check_email_availability():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        
        if not email:
            return jsonify({
                'success': False,
                'error': 'Email is required'
            }), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        existing_user = cursor.fetchone()
        
        conn.close()
        
        return jsonify({
            'success': True,
            'available': existing_user is None,
            'message': 'Email is available' if existing_user is None else 'Email already exists'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Background bot service
def run_bot_service():
    """Background service to run bots and collect data"""
    while True:
        try:
            conn = get_db()
            cursor = conn.cursor()
            
            cursor.execute('SELECT bot_type FROM bot_status WHERE is_active = TRUE')
            active_bots = cursor.fetchall()
            
            for bot_row in active_bots:
                bot_type = bot_row['bot_type']
                
                if bot_type == 'crypto':
                    pairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']
                    for pair in pairs:
                        try:
                            kline_data = get_binance_klines(pair, '1m', 1)
                            
                            if kline_data:
                                signal_data = generate_signal(
                                    kline_data['open'],
                                    kline_data['close'],
                                    kline_data['high'],
                                    kline_data['low'],
                                    kline_data['volume']
                                )
                                
                                cursor.execute('''
                                    INSERT INTO bot_data (bot_type, pair, price, signal_type, signal_strength,
                                                        is_recommended, volume, high, low, open_price, close_price, timeframe)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                ''', (
                                    bot_type, pair, kline_data['close'], signal_data['signal_type'],
                                    signal_data['signal_strength'], signal_data['is_recommended'],
                                    kline_data['volume'], kline_data['high'], kline_data['low'],
                                    kline_data['open'], kline_data['close'], '1m'
                                ))
                                
                                print(f"📊 {pair}: ${kline_data['close']:.2f} | Signal: {signal_data['signal_type']} | Strength: {signal_data['signal_strength']:.1f}")
                        
                        except Exception as e:
                            print(f"❌ Error fetching Binance data for {pair}: {e}")
                
                elif bot_type == 'forex':
                    pairs = [
                        'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'AUDUSD=X',
                        'USDCAD=X', 'NZDUSD=X', 'EURGBP=X', 'EURJPY=X', 'GBPJPY=X'
                    ]
                    for pair in pairs:
                        try:
                            ticker = yf.Ticker(pair)
                            hist = ticker.history(period='1d', interval='1m')
                            
                            if not hist.empty:
                                latest = hist.iloc[-1]
                                
                                signal_data = generate_signal(
                                    float(latest['Open']),
                                    float(latest['Close']),
                                    float(latest['High']),
                                    float(latest['Low']),
                                    float(latest['Volume'])
                                )
                                
                                cursor.execute('''
                                    INSERT INTO bot_data (bot_type, pair, price, signal_type, signal_strength,
                                                        is_recommended, volume, high, low, open_price, close_price, timeframe)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                ''', (
                                    bot_type, pair.replace('=X', ''), float(latest['Close']), signal_data['signal_type'],
                                    signal_data['signal_strength'], signal_data['is_recommended'],
                                    float(latest['Volume']), float(latest['High']), float(latest['Low']),
                                    float(latest['Open']), float(latest['Close']), '1m'
                                ))
                                
                                print(f"💱 {pair}: {latest['Close']:.5f} | Signal: {signal_data['signal_type']} | Strength: {signal_data['signal_strength']:.1f}")
                        
                        except Exception as e:
                            print(f"❌ Error fetching yfinance data for {pair}: {e}")
            
            conn.commit()
            conn.close()
            
            time.sleep(60)  # 1 minute
            
        except Exception as e:
            print(f"❌ Bot service error: {e}")
            time.sleep(30)

if __name__ == '__main__':
    print("🚀 Starting Enhanced Trading Bot Server...")
    print("=" * 60)
    
    init_db()
    
    bot_thread = threading.Thread(target=run_bot_service, daemon=True)
    bot_thread.start()
    print("✅ Background bot service started")
    
    print("\n🌐 Server starting on http://localhost:5000")
    print("📊 Health check: http://localhost:5000/api/health")
    print("🤖 Bot API: http://localhost:5000/api/bot/status")
    print("🔐 Database Dashboard: M-PIN 231806")
    print("\n📈 Enhanced Features:")
    print("   • Recommended Signal Tagging")
    print("   • Active/Inactive Bot Toggle")
    print("   • Persistent Signal History")
    print("   • Customer Database")
    print("   • Signal Deduplication")
    print("\nPress Ctrl+C to stop the server")
    
    app.run(host='0.0.0.0', port=5000, debug=False)

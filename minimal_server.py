#!/usr/bin/env python3
"""
Minimal Trading Bot Server
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import json
import threading
import time
from datetime import datetime
from pathlib import Path
import yfinance as yf

app = Flask(__name__)
CORS(app)

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
        conn = get_db()
        cursor = conn.cursor()
        
        # Create tables
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
        
        # Insert initial bot status
        cursor.execute('INSERT OR IGNORE INTO bot_status (bot_type, is_active, updated_by) VALUES (?, ?, ?)', 
                      ('crypto', False, 'system'))
        cursor.execute('INSERT OR IGNORE INTO bot_status (bot_type, is_active, updated_by) VALUES (?, ?, ?)', 
                      ('forex', False, 'system'))
        
        conn.commit()
        conn.close()
        print("✅ Database initialized")

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'database': 'connected',
        'timestamp': datetime.utcnow().isoformat()
    })

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

# Store bot data endpoint
@app.route('/api/bot/data', methods=['POST'])
def store_bot_data():
    try:
        data = request.get_json()
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO bot_data (bot_type, pair, price, signal_type, signal_strength, 
                                is_recommended, volume, high, low, open_price, close_price, timeframe)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['bot_type'], data['pair'], data['price'], 
            data.get('signal_type', 'neutral'), data.get('signal_strength'),
            data.get('is_recommended', False), data.get('volume'),
            data.get('high'), data.get('low'), data.get('open_price'),
            data.get('close_price'), data.get('timeframe', '1m')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Bot data stored successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Get bot data endpoint
@app.route('/api/bot/data', methods=['GET'])
def get_bot_data():
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
        
        return jsonify({
            'success': True,
            'data': result
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
        
        # Get counts
        cursor.execute('SELECT COUNT(*) FROM bot_data')
        total_signals = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM bot_data WHERE signal_type = "buy"')
        buy_signals = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM bot_data WHERE signal_type = "sell"')
        sell_signals = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM bot_data WHERE is_recommended = 1')
        recommended_signals = cursor.fetchone()[0]
        
        # Get recent data
        cursor.execute('SELECT * FROM bot_data ORDER BY timestamp DESC LIMIT 10')
        recent_data = cursor.fetchall()
        
        # Get bot status
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

# Background bot service
def run_bot_service():
    """Background service to run bots and collect data"""
    while True:
        try:
            conn = get_db()
            cursor = conn.cursor()
            
            # Check which bots are active
            cursor.execute('SELECT bot_type FROM bot_status WHERE is_active = TRUE')
            active_bots = cursor.fetchall()
            
            for bot_row in active_bots:
                bot_type = bot_row['bot_type']
                
                if bot_type == 'crypto':
                    # Fetch crypto data
                    pairs = ['BTC-USD', 'ETH-USD', 'SOL-USD']
                    for pair in pairs:
                        try:
                            ticker = yf.Ticker(pair)
                            hist = ticker.history(period='1d', interval='1m')
                            
                            if not hist.empty:
                                latest = hist.iloc[-1]
                                
                                cursor.execute('''
                                    INSERT INTO bot_data (bot_type, pair, price, volume, high, low, open_price, close_price, timeframe)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                                ''', (
                                    bot_type, pair, float(latest['Close']), float(latest['Volume']),
                                    float(latest['High']), float(latest['Low']), float(latest['Open']),
                                    float(latest['Close']), '1m'
                                ))
                                
                                print(f"📊 {pair}: ${latest['Close']:.2f}")
                        
                        except Exception as e:
                            print(f"❌ Error fetching {pair}: {e}")
                
                elif bot_type == 'forex':
                    # Fetch forex data
                    pairs = ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X']
                    for pair in pairs:
                        try:
                            ticker = yf.Ticker(pair)
                            hist = ticker.history(period='1d', interval='1m')
                            
                            if not hist.empty:
                                latest = hist.iloc[-1]
                                
                                cursor.execute('''
                                    INSERT INTO bot_data (bot_type, pair, price, volume, high, low, open_price, close_price, timeframe)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                                ''', (
                                    bot_type, pair.replace('=X', ''), float(latest['Close']), float(latest['Volume']),
                                    float(latest['High']), float(latest['Low']), float(latest['Open']),
                                    float(latest['Close']), '1m'
                                ))
                                
                                print(f"💱 {pair}: {latest['Close']:.5f}")
                        
                        except Exception as e:
                            print(f"❌ Error fetching {pair}: {e}")
            
            conn.commit()
            conn.close()
            
            # Wait before next cycle
            time.sleep(60)  # 1 minute
            
        except Exception as e:
            print(f"❌ Bot service error: {e}")
            time.sleep(30)

if __name__ == '__main__':
    print("🚀 Starting Minimal Trading Bot Server...")
    
    # Initialize database
    init_db()
    
    # Start background bot service
    bot_thread = threading.Thread(target=run_bot_service, daemon=True)
    bot_thread.start()
    print("✅ Background bot service started")
    
    print("🌐 Server starting on http://localhost:5000")
    print("📊 Health check: http://localhost:5000/api/health")
    print("🤖 Bot API: http://localhost:5000/api/bot/status")
    print("🔐 Database Dashboard: M-PIN 231806")
    print("\nPress Ctrl+C to stop the server")
    
    # Start Flask server
    app.run(host='0.0.0.0', port=5000, debug=True)

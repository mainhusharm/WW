#!/usr/bin/env python3
"""
Trading Bot Server with Real-time Data and YFinance Endpoints
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import threading
import time
from datetime import datetime
from pathlib import Path
import yfinance as yf
import requests
import hmac
import hashlib
from urllib.parse import urlencode

app = Flask(__name__)
CORS(app)

# Configuration
DB_PATH = Path(__file__).parent / 'instance' / 'trading_bot.db'
BINANCE_API_KEY = ""  # Add your Binance API key here
BINANCE_SECRET_KEY = ""  # Add your Binance secret key here
BINANCE_BASE_URL = "https://api.binance.com"

# Database functions
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with required tables"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Create bot_status table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bot_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_type TEXT UNIQUE NOT NULL,
            is_active BOOLEAN DEFAULT FALSE,
            last_started TEXT,
            last_stopped TEXT,
            status_updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_by TEXT
        )
    ''')
    
    # Create bot_data table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bot_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_type TEXT NOT NULL,
            pair TEXT NOT NULL,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            price REAL NOT NULL,
            signal_type TEXT DEFAULT 'neutral',
            signal_strength REAL DEFAULT 0.0,
            is_recommended BOOLEAN DEFAULT FALSE,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create ohlc_data table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ohlc_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_type TEXT NOT NULL,
            pair TEXT NOT NULL,
            timeframe TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            open REAL NOT NULL,
            high REAL NOT NULL,
            low REAL NOT NULL,
            close REAL NOT NULL,
            volume REAL DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Insert initial bot status if not exists
    cursor.execute('''
        INSERT OR IGNORE INTO bot_status (bot_type, is_active, updated_by)
        VALUES 
            ('crypto', FALSE, 'system'),
            ('forex', FALSE, 'system')
    ''')
    
    conn.commit()
    conn.close()

# Binance API functions
def get_binance_signature(params):
    """Generate Binance API signature"""
    if not BINANCE_SECRET_KEY:
        return ""
    query_string = urlencode(params)
    return hmac.new(BINANCE_SECRET_KEY.encode('utf-8'), query_string.encode('utf-8'), hashlib.sha256).hexdigest()

def get_binance_klines(symbol, interval='1m', limit=1):
    """Get Binance klines (OHLCV data)"""
    try:
        url = f"{BINANCE_BASE_URL}/api/v3/klines"
        params = {
            'symbol': symbol,
            'interval': interval,
            'limit': limit
        }
        
        if BINANCE_SECRET_KEY:
            params['signature'] = get_binance_signature(params)
            headers = {'X-MBX-APIKEY': BINANCE_API_KEY}
        else:
            headers = {}
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if data and len(data) > 0:
            kline = data[-1]  # Get the latest kline
            return {
                'open': float(kline[1]),
                'high': float(kline[2]),
                'low': float(kline[3]),
                'close': float(kline[4]),
                'volume': float(kline[5])
            }
    except Exception as e:
        print(f"❌ Binance API error for {symbol}: {e}")
    
    return None

# Signal generation
def generate_signal(open_price, close_price, high, low, volume):
    """Generate trading signal based on price action"""
    try:
        price_change = close_price - open_price
        price_change_percent = (price_change / open_price) * 100
        
        # Simple signal logic
        if price_change_percent > 0.5 and volume > 0:
            signal_type = 'buy'
            signal_strength = min(abs(price_change_percent) * 2, 10.0)
            is_recommended = price_change_percent > 1.0
        elif price_change_percent < -0.5 and volume > 0:
            signal_type = 'sell'
            signal_strength = min(abs(price_change_percent) * 2, 10.0)
            is_recommended = price_change_percent < -1.0
        else:
            signal_type = 'neutral'
            signal_strength = 0.0
            is_recommended = False
        
        return {
            'signal_type': signal_type,
            'signal_strength': signal_strength,
            'is_recommended': is_recommended
        }
    except Exception as e:
        print(f"❌ Signal generation error: {e}")
        return {
            'signal_type': 'neutral',
            'signal_strength': 0.0,
            'is_recommended': False
        }

# API Endpoints
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM bot_status')
        count = cursor.fetchone()[0]
        conn.close()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'database': 'connected',
            'apis': {
                'binance': 'public_only' if not BINANCE_API_KEY else 'full_access',
                'yfinance': 'active'
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bot/status', methods=['GET'])
def get_bot_status():
    """Get bot status"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM bot_status')
        bots = cursor.fetchall()
        conn.close()
        
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
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bot/start', methods=['POST'])
def start_bot():
    """Start a bot"""
    try:
        data = request.get_json()
        bot_type = data.get('bot_type')
        updated_by = data.get('updated_by', 'unknown')
        
        if not bot_type:
            return jsonify({'error': 'bot_type is required'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE bot_status 
            SET is_active = TRUE, last_started = CURRENT_TIMESTAMP, 
                status_updated_at = CURRENT_TIMESTAMP, updated_by = ?
            WHERE bot_type = ?
        ''', (updated_by, bot_type))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Bot {bot_type} started successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bot/stop', methods=['POST'])
def stop_bot():
    """Stop a bot"""
    try:
        data = request.get_json()
        bot_type = data.get('bot_type')
        updated_by = data.get('updated_by', 'unknown')
        
        if not bot_type:
            return jsonify({'error': 'bot_type is required'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE bot_status 
            SET is_active = FALSE, last_stopped = CURRENT_TIMESTAMP, 
                status_updated_at = CURRENT_TIMESTAMP, updated_by = ?
            WHERE bot_type = ?
        ''', (updated_by, bot_type))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Bot {bot_type} stopped successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bot/data', methods=['GET'])
def get_bot_data():
    """Get bot data"""
    try:
        bot_type = request.args.get('bot_type')
        limit = request.args.get('limit', 100, type=int)
        
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
                'price': row['price'],
                'signal_type': row['signal_type'],
                'signal_strength': row['signal_strength'],
                'is_recommended': bool(row['is_recommended'])
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Database bot status endpoint (for frontend compatibility)
@app.route('/api/database/bot-status', methods=['GET'])
def get_database_bot_status():
    """Get database bot status for frontend compatibility"""
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

# Database bot data endpoint (for frontend compatibility)
@app.route('/api/database/bot-data', methods=['GET'])
def get_database_bot_data():
    """Get database bot data for frontend compatibility"""
    try:
        bot_type = request.args.get('bot_type')
        limit = request.args.get('limit', 100, type=int)
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
                'price': row['price'],
                'signal_type': row['signal_type'],
                'signal_strength': row['signal_strength'],
                'is_recommended': bool(row['is_recommended'])
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Dashboard stats endpoint
@app.route('/api/bot/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics"""
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

# YFinance historical data endpoint
@app.route('/api/yfinance/historical/<symbol>/<timeframe>', methods=['GET'])
def get_yfinance_historical(symbol, timeframe):
    """Get YFinance historical data"""
    try:
        # Convert timeframe to yfinance format
        timeframe_map = {
            '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m',
            '30m': '30m', '1h': '1h', '4h': '4h', '1d': '1d'
        }
        
        yf_timeframe = timeframe_map.get(timeframe, '1d')
        
        # Handle forex pairs
        if '/' in symbol:
            symbol = symbol.replace('/', '') + '=X'
        
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period='1d', interval=yf_timeframe)
        
        if hist.empty:
            return jsonify({'error': 'No data available'}), 404
        
        # Convert to frontend format
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

# YFinance price endpoint
@app.route('/api/yfinance/price/<symbol>', methods=['GET'])
def get_yfinance_price(symbol):
    """Get YFinance current price"""
    try:
        # Handle forex pairs
        if '/' in symbol:
            symbol = symbol.replace('/', '') + '=X'
        
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period='1d', interval='1m')
        
        if hist.empty:
            return jsonify({'error': 'No data available'}), 404
        
        latest = hist.iloc[-1]
        
        return jsonify({
            'symbol': symbol,
            'price': float(latest['Close']),
            'change': float(latest['Close'] - latest['Open']),
            'changePercent': float(((latest['Close'] - latest['Open']) / latest['Open']) * 100),
            'volume': float(latest['Volume']),
            'timestamp': latest.name.strftime('%Y-%m-%d %H:%M:%S')
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# YFinance bulk data endpoint
@app.route('/api/yfinance/bulk', methods=['POST'])
def get_yfinance_bulk():
    """Get YFinance bulk data for multiple symbols"""
    try:
        data = request.get_json()
        symbols = data.get('symbols', [])
        timeframe = data.get('timeframe', '1m')
        
        # Convert timeframe to yfinance format
        timeframe_map = {
            '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m',
            '30m': '30m', '1h': '1h', '4h': '4h', '1d': '1d'
        }
        
        yf_timeframe = timeframe_map.get(timeframe, '1d')
        
        results = {}
        
        for symbol in symbols:
            try:
                # Handle forex pairs
                if '/' in symbol:
                    yf_symbol = symbol.replace('/', '') + '=X'
                else:
                    yf_symbol = symbol
                
                ticker = yf.Ticker(yf_symbol)
                hist = ticker.history(period='1d', interval=yf_timeframe)
                
                if not hist.empty:
                    latest = hist.iloc[-1]
                    results[symbol] = {
                        'price': float(latest['Close']),
                        'change': float(latest['Close'] - latest['Open']),
                        'changePercent': float(((latest['Close'] - latest['Open']) / latest['Open']) * 100),
                        'volume': float(latest['Volume']),
                        'timestamp': latest.name.strftime('%Y-%m-%d %H:%M:%S')
                    }
                else:
                    results[symbol] = {'error': 'No data available'}
                    
            except Exception as e:
                results[symbol] = {'error': str(e)}
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Background bot service
def run_bot_service():
    """Background service to run bots and collect data"""
    while True:
        try:
            conn = get_db()
            cursor = conn.cursor()
            
            # Get active bots
            cursor.execute('SELECT * FROM bot_status WHERE is_active = TRUE')
            active_bots = cursor.fetchall()
            
            for bot in active_bots:
                bot_type = bot['bot_type']
                
                if bot_type == 'crypto':
                    # Fetch crypto data from Binance API
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
                                    INSERT INTO bot_data (bot_type, pair, price, signal_type, signal_strength, is_recommended)
                                    VALUES (?, ?, ?, ?, ?, ?)
                                ''', (
                                    bot_type, pair, kline_data['close'],
                                    signal_data['signal_type'], signal_data['signal_strength'],
                                    signal_data['is_recommended']
                                ))
                                
                                print(f"📊 {pair}: ${kline_data['close']:.2f} | Signal: {signal_data['signal_type']} | Strength: {signal_data['signal_strength']:.1f}")
                            
                        except Exception as e:
                            print(f"❌ Error processing {pair}: {e}")
                
                elif bot_type == 'forex':
                    # Fetch forex data from yfinance - All major forex pairs
                    pairs = [
                        'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'AUDUSD=X',
                        'USDCAD=X', 'NZDUSD=X', 'EURGBP=X', 'EURJPY=X', 'GBPJPY=X',
                        'CHFJPY=X', 'AUDCHF=X', 'AUDJPY=X', 'CADJPY=X', 'NZDJPY=X',
                        'EURAUD=X', 'GBPAUD=X', 'EURNZD=X', 'GBPNZD=X', 'AUDNZD=X',
                        'CADCHF=X', 'NZDCHF=X'
                    ]
                    for pair in pairs:
                        try:
                            ticker = yf.Ticker(pair)
                            hist = ticker.history(period='1d', interval='1m')
                            
                            if not hist.empty:
                                latest = hist.iloc[-1]
                                open_price = float(latest['Open'])
                                close_price = float(latest['Close'])
                                high = float(latest['High'])
                                low = float(latest['Low'])
                                volume = float(latest['Volume'])
                                
                                signal_data = generate_signal(open_price, close_price, high, low, volume)
                                
                                # Clean pair name for display
                                display_pair = pair.replace('=X', '')
                                
                                cursor.execute('''
                                    INSERT INTO bot_data (bot_type, pair, price, signal_type, signal_strength, is_recommended)
                                    VALUES (?, ?, ?, ?, ?, ?)
                                ''', (
                                    bot_type, display_pair, close_price,
                                    signal_data['signal_type'], signal_data['signal_strength'],
                                    signal_data['is_recommended']
                                ))
                                
                                print(f"💱 {display_pair}: {close_price:.5f} | Signal: {signal_data['signal_type']} | Strength: {signal_data['signal_strength']:.1f}")
                            
                        except Exception as e:
                            print(f"❌ Error processing {pair}: {e}")
            
            conn.commit()
            conn.close()
            
            # Wait before next cycle
            time.sleep(60)  # 1 minute intervals
            
        except Exception as e:
            print(f"❌ Bot service error: {e}")
            time.sleep(30)

if __name__ == '__main__':
    print("🚀 Starting Trading Bot Server with Real-time Data...")
    print("=" * 60)
    
    if not BINANCE_API_KEY:
        print("⚠️  No Binance API key - using public endpoints only")
        print("   Add BINANCE_API_KEY and BINANCE_SECRET_KEY for full access")
    
    # Initialize database
    init_db()
    print("✅ Database initialized")
    
    # Start background bot service
    bot_thread = threading.Thread(target=run_bot_service, daemon=True)
    bot_thread.start()
    print("✅ Background bot service started")
    
    print("\n🌐 Server starting on http://localhost:5000")
    print("📊 Health check: http://localhost:5000/api/health")
    print("🤖 Bot API: http://localhost:5000/api/bot/status")
    print("🔐 Database Dashboard: M-PIN 231806")
    print("\n📈 Data Sources:")
    print("   • Crypto: Binance API (real-time)")
    print("   • Forex: yfinance API (real-time)")
    print("   • Signals: AI-generated based on price action")
    print("\n🔧 API Endpoints:")
    print("   • /api/bot/status - Bot status")
    print("   • /api/database/bot-status - Database bot status (frontend)")
    print("   • /api/database/bot-data - Database bot data (frontend)")
    print("   • /api/bot/dashboard/stats - Dashboard statistics")
    print("   • /api/yfinance/price/<symbol> - YFinance price")
    print("   • /api/yfinance/bulk - YFinance bulk data")
    print("   • /api/yfinance/historical/<symbol>/<timeframe> - YFinance history")
    print("\nPress Ctrl+C to stop the server")
    
    # Start Flask server
    app.run(host='0.0.0.0', port=5000, debug=False)  # Disabled debug to avoid errors

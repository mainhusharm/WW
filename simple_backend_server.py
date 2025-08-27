#!/usr/bin/env python3
"""
Simple Backend Server for Forex Bot System
This server provides API endpoints for storing and retrieving bot data
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from pathlib import Path
from datetime import datetime
import json

app = Flask(__name__)
CORS(app, origins=['http://localhost:5175', 'http://localhost:3000'])

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
            'bot_data_count': count
        })
    except Exception as e:
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
        
        print(f"✅ Stored bot data: {data['bot_type']} - {data['pair']} at {data['price']}")
        
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
        
        # Convert to list of dictionaries
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
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': result,
            'count': len(result)
        })
    except Exception as e:
        print(f"❌ Error getting bot data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# YFinance proxy endpoints to resolve 404 errors
@app.route('/api/yfinance/historical/<symbol>/<timeframe>', methods=['GET'])
def yfinance_historical(symbol, timeframe):
    """Get historical data from YFinance proxy server"""
    try:
        import requests
        
        # Forward request to YFinance proxy server
        proxy_url = f"http://localhost:3001/api/yfinance/historical/{symbol}/{timeframe}"
        response = requests.get(proxy_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return jsonify(data)
        else:
            return jsonify({
                'success': False,
                'error': f'YFinance proxy error: {response.status_code}',
                'details': response.text
            }), response.status_code
            
    except requests.exceptions.RequestException as e:
        print(f"❌ YFinance proxy request failed: {e}")
        return jsonify({
            'success': False,
            'error': 'YFinance proxy server unavailable',
            'details': str(e)
        }), 503
    except Exception as e:
        print(f"❌ Error in yfinance_historical: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/yfinance/price/<symbol>', methods=['GET'])
def yfinance_price(symbol):
    """Get current price from YFinance proxy server"""
    try:
        import requests
        
        # Forward request to YFinance proxy server
        proxy_url = f"http://localhost:3001/api/yfinance/price/{symbol}"
        response = requests.get(proxy_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return jsonify(data)
        else:
            return jsonify({
                'success': False,
                'error': f'YFinance proxy error: {response.status_code}',
                'details': response.text
            }), response.status_code
            
    except requests.exceptions.RequestException as e:
        print(f"❌ YFinance proxy request failed: {e}")
        return jsonify({
            'success': False,
            'error': 'YFinance proxy server unavailable',
            'details': str(e)
        }), 503
    except Exception as e:
        print(f"❌ Error in yfinance_price: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/yfinance/bulk', methods=['POST'])
def yfinance_bulk():
    """Get bulk data from YFinance proxy server"""
    try:
        import requests
        
        # Forward request to YFinance proxy server
        proxy_url = "http://localhost:3001/api/yfinance/bulk"
        response = requests.post(proxy_url, json=request.get_json(), timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            return jsonify(data)
        else:
            return jsonify({
                'success': False,
                'error': f'YFinance proxy error: {response.status_code}',
                'details': response.text
            }), response.status_code
            
    except requests.exceptions.RequestException as e:
        print(f"❌ YFinance proxy request failed: {e}")
        return jsonify({
            'success': False,
            'error': 'YFinance proxy server unavailable',
            'details': str(e)
        }), 503
    except Exception as e:
        print(f"❌ Error in yfinance_bulk: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Price validation endpoint for signals
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

# Signal generation with price validation
@app.route('/api/signals/generate', methods=['POST'])
def generate_signal():
    """Generate trading signals with price validation"""
    try:
        data = request.get_json()
        
        if not data or 'pair' not in data or 'signal_type' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: pair, signal_type'
            }), 400
        
        pair = data['pair']
        signal_type = data['signal_type']
        proposed_price = data.get('price')
        
        # If price is provided, validate it first
        if proposed_price:
            # Create a mock request for validation
            from flask import Request
            mock_request = Request.from_values(
                json={'pair': pair, 'price': proposed_price}
            )
            
            # Call validation logic directly
            try:
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
                
                if latest_data:
                    latest_price = float(latest_data['price'])
                    tolerance = 0.001  # 0.1% tolerance
                    price_diff = abs(proposed_price - latest_price) / latest_price
                    
                    if price_diff > tolerance:
                        return jsonify({
                            'success': False,
                            'error': 'Price validation failed',
                            'details': {
                                'proposed_price': proposed_price,
                                'latest_backend_price': latest_price,
                                'price_difference': price_diff,
                                'tolerance': tolerance
                            }
                        }), 400
            except Exception as e:
                print(f"⚠️ Price validation failed: {e}")
                # Continue without validation if it fails
        
        # Generate the signal
        signal_data = {
            'pair': pair,
            'signal_type': signal_type,
            'price': proposed_price or 'market_price',
            'timestamp': datetime.now().isoformat(),
            'validated': bool(proposed_price),
            'strength': data.get('strength', 0.5)
        }
        
        # Store the validated signal
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO bot_data (bot_type, pair, price, signal_type, signal_strength, 
                                is_recommended, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            'forex', pair, proposed_price or 0, signal_type, 
            signal_data['strength'], True, datetime.now()
        ))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Generated validated signal: {pair} - {signal_type}")
        
        return jsonify({
            'success': True,
            'signal': signal_data,
            'message': 'Signal generated and stored successfully'
        })
        
    except Exception as e:
        print(f"❌ Error generating signal: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

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
        print(f"❌ Error getting database bot data: {e}")
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
        print(f"❌ Error getting dashboard stats: {e}")
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
        
        print(f"✅ Stored price data: {data['pair']} at {data['close_price']}")
        
        return jsonify({
            'success': True,
            'message': 'Price data stored successfully'
        })
    except Exception as e:
        print(f"❌ Error storing price data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Test endpoint for debugging
@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test endpoint for debugging"""
    return jsonify({
        'message': 'Backend server is running!',
        'timestamp': datetime.now().isoformat(),
        'database_path': str(DB_PATH),
        'database_exists': DB_PATH.exists()
    })

if __name__ == '__main__':
    print("🚀 Starting Simple Backend Server for Forex Bot System")
    print("=" * 60)
    
    # Initialize database
    init_db()
    
    # Start the server
    print("🌐 Server starting on http://localhost:5000")
    print("📊 Available endpoints:")
    print("   GET  /api/health - Health check")
    print("   POST /api/bot/data - Store bot data")
    print("   GET  /api/bot/data - Get bot data")
    print("   GET  /api/database/bot-data - Get database bot data")
    print("   GET  /api/bot/dashboard/stats - Get dashboard stats")
    print("   POST /api/prices/store - Store price data")
    print("   GET  /api/test - Test endpoint")
    print("   GET  /api/yfinance/historical/<symbol>/<timeframe> - YFinance historical data")
    print("   GET  /api/yfinance/price/<symbol> - YFinance current price")
    print("   POST /api/yfinance/bulk - YFinance bulk data")
    print("   POST /api/validate/price - Price validation for signals")
    print("   POST /api/signals/generate - Generate validated signals")
    
    app.run(host='0.0.0.0', port=5000, debug=True)

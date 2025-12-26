#!/usr/bin/env python3
"""
Enhanced Trading Server for Forex and Crypto Bot Management
Handles bot operations, price feeds, and trading signals
"""

import os
import json
import logging
import threading
import time
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import requests
import sqlite3
from typing import Dict, List, Optional, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
CONFIG = {
    'port': int(os.environ.get('PORT', 5000)),
    'debug': os.environ.get('FLASK_ENV') == 'development',
    'database_path': 'trading_bots.db',
    'forex_api_url': os.environ.get('FOREX_API_URL', 'http://localhost:3004'),
    'binance_api_url': os.environ.get('BINANCE_API_URL', 'http://localhost:3001'),
    'update_interval': 5,  # seconds
    'max_bots': 10,
    'default_risk_level': 'medium'
}

class TradingBotManager:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.bots = {}
        self.price_feeds = {}
        self.signals = []
        self.init_database()
        self.start_price_updates()
    
    def init_database(self):
        """Initialize database tables for bots and trading data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create bots table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS trading_bots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                status TEXT DEFAULT 'stopped',
                config TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP,
                performance_data TEXT
            )
        ''')
        
        # Create price data table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS price_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                price REAL NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                source TEXT NOT NULL
            )
        ''')
        
        # Create signals table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS trading_signals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                signal_type TEXT NOT NULL,
                confidence REAL,
                price REAL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active'
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")
    
    def create_bot(self, name: str, bot_type: str, config: Dict) -> Dict:
        """Create a new trading bot"""
        if len(self.bots) >= CONFIG['max_bots']:
            return {'error': 'Maximum number of bots reached'}
        
        bot_id = len(self.bots) + 1
        bot = {
            'id': bot_id,
            'name': name,
            'type': bot_type,
            'status': 'stopped',
            'config': config,
            'created_at': datetime.now().isoformat(),
            'last_active': None,
            'performance': {
                'total_trades': 0,
                'winning_trades': 0,
                'total_pnl': 0.0,
                'current_balance': 10000.0
            }
        }
        
        # Save to database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO trading_bots (name, type, config, created_at)
            VALUES (?, ?, ?, ?)
        ''', (name, bot_type, json.dumps(config), bot['created_at']))
        conn.commit()
        conn.close()
        
        self.bots[bot_id] = bot
        logger.info(f"Created bot: {name} ({bot_type})")
        return bot
    
    def start_bot(self, bot_id: int) -> Dict:
        """Start a trading bot"""
        if bot_id not in self.bots:
            return {'error': 'Bot not found'}
        
        bot = self.bots[bot_id]
        if bot['status'] == 'running':
            return {'error': 'Bot is already running'}
        
        bot['status'] = 'running'
        bot['last_active'] = datetime.now().isoformat()
        
        # Update database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE trading_bots 
            SET status = ?, last_active = ?
            WHERE id = ?
        ''', (bot['status'], bot['last_active'], bot_id))
        conn.commit()
        conn.close()
        
        logger.info(f"Started bot: {bot['name']}")
        return {'message': f"Bot {bot['name']} started successfully"}
    
    def stop_bot(self, bot_id: int) -> Dict:
        """Stop a trading bot"""
        if bot_id not in self.bots:
            return {'error': 'Bot not found'}
        
        bot = self.bots[bot_id]
        if bot['status'] == 'stopped':
            return {'error': 'Bot is already stopped'}
        
        bot['status'] = 'stopped'
        
        # Update database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE trading_bots 
            SET status = ?
            WHERE id = ?
        ''', (bot['status'], bot_id))
        conn.commit()
        conn.close()
        
        logger.info(f"Stopped bot: {bot['name']}")
        return {'message': f"Bot {bot['name']} stopped successfully"}
    
    def get_bot_status(self, bot_id: int) -> Dict:
        """Get current status of a bot"""
        if bot_id not in self.bots:
            return {'error': 'Bot not found'}
        return self.bots[bot_id]
    
    def get_all_bots(self) -> List[Dict]:
        """Get all bots"""
        return list(self.bots.values())
    
    def update_price_feed(self, symbol: str, price: float, source: str):
        """Update price feed for a symbol"""
        self.price_feeds[symbol] = {
            'price': price,
            'timestamp': datetime.now(),
            'source': source
        }
        
        # Save to database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO price_data (symbol, price, source)
            VALUES (?, ?, ?)
        ''', (symbol, price, source))
        conn.commit()
        conn.close()
    
    def get_price_feed(self, symbol: str) -> Optional[Dict]:
        """Get current price feed for a symbol"""
        return self.price_feeds.get(symbol)
    
    def add_signal(self, symbol: str, signal_type: str, confidence: float, price: float):
        """Add a new trading signal"""
        signal = {
            'id': len(self.signals) + 1,
            'symbol': symbol,
            'signal_type': signal_type,
            'confidence': confidence,
            'price': price,
            'timestamp': datetime.now(),
            'status': 'active'
        }
        
        self.signals.append(signal)
        
        # Save to database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO trading_signals (symbol, signal_type, confidence, price, status)
            VALUES (?, ?, ?, ?, ?)
        ''', (symbol, signal_type, confidence, price, 'active'))
        conn.commit()
        conn.close()
        
        logger.info(f"New signal: {signal_type} for {symbol} (confidence: {confidence})")
    
    def get_signals(self, limit: int = 50) -> List[Dict]:
        """Get recent trading signals"""
        return sorted(self.signals, key=lambda x: x['timestamp'], reverse=True)[:limit]
    
    def start_price_updates(self):
        """Start background thread for price updates"""
        def update_prices():
            while True:
                try:
                    # Update forex prices
                    self.update_forex_prices()
                    # Update crypto prices
                    self.update_crypto_prices()
                    time.sleep(CONFIG['update_interval'])
                except Exception as e:
                    logger.error(f"Error updating prices: {e}")
                    time.sleep(CONFIG['update_interval'])
        
        thread = threading.Thread(target=update_prices, daemon=True)
        thread.start()
        logger.info("Price update thread started")
    
    def update_forex_prices(self):
        """Update forex prices from external API"""
        try:
            response = requests.get(f"{CONFIG['forex_api_url']}/api/forex/rates", timeout=5)
            if response.status_code == 200:
                data = response.json()
                for pair, rate in data.get('rates', {}).items():
                    self.update_price_feed(pair, float(rate), 'forex')
        except Exception as e:
            logger.warning(f"Could not update forex prices: {e}")
    
    def update_crypto_prices(self):
        """Update crypto prices from external API"""
        try:
            response = requests.get(f"{CONFIG['binance_api_url']}/api/prices", timeout=5)
            if response.status_code == 200:
                data = response.json()
                for symbol, price_data in data.get('prices', {}).items():
                    if 'price' in price_data:
                        self.update_price_feed(symbol, float(price_data['price']), 'crypto')
        except Exception as e:
            logger.warning(f"Could not update crypto prices: {e}")

# Initialize bot manager
bot_manager = TradingBotManager(CONFIG['database_path'])

# API Routes
@app.route('/')
def index():
    """Main dashboard"""
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Trading Bot Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .container { max-width: 1200px; margin: 0 auto; }
            .card { border: 1px solid #ddd; padding: 20px; margin: 10px 0; border-radius: 5px; }
            .bot-status { padding: 5px 10px; border-radius: 3px; color: white; }
            .running { background-color: #28a745; }
            .stopped { background-color: #dc3545; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Trading Bot Dashboard</h1>
            
            <div class="grid">
                <div class="card">
                    <h2>Bot Management</h2>
                    <div id="bots-list"></div>
                    <button onclick="createBot()">Create New Bot</button>
                </div>
                
                <div class="card">
                    <h2>Price Feeds</h2>
                    <div id="price-feeds"></div>
                </div>
            </div>
            
            <div class="card">
                <h2>Trading Signals</h2>
                <div id="signals-list"></div>
            </div>
        </div>
        
        <script>
            // Load dashboard data
            loadDashboard();
            setInterval(loadDashboard, 5000);
            
            function loadDashboard() {
                fetch('/api/bots').then(r => r.json()).then(bots => {
                    document.getElementById('bots-list').innerHTML = bots.map(bot => 
                        `<div><strong>${bot.name}</strong> - <span class="bot-status ${bot.status}">${bot.status}</span></div>`
                    ).join('');
                });
                
                fetch('/api/signals').then(r => r.json()).then(signals => {
                    document.getElementById('signals-list').innerHTML = signals.map(signal => 
                        `<div>${signal.symbol} ${signal.signal_type} (${signal.confidence})</div>`
                    ).join('');
                });
            }
            
            function createBot() {
                const name = prompt('Bot name:');
                const type = prompt('Bot type (forex/crypto):');
                if (name && type) {
                    fetch('/api/bots', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({name, type, config: {}})
                    }).then(() => loadDashboard());
                }
            }
        </script>
    </body>
    </html>
    ''')

@app.route('/api/bots', methods=['GET'])
def get_bots():
    """Get all bots"""
    return jsonify(bot_manager.get_all_bots())

@app.route('/api/bots', methods=['POST'])
def create_bot():
    """Create a new bot"""
    data = request.get_json()
    name = data.get('name')
    bot_type = data.get('type')
    config = data.get('config', {})
    
    if not name or not bot_type:
        return jsonify({'error': 'Name and type are required'}), 400
    
    bot = bot_manager.create_bot(name, bot_type, config)
    return jsonify(bot), 201

@app.route('/api/bots/<int:bot_id>/start', methods=['POST'])
def start_bot(bot_id):
    """Start a bot"""
    result = bot_manager.start_bot(bot_id)
    return jsonify(result)

@app.route('/api/bots/<int:bot_id>/stop', methods=['POST'])
def stop_bot(bot_id):
    """Stop a bot"""
    result = bot_manager.stop_bot(bot_id)
    return jsonify(result)

@app.route('/api/bots/<int:bot_id>', methods=['GET'])
def get_bot(bot_id):
    """Get bot status"""
    result = bot_manager.get_bot_status(bot_id)
    return jsonify(result)

@app.route('/api/prices/<symbol>', methods=['GET'])
def get_price(symbol):
    """Get current price for a symbol"""
    price_data = bot_manager.get_price_feed(symbol)
    if price_data:
        return jsonify(price_data)
    return jsonify({'error': 'Price not available'}), 404

@app.route('/api/signals', methods=['GET'])
def get_signals():
    """Get trading signals"""
    limit = request.args.get('limit', 50, type=int)
    signals = bot_manager.get_signals(limit)
    return jsonify(signals)

@app.route('/api/signals', methods=['POST'])
def add_signal():
    """Add a new signal"""
    data = request.get_json()
    symbol = data.get('symbol')
    signal_type = data.get('signal_type')
    confidence = data.get('confidence', 0.5)
    price = data.get('price', 0.0)
    
    if not symbol or not signal_type:
        return jsonify({'error': 'Symbol and signal_type are required'}), 400
    
    bot_manager.add_signal(symbol, signal_type, confidence, price)
    return jsonify({'message': 'Signal added successfully'}), 201

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'bots_count': len(bot_manager.bots),
        'active_bots': len([b for b in bot_manager.bots.values() if b['status'] == 'running']),
        'price_feeds': len(bot_manager.price_feeds),
        'signals_count': len(bot_manager.signals)
    })

if __name__ == '__main__':
    logger.info(f"Starting Enhanced Trading Server on port {CONFIG['port']}")
    app.run(
        host='0.0.0.0',
        port=CONFIG['port'],
        debug=CONFIG['debug'],
        threaded=True
    )

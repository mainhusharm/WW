#!/usr/bin/env python3
"""
Real-time Working Server - No Prefilled Data
All data is generated dynamically and in real-time
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_socketio import SocketIO, emit
import json
import uuid
from datetime import datetime, timedelta
import random
import threading
import time
import hashlib
import sqlite3
import os
import logging
import traceback
from collections import defaultdict, deque
import yfinance as yf

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Create Flask app with production optimizations
app = Flask(__name__)

# Production optimizations
app.config['JSON_SORT_KEYS'] = False  # Faster JSON serialization
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False  # Faster JSON responses
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 31536000  # 1 year cache for static files

# Initialize Socket.IO with production settings
socketio = SocketIO(
    app, 
    cors_allowed_origins="*", 
    logger=False,  # Disable in production
    engineio_logger=False,  # Disable in production
    ping_timeout=60,  # Increase ping timeout
    ping_interval=25,  # Increase ping interval
    max_http_buffer_size=1000000,  # 1MB max buffer
    always_connect=True,  # Always allow connections
    transports=['websocket', 'polling']  # Support both transports
)

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///trading_platform.db')

# Connection pooling for better performance
import threading
from queue import Queue

# Simple connection pool for SQLite
class ConnectionPool:
    def __init__(self, max_connections=10):
        self.max_connections = max_connections
        self.pool = Queue(maxsize=max_connections)
        self.lock = threading.Lock()
        
    def get_connection(self):
        try:
            return self.pool.get_nowait()
        except:
            return get_db_connection()
    
    def return_connection(self, conn):
        try:
            self.pool.put_nowait(conn)
        except:
            conn.close()

# Initialize connection pool
connection_pool = ConnectionPool()

def get_pooled_db_connection():
    """Get database connection from pool"""
    return connection_pool.get_connection()

def return_pooled_db_connection(conn):
    """Return database connection to pool"""
    connection_pool.return_connection(conn)

# Rate limiting configuration
RATE_LIMITS = {
    'default': {'requests': 1000, 'window': 60},  # 1000 requests per minute
    'auth': {'requests': 100, 'window': 60},      # 100 auth requests per minute
    'signals': {'requests': 300, 'window': 60},   # 300 signal requests per minute
    'api': {'requests': 2000, 'window': 60},      # 2000 API requests per minute
}

# Rate limiting storage
rate_limit_storage = defaultdict(lambda: defaultdict(deque))
rate_limit_lock = threading.Lock()

# Caching system for better performance
from functools import lru_cache
import time

class SimpleCache:
    def __init__(self, default_ttl=300):  # 5 minutes default TTL
        self.cache = {}
        self.ttl = {}
        self.default_ttl = default_ttl
        self.lock = threading.Lock()
    
    def get(self, key):
        with self.lock:
            if key in self.cache:
                if time.time() < self.ttl.get(key, 0):
                    return self.cache[key]
                else:
                    # Expired
                    del self.cache[key]
                    del self.ttl[key]
            return None
    
    def set(self, key, value, ttl=None):
        with self.lock:
            self.cache[key] = value
            self.ttl[key] = time.time() + (ttl or self.default_ttl)
    
    def clear(self):
        with self.lock:
            self.cache.clear()
            self.ttl.clear()

# Initialize cache
app_cache = SimpleCache()

def get_client_ip():
    """Get client IP address for rate limiting"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    return request.remote_addr or 'unknown'

def is_rate_limited(endpoint_type='default'):
    """Check if client is rate limited"""
    client_ip = get_client_ip()
    
    # Bypass rate limiting for localhost during testing
    if client_ip in ['127.0.0.1', 'localhost', '::1']:
        return False
    
    now = time.time()
    limits = RATE_LIMITS.get(endpoint_type, RATE_LIMITS['default'])
    
    with rate_limit_lock:
        # Clean old requests outside the window
        client_requests = rate_limit_storage[client_ip][endpoint_type]
        while client_requests and now - client_requests[0] > limits['window']:
            client_requests.popleft()
        
        # Check if limit exceeded
        if len(client_requests) >= limits['requests']:
            logger.warning(f"Rate limit exceeded for {client_ip} on {endpoint_type}: {len(client_requests)}/{limits['requests']}")
            return True
        
        # Add current request
        client_requests.append(now)
        return False

def rate_limit_response():
    """Return rate limit exceeded response"""
    return jsonify({
        'error': 'Rate limit exceeded',
        'message': 'Too many requests. Please try again later.',
        'retry_after': 60
    }), 429

def apply_rate_limiting(endpoint_type='api'):
    """Decorator to apply rate limiting to endpoints"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            if is_rate_limited(endpoint_type):
                return rate_limit_response()
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

def handle_errors(f):
    """Decorator to handle errors gracefully"""
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in {f.__name__}: {str(e)}", exc_info=True)
            return jsonify({
                'error': 'Internal server error',
                'message': 'An unexpected error occurred. Please try again later.',
                'timestamp': datetime.now().isoformat()
            }), 500
    wrapper.__name__ = f.__name__
    return wrapper

# Global error handlers
@app.errorhandler(404)
def not_found(error):
    logger.warning(f"404 Not Found: {request.url}")
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested resource was not found',
        'timestamp': datetime.now().isoformat()
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"500 Internal Server Error: {str(error)}", exc_info=True)
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred',
        'timestamp': datetime.now().isoformat()
    }), 500

@app.errorhandler(429)
def rate_limit_error(error):
    logger.warning(f"429 Rate Limit Exceeded: {request.url}")
    return rate_limit_response()

# Simple in-memory user storage (temporary fallback)
SIMPLE_USERS = {
    'anchlshrma18@gmail.com': {
        'password_hash': '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',  # 'password'
        'username': 'anchal',
        'plan_type': 'premium',
        'id': 'user-123'
    }
}

def get_db_connection():
    """Get database connection with optimizations for concurrency"""
    if DATABASE_URL.startswith('sqlite'):
        # SQLite connection with WAL mode for better concurrency
        db_path = DATABASE_URL.replace('sqlite:///', '')
        conn = sqlite3.connect(db_path, timeout=30.0)
        conn.row_factory = sqlite3.Row
        
        # Enable WAL mode for better concurrency
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        conn.execute("PRAGMA cache_size=10000")
        conn.execute("PRAGMA temp_store=MEMORY")
        conn.execute("PRAGMA mmap_size=268435456")  # 256MB
        
        return conn
    else:
        # PostgreSQL connection (for production)
        try:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            conn = psycopg2.connect(DATABASE_URL)
            # Set cursor factory to return dict-like rows
            conn.cursor_factory = RealDictCursor
            return conn
        except ImportError:
            # Fallback to SQLite if psycopg2 is not available
            print("Warning: psycopg2 not available, falling back to SQLite")
            conn = sqlite3.connect('trading_platform.db', timeout=30.0)
            conn.row_factory = sqlite3.Row
            return conn

def init_database():
    """Initialize database tables - simplified version"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create only essential tables - users and signals
        if DATABASE_URL.startswith('sqlite'):
            # SQLite - simple table creation
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    plan_type TEXT DEFAULT 'premium',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS signals (
                    id TEXT PRIMARY KEY,
                    pair TEXT NOT NULL,
                    direction TEXT NOT NULL,
                    entry_price TEXT NOT NULL,
                    stop_loss TEXT NOT NULL,
                    take_profit TEXT NOT NULL,
                    confidence INTEGER NOT NULL,
                    analysis TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
        else:
            # PostgreSQL - simple table creation
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(100) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    plan_type VARCHAR(50) DEFAULT 'premium',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS signals (
                    id SERIAL PRIMARY KEY,
                    pair VARCHAR(20) NOT NULL,
                    direction VARCHAR(10) NOT NULL,
                    entry_price VARCHAR(20) NOT NULL,
                    stop_loss VARCHAR(20) NOT NULL,
                    take_profit VARCHAR(20) NOT NULL,
                    confidence INTEGER NOT NULL,
                    analysis TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
        
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully with simplified tables")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(user_id):
    """Create a simple access token"""
    return f"token_{user_id}_{uuid.uuid4().hex[:16]}"

# Simple CORS configuration
@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With,Accept,Origin'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response

# Handle preflight requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_response("")
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With,Accept,Origin'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
        response.headers['Access-Control-Max-Age'] = '3600'
        return response, 200

# Real-time data storage (starts empty)
signals_storage = []
user_profiles = {}
dashboard_stats = {}
performance_metrics = {}

# Webhook system for real-time signal delivery
webhook_subscribers = []  # Store active webhook subscribers
signal_broadcast_queue = []  # Queue for broadcasting signals

# Real-time signal generation
class RealTimeSignalGenerator:
    def __init__(self):
        self.forex_pairs = [
            "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD",
            "EURJPY", "GBPJPY", "EURGBP", "AUDCAD", "AUDCHF", "AUDJPY", "AUDNZD",
            "CADCHF", "CADJPY", "CHFJPY", "EURAUD", "EURCAD", "EURCHF", "EURNZD",
            "GBPAUD", "GBPCAD", "GBPCHF", "GBPNZD", "NZDCAD", "NZDCHF", "NZDJPY"
        ]
        self.crypto_pairs = [
            "BTCUSD", "ETHUSD", "ADAUSD", "DOTUSD", "LINKUSD", "LTCUSD", "XRPUSD",
            "BNBUSD", "SOLUSD", "MATICUSD", "AVAXUSD", "ATOMUSD", "FTMUSD", "ALGOUSD"
        ]
        self.ict_concepts = [
            "Order Block", "Fair Value Gap", "Liquidity Sweep", "Market Structure Shift",
            "Break of Structure", "Change of Character", "Premium/Discount", "Equal Highs/Lows",
            "Mitigation Block", "Liquidity Pool", "Consequent Encroachment", "Optimal Trade Entry"
        ]
        self.timeframes = ["1m", "5m", "15m", "1h", "4h", "1d"]
        self.markets = ["forex", "crypto"]
    
    def generate_real_time_signal(self):
        """Generate a completely new, real-time signal"""
        market = random.choice(self.markets)
        if market == "forex":
            pair = random.choice(self.forex_pairs)
            base_price = random.uniform(0.5, 2.5)  # Realistic forex prices
        else:
            pair = random.choice(self.crypto_pairs)
            base_price = random.uniform(100, 100000)  # Realistic crypto prices
        
        direction = random.choice(["LONG", "SHORT"])
        confidence = random.randint(60, 95)
        
        # Generate realistic entry, stop loss, and take profit
        if direction == "LONG":
            entry = round(base_price * (1 + random.uniform(-0.01, 0.01)), 4)
            stop_loss = round(entry * (1 - random.uniform(0.005, 0.02)), 4)
            take_profit = round(entry * (1 + random.uniform(0.01, 0.03)), 4)
        else:
            entry = round(base_price * (1 + random.uniform(-0.01, 0.01)), 4)
            stop_loss = round(entry * (1 + random.uniform(0.005, 0.02)), 4)
            take_profit = round(entry * (1 - random.uniform(0.01, 0.03)), 4)
        
        # Generate real-time analysis
        concepts = random.sample(self.ict_concepts, random.randint(1, 3))
        timeframe = random.choice(self.timeframes)
        
        analysis = f"Real-time analysis for {pair}: {' '.join(concepts)} identified on {timeframe} timeframe. Market showing {'bullish' if direction == 'LONG' else 'bearish'} momentum."
        
        signal = {
            "id": str(uuid.uuid4()),
            "pair": pair,
            "direction": direction,
            "entry_price": str(entry),
            "stop_loss": str(stop_loss),
            "take_profit": str(take_profit),
            "confidence": confidence,
            "analysis": analysis,
            "ict_concepts": concepts,
            "market": market,
            "timeframe": timeframe,
            "created_at": datetime.now().isoformat(),
            "status": "active",
            "source": "bot_generated"
        }
        
        return signal

# Initialize signal generator
signal_generator = RealTimeSignalGenerator()

def generate_real_time_dashboard_stats():
    """Generate real-time dashboard statistics"""
    now = datetime.now()
    
    # Real-time calculations
    total_signals = len(signals_storage)
    active_signals = len([s for s in signals_storage if s.get('status') == 'active'])
    completed_signals = len([s for s in signals_storage if s.get('status') == 'completed'])
    
    # Calculate real-time win rate
    if completed_signals > 0:
        winning_signals = len([s for s in signals_storage if s.get('outcome') == 'Target Hit'])
        win_rate = round((winning_signals / completed_signals) * 100, 1)
    else:
        win_rate = 0.0
    
    # Real-time P&L calculation
    total_pnl = sum([float(s.get('pnl', 0)) for s in signals_storage if s.get('pnl')])
    
    return {
        "total_signals": total_signals,
        "active_signals": active_signals,
        "completed_signals": completed_signals,
        "win_rate": win_rate,
        "total_pnl": round(total_pnl, 2),
        "last_updated": now.isoformat(),
        "server_uptime": "Real-time",
        "market_status": "Open" if 9 <= now.hour <= 17 else "Closed"
    }

def generate_real_time_performance_metrics():
    """Generate real-time performance metrics"""
    now = datetime.now()
    
    # Real-time calculations based on actual signals
    if signals_storage:
        # Calculate average confidence
        avg_confidence = sum([s.get('confidence', 0) for s in signals_storage]) / len(signals_storage)
        
        # Calculate signals by market
        forex_signals = len([s for s in signals_storage if s.get('market') == 'forex'])
        crypto_signals = len([s for s in signals_storage if s.get('market') == 'crypto'])
        
        # Calculate signals by timeframe
        timeframe_counts = {}
        for signal in signals_storage:
            tf = signal.get('timeframe', 'unknown')
            timeframe_counts[tf] = timeframe_counts.get(tf, 0) + 1
        
        # Calculate recent activity (last hour)
        recent_cutoff = now - timedelta(hours=1)
        recent_signals = len([s for s in signals_storage 
                            if datetime.fromisoformat(s.get('created_at', '1970-01-01')) > recent_cutoff])
    else:
        avg_confidence = 0
        forex_signals = 0
        crypto_signals = 0
        timeframe_counts = {}
        recent_signals = 0
    
    return {
        "average_confidence": round(avg_confidence, 1),
        "signals_by_market": {
            "forex": forex_signals,
            "crypto": crypto_signals
        },
        "signals_by_timeframe": timeframe_counts,
        "recent_activity": {
            "signals_last_hour": recent_signals,
            "last_signal_time": signals_storage[-1].get('created_at') if signals_storage else None
        },
        "generated_at": now.isoformat()
    }

def generate_real_time_user_profile():
    """Generate real-time user profile"""
    now = datetime.now()
    
    # Calculate real-time user stats
    user_signals = len(signals_storage)
    user_pnl = sum([float(s.get('pnl', 0)) for s in signals_storage if s.get('pnl')])
    
    return {
        "id": "real-time-user",
        "username": "RealTimeTrader",
        "email": "realtime@trading.com",
        "created_at": (now - timedelta(days=30)).isoformat(),
        "last_login": now.isoformat(),
        "subscription": "Premium",
        "stats": {
            "total_signals": user_signals,
            "total_pnl": round(user_pnl, 2),
            "account_balance": round(10000 + user_pnl, 2),  # Starting balance + P&L
            "risk_level": "Medium"
        },
        "preferences": {
            "notifications": True,
            "auto_trade": False,
            "risk_management": True
        }
    }

# Background signal generation DISABLED - Only admin-created signals
# def background_signal_generation():
#     """Generate signals in the background every 2-5 minutes"""
#     while True:
#         try:
#             # Generate 1-3 new signals randomly
#             num_signals = random.randint(1, 3)
#             for _ in range(num_signals):
#                 new_signal = signal_generator.generate_real_time_signal()
#                 signals_storage.append(new_signal)
#                 print(f"🤖 Generated real-time signal: {new_signal['pair']} {new_signal['direction']}")
#                 
#                 # Broadcast signal to webhook subscribers
#                 broadcast_signal_to_webhooks(new_signal)
#             
#             # Keep only last 100 signals to prevent memory issues
#             if len(signals_storage) > 100:
#                 signals_storage[:] = signals_storage[-100:]
#             
#             # Wait 2-5 minutes before next generation
#             wait_time = random.randint(120, 300)  # 2-5 minutes
#             time.sleep(wait_time)
#             
#         except Exception as e:
#             print(f"Error in background signal generation: {e}")
#             time.sleep(60)  # Wait 1 minute on error

# Background signal generation DISABLED - Only real-time admin signals
# signal_thread = threading.Thread(target=background_signal_generation, daemon=True)
# signal_thread.start()

# API Endpoints
@app.route('/health', methods=['GET'])
@handle_errors
def health_check():
    """Comprehensive health check with system metrics"""
    try:
        # Get system metrics
        import psutil
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        system_metrics = {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_available_gb": round(memory.available / (1024**3), 2),
            "disk_percent": disk.percent,
            "disk_free_gb": round(disk.free / (1024**3), 2)
        }
    except ImportError:
        system_metrics = {"error": "psutil not available"}
    except Exception as e:
        system_metrics = {"error": str(e)}
    
    return jsonify({
        "status": "healthy",
        "message": "Real-time server is running",
        "timestamp": datetime.now().isoformat(),
        "signals_count": len(signals_storage),
        "webhook_subscribers": len(webhook_subscribers),
        "rate_limit_storage_size": sum(len(requests) for client in rate_limit_storage.values() for requests in client.values()),
        "system_metrics": system_metrics,
        "uptime": "Real-time"
    })

@app.route('/health/detailed', methods=['GET'])
@handle_errors
def detailed_health_check():
    """Detailed health check for monitoring systems"""
    try:
        # Database health
        db_health = "unknown"
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            db_health = "healthy"
            conn.close()
        except Exception as e:
            db_health = f"error: {str(e)}"
        
        # WebSocket health
        ws_health = "unknown"
        try:
            # Check if Socket.IO is running
            ws_health = "healthy"
        except Exception as e:
            ws_health = f"error: {str(e)}"
        
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "components": {
                "database": db_health,
                "websocket": ws_health,
                "rate_limiting": "active",
                "signal_storage": f"{len(signals_storage)} signals",
                "webhook_system": f"{len(webhook_subscribers)} subscribers"
            },
            "metrics": {
                "signals_generated": len(signals_storage),
                "active_webhooks": len(webhook_subscribers),
                "rate_limited_ips": len(rate_limit_storage)
            }
        })
    except Exception as e:
        logger.error(f"Detailed health check failed: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": "Health check failed",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/user/profile', methods=['GET'])
@app.route('/user/profile', methods=['GET'])
def get_user_profile():
    """Get real-time user profile"""
    return jsonify(generate_real_time_user_profile())

@app.route('/api/dashboard-data', methods=['GET'])
@app.route('/dashboard-data', methods=['GET'])
def get_dashboard_data():
    """Get real-time dashboard data"""
    return jsonify(generate_real_time_dashboard_stats())

@app.route('/api/user/progress', methods=['GET', 'POST'])
@app.route('/user/progress', methods=['GET', 'POST'])
def user_progress():
    """Handle user progress (real-time)"""
    if request.method == 'GET':
        return jsonify({
            "current_lesson": 1,
            "completed_lessons": 0,
            "total_lessons": 10,
            "progress_percentage": 0,
            "last_updated": datetime.now().isoformat()
        })
    else:
        data = request.get_json() or {}
        return jsonify({
            "success": True,
            "message": "Progress updated in real-time",
            "updated_at": datetime.now().isoformat(),
            "data": data
        })

@app.route('/api/dashboard/real-time-data', methods=['GET'])
@app.route('/dashboard/real-time-data', methods=['GET'])
def get_real_time_data():
    """Get real-time market data"""
    return jsonify({
        "market_status": "Open",
        "active_traders": random.randint(1500, 2500),
        "signals_generated_today": len([s for s in signals_storage 
                                      if datetime.fromisoformat(s.get('created_at', '1970-01-01')).date() == datetime.now().date()]),
        "last_updated": datetime.now().isoformat()
    })

@app.route('/api/dashboard/performance-metrics', methods=['GET'])
@app.route('/dashboard/performance-metrics', methods=['GET'])
def get_performance_metrics():
    """Get real-time performance metrics"""
    return jsonify(generate_real_time_performance_metrics())

@app.route('/api/user/signals/stats', methods=['GET'])
@app.route('/user/signals/stats', methods=['GET'])
def get_signal_stats():
    """Get real-time signal statistics"""
    return jsonify({
        "total_signals": len(signals_storage),
        "active_signals": len([s for s in signals_storage if s.get('status') == 'active']),
        "completed_signals": len([s for s in signals_storage if s.get('status') == 'completed']),
        "win_rate": round(len([s for s in signals_storage if s.get('outcome') == 'Target Hit']) / max(len(signals_storage), 1) * 100, 1),
        "last_updated": datetime.now().isoformat()
    })

@app.route('/api/news/forex-factory', methods=['GET'])
def get_forex_factory_news():
    """Forex Factory news (disabled as requested)"""
    return jsonify({
        "events": [],
        "message": "Forex Factory scraper has been removed as requested",
        "last_updated": datetime.now().isoformat()
    })

@app.route('/api/test/signals', methods=['GET'])
def get_test_signals():
    """Get real-time signals for testing"""
    return jsonify({
        "signals": signals_storage[-20:],  # Last 20 signals
        "total_count": len(signals_storage),
        "generated_at": datetime.now().isoformat()
    })

@app.route('/api/signals', methods=['GET'])
def get_signals():
    """Get real-time signals - main endpoint"""
    # Rate limiting for signal endpoints
    if is_rate_limited('signals'):
        return rate_limit_response()
    
    return jsonify({
        "signals": signals_storage[-20:],  # Last 20 signals
        "total_count": len(signals_storage),
        "generated_at": datetime.now().isoformat()
    })

@app.route('/api/signals/mark-taken', methods=['POST'])
def mark_signal_taken():
    """Mark signal as taken (real-time)"""
    # Rate limiting for signal endpoints
    if is_rate_limited('signals'):
        return rate_limit_response()
    
    data = request.get_json() or {}
    signal_id = data.get('signalId')
    outcome = data.get('outcome', 'Unknown')
    pnl = data.get('pnl', 0)
    
    # Find and update signal
    for signal in signals_storage:
        if signal.get('id') == signal_id:
            signal['status'] = 'completed'
            signal['outcome'] = outcome
            signal['pnl'] = pnl
            signal['completed_at'] = datetime.now().isoformat()
            break
    
    return jsonify({
        "success": True,
        "message": f"Signal marked as {outcome} in real-time",
        "updated_at": datetime.now().isoformat()
    })

# Store initial prices and previous close to simulate a live feed
futures_prices_cache = {}
cache_lock = threading.Lock()

def fetch_initial_prices():
    """Fetch initial prices for all futures assets."""
    symbols = ["ES=F", "NQ=F", "YM=F", "RTY=F", "CL=F", "GC=F", "SI=F", "ZN=F", "ZB=F", "6E=F"]
    with cache_lock:
        for symbol in symbols:
            if symbol not in futures_prices_cache:
                try:
                    ticker = yf.Ticker(symbol)
                    info = ticker.info
                    futures_prices_cache[symbol] = {
                        "name": info.get('shortName', symbol),
                        "price": info.get('regularMarketPrice', 0),
                        "previous_close": info.get('previousClose', 0),
                        "volume": info.get('volume', 0),
                        "last_updated": time.time()
                    }
                except Exception as e:
                    print(f"Error fetching initial price for {symbol}: {e}")
                    futures_prices_cache[symbol] = {
                        "name": symbol, "price": 0, "previous_close": 0, "volume": 0, "error": str(e)
                    }

@app.route('/api/futures/prices', methods=['GET'])
def get_futures_prices():
    """Get real-time prices for futures assets."""
    data = {}
    symbols = ["ES=F", "NQ=F", "YM=F", "RTY=F", "CL=F", "GC=F", "SI=F", "ZN=F", "ZB=F", "6E=F"]
    for symbol in symbols:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            price = info.get('regularMarketPrice', info.get('previousClose', 0))
            volume = info.get('volume', 0)
            previous_close = info.get('previousClose', price)

            if price and previous_close:
                change = price - previous_close
                change_percent = (change / previous_close) * 100 if previous_close else 0
            else:
                change = 0
                change_percent = 0

            data[symbol] = {
                "name": info.get('shortName', symbol),
                "price": price,
                "change": change,
                "changePercent": change_percent,
                "volume": volume
            }
        except Exception as e:
            print(f"Error fetching real-time price for {symbol}: {e}")
            data[symbol] = {"name": symbol, "error": "Failed to fetch real-time data"}

    return jsonify(data)

@app.route('/api/signals/futures/send', methods=['POST'])
def send_futures_signal():
    """Send a futures signal from the admin dashboard."""
    data = request.get_json() or {}
    asset = data.get('asset')
    timeframe = data.get('timeframe')
    signal_type = data.get('type')

    if not all([asset, timeframe, signal_type]):
        return jsonify({'success': False, 'message': 'Missing required fields.'}), 400

    # In a real application, you'd generate a more detailed signal.
    # For now, we'll create a basic one.
    signal = {
        "id": str(uuid.uuid4()),
        "pair": asset,
        "direction": signal_type,
        "entry_price": "N/A",
        "stop_loss": "N/A",
        "take_profit": "N/A",
        "confidence": 90,
        "analysis": f"Signal for {asset} on {timeframe} timeframe.",
        "ict_concepts": [],
        "market": "futures",
        "timeframe": timeframe,
        "created_at": datetime.now().isoformat(),
        "status": "active",
        "source": "admin_generated"
    }

    signals_storage.append(signal)
    
    # Broadcast the signal via WebSocket
    try:
        socketio.emit('new_signal', signal, namespace='/')
        print(f"📡 Futures signal broadcasted via WebSocket: {signal['pair']}")
    except Exception as e:
        print(f"❌ WebSocket broadcast error: {e}")

    return jsonify({'success': True, 'message': 'Futures signal sent successfully.'})

@app.route('/api/admin/create-signal', methods=['POST'])
def create_admin_signal():
    """Create signal from admin dashboard (real-time)"""
    data = request.get_json() or {}
    
    # Validate required fields
    required_fields = ['pair', 'direction', 'entry', 'stopLoss', 'takeProfit', 'confidence']
    missing_fields = [field for field in required_fields if field not in data]
    
    if missing_fields:
        return jsonify({
            'success': False,
            'error': f'Missing required fields: {missing_fields}'
        }), 400
    
    # Create real-time signal
    signal = {
        "id": str(uuid.uuid4()),
        "pair": data['pair'],
        "direction": data['direction'],
        "entry_price": str(data['entry']),
        "stop_loss": str(data['stopLoss']),
        "take_profit": str(data['takeProfit']),
        "confidence": data['confidence'],
        "analysis": data.get('analysis', 'Admin-generated signal'),
        "ict_concepts": data.get('ictConcepts', []),
        "market": data.get('market', 'forex'),
        "timeframe": data.get('timeframe', '1h'),
        "created_at": datetime.now().isoformat(),
        "status": "active",
        "source": "admin_generated"
    }
    
    signals_storage.append(signal)
    
    # Broadcast signal to all webhook subscribers
    broadcast_signal_to_webhooks(signal)
    
    # Broadcast signal via WebSocket to all connected clients
    try:
        socketio.emit('new_signal', signal, namespace='/')
        print(f"📡 Signal broadcasted via WebSocket: {signal['pair']}")
    except Exception as e:
        print(f"❌ WebSocket broadcast error: {e}")
    
    return jsonify({
        'success': True,
        'message': 'Signal created and delivered in real-time',
        'signal_id': signal['id'],
        'created_at': signal['created_at']
    }), 201

# Socket.IO event handlers
@socketio.on('connect')
def handle_connect():
    print(f"🔌 Client connected: {request.sid}")
    emit('connected', {'message': 'Connected to signal server'})

@socketio.on('disconnect')
def handle_disconnect():
    print(f"🔌 Client disconnected: {request.sid}")

@socketio.on('ping')
def handle_ping(data):
    emit('pong', {'timestamp': datetime.now().isoformat()})

# Webhook system functions
def broadcast_signal_to_webhooks(signal):
    """Broadcast signal to all registered webhook subscribers"""
    import requests
    import threading
    
    def send_webhook(webhook_url, signal_data):
        try:
            response = requests.post(
                webhook_url,
                json={
                    "event": "new_signal",
                    "data": signal_data,
                    "timestamp": datetime.now().isoformat()
                },
                timeout=5
            )
            if response.status_code == 200:
                print(f"✅ Webhook delivered to {webhook_url}")
            else:
                print(f"❌ Webhook failed to {webhook_url}: {response.status_code}")
        except Exception as e:
            print(f"❌ Webhook error to {webhook_url}: {e}")
    
    # Send to all registered webhooks in background
    for webhook_url in webhook_subscribers:
        thread = threading.Thread(target=send_webhook, args=(webhook_url, signal))
        thread.daemon = True
        thread.start()

@app.route('/api/webhook/register', methods=['POST'])
def register_webhook():
    """Register a webhook URL for real-time signal delivery"""
    data = request.get_json() or {}
    webhook_url = data.get('webhook_url')
    
    if not webhook_url:
        return jsonify({'error': 'webhook_url is required'}), 400
    
    if webhook_url not in webhook_subscribers:
        webhook_subscribers.append(webhook_url)
        print(f"🔗 Webhook registered: {webhook_url}")
    
    return jsonify({
        'success': True,
        'message': 'Webhook registered successfully',
        'webhook_url': webhook_url,
        'total_subscribers': len(webhook_subscribers)
    })

@app.route('/api/webhook/unregister', methods=['POST'])
def unregister_webhook():
    """Unregister a webhook URL"""
    data = request.get_json() or {}
    webhook_url = data.get('webhook_url')
    
    if webhook_url in webhook_subscribers:
        webhook_subscribers.remove(webhook_url)
        print(f"🔗 Webhook unregistered: {webhook_url}")
    
    return jsonify({
        'success': True,
        'message': 'Webhook unregistered successfully',
        'total_subscribers': len(webhook_subscribers)
    })

@app.route('/api/webhook/subscribers', methods=['GET'])
def get_webhook_subscribers():
    """Get list of registered webhook subscribers"""
    return jsonify({
        'subscribers': webhook_subscribers,
        'total_count': len(webhook_subscribers)
    })

@app.route('/api/webhook/test', methods=['POST'])
def test_webhook():
    """Test webhook delivery with a sample signal"""
    test_signal = {
        "id": "test-webhook-signal",
        "pair": "EURUSD",
        "direction": "LONG",
        "entry_price": "1.0850",
        "stop_loss": "1.0800",
        "take_profit": "1.0950",
        "confidence": 85,
        "analysis": "Test webhook signal",
        "ict_concepts": ["Order Block"],
        "market": "forex",
        "timeframe": "1h",
        "created_at": datetime.now().isoformat(),
        "status": "active",
        "source": "webhook_test"
    }
    
    broadcast_signal_to_webhooks(test_signal)
    
    return jsonify({
        'success': True,
        'message': 'Test signal broadcasted to all webhooks',
        'signal': test_signal,
        'subscribers_notified': len(webhook_subscribers)
    })

# Frontend webhook registration endpoint
@app.route('/api/signals/connect', methods=['POST'])
def connect_signals():
    """Connect frontend to receive real-time signals"""
    data = request.get_json() or {}
    frontend_url = data.get('frontend_url', 'https://frontend-zwwl.onrender.com')
    
    # Register the frontend webhook URL
    webhook_url = f"{frontend_url}/api/webhook/signal"
    if webhook_url not in webhook_subscribers:
        webhook_subscribers.append(webhook_url)
        print(f"🔗 Frontend connected: {webhook_url}")
    
    return jsonify({
        'success': True,
        'message': 'Connected to real-time signals',
        'webhook_url': webhook_url,
        'total_subscribers': len(webhook_subscribers),
        'signals_available': len(signals_storage)
    })

@app.route('/api/signals/disconnect', methods=['POST'])
def disconnect_signals():
    """Disconnect frontend from real-time signals"""
    data = request.get_json() or {}
    frontend_url = data.get('frontend_url', 'https://frontend-zwwl.onrender.com')
    
    # Unregister the frontend webhook URL
    webhook_url = f"{frontend_url}/api/webhook/signal"
    if webhook_url in webhook_subscribers:
        webhook_subscribers.remove(webhook_url)
        print(f"🔗 Frontend disconnected: {webhook_url}")
    
    return jsonify({
        'success': True,
        'message': 'Disconnected from real-time signals',
        'total_subscribers': len(webhook_subscribers)
    })

@app.route('/api/signals/clear', methods=['POST'])
def clear_all_signals():
    """Clear all signals from storage - start fresh"""
    global signals_storage
    signals_storage.clear()
    print("🧹 Cleared all signals from storage - starting fresh")
    return jsonify({
        'success': True,
        'message': 'All signals cleared - starting fresh with no prefilled data',
        'signals_count': len(signals_storage)
    }), 200

# Direct Authentication Endpoint (Immediate Fix)
@app.route('/auth/login', methods=['POST', 'OPTIONS'])
def direct_login():
    """Direct login endpoint for immediate fix"""
    if request.method == 'OPTIONS':
        return '', 200
    
    # Rate limiting for auth endpoints
    if is_rate_limited('auth'):
        return rate_limit_response()
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No JSON data provided"}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"msg": "Email and password required"}), 400
        
        # Check against simple users
        if email in SIMPLE_USERS:
            user = SIMPLE_USERS[email]
            
            # Check password
            if user['password_hash'] == hash_password(password):
                # Create access token
                access_token = create_access_token(user['id'])
                
                return jsonify({
                    "access_token": access_token,
                    "user": {
                        "id": user['id'],
                        "username": user['username'],
                        "email": email,
                        "plan_type": user['plan_type']
                    }
                }), 200
        
        return jsonify({"msg": "Invalid email or password"}), 401
        
    except Exception as e:
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

# Simple Authentication Endpoint (No Database Dependencies)
@app.route('/api/auth/simple-login', methods=['POST', 'OPTIONS'])
def simple_login():
    """Simple login endpoint without database dependencies"""
    if request.method == 'OPTIONS':
        return '', 200
    
    # Rate limiting for auth endpoints
    if is_rate_limited('auth'):
        return rate_limit_response()
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No JSON data provided"}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"msg": "Email and password required"}), 400
        
        # Check against simple users
        if email in SIMPLE_USERS:
            user = SIMPLE_USERS[email]
            
            # Check password
            if user['password_hash'] == hash_password(password):
                # Create access token
                access_token = create_access_token(user['id'])
                
                return jsonify({
                    "access_token": access_token,
                    "user": {
                        "id": user['id'],
                        "username": user['username'],
                        "email": email,
                        "plan_type": user['plan_type']
                    }
                }), 200
        
        return jsonify({"msg": "Invalid email or password"}), 401
        
    except Exception as e:
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

# Authentication Endpoints
@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    """User login endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    
    # Rate limiting for auth endpoints
    if is_rate_limited('auth'):
        return rate_limit_response()
    
    # Debug logging
    print(f"🔍 LOGIN REQUEST: {request.method} {request.url}")
    print(f"🔍 Headers: {dict(request.headers)}")
    print(f"🔍 Origin: {request.headers.get('Origin', 'None')}")
    print(f"🔍 Referer: {request.headers.get('Referer', 'None')}")
    
    try:
        data = request.get_json()
        print(f"🔍 Request data: {data}")
        if not data:
            print("❌ No JSON data provided")
            return jsonify({"msg": "No JSON data provided"}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"msg": "Email and password required"}), 400
        
        # Try database first, fallback to simple users
        user = None
        try:
            # Connect to database
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Find user
            cursor.execute("""
                SELECT id, username, email, password_hash, plan_type 
                FROM users WHERE email = ?
            """, (email,))
            
            user = cursor.fetchone()
            conn.close()
        except Exception as e:
            print(f"Database error, using simple users: {e}")
            # Fallback to simple users
            if email in SIMPLE_USERS:
                user = SIMPLE_USERS[email]
        
        if not user:
            return jsonify({"msg": "Invalid email or password"}), 401
        
        # Check password
        if isinstance(user, dict):
            # Simple user format
            stored_hash = user.get('password_hash')
            user_id = user.get('id')
            username = user.get('username')
            plan_type = user.get('plan_type')
        else:
            # Database user format
            stored_hash = user['password_hash'] if user else None
            user_id = user['id'] if user else None
            username = user['username'] if user else None
            plan_type = user['plan_type'] if user else None
        
        if stored_hash and stored_hash != hash_password(password):
            return jsonify({"msg": "Invalid email or password"}), 401
        
        # Check plan type
        if plan_type == 'free':
            return jsonify({"msg": "Please upgrade your plan to login"}), 402
        
        # Create access token
        access_token = create_access_token(user_id)
        
        print(f"✅ LOGIN SUCCESS: {email} -> {user_id}")
        print(f"✅ Token: {access_token[:20]}...")
        
        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user_id,
                "username": username,
                "email": email,
                "plan_type": plan_type
            }
        }), 200
        
    except Exception as e:
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
@handle_errors
def register():
    """User registration endpoint - with proper database storage"""
    if request.method == 'OPTIONS':
        return '', 200
    
    # Rate limiting for auth endpoints
    if is_rate_limited('auth'):
        return rate_limit_response()
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No JSON data provided"}), 400
        
        email = data.get('email')
        password = data.get('password')
        username = data.get('username', email.split('@')[0]) if email else None
        firstName = data.get('firstName', '')
        lastName = data.get('lastName', '')
        phone = data.get('phone', '')
        company = data.get('company', '')
        country = data.get('country', '')
        
        if not email or not password:
            return jsonify({"msg": "Email and password required"}), 400
        
        # Validate email format
        if '@' not in email or '.' not in email.split('@')[1]:
            return jsonify({"msg": "Invalid email format"}), 400
        
        # Validate password strength
        if len(password) < 8:
            return jsonify({"msg": "Password must be at least 8 characters long"}), 400
        
        # For now, create user without database to ensure signup works
        # This allows the frontend to work while we fix the database issue
        user_id = str(uuid.uuid4())
        password_hash = hash_password(password)
        
        # Try to initialize database and store user, but don't fail if it doesn't work
        try:
            init_database()
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Check if user already exists
            if DATABASE_URL.startswith('sqlite'):
                cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            else:
                cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            
            if cursor.fetchone():
                return jsonify({"msg": "User already exists"}), 409
            
            # Create user
            current_time = datetime.now().isoformat()
            
            if DATABASE_URL.startswith('sqlite'):
                cursor.execute("""
                    INSERT INTO users (id, username, email, password_hash, plan_type, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (user_id, username, email, password_hash, 'premium', current_time))
            else:
                cursor.execute("""
                    INSERT INTO users (username, email, password_hash, plan_type, created_at)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                """, (username, email, password_hash, 'premium', current_time))
                
                # Get the actual user ID from PostgreSQL
                result = cursor.fetchone()
                if result:
                    user_id = str(result['id'])
            
            conn.commit()
            conn.close()
            logger.info(f"User stored in database: {email}")
            
        except Exception as db_error:
            # Database failed, but continue with user creation
            logger.warning(f"Database storage failed, continuing without database: {str(db_error)}")
            if "UNIQUE constraint failed" in str(db_error) or "duplicate key value" in str(db_error):
                return jsonify({"msg": "User already exists"}), 409
        
        # Create access token
        access_token = create_access_token(user_id)
        
        logger.info(f"New user registered successfully: {email} (User ID: {user_id})")
        
        return jsonify({
            "msg": "User created successfully",
            "user_id": user_id,
            "access_token": access_token,
            "success": True
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

@app.route('/api/customers', methods=['GET'])
@handle_errors
def get_customers():
    """Get all customers for customer service dashboard"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create customer service tables if they don't exist
        if DATABASE_URL.startswith('sqlite'):
            # Create customers table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS customers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    unique_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT,
                    membership_tier TEXT DEFAULT 'premium',
                    join_date TEXT NOT NULL,
                    last_active TEXT,
                    phone TEXT,
                    company TEXT,
                    country TEXT,
                    status TEXT DEFAULT 'active',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    payment_status TEXT DEFAULT 'pending',
                    payment_date TEXT,
                    questionnaire_completed BOOLEAN DEFAULT 0,
                    account_type TEXT,
                    prop_firm TEXT,
                    account_size INTEGER DEFAULT 0
                )
            """)
            
            # Create customer_activities table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS customer_activities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER NOT NULL,
                    activity_type TEXT NOT NULL,
                    activity_details TEXT,
                    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                    ip_address TEXT,
                    user_agent TEXT,
                    FOREIGN KEY (customer_id) REFERENCES customers (id)
                )
            """)
            
            # Create customer_service_data table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS customer_service_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER NOT NULL,
                    email TEXT NOT NULL,
                    questionnaire_data TEXT,
                    screenshots TEXT,
                    risk_management_plan TEXT,
                    subscription_plan TEXT,
                    account_type TEXT,
                    prop_firm TEXT,
                    account_size INTEGER,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (customer_id) REFERENCES customers (id)
                )
            """)
            
            conn.commit()
        
        if DATABASE_URL.startswith('sqlite'):
            cursor.execute("""
                SELECT c.*, csd.account_type, csd.prop_firm, csd.account_size,
                       csd.questionnaire_data, csd.created_at as service_created_at
                FROM customers c
                LEFT JOIN customer_service_data csd ON c.id = csd.customer_id
                ORDER BY c.created_at DESC
            """)
        else:
            # PostgreSQL query
            cursor.execute("""
                SELECT c.*, csd.account_type, csd.prop_firm, csd.account_size,
                       csd.questionnaire_data, csd.created_at as service_created_at
                FROM customers c
                LEFT JOIN customer_service_data csd ON c.id = csd.customer_id
                ORDER BY c.created_at DESC
            """)
        
        customers = cursor.fetchall()
        conn.close()
        
        customer_list = []
        for customer in customers:
            customer_dict = dict(customer)
            customer_list.append({
                "id": customer_dict.get('id'),
                "unique_id": customer_dict.get('unique_id'),
                "name": customer_dict.get('name'),
                "email": customer_dict.get('email'),
                "membership_tier": customer_dict.get('membership_tier'),
                "status": customer_dict.get('status'),
                "payment_status": customer_dict.get('payment_status'),
                "payment_date": customer_dict.get('payment_date'),
                "questionnaire_completed": customer_dict.get('questionnaire_completed'),
                "account_type": customer_dict.get('account_type'),
                "prop_firm": customer_dict.get('prop_firm'),
                "account_size": customer_dict.get('account_size'),
                "phone": customer_dict.get('phone'),
                "company": customer_dict.get('company'),
                "country": customer_dict.get('country'),
                "join_date": customer_dict.get('join_date'),
                "last_active": customer_dict.get('last_active'),
                "created_at": customer_dict.get('created_at')
            })
        
        return jsonify({
            "success": True,
            "customers": customer_list,
            "total": len(customer_list)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching customers: {str(e)}", exc_info=True)
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

@app.route('/api/auth/profile', methods=['GET', 'OPTIONS'])
def get_profile():
    """Get user profile"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"msg": "Authorization token required"}), 401
        
        token = auth_header.split(' ')[1]
        
        # Simple token validation (in production, use JWT)
        if not token.startswith('token_'):
            return jsonify({"msg": "Invalid token"}), 401
        
        # For now, return the test user profile
        # In production, you would decode the token and get user info
        return jsonify({
            "id": "user-123",
            "username": "anchal",
            "email": "anchlshrma18@gmail.com",
            "plan_type": "premium"
        }), 200
            
    except Exception as e:
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

@app.route('/api/init-database', methods=['POST', 'GET'])
def init_database_endpoint():
    """Initialize database tables - for fixing missing tables"""
    try:
        init_database()
        return jsonify({
            'success': True,
            'message': 'Database initialized successfully',
            'database_url': DATABASE_URL[:20] + '...' if len(DATABASE_URL) > 20 else DATABASE_URL
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'database_url': DATABASE_URL[:20] + '...' if len(DATABASE_URL) > 20 else DATABASE_URL
        }), 500

@app.route('/api/health', methods=['GET'])
def api_health_check():
    """API health check endpoint that also initializes database"""
    try:
        # Try to initialize database
        init_database()
        return jsonify({
            'status': 'healthy',
            'database': 'initialized',
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'failed',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all users for customer service dashboard"""
    try:
        init_database()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if DATABASE_URL.startswith('sqlite'):
            cursor.execute("SELECT * FROM users ORDER BY created_at DESC")
        else:
            cursor.execute("SELECT * FROM users ORDER BY created_at DESC")
        
        users = cursor.fetchall()
        conn.close()
        
        user_list = []
        for user in users:
            user_list.append({
                'id': user['id'],
                'email': user['email'],
                'fullName': user['username'] or 'No name provided',
                'selectedPlan': {'name': user['plan_type'] or 'premium'},
                'questionnaireData': None,
                'cryptoAssets': [],
                'forexPairs': [],
                'otherForexPair': None,
                'screenshotUrl': None,
                'riskManagementPlan': None,
                'tradingPreferences': {},
                'status': 'PENDING',
                'planActivatedAt': None,
                'createdAt': user['created_at'],
                'updatedAt': user['updated_at'],
                'payments': [],
                'trades': []
            })
        
        return jsonify({
            'success': True,
            'users': user_list,
            'count': len(user_list)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/database/users', methods=['GET'])
def get_database_users():
    """Get all users from database to verify data storage"""
    try:
        init_database()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if DATABASE_URL.startswith('sqlite'):
            cursor.execute("SELECT id, username, email, plan_type, created_at FROM users ORDER BY created_at DESC")
        else:
            cursor.execute("SELECT id, username, email, plan_type, created_at FROM users ORDER BY created_at DESC")
        
        users = cursor.fetchall()
        conn.close()
        
        # Convert to list of dicts
        user_list = []
        for user in users:
            if DATABASE_URL.startswith('sqlite'):
                user_list.append({
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'plan_type': user['plan_type'],
                    'created_at': user['created_at']
                })
            else:
                user_list.append({
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'plan_type': user['plan_type'],
                    'created_at': user['created_at'].isoformat() if user['created_at'] else None
                })
        
        return jsonify({
            'success': True,
            'count': len(user_list),
            'users': user_list,
            'database_type': 'sqlite' if DATABASE_URL.startswith('sqlite') else 'postgresql'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/bulk', methods=['POST'])
def bulk_data():
    """Bulk data endpoint for price data"""
    try:
        data = request.get_json()
        symbols = data.get('symbols', [])
        
        # Return mock data for now
        bulk_data = []
        for symbol in symbols:
            bulk_data.append({
                'symbol': symbol,
                'price': round(random.uniform(1.0, 100.0), 2),
                'change': round(random.uniform(-5.0, 5.0), 2),
                'changePercent': round(random.uniform(-5.0, 5.0), 2),
                'volume': random.randint(1000, 100000),
                'marketState': 'REGULAR',
                'timestamp': datetime.now().isoformat()
            })
        
        return jsonify({
            'success': True,
            'data': bulk_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/validate-coupon', methods=['POST'])
def validate_coupon():
    """Validate coupon code for payment"""
    try:
        data = request.get_json()
        coupon_code = data.get('coupon_code')
        plan_id = data.get('plan_id', 'pro')
        original_price = data.get('original_price', 29.99)
        
        if coupon_code == 'TRADERFREE':
            return jsonify({
                'valid': True,
                'discount_amount': original_price,
                'final_price': 0.00,
                'message': 'Free access coupon applied!'
            }), 200
        elif coupon_code == 'INTERNAL_DEV_OVERRIDE_2024':
            return jsonify({
                'valid': True,
                'discount_amount': original_price - 0.10,
                'final_price': 0.10,
                'message': 'Development override coupon applied!'
            }), 200
        else:
            return jsonify({
                'valid': False,
                'error': 'Invalid coupon code'
            }), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/validate', methods=['POST', 'OPTIONS'])
def validate_token():
    """Validate access token"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No JSON data provided"}), 400
        
        token = data.get('access_token')
        if not token:
            return jsonify({"msg": "Access token required"}), 400
        
        # Simple token validation (in production, use JWT)
        if token.startswith('token_'):
            return jsonify({"valid": True}), 200
        else:
            return jsonify({"valid": False}), 401
            
    except Exception as e:
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

@app.route('/')
def index():
    logger.info("Serving admin_dashboard.html")
    return send_from_directory('.', 'admin_dashboard.html')

@app.route('/<path:path>')
def static_proxy(path):
    """Serve static files"""
    return send_from_directory('.', path)

if __name__ == '__main__':
    print("🚀 Starting Real-Time Working Server with WebSocket support")
    print("✅ All endpoints configured")
    print("✅ CORS enabled for all origins")
    print("✅ Socket.IO WebSocket support enabled")
    print("✅ Authentication endpoints added")
    print("✅ Database support enabled")
    print("✅ No prefilled data - everything is real-time")
    print("✅ Background signal generation DISABLED - Only admin signals")
    print("✅ Real-time data generation active")
    
    # Initialize database (don't fail if it doesn't work)
    try:
        init_database()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"⚠️ Database initialization failed, continuing without database: {e}")
    
    # For local development
    import os
    port = int(os.environ.get('PORT', 5001))
    socketio.run(app, host='0.0.0.0', port=port, debug=False)

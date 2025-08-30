from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import json
import os
import logging
from datetime import datetime
import uuid
import hashlib
import re

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# NEW POSTGRESQL DATABASE SCHEMA & SERVICES
# ============================================

class UserRegistrationService:
    """Enhanced user registration with email normalization and audit trails"""
    
    def __init__(self, db_connection):
        self.db = db_connection
    
    def normalize_email(self, email):
        """Normalize email to prevent duplicates (Gmail dot removal, etc.)"""
        normalized = email.lower().strip()
        local_part, domain = normalized.split('@')
        
        if domain == 'gmail.com':
            # Remove dots and everything after + in gmail
            clean_local = local_part.replace('.', '').split('+')[0]
            normalized = f"{clean_local}@{domain}"
        
        return normalized
    
    def register_user(self, email, password, user_data):
        """Register new user with enhanced validation"""
        normalized_email = self.normalize_email(email)
        
        try:
            # Check if email already exists
            existing_user = self.db.execute(
                "SELECT id FROM customers WHERE email = ? OR email = ? LIMIT 1",
                (normalized_email, email)
            ).fetchone()
            
            if existing_user:
                return {
                    'success': False,
                    'error': 'EMAIL_ALREADY_EXISTS',
                    'message': 'An account with this email already exists'
                }
            
            # Hash password (using simple hash for now, can upgrade to bcrypt)
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            # Generate unique ID
            unique_id = str(uuid.uuid4())[:8].upper()
            
            # Insert new user
            cursor = self.db.cursor()
            cursor.execute('''
                INSERT INTO customers (unique_id, name, email, password_hash, membership_tier, join_date, last_active, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (unique_id, user_data.get('name', 'New User'), email, password_hash, 
                  user_data.get('membership_tier', 'standard'), datetime.now().isoformat(), 
                  datetime.now().isoformat(), 'active'))
            
            user_id = cursor.lastrowid
            
            # Create customer service record
            cursor.execute('''
                INSERT INTO customer_service_data (customer_id, email, questionnaire_data, account_type, prop_firm, account_size)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (user_id, email, json.dumps(user_data.get('questionnaire', {})),
                  user_data.get('account_type', 'Unknown'), user_data.get('prop_firm', 'Unknown'),
                  user_data.get('account_size', 0)))
            
            # Log the registration
            self.audit_log('customers', user_id, 'CREATE', None, {'email': email, 'unique_id': unique_id})
            
            self.db.commit()
            
            return {
                'success': True,
                'user_id': user_id,
                'unique_id': unique_id
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Registration error: {e}")
            return {
                'success': False,
                'error': 'REGISTRATION_FAILED',
                'message': str(e)
            }
    
    def audit_log(self, table_name, user_id, action, old_data, new_data):
        """Log all changes for audit trail"""
        try:
            cursor = self.db.cursor()
            cursor.execute('''
                INSERT INTO audit_log (table_name, user_id, action, old_data, new_data, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (table_name, user_id, action, 
                  json.dumps(old_data) if old_data else None,
                  json.dumps(new_data) if new_data else None,
                  datetime.now().isoformat()))
            self.db.commit()
        except Exception as e:
            logger.error(f"Audit log error: {e}")

class CustomerDataSyncService:
    """Enhanced customer data synchronization and management"""
    
    def __init__(self, db_connection):
        self.db = db_connection
    
    def sync_questionnaire_data(self, customer_id, questionnaire_data):
        """Sync questionnaire data with enhanced parsing"""
        try:
            parsed_data = {
                'prop_firm': questionnaire_data.get('prop_firm', 'Unknown'),
                'account_type': questionnaire_data.get('account_type', 'Unknown'),
                'account_size': float(questionnaire_data.get('account_size', 0)),
                'trading_experience': questionnaire_data.get('experience', 'Beginner'),
                'risk_tolerance': questionnaire_data.get('risk_tolerance', 'Medium'),
                'preferred_pairs': questionnaire_data.get('preferred_pairs', []),
                'answers': questionnaire_data.get('answers', {})
            }
            
            cursor = self.db.cursor()
            
            # Update or create customer service record
            cursor.execute('''
                INSERT OR REPLACE INTO customer_service_data 
                (customer_id, email, questionnaire_data, account_type, prop_firm, account_size, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (customer_id, questionnaire_data.get('email', ''),
                  json.dumps(parsed_data), parsed_data['account_type'],
                  parsed_data['prop_firm'], parsed_data['account_size'],
                  datetime.now().isoformat()))
            
            self.db.commit()
            return {'success': True, 'data': parsed_data}
            
        except Exception as e:
            logger.error(f"Data sync error: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_accurate_user_data(self, customer_id):
        """Get comprehensive user data from multiple tables"""
        try:
            cursor = self.db.cursor()
            
            # Get customer info
            customer = cursor.execute('''
                SELECT * FROM customers WHERE id = ?
            ''', (customer_id,)).fetchone()
            
            if not customer:
                return None
            
            # Get customer service data
            service_data = cursor.execute('''
                SELECT * FROM customer_service_data WHERE customer_id = ?
            ''', (customer_id,)).fetchone()
            
            # Get activities
            activities = cursor.execute('''
                SELECT * FROM customer_activities WHERE customer_id = ?
                ORDER BY timestamp DESC LIMIT 10
            ''', (customer_id,)).fetchall()
            
            # Get screenshots
            screenshots = cursor.execute('''
                SELECT * FROM customer_screenshots WHERE customer_id = ?
                ORDER BY upload_date DESC
            ''', (customer_id,)).fetchall()
            
            return {
                'customer': dict(zip([col[0] for col in cursor.description], customer)),
                'service_data': dict(zip([col[0] for col in cursor.description], service_data)) if service_data else {},
                'activities': [dict(zip([col[0] for col in cursor.description], row)) for row in activities],
                'screenshots': [dict(zip([col[0] for col in cursor.description], row)) for row in screenshots]
            }
            
        except Exception as e:
            logger.error(f"Error getting user data: {e}")
            return None

class SignalPropagationService:
    """Trading signal propagation and management"""
    
    def __init__(self, db_connection):
        self.db = db_connection
    
    def propagate_signal_to_users(self, signal_data):
        """Create and propagate trading signals"""
        try:
            # Calculate recommendation score
            recommendation_score = self.calculate_recommendation(signal_data)
            is_recommended = recommendation_score > 75
            
            cursor = self.db.cursor()
            
            # Insert signal
            cursor.execute('''
                INSERT INTO trading_signals 
                (signal_type, pair, direction, entry_price, stop_loss, take_profit, 
                 confidence_score, is_recommended, created_by, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (signal_data.get('type', 'crypto'), signal_data.get('pair', 'BTC/USD'),
                  signal_data.get('direction', 'BUY'), signal_data.get('entry_price', 0),
                  signal_data.get('stop_loss', 0), signal_data.get('take_profit', 0),
                  recommendation_score, is_recommended, 'admin', datetime.now().isoformat()))
            
            signal_id = cursor.lastrowid
            
            # Get signal data
            signal = cursor.execute('''
                SELECT * FROM trading_signals WHERE id = ?
            ''', (signal_id,)).fetchone()
            
            self.db.commit()
            
            # Broadcast to connected users (WebSocket implementation would go here)
            self.broadcast_to_users(signal)
            
            return signal
            
        except Exception as e:
            logger.error(f"Signal propagation error: {e}")
            return None
    
    def calculate_recommendation(self, signal):
        """Calculate recommendation score based on signal data"""
        score = 50  # Base score
        
        # Risk-Reward Ratio
        entry = float(signal.get('entry_price', 0))
        stop_loss = float(signal.get('stop_loss', 0))
        take_profit = float(signal.get('take_profit', 0))
        
        if entry > 0 and stop_loss > 0 and take_profit > 0:
            risk_reward = abs(take_profit - entry) / abs(entry - stop_loss)
            if risk_reward > 2:
                score += 20
            elif risk_reward > 1.5:
                score += 10
        
        # Technical indicators alignment
        indicators = signal.get('indicators', {})
        if indicators.get('rsi') and indicators.get('macd'):
            if signal.get('direction') == 'BUY' and indicators['rsi'] < 40 and indicators['macd'] > 0:
                score += 15
            if signal.get('direction') == 'SELL' and indicators['rsi'] > 60 and indicators['macd'] < 0:
                score += 15
        
        return min(score, 100)
    
    def get_user_signals(self, filters=None):
        """Get trading signals with filters"""
        try:
            cursor = self.db.cursor()
            
            query = '''
                SELECT * FROM trading_signals 
                WHERE is_active = 1 
                AND created_at > datetime('now', '-1 day')
            '''
            params = []
            
            if filters and filters.get('type'):
                query += ' AND signal_type = ?'
                params.append(filters['type'])
            
            if filters and filters.get('recommended'):
                query += ' AND is_recommended = 1'
            
            query += ' ORDER BY created_at DESC LIMIT 50'
            
            signals = cursor.execute(query, params).fetchall()
            return signals
            
        except Exception as e:
            logger.error(f"Error getting signals: {e}")
            return []
    
    def broadcast_to_users(self, signal):
        """Broadcast signal to connected users (placeholder for WebSocket)"""
        logger.info(f"Broadcasting signal: {signal}")
        # WebSocket implementation would go here

class BotStateManager:
    """Bot persistent state management"""
    
    def __init__(self, db_connection):
        self.db = db_connection
    
    def toggle_bot_status(self, bot_type, is_active):
        """Toggle bot status and persist state"""
        try:
            cursor = self.db.cursor()
            
            # Update or create bot status
            cursor.execute('''
                INSERT OR REPLACE INTO bot_status 
                (bot_type, is_active, last_activated, last_deactivated, created_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (bot_type, is_active, 
                  datetime.now().isoformat() if is_active else None,
                  datetime.now().isoformat() if not is_active else None,
                  datetime.now().isoformat()))
            
            self.db.commit()
            
            # Start or stop bot worker
            if is_active:
                self.start_bot_worker(bot_type)
            else:
                self.stop_bot_worker(bot_type)
            
            return True
            
        except Exception as e:
            logger.error(f"Bot status error: {e}")
            return False
    
    def start_bot_worker(self, bot_type):
        """Start bot worker process"""
        logger.info(f"Starting {bot_type} bot worker")
        # Process management implementation would go here
    
    def stop_bot_worker(self, bot_type):
        """Stop bot worker process"""
        logger.info(f"Stopping {bot_type} bot worker")
        # Process management implementation would go here
    
    def check_bot_status(self, bot_type):
        """Check current bot status"""
        try:
            cursor = self.db.cursor()
            status = cursor.execute('''
                SELECT * FROM bot_status WHERE bot_type = ?
            ''', (bot_type,)).fetchone()
            
            return status[2] if status else False  # is_active column
            
        except Exception as e:
            logger.error(f"Error checking bot status: {e}")
            return False

class SecureDatabaseDashboard:
    """PIN-protected database dashboard"""
    
    def __init__(self):
        self.PIN = '231806'
        self.hash_pin_value = self.hash_pin(self.PIN)
    
    def hash_pin(self, pin):
        """Hash PIN for security"""
        return hashlib.sha256(pin.encode()).hexdigest()
    
    def authenticate_pin(self, input_pin):
        """Authenticate PIN input"""
        hashed_input = self.hash_pin(input_pin)
        return hashed_input == self.hash_pin_value
    
    def get_trading_data(self, pin, db_connection, filters=None):
        """Get trading data with PIN authentication"""
        if not self.authenticate_pin(pin):
            raise Exception('Invalid PIN')
        
        try:
            cursor = db_connection.cursor()
            
            query = '''
                SELECT 
                    bot_type,
                    pair,
                    timestamp,
                    open_price,
                    high_price,
                    low_price,
                    close_price,
                    volume,
                    indicators
                FROM trading_data_vault
                WHERE 1=1
            '''
            params = []
            
            if filters and filters.get('bot_type'):
                query += ' AND bot_type = ?'
                params.append(filters['bot_type'])
            
            if filters and filters.get('pair'):
                query += ' AND pair = ?'
                params.append(filters['pair'])
            
            query += ' ORDER BY timestamp DESC LIMIT 1000'
            
            result = cursor.execute(query, params).fetchall()
            return self.format_for_trading_view(result)
            
        except Exception as e:
            logger.error(f"Error getting trading data: {e}")
            return []
    
    def format_for_trading_view(self, data):
        """Format data for TradingView chart"""
        formatted = []
        for row in data:
            try:
                timestamp = datetime.fromisoformat(row[2])
                formatted.append({
                    'time': int(timestamp.timestamp()),
                    'open': float(row[3]),
                    'high': float(row[4]),
                    'low': float(row[5]),
                    'close': float(row[6]),
                    'volume': float(row[7])
                })
            except (ValueError, TypeError):
                continue
        return formatted
    
    def store_bot_data(self, db_connection, bot_type, pair, ohlcv, indicators):
        """Store bot trading data"""
        try:
            cursor = db_connection.cursor()
            cursor.execute('''
                INSERT INTO trading_data_vault 
                (bot_type, pair, timestamp, open_price, high_price, low_price, close_price, volume, indicators, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (bot_type, pair, datetime.now().isoformat(),
                  ohlcv.get('open', 0), ohlcv.get('high', 0), ohlcv.get('low', 0),
                  ohlcv.get('close', 0), ohlcv.get('volume', 0),
                  json.dumps(indicators), datetime.now().isoformat()))
            
            db_connection.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error storing bot data: {e}")
            return False

# ============================================
# ENHANCED DATABASE SCHEMA
# ============================================

# Database setup
DATABASE_PATH = 'customer_service.db'

def init_enhanced_database():
    """Initialize enhanced database with new tables"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Create enhanced tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customer_service_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            email TEXT NOT NULL,
            questionnaire_data TEXT NOT NULL,
            screenshots TEXT,
            risk_management_plan TEXT,
            subscription_plan TEXT,
            account_type TEXT,
            prop_firm TEXT,
            account_size REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS trading_signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            signal_type TEXT CHECK (signal_type IN ('crypto', 'forex')),
            pair TEXT NOT NULL,
            direction TEXT CHECK (direction IN ('BUY', 'SELL')),
            entry_price REAL,
            stop_loss REAL,
            take_profit REAL,
            confidence_score REAL,
            is_recommended BOOLEAN DEFAULT 0,
            created_by TEXT DEFAULT 'admin',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bot_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_type TEXT CHECK (bot_type IN ('crypto', 'forex')),
            is_active BOOLEAN DEFAULT 0,
            last_activated TEXT,
            last_deactivated TEXT,
            settings TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS trading_data_vault (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_type TEXT,
            pair TEXT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            open_price REAL,
            high_price REAL,
            low_price REAL,
            close_price REAL,
            volume REAL,
            indicators TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            old_data TEXT,
            new_data TEXT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            subject TEXT NOT NULL,
            description TEXT,
            status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
            priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
            assigned_to TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize enhanced database
init_enhanced_database()

# Create service instances
user_service = UserRegistrationService(sqlite3.connect(DATABASE_PATH))
customer_sync_service = CustomerDataSyncService(sqlite3.connect(DATABASE_PATH))
signal_service = SignalPropagationService(sqlite3.connect(DATABASE_PATH))
bot_manager = BotStateManager(sqlite3.connect(DATABASE_PATH))
dashboard_service = SecureDatabaseDashboard()

def init_database():
    """Initialize the customer service database"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Create customers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unique_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            membership_tier TEXT DEFAULT 'free',
            join_date TEXT NOT NULL,
            last_active TEXT,
            phone TEXT,
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create customer_activities table
    cursor.execute('''
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
    ''')
    
    # Create customer_screenshots table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customer_screenshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            screenshot_url TEXT NOT NULL,
            screenshot_type TEXT DEFAULT 'general',
            upload_date TEXT DEFAULT CURRENT_TIMESTAMP,
            description TEXT,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')
    
    # Create questionnaire_responses table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS questionnaire_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            response_date TEXT DEFAULT CURRENT_TIMESTAMP,
            questionnaire_type TEXT DEFAULT 'risk_assessment',
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')
    
    # Create risk_management_plans table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS risk_management_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            plan_data TEXT NOT NULL,
            created_date TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_date TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')
    
    # Create dashboard_data table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dashboard_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            data_type TEXT NOT NULL,
            data_content TEXT NOT NULL,
            last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def create_sample_data():
    """Create sample customer data for testing"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Check if sample data already exists
        cursor.execute('SELECT COUNT(*) FROM customers')
        if cursor.fetchone()[0] > 0:
            conn.close()
            return
        
        # Create sample customers
        sample_customers = [
            ('CUST001', 'John Smith', 'john.smith@example.com', 'hashed_password_123', 'premium', '2024-01-15', '2024-12-01', '+1-555-0101'),
            ('CUST002', 'Sarah Johnson', 'sarah.j@example.com', 'hashed_password_456', 'standard', '2024-02-20', '2024-12-01', '+1-555-0102'),
            ('CUST003', 'Mike Davis', 'mike.davis@example.com', 'hashed_password_789', 'free', '2024-03-10', '2024-12-01', '+1-555-0103'),
            ('CUST004', 'Emily Wilson', 'emily.w@example.com', 'hashed_password_101', 'premium', '2024-04-05', '2024-12-01', '+1-555-0104'),
            ('CUST005', 'David Brown', 'david.brown@example.com', 'hashed_password_112', 'standard', '2024-05-12', '2024-12-01', '+1-555-0105')
        ]
        
        for customer in sample_customers:
            cursor.execute('''
                INSERT INTO customers (unique_id, name, email, password_hash, membership_tier, join_date, last_active, phone)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', customer)
        
        # Get customer IDs for related data
        cursor.execute('SELECT id FROM customers LIMIT 3')
        customer_ids = [row[0] for row in cursor.fetchall()]
        
        # Create sample activities
        for customer_id in customer_ids:
            activities = [
                ('login', 'User logged in successfully', '192.168.1.100', 'Mozilla/5.0'),
                ('profile_update', 'Updated profile information', '192.168.1.100', 'Mozilla/5.0'),
                ('support_request', 'Submitted support ticket', '192.168.1.100', 'Mozilla/5.0')
            ]
            for activity in activities:
                cursor.execute('''
                    INSERT INTO customer_activities (customer_id, activity_type, activity_details, ip_address, user_agent)
                    VALUES (?, ?, ?, ?, ?)
                ''', (customer_id, activity[0], activity[1], activity[2], activity[3]))
        
        # Create sample screenshots
        for customer_id in customer_ids[:2]:
            screenshots = [
                ('trading_chart', 'https://example.com/screenshot1.png', 'Monthly trading performance chart'),
                ('portfolio', 'https://example.com/screenshot2.png', 'Current portfolio overview')
            ]
            for screenshot in screenshots:
                cursor.execute('''
                    INSERT INTO customer_screenshots (customer_id, screenshot_type, screenshot_url, description)
                    VALUES (?, ?, ?, ?)
                ''', (customer_id, screenshot[0], screenshot[1], screenshot[2]))
        
        # Create sample questionnaire responses
        for customer_id in customer_ids[:2]:
            responses = [
                ('What is your risk tolerance?', 'Moderate', 'risk_assessment'),
                ('How long do you plan to invest?', '5-10 years', 'risk_assessment'),
                ('What is your investment experience?', 'Intermediate', 'risk_assessment')
            ]
            for response in responses:
                cursor.execute('''
                    INSERT INTO questionnaire_responses (customer_id, question, answer, questionnaire_type)
                    VALUES (?, ?, ?, ?)
                ''', (customer_id, response[0], response[1], response[2]))
        
        conn.commit()
        conn.close()
        logger.info("Sample data created successfully")
        
    except Exception as e:
        logger.error(f"Error creating sample data: {str(e)}")
        if 'conn' in locals():
            conn.close()

# Initialize database on startup
init_database()
create_sample_data()

# ============================================
# NEW ENHANCED API ENDPOINTS
# ============================================

@app.route('/api/enhanced/register', methods=['POST'])
def enhanced_user_registration():
    """Enhanced user registration with email normalization"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        user_data = data.get('user_data', {})
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Use the enhanced registration service
        conn = sqlite3.connect(DATABASE_PATH)
        user_service = UserRegistrationService(conn)
        result = user_service.register_user(email, password, user_data)
        conn.close()
        
        if result['success']:
            return jsonify({
                'success': True,
                'user_id': result['user_id'],
                'unique_id': result['unique_id'],
                'message': 'User registered successfully with enhanced validation'
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': result['error'],
                'message': result['message']
            }), 400
            
    except Exception as e:
        logger.error(f"Enhanced registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/enhanced/customers/<customer_id>/sync', methods=['POST'])
def sync_customer_data(customer_id):
    """Sync customer questionnaire and service data"""
    try:
        data = request.get_json()
        
        conn = sqlite3.connect(DATABASE_PATH)
        sync_service = CustomerDataSyncService(conn)
        result = sync_service.sync_questionnaire_data(customer_id, data)
        conn.close()
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['data'],
                'message': 'Customer data synchronized successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Data sync error: {e}")
        return jsonify({'error': 'Data synchronization failed'}), 500

@app.route('/api/enhanced/customers/<customer_id>/comprehensive', methods=['GET'])
def get_comprehensive_customer_data(customer_id):
    """Get comprehensive customer data from all tables"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        sync_service = CustomerDataSyncService(conn)
        data = sync_service.get_accurate_user_data(customer_id)
        conn.close()
        
        if data:
            return jsonify({
                'success': True,
                'data': data
            }), 200
        else:
            return jsonify({'error': 'Customer not found'}), 404
            
    except Exception as e:
        logger.error(f"Error getting comprehensive data: {e}")
        return jsonify({'error': 'Failed to retrieve customer data'}), 500

@app.route('/api/enhanced/signals', methods=['POST'])
def create_trading_signal():
    """Create and propagate trading signal"""
    try:
        data = request.get_json()
        
        conn = sqlite3.connect(DATABASE_PATH)
        signal_service = SignalPropagationService(conn)
        signal = signal_service.propagate_signal_to_users(data)
        conn.close()
        
        if signal:
            return jsonify({
                'success': True,
                'signal': signal,
                'message': 'Trading signal created and propagated successfully'
            }), 201
        else:
            return jsonify({'error': 'Failed to create signal'}), 500
            
    except Exception as e:
        logger.error(f"Signal creation error: {e}")
        return jsonify({'error': 'Signal creation failed'}), 500

@app.route('/api/enhanced/signals', methods=['GET'])
def get_trading_signals():
    """Get trading signals with filters"""
    try:
        filters = request.args.to_dict()
        
        conn = sqlite3.connect(DATABASE_PATH)
        signal_service = SignalPropagationService(conn)
        signals = signal_service.get_user_signals(filters)
        conn.close()
        
        return jsonify({
            'success': True,
            'signals': signals,
            'count': len(signals)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting signals: {e}")
        return jsonify({'error': 'Failed to retrieve signals'}), 500

@app.route('/api/enhanced/bot/<bot_type>/toggle', methods=['POST'])
def toggle_bot_status(bot_type):
    """Toggle bot status (start/stop)"""
    try:
        data = request.get_json()
        is_active = data.get('active', False)
        
        conn = sqlite3.connect(DATABASE_PATH)
        bot_manager = BotStateManager(conn)
        result = bot_manager.toggle_bot_status(bot_type, is_active)
        conn.close()
        
        if result:
            return jsonify({
                'success': True,
                'bot_type': bot_type,
                'is_active': is_active,
                'message': f'Bot {bot_type} {"started" if is_active else "stopped"} successfully'
            }), 200
        else:
            return jsonify({'error': f'Failed to toggle bot {bot_type}'}), 500
            
    except Exception as e:
        logger.error(f"Bot toggle error: {e}")
        return jsonify({'error': 'Bot status toggle failed'}), 500

@app.route('/api/enhanced/bot/<bot_type>/status', methods=['GET'])
def get_bot_status(bot_type):
    """Get current bot status"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        bot_manager = BotStateManager(conn)
        status = bot_manager.check_bot_status(bot_type)
        conn.close()
        
        return jsonify({
            'success': True,
            'bot_type': bot_type,
            'is_active': status
        }), 200
        
    except Exception as e:
        logger.error(f"Bot status check error: {e}")
        return jsonify({'error': 'Failed to check bot status'}), 500

@app.route('/api/enhanced/dashboard/trading-data', methods=['POST'])
def get_secure_trading_data():
    """Get trading data with PIN authentication"""
    try:
        data = request.get_json()
        pin = data.get('pin')
        filters = data.get('filters', {})
        
        if not pin:
            return jsonify({'error': 'PIN is required'}), 400
        
        conn = sqlite3.connect(DATABASE_PATH)
        dashboard_service = SecureDatabaseDashboard()
        
        try:
            trading_data = dashboard_service.get_trading_data(pin, conn, filters)
            conn.close()
            
            return jsonify({
                'success': True,
                'data': trading_data,
                'count': len(trading_data)
            }), 200
            
        except Exception as auth_error:
            conn.close()
            if 'Invalid PIN' in str(auth_error):
                return jsonify({'error': 'Invalid PIN'}), 401
            else:
                raise auth_error
                
    except Exception as e:
        logger.error(f"Trading data access error: {e}")
        return jsonify({'error': 'Failed to access trading data'}), 500

@app.route('/api/enhanced/dashboard/store-bot-data', methods=['POST'])
def store_bot_trading_data():
    """Store bot trading data in secure vault"""
    try:
        data = request.get_json()
        pin = data.get('pin')
        bot_type = data.get('bot_type')
        pair = data.get('pair')
        ohlcv = data.get('ohlcv', {})
        indicators = data.get('indicators', {})
        
        if not pin:
            return jsonify({'error': 'PIN is required'}), 400
        
        conn = sqlite3.connect(DATABASE_PATH)
        dashboard_service = SecureDatabaseDashboard()
        
        try:
            # Authenticate PIN first
            if not dashboard_service.authenticate_pin(pin):
                conn.close()
                return jsonify({'error': 'Invalid PIN'}), 401
            
            # Store the data
            result = dashboard_service.store_bot_data(conn, bot_type, pair, ohlcv, indicators)
            conn.close()
            
            if result:
                return jsonify({
                    'success': True,
                    'message': 'Bot trading data stored successfully'
                }), 201
            else:
                return jsonify({'error': 'Failed to store bot data'}), 500
                
        except Exception as auth_error:
            conn.close()
            raise auth_error
                
    except Exception as e:
        logger.error(f"Bot data storage error: {e}")
        return jsonify({'error': 'Failed to store bot data'}), 500

@app.route('/api/enhanced/audit-log', methods=['GET'])
def get_audit_log():
    """Get audit log for compliance and tracking"""
    try:
        # Get query parameters
        table_name = request.args.get('table_name')
        user_id = request.args.get('user_id')
        action = request.args.get('action')
        limit = min(int(request.args.get('limit', 100)), 1000)  # Max 1000 records
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Build query with filters
        query = 'SELECT * FROM audit_log WHERE 1=1'
        params = []
        
        if table_name:
            query += ' AND table_name = ?'
            params.append(table_name)
        
        if user_id:
            query += ' AND user_id = ?'
            params.append(user_id)
        
        if action:
            query += ' AND action = ?'
            params.append(action)
        
        query += ' ORDER BY timestamp DESC LIMIT ?'
        params.append(limit)
        
        audit_records = cursor.execute(query, params).fetchall()
        conn.close()
        
        # Format the response
        formatted_records = []
        for record in audit_records:
            formatted_records.append({
                'id': record[0],
                'table_name': record[1],
                'user_id': record[2],
                'action': record[3],
                'old_data': json.loads(record[4]) if record[4] else None,
                'new_data': json.loads(record[5]) if record[5] else None,
                'timestamp': record[6]
            })
        
        return jsonify({
            'success': True,
            'audit_log': formatted_records,
            'count': len(formatted_records)
        }), 200
        
    except Exception as e:
        logger.error(f"Audit log retrieval error: {e}")
        return jsonify({'error': 'Failed to retrieve audit log'}), 500

@app.route('/api/enhanced/email-validation', methods=['POST'])
def validate_email_uniqueness():
    """Validate email uniqueness with normalization"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        conn = sqlite3.connect(DATABASE_PATH)
        user_service = UserRegistrationService(conn)
        normalized_email = user_service.normalize_email(email)
        conn.close()
        
        # Check if normalized email already exists
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        existing_user = cursor.execute(
            'SELECT id, email FROM customers WHERE email = ? OR email = ? LIMIT 1',
            (normalized_email, email)
        ).fetchone()
        conn.close()
        
        if existing_user:
            return jsonify({
                'success': False,
                'is_available': False,
                'normalized_email': normalized_email,
                'message': 'Email already exists in system'
            }), 200
        else:
            return jsonify({
                'success': True,
                'is_available': True,
                'normalized_email': normalized_email,
                'message': 'Email is available for registration'
            }), 200
            
    except Exception as e:
        logger.error(f"Email validation error: {e}")
        return jsonify({'error': 'Email validation failed'}), 500

# ============================================
# DASHBOARD FEATURES API ENDPOINTS
# ============================================

@app.route('/api/dashboard/tickets', methods=['GET'])
def get_tickets():
    """Get all support tickets"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get tickets with customer information
        cursor.execute('''
            SELECT 
                t.id,
                t.customer_id,
                c.name as customer_name,
                c.email as customer_email,
                t.subject,
                t.description,
                t.status,
                t.priority,
                t.created_at,
                t.updated_at,
                t.assigned_to
            FROM tickets t
            LEFT JOIN customers c ON t.customer_id = c.id
            ORDER BY t.created_at DESC
        ''')
        
        tickets = cursor.fetchall()
        conn.close()
        
        # Format tickets
        formatted_tickets = []
        for ticket in tickets:
            formatted_tickets.append({
                'id': ticket[0],
                'customer_id': ticket[1],
                'customer_name': ticket[2],
                'customer_email': ticket[3],
                'subject': ticket[4],
                'description': ticket[5],
                'status': ticket[6],
                'priority': ticket[7],
                'created_at': ticket[8],
                'updated_at': ticket[9],
                'assigned_to': ticket[10]
            })
        
        return jsonify({
            'success': True,
            'tickets': formatted_tickets,
            'count': len(formatted_tickets)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting tickets: {e}")
        return jsonify({'error': 'Failed to retrieve tickets'}), 500

@app.route('/api/dashboard/tickets', methods=['POST'])
def create_ticket():
    """Create a new support ticket"""
    try:
        data = request.get_json()
        
        if not data or not data.get('customer_id') or not data.get('subject'):
            return jsonify({'error': 'Customer ID and subject are required'}), 400
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO tickets (customer_id, subject, description, status, priority, assigned_to)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data['customer_id'],
            data['subject'],
            data.get('description', ''),
            data.get('status', 'open'),
            data.get('priority', 'medium'),
            data.get('assigned_to', 'Unassigned')
        ))
        
        ticket_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'ticket_id': ticket_id,
            'message': 'Ticket created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating ticket: {e}")
        return jsonify({'error': 'Failed to create ticket'}), 500

@app.route('/api/dashboard/tickets/<int:ticket_id>', methods=['PUT'])
def update_ticket(ticket_id):
    """Update a support ticket"""
    try:
        data = request.get_json()
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Build update query dynamically
        update_fields = []
        params = []
        
        for field in ['status', 'priority', 'assigned_to', 'description']:
            if field in data:
                update_fields.append(f"{field} = ?")
                params.append(data[field])
        
        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400
        
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(ticket_id)
        
        query = f"UPDATE tickets SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, params)
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Ticket updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating ticket: {e}")
        return jsonify({'error': 'Failed to update ticket'}), 500

@app.route('/api/dashboard/notifications', methods=['GET'])
def get_notifications():
    """Get system notifications"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get recent system events as notifications
        cursor.execute('''
            SELECT 
                'customer_registered' as type,
                'New customer registered' as message,
                c.created_at as timestamp,
                c.name as customer_name,
                'info' as priority
            FROM customers c
            WHERE c.created_at > datetime('now', '-1 day')
            UNION ALL
            SELECT 
                'ticket_created' as type,
                'New support ticket created' as message,
                t.created_at as timestamp,
                c.name as customer_name,
                'medium' as priority
            FROM tickets t
            LEFT JOIN customers c ON t.customer_id = c.id
            WHERE t.created_at > datetime('now', '-1 day')
            ORDER BY timestamp DESC
            LIMIT 20
        ''')
        
        notifications = cursor.fetchall()
        conn.close()
        
        # Format notifications
        formatted_notifications = []
        for notif in notifications:
            formatted_notifications.append({
                'type': notif[0],
                'message': notif[1],
                'timestamp': notif[2],
                'customer_name': notif[3],
                'priority': notif[4],
                'read': False
            })
        
        return jsonify({
            'success': True,
            'notifications': formatted_notifications,
            'count': len(formatted_notifications)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting notifications: {e}")
        return jsonify({'error': 'Failed to retrieve notifications'}), 500

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get comprehensive dashboard statistics"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get customer stats
        cursor.execute('SELECT COUNT(*) FROM customers')
        total_customers = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM customers WHERE created_at > datetime("now", "-1 day")')
        new_customers_today = cursor.fetchone()[0]
        
        # Get ticket stats
        cursor.execute('SELECT COUNT(*) FROM tickets WHERE status = "open"')
        open_tickets = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM tickets WHERE status = "resolved" AND updated_at > datetime("now", "-1 day")')
        resolved_tickets_today = cursor.fetchone()[0]
        
        # Get chat stats (simulated)
        active_chats = min(3, total_customers)  # Simulate active chats
        
        conn.close()
        
        stats = {
            'totalCustomers': total_customers,
            'activeChats': active_chats,
            'openTickets': open_tickets,
            'avgResponseTime': '2m 30s',
            'satisfactionScore': 94,
            'newCustomersToday': new_customers_today,
            'resolvedTicketsToday': resolved_tickets_today
        }
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}")
        return jsonify({'error': 'Failed to retrieve dashboard stats'}), 500

# ============================================
# EXISTING ENDPOINTS CONTINUE BELOW
# ============================================

@app.route('/health')
def health_check():
    """Health check endpoint"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM customers')
        customer_count = cursor.fetchone()[0]
        conn.close()
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'customer_count': customer_count,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/customers', methods=['GET'])
def get_customers():
    """Get all customers with pagination and search"""
    try:
        search = request.args.get('search', '')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        offset = (page - 1) * per_page
        
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if search:
            cursor.execute('''
                SELECT * FROM customers 
                WHERE unique_id LIKE ? OR name LIKE ? OR email LIKE ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (f'%{search}%', f'%{search}%', f'%{search}%', per_page, offset))
        else:
            cursor.execute('''
                SELECT * FROM customers 
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (per_page, offset))
        
        customers = [dict(row) for row in cursor.fetchall()]
        
        # Get total count
        if search:
            cursor.execute('''
                SELECT COUNT(*) FROM customers 
                WHERE unique_id LIKE ? OR name LIKE ? OR email LIKE ?
            ''', (f'%{search}%', f'%{search}%', f'%{search}%'))
        else:
            cursor.execute('SELECT COUNT(*) FROM customers')
        
        total_count = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'customers': customers,
            'total': total_count,
            'page': page,
            'per_page': per_page,
            'total_pages': (total_count + per_page - 1) // per_page
        })
        
    except Exception as e:
        logger.error(f"Error fetching customers: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers/search', methods=['GET'])
def search_customers():
    """Search customers by name, email, or unique_id"""
    try:
        search = request.args.get('search', '')
        if not search:
            return jsonify({'customers': []})
        
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM customers 
            WHERE unique_id LIKE ? OR name LIKE ? OR email LIKE ?
            ORDER BY created_at DESC
            LIMIT 100
        ''', (f'%{search}%', f'%{search}%', f'%{search}%'))
        
        customers = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({'customers': customers})
        
    except Exception as e:
        logger.error(f"Error searching customers: {str(e)}")
        return jsonify({'error': str(e), 'customers': []}), 500

@app.route('/api/customers/<customer_id>', methods=['GET'])
def get_customer_details(customer_id):
    """Get detailed customer information"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get customer basic info
        cursor.execute('SELECT * FROM customers WHERE unique_id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        customer_dict = dict(customer)
        
        # Get activities
        cursor.execute('''
            SELECT * FROM customer_activities 
            WHERE customer_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 50
        ''', (customer['id'],))
        activities = [dict(row) for row in cursor.fetchall()]
        
        # Get screenshots
        cursor.execute('''
            SELECT * FROM customer_screenshots 
            WHERE customer_id = ? 
            ORDER BY upload_date DESC
        ''', (customer['id'],))
        screenshots = [dict(row) for row in cursor.fetchall()]
        
        # Get questionnaire responses
        cursor.execute('''
            SELECT * FROM questionnaire_responses 
            WHERE customer_id = ? 
            ORDER BY response_date DESC
        ''', (customer['id'],))
        questionnaire_responses = [dict(row) for row in cursor.fetchall()]
        
        # Get risk management plan
        cursor.execute('''
            SELECT * FROM risk_management_plans 
            WHERE customer_id = ? 
            ORDER BY updated_date DESC 
            LIMIT 1
        ''', (customer['id'],))
        risk_plan = cursor.fetchone()
        risk_plan_dict = dict(risk_plan) if risk_plan else None
        
        # Get dashboard data
        cursor.execute('''
            SELECT * FROM dashboard_data 
            WHERE customer_id = ? 
            ORDER BY last_updated DESC
        ''', (customer['id'],))
        dashboard_data = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'customer': customer_dict,
            'activities': activities,
            'screenshots': screenshots,
            'questionnaire_responses': questionnaire_responses,
            'risk_management_plan': risk_plan_dict,
            'dashboard_data': dashboard_data
        })
        
    except Exception as e:
        logger.error(f"Error fetching customer details: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers/<customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    """Delete a customer and all associated data"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get customer ID
        cursor.execute('SELECT id FROM customers WHERE unique_id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        customer_db_id = customer[0]
        
        # Delete all associated data
        cursor.execute('DELETE FROM customer_activities WHERE customer_id = ?', (customer_db_id,))
        cursor.execute('DELETE FROM customer_screenshots WHERE customer_id = ?', (customer_db_id,))
        cursor.execute('DELETE FROM questionnaire_responses WHERE customer_id = ?', (customer_db_id,))
        cursor.execute('DELETE FROM risk_management_plans WHERE customer_id = ?', (customer_db_id,))
        cursor.execute('DELETE FROM dashboard_data WHERE customer_id = ?', (customer_db_id,))
        cursor.execute('DELETE FROM customers WHERE id = ?', (customer_db_id,))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Customer {customer_id} and all associated data deleted")
        return jsonify({'message': 'Customer deleted successfully'})
        
    except Exception as e:
        logger.error(f"Error deleting customer: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers', methods=['POST'])
def create_customer():
    """Create a new customer record"""
    try:
        data = request.get_json()
        
        if not data or not data.get('name') or not data.get('email'):
            return jsonify({'error': 'Name and email are required'}), 400
        
        # Generate unique ID
        unique_id = str(uuid.uuid4())[:8].upper()
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO customers (unique_id, name, email, membership_tier, join_date, last_active, phone, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            unique_id,
            data['name'],
            data['email'],
            data.get('membership_tier', 'free'),
            data.get('join_date', datetime.now().isoformat()),
            data.get('last_active', datetime.now().isoformat()),
            data.get('phone', ''),
            data.get('status', 'active')
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Customer {unique_id} created successfully")
        return jsonify({'message': 'Customer created successfully', 'unique_id': unique_id}), 201
        
    except Exception as e:
        logger.error(f"Error creating customer: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers/<unique_id>', methods=['PUT'])
def update_customer(unique_id):
    """Update customer information"""
    try:
        data = request.get_json()
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Update customer fields
        update_fields = []
        params = []
        
        if 'name' in data:
            update_fields.append('name = ?')
            params.append(data['name'])
        
        if 'email' in data:
            update_fields.append('email = ?')
            params.append(data['email'])
            
        if 'phone' in data:
            update_fields.append('phone = ?')
            params.append(data['phone'])
            
        if 'membership_tier' in data:
            update_fields.append('membership_tier = ?')
            params.append(data['membership_tier'])
            
        if 'status' in data:
            update_fields.append('status = ?')
            params.append(data['status'])
        
        update_fields.append('updated_at = ?')
        params.append(datetime.now().isoformat())
        params.append(unique_id)
        
        if update_fields:
            query = f"UPDATE customers SET {', '.join(update_fields)} WHERE unique_id = ?"
            cursor.execute(query, params)
            conn.commit()
            
            if cursor.rowcount > 0:
                return jsonify({'message': 'Customer updated successfully'}), 200
            else:
                return jsonify({'error': 'Customer not found'}), 404
        else:
            return jsonify({'error': 'No fields to update'}), 400
            
    except Exception as e:
        logger.error(f"Error updating customer: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        conn.close()

@app.route('/api/customers/<unique_id>/activities', methods=['GET'])
def get_customer_activities(unique_id):
    """Get customer activities"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT ca.id, ca.activity_type, ca.activity_details, ca.timestamp, 
                   ca.ip_address, ca.user_agent
            FROM customer_activities ca
            JOIN customers c ON ca.customer_id = c.id
            WHERE c.unique_id = ?
            ORDER BY ca.timestamp DESC
        ''', (unique_id,))
        
        activities = []
        for row in cursor.fetchall():
            activities.append({
                'id': row[0],
                'type': row[1],
                'details': row[2],
                'timestamp': row[3],
                'ip_address': row[4],
                'user_agent': row[5]
            })
        
        return jsonify({'activities': activities}), 200
        
    except Exception as e:
        logger.error(f"Error fetching customer activities: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        conn.close()

@app.route('/api/customers/<unique_id>/screenshots', methods=['GET'])
def get_customer_screenshots(unique_id):
    """Get customer screenshots"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT cs.id, cs.screenshot_url, cs.screenshot_type, cs.upload_date, cs.description
            FROM customer_screenshots cs
            JOIN customers c ON cs.customer_id = c.id
            WHERE c.unique_id = ?
            ORDER BY cs.upload_date DESC
        ''', (unique_id,))
        
        screenshots = []
        for row in cursor.fetchall():
            screenshots.append({
                'id': row[0],
                'url': row[1],
                'type': row[2],
                'upload_date': row[3],
                'description': row[4]
            })
        
        return jsonify({'screenshots': screenshots}), 200
        
    except Exception as e:
        logger.error(f"Error fetching customer screenshots: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        conn.close()

@app.route('/api/customers/<unique_id>/questionnaire', methods=['GET'])
def get_customer_questionnaire(unique_id):
    """Get customer questionnaire responses"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT qr.id, qr.question, qr.answer, qr.response_date, qr.questionnaire_type
            FROM questionnaire_responses qr
            JOIN customers c ON qr.customer_id = c.id
            WHERE c.unique_id = ?
            ORDER BY qr.response_date DESC
        ''', (unique_id,))
        
        responses = []
        for row in cursor.fetchall():
            responses.append({
                'id': row[0],
                'question': row[1],
                'answer': row[2],
                'response_date': row[3],
                'questionnaire_type': row[4]
            })
        
        return jsonify({'questionnaire_responses': responses}), 200
        
    except Exception as e:
        logger.error(f"Error fetching customer questionnaire: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        conn.close()

@app.route('/api/customers/<unique_id>/risk-plan', methods=['GET'])
def get_customer_risk_plan(unique_id):
    """Get customer risk management plan"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT rmp.id, rmp.plan_data, rmp.created_date, rmp.updated_date
            FROM risk_management_plans rmp
            JOIN customers c ON rmp.customer_id = c.id
            WHERE c.unique_id = ?
            ORDER BY rmp.updated_date DESC
            LIMIT 1
        ''', (unique_id,))
        
        row = cursor.fetchone()
        if row:
            risk_plan = {
                'id': row[0],
                'plan_data': json.loads(row[1]),
                'created_date': row[2],
                'updated_date': row[3]
            }
            return jsonify({'risk_plan': risk_plan}), 200
        else:
            return jsonify({'risk_plan': None}), 200
        
    except Exception as e:
        logger.error(f"Error fetching customer risk plan: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        conn.close()

@app.route('/api/customers/<unique_id>/dashboard-data', methods=['GET'])
def get_customer_dashboard_data(unique_id):
    """Get customer dashboard data"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT dd.id, dd.data_type, dd.data_content, dd.last_updated
            FROM dashboard_data dd
            JOIN customers c ON dd.customer_id = c.id
            WHERE c.unique_id = ?
            ORDER BY dd.last_updated DESC
        ''', (unique_id,))
        
        dashboard_data = []
        for row in cursor.fetchall():
            dashboard_data.append({
                'id': row[0],
                'data_type': row[1],
                'data_content': json.loads(row[2]),
                'created_date': row[3]
            })
        
        return jsonify({'dashboard_data': dashboard_data}), 200
        
    except Exception as e:
        logger.error(f"Error fetching customer dashboard data: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        conn.close()

@app.route('/api/customers/<customer_id>/activities', methods=['POST'])
def add_customer_activity(customer_id):
    """Add an activity record for a customer"""
    try:
        data = request.get_json()
        
        if not data or not data.get('activity_type'):
            return jsonify({'error': 'Activity type is required'}), 400
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get customer ID
        cursor.execute('SELECT id FROM customers WHERE unique_id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        cursor.execute('''
            INSERT INTO customer_activities (customer_id, activity_type, activity_details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            customer[0],
            data['activity_type'],
            data.get('activity_details', ''),
            data.get('ip_address', ''),
            data.get('user_agent', '')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Activity added successfully'}), 201
        
    except Exception as e:
        logger.error(f"Error adding customer activity: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers/<customer_id>/screenshots', methods=['POST'])
def add_customer_screenshot(customer_id):
    """Add a screenshot record for a customer"""
    try:
        data = request.get_json()
        
        if not data or not data.get('screenshot_url'):
            return jsonify({'error': 'Screenshot URL is required'}), 400
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get customer ID
        cursor.execute('SELECT id FROM customers WHERE unique_id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        cursor.execute('''
            INSERT INTO customer_screenshots (customer_id, screenshot_url, screenshot_type, description)
            VALUES (?, ?, ?, ?)
        ''', (
            customer[0],
            data['screenshot_url'],
            data.get('screenshot_type', 'general'),
            data.get('description', '')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Screenshot added successfully'}), 201
        
    except Exception as e:
        logger.error(f"Error adding customer screenshot: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers/<customer_id>/questionnaire', methods=['POST'])
def add_questionnaire_response(customer_id):
    """Add questionnaire responses for a customer"""
    try:
        data = request.get_json()
        
        if not data or not data.get('responses'):
            return jsonify({'error': 'Questionnaire responses are required'}), 400
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get customer ID
        cursor.execute('SELECT id FROM customers WHERE unique_id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Add each response
        for response in data['responses']:
            cursor.execute('''
                INSERT INTO questionnaire_responses (customer_id, question, answer, questionnaire_type)
                VALUES (?, ?, ?, ?)
            ''', (
                customer[0],
                response['question'],
                response['answer'],
                data.get('questionnaire_type', 'risk_assessment')
            ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Questionnaire responses added successfully'}), 201
        
    except Exception as e:
        logger.error(f"Error adding questionnaire responses: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers/<customer_id>/risk-plan', methods=['POST'])
def add_risk_management_plan(customer_id):
    """Add or update risk management plan for a customer"""
    try:
        data = request.get_json()
        
        if not data or not data.get('plan_data'):
            return jsonify({'error': 'Risk plan data is required'}), 400
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get customer ID
        cursor.execute('SELECT id FROM customers WHERE unique_id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Check if plan exists
        cursor.execute('SELECT id FROM risk_management_plans WHERE customer_id = ?', (customer[0],))
        existing_plan = cursor.fetchone()
        
        if existing_plan:
            # Update existing plan
            cursor.execute('''
                UPDATE risk_management_plans 
                SET plan_data = ?, updated_date = CURRENT_TIMESTAMP
                WHERE customer_id = ?
            ''', (json.dumps(data['plan_data']), customer[0]))
        else:
            # Create new plan
            cursor.execute('''
                INSERT INTO risk_management_plans (customer_id, plan_data)
                VALUES (?, ?)
            ''', (customer[0], json.dumps(data['plan_data'])))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Risk management plan saved successfully'}), 201
        
    except Exception as e:
        logger.error(f"Error saving risk management plan: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers/<customer_id>/dashboard-data', methods=['POST'])
def add_dashboard_data(customer_id):
    """Add dashboard data for a customer"""
    try:
        data = request.get_json()
        
        if not data or not data.get('data_type') or not data.get('data_content'):
            return jsonify({'error': 'Data type and content are required'}), 400
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get customer ID
        cursor.execute('SELECT id FROM customers WHERE unique_id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Check if data type exists for this customer
        cursor.execute('SELECT id FROM dashboard_data WHERE customer_id = ? AND data_type = ?', 
                      (customer[0], data['data_type']))
        existing_data = cursor.fetchone()
        
        if existing_data:
            # Update existing data
            cursor.execute('''
                UPDATE dashboard_data 
                SET data_content = ?, last_updated = CURRENT_TIMESTAMP
                WHERE customer_id = ? AND data_type = ?
            ''', (json.dumps(data['data_content']), customer[0], data['data_type']))
        else:
            # Create new data entry
            cursor.execute('''
                INSERT INTO dashboard_data (customer_id, data_type, data_content)
                VALUES (?, ?, ?)
            ''', (customer[0], data['data_type'], json.dumps(data['data_content'])))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Dashboard data saved successfully'}), 201
        
    except Exception as e:
        logger.error(f"Error saving dashboard data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/')
def serve_dashboard():
    """Serve the customer service dashboard"""
    return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3005))
    app.run(host='0.0.0.0', port=port, debug=False)

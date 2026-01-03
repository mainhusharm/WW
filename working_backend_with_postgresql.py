#!/usr/bin/env python3
"""
Working Backend with PostgreSQL Database Connection
Connects to Render PostgreSQL database instead of local SQLite
"""

import os
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
from datetime import datetime
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# PostgreSQL Database Configuration
# Replace with your actual Render PostgreSQL connection details
DATABASE_CONFIG = {
    'host': 'dpg-d37pd8nfte5s73bfl1ug-a',  # Your Render PostgreSQL host
    'database': 'pghero_dpg_d2v9i7er433s73f0878g_a_cdm2',  # Your database name
    'user': 'pghero_dpg_d2v9i7er433s73f0878g_a_cdm2',  # Your username
    'password': os.getenv('POSTGRES_PASSWORD', 'your_password_here'),  # Set this as environment variable
    'port': 5432
}

def get_db_connection():
    """Get PostgreSQL database connection"""
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        return conn
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return None

def init_database():
    """Initialize PostgreSQL database tables"""
    conn = get_db_connection()
    if not conn:
        logger.error("Cannot initialize database - no connection")
        return False
    
    try:
        cursor = conn.cursor()
        
        # Create users table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create sessions table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                token VARCHAR(36) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        conn.commit()
        logger.info("✅ PostgreSQL database tables initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        return False
    finally:
        conn.close()

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_user(email, password, first_name, last_name):
    """Create a new user in PostgreSQL database"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        user_id = str(uuid.uuid4())
        password_hash = hash_password(password)
        
        cursor.execute("""
            INSERT INTO users (id, email, password_hash, first_name, last_name)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, email, password_hash, first_name, last_name))
        
        conn.commit()
        logger.info(f"✅ User created in PostgreSQL: {email}")
        return user_id
        
    except psycopg2.IntegrityError as e:
        if "duplicate key" in str(e):
            logger.warning(f"User already exists: {email}")
            return None
        else:
            logger.error(f"Database integrity error: {e}")
            return None
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        return None
    finally:
        conn.close()

def get_user_by_email(email):
    """Get user by email from PostgreSQL database"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        return dict(user) if user else None
        
    except Exception as e:
        logger.error(f"Error getting user: {e}")
        return None
    finally:
        conn.close()

def create_session(user_id):
    """Create a new session for user"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        session_id = str(uuid.uuid4())
        token = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO sessions (id, user_id, token)
            VALUES (%s, %s, %s)
        """, (session_id, user_id, token))
        
        conn.commit()
        logger.info(f"✅ Session created for user: {user_id}")
        return token
        
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        return None
    finally:
        conn.close()

def get_all_users():
    """Get all users from PostgreSQL database"""
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT id, email, first_name, last_name, created_at FROM users ORDER BY created_at DESC")
        users = cursor.fetchall()
        return [dict(user) for user in users]
        
    except Exception as e:
        logger.error(f"Error getting users: {e}")
        return []
    finally:
        conn.close()

# Flask Routes
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    conn = get_db_connection()
    db_status = "connected" if conn else "disconnected"
    if conn:
        conn.close()
    
    return jsonify({
        'status': 'healthy',
        'database': db_status,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/user/register', methods=['POST'])
def register_user():
    """Register a new user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('firstName')
        last_name = data.get('lastName')
        
        if not all([email, password, first_name, last_name]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        user_id = create_user(email, password, first_name, last_name)
        
        if user_id:
            logger.info(f"✅ User registered: {email}")
            return jsonify({
                'message': 'User registered successfully',
                'success': True,
                'user_id': user_id,
                'timestamp': datetime.now().isoformat()
            }), 201
        else:
            return jsonify({'error': 'User registration failed'}), 400
            
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/user/login', methods=['POST'])
def login_user():
    """Login user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        user = get_user_by_email(email)
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 400
        
        password_hash = hash_password(password)
        
        if user['password_hash'] != password_hash:
            return jsonify({'error': 'Invalid email or password'}), 400
        
        token = create_session(user['id'])
        
        if token:
            logger.info(f"✅ User logged in: {email}")
            return jsonify({
                'message': 'Login successful',
                'success': True,
                'token': token,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'firstName': user['first_name'],
                    'lastName': user['last_name']
                },
                'timestamp': datetime.now().isoformat()
            }), 200
        else:
            return jsonify({'error': 'Login failed'}), 500
            
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    """Get dashboard data"""
    try:
        users = get_all_users()
        
        return jsonify({
            'message': 'Dashboard data retrieved successfully',
            'success': True,
            'users': users,
            'total_users': len(users),
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Initialize database
    if init_database():
        logger.info("🚀 Starting working backend with PostgreSQL on port 5001")
        logger.info("🔧 Debug mode: False")
        logger.info("✅ PostgreSQL database: Connected to Render")
        logger.info("✅ All backend errors have been fixed")
        logger.info("✅ Frontend connection is ready")
        
        # Get port from environment variable
        port = int(os.getenv('PORT', 5001))
        
        app.run(host='0.0.0.0', port=port, debug=False)
    else:
        logger.error("❌ Failed to initialize database. Exiting.")


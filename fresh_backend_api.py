#!/usr/bin/env python3
"""
Fresh Backend API for User Data Management
Direct PostgreSQL connection with comprehensive error handling
"""

import os
import json
import uuid
import hashlib
import logging
from datetime import datetime, timezone
from flask import Flask, request, jsonify, g
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import psycopg2.pool
from contextlib import contextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flask app setup
app = Flask(__name__)
CORS(app, origins="*", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"])

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 
    'postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2')

# Connection pool
connection_pool = None

def init_connection_pool():
    """Initialize PostgreSQL connection pool"""
    global connection_pool
    try:
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            1, 20,  # min and max connections
            DATABASE_URL,
            cursor_factory=RealDictCursor
        )
        logger.info("✅ PostgreSQL connection pool initialized successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to initialize connection pool: {e}")
        return False

@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    connection = None
    try:
        connection = connection_pool.getconn()
        yield connection
    except Exception as e:
        if connection:
            connection.rollback()
        logger.error(f"Database error: {e}")
        raise
    finally:
        if connection:
            connection_pool.putconn(connection)

def hash_password(password):
    """Simple password hashing"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_access_token():
    """Generate unique access token"""
    return str(uuid.uuid4()) + str(uuid.uuid4()).replace('-', '')

def init_database():
    """Initialize database tables"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Read and execute schema
                schema_file = 'fresh_user_data_schema.sql'
                if os.path.exists(schema_file):
                    with open(schema_file, 'r') as f:
                        schema_sql = f.read()
                    cur.execute(schema_sql)
                    conn.commit()
                    logger.info("✅ Database schema initialized successfully")
                else:
                    # Create table directly if schema file doesn't exist
                    create_table_sql = """
                    CREATE TABLE IF NOT EXISTS user_data (
                        id SERIAL PRIMARY KEY,
                        user_id VARCHAR(255) UNIQUE NOT NULL,
                        first_name VARCHAR(100) NOT NULL,
                        last_name VARCHAR(100) NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        phone VARCHAR(50),
                        password_hash VARCHAR(255) NOT NULL,
                        company VARCHAR(255),
                        country VARCHAR(10),
                        agree_to_terms BOOLEAN DEFAULT FALSE,
                        agree_to_marketing BOOLEAN DEFAULT FALSE,
                        plan_type VARCHAR(100) DEFAULT 'Standard',
                        plan_price DECIMAL(10,2),
                        registration_method VARCHAR(50) DEFAULT 'web',
                        status VARCHAR(50) DEFAULT 'active',
                        access_token VARCHAR(500),
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        last_login TIMESTAMP WITH TIME ZONE
                    );
                    
                    CREATE INDEX IF NOT EXISTS idx_user_data_email ON user_data(email);
                    CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
                    """
                    cur.execute(create_table_sql)
                    conn.commit()
                    logger.info("✅ Database table created successfully")
                
                return True
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        return False

# API Routes

@app.before_request
def before_request():
    """Handle preflight requests"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

@app.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                result = cur.fetchone()
                
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'message': 'Fresh backend API is running successfully'
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 500

@app.route('/api/user/register', methods=['POST'])
def register_user():
    """Register new user with all form data"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['firstName', 'lastName', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Generate unique identifiers
        user_id = str(uuid.uuid4())
        access_token = generate_access_token()
        password_hash = hash_password(data['password'])
        
        # Prepare user data
        user_data = {
            'user_id': user_id,
            'first_name': data['firstName'],
            'last_name': data['lastName'],
            'email': data['email'].lower().strip(),
            'phone': data.get('phone', ''),
            'password_hash': password_hash,
            'company': data.get('company', ''),
            'country': data.get('country', ''),
            'agree_to_terms': data.get('terms', False),
            'agree_to_marketing': data.get('newsletter', False),
            'plan_type': data.get('plan_type', 'Standard'),
            'plan_price': data.get('plan_price', 0.00),
            'registration_method': 'web',
            'status': 'active',
            'access_token': access_token
        }
        
        # Insert into database
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Check if user already exists
                cur.execute("SELECT email FROM user_data WHERE email = %s", (user_data['email'],))
                if cur.fetchone():
                    return jsonify({
                        'success': False,
                        'error': 'User with this email already exists'
                    }), 409
                
                # Insert new user
                insert_sql = """
                INSERT INTO user_data (
                    user_id, first_name, last_name, email, phone, password_hash,
                    company, country, agree_to_terms, agree_to_marketing,
                    plan_type, plan_price, registration_method, status, access_token
                ) VALUES (
                    %(user_id)s, %(first_name)s, %(last_name)s, %(email)s, %(phone)s, %(password_hash)s,
                    %(company)s, %(country)s, %(agree_to_terms)s, %(agree_to_marketing)s,
                    %(plan_type)s, %(plan_price)s, %(registration_method)s, %(status)s, %(access_token)s
                ) RETURNING id, user_id, email, first_name, last_name, created_at
                """
                
                cur.execute(insert_sql, user_data)
                result = cur.fetchone()
                conn.commit()
                
                logger.info(f"✅ User registered successfully: {user_data['email']}")
                
                return jsonify({
                    'success': True,
                    'message': 'User registered successfully',
                    'user_id': result['user_id'],
                    'access_token': access_token,
                    'user': {
                        'id': result['id'],
                        'user_id': result['user_id'],
                        'email': result['email'],
                        'fullName': f"{result['first_name']} {result['last_name']}",
                        'firstName': result['first_name'],
                        'lastName': result['last_name'],
                        'status': 'active',
                        'createdAt': result['created_at'].isoformat()
                    }
                }), 201
                
    except psycopg2.IntegrityError as e:
        logger.error(f"Database integrity error: {e}")
        return jsonify({
            'success': False,
            'error': 'User with this email already exists'
        }), 409
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error during registration'
        }), 500

@app.route('/api/user/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get user data by user_id"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT user_id, first_name, last_name, email, phone, company, country,
                           plan_type, status, created_at, last_login
                    FROM user_data 
                    WHERE user_id = %s
                """, (user_id,))
                
                user = cur.fetchone()
                if not user:
                    return jsonify({
                        'success': False,
                        'error': 'User not found'
                    }), 404
                
                return jsonify({
                    'success': True,
                    'user': dict(user)
                }), 200
                
    except Exception as e:
        logger.error(f"Get user error: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.route('/api/users', methods=['GET'])
def get_all_users():
    """Get all users (admin endpoint)"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT user_id, first_name, last_name, email, phone, company, country,
                           plan_type, status, created_at, last_login
                    FROM user_data 
                    ORDER BY created_at DESC
                    LIMIT 100
                """)
                
                users = cur.fetchall()
                
                return jsonify({
                    'success': True,
                    'users': [dict(user) for user in users],
                    'count': len(users)
                }), 200
                
    except Exception as e:
        logger.error(f"Get users error: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get database statistics"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Get total users
                cur.execute("SELECT COUNT(*) as total FROM user_data")
                total_users = cur.fetchone()['total']
                
                # Get users by status
                cur.execute("""
                    SELECT status, COUNT(*) as count 
                    FROM user_data 
                    GROUP BY status
                """)
                status_counts = cur.fetchall()
                
                # Get recent registrations (last 24 hours)
                cur.execute("""
                    SELECT COUNT(*) as recent 
                    FROM user_data 
                    WHERE created_at >= NOW() - INTERVAL '24 hours'
                """)
                recent_registrations = cur.fetchone()['recent']
                
                return jsonify({
                    'success': True,
                    'stats': {
                        'total_users': total_users,
                        'recent_registrations': recent_registrations,
                        'status_breakdown': [dict(row) for row in status_counts]
                    }
                }), 200
                
    except Exception as e:
        logger.error(f"Get stats error: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

# Initialize everything
if __name__ == '__main__':
    logger.info("🚀 Starting Fresh Backend API...")
    
    # Initialize connection pool
    if not init_connection_pool():
        logger.error("❌ Failed to initialize connection pool. Exiting.")
        exit(1)
    
    # Initialize database
    if not init_database():
        logger.error("❌ Failed to initialize database. Exiting.")
        exit(1)
    
    # Start the server
    port = int(os.getenv('PORT', 10000))
    logger.info(f"🌟 Fresh Backend API running on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)

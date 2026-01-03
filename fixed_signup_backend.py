#!/usr/bin/env python3
"""
Fixed Signup Backend for TraderEdgePro
Specifically handles signup-enhanced page data flow to PostgreSQL
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import psycopg2
import hashlib
import uuid
import json
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=["*"], methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])

# PostgreSQL connection
DATABASE_URL = "postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2"

def get_db_connection():
    """Get database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        logger.info("Database connection established")
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return None

def create_signup_table():
    """Create signup_enhanced_users table"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Create table for signup-enhanced data
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS signup_enhanced_users (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                company VARCHAR(255),
                country VARCHAR(100),
                password_hash VARCHAR(255),
                plan_type VARCHAR(50),
                terms_accepted BOOLEAN DEFAULT FALSE,
                newsletter_subscribed BOOLEAN DEFAULT FALSE,
                unique_id VARCHAR(100) UNIQUE,
                access_token VARCHAR(255),
                source_page VARCHAR(50) DEFAULT 'signup-enhanced',
                raw_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create index
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_signup_enhanced_email 
            ON signup_enhanced_users(email);
        """)
        
        conn.commit()
        conn.close()
        logger.info("signup_enhanced_users table ready")
        return True
        
    except Exception as e:
        logger.error(f"Table creation error: {e}")
        return False

@app.before_request
def log_request_info():
    """Log all incoming requests"""
    logger.info(f"Request: {request.method} {request.url}")
    if request.method == "POST":
        logger.info(f"Request data: {request.get_data(as_text=True)[:500]}")

@app.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    logger.info(f"Response: {response.status_code}")
    return response

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health_check():
    """Health check endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    
    # Test database connection
    conn = get_db_connection()
    db_status = "connected" if conn else "failed"
    if conn:
        conn.close()
    
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": db_status,
        "service": "signup-backend"
    })

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
@app.route('/api/enhanced/signup', methods=['POST', 'OPTIONS'])
@app.route('/api/signup', methods=['POST', 'OPTIONS'])
def signup():
    """Handle user signup from signup-enhanced page"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get JSON data
        data = request.get_json()
        logger.info(f"Received signup data: {json.dumps(data, indent=2)}")
        
        if not data:
            logger.error("No JSON data received")
            return jsonify({"error": "No data provided", "success": False}), 400
        
        # Validate required fields
        required_fields = ['firstName', 'lastName', 'email']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            logger.error(f"Missing required fields: {missing_fields}")
            return jsonify({
                "error": f"Missing required fields: {', '.join(missing_fields)}",
                "success": False
            }), 400
        
        # Connect to database
        conn = get_db_connection()
        if not conn:
            logger.error("Database connection failed")
            return jsonify({"error": "Database connection failed", "success": False}), 500
        
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute("SELECT id FROM signup_enhanced_users WHERE email = %s", (data['email'],))
        existing_user = cursor.fetchone()
        
        if existing_user:
            logger.warning(f"User already exists: {data['email']}")
            return jsonify({
                "error": "User already exists",
                "success": False,
                "user_id": existing_user[0]
            }), 409
        
        # Create user record
        password_hash = hashlib.sha256(data.get('password', '').encode()).hexdigest()
        unique_id = str(uuid.uuid4())
        access_token = str(uuid.uuid4())
        
        # Insert user data
        cursor.execute("""
            INSERT INTO signup_enhanced_users 
            (first_name, last_name, email, phone, company, country, password_hash, 
             terms_accepted, newsletter_subscribed, unique_id, access_token, raw_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, email, created_at
        """, (
            data['firstName'],
            data['lastName'], 
            data['email'],
            data.get('phone', ''),
            data.get('company', ''),
            data.get('country', ''),
            password_hash,
            data.get('terms', False),
            data.get('newsletter', False),
            unique_id,
            access_token,
            json.dumps(data)  # Store raw data as JSONB
        ))
        
        result = cursor.fetchone()
        user_id, email, created_at = result
        
        conn.commit()
        conn.close()
        
        logger.info(f"User created successfully: ID={user_id}, Email={email}")
        
        return jsonify({
            "success": True,
            "message": "User created successfully",
            "user_id": user_id,
            "email": email,
            "access_token": access_token,
            "created_at": created_at.isoformat()
        }), 201
        
    except psycopg2.IntegrityError as e:
        logger.error(f"Database integrity error: {e}")
        return jsonify({
            "error": "User with this email already exists",
            "success": False
        }), 409
        
    except Exception as e:
        logger.error(f"Signup error: {e}")
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "success": False
        }), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all users for debugging"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, first_name, last_name, email, created_at, source_page
            FROM signup_enhanced_users 
            ORDER BY created_at DESC 
            LIMIT 50
        """)
        
        users = []
        for row in cursor.fetchall():
            users.append({
                'id': row[0],
                'first_name': row[1],
                'last_name': row[2],
                'email': row[3],
                'created_at': row[4].isoformat() if row[4] else None,
                'source_page': row[5]
            })
        
        conn.close()
        
        return jsonify({
            "success": True,
            "users": users,
            "count": len(users)
        })
        
    except Exception as e:
        logger.error(f"Get users error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/test-insert', methods=['POST'])
def test_insert():
    """Test endpoint for manual data insertion"""
    try:
        test_data = {
            'firstName': 'Test',
            'lastName': 'User',
            'email': f'test_{int(datetime.now().timestamp())}@example.com',
            'phone': '+1234567890',
            'company': 'Test Company',
            'country': 'United States',
            'password': 'testpass123',
            'terms': True,
            'newsletter': False
        }
        
        # Use the same signup logic
        request.json = test_data
        return signup()
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Fixed Signup Backend Server...")
    
    # Create tables
    if create_signup_table():
        print("✅ Database tables ready")
    else:
        print("⚠️  Database table creation failed")
    
    print("🌐 Server running on http://localhost:5002")
    print("📊 API endpoints available:")
    print("   - GET  /api/health")
    print("   - POST /api/auth/register")
    print("   - POST /api/enhanced/signup") 
    print("   - POST /api/signup")
    print("   - GET  /api/users")
    print("   - POST /api/test-insert")
    print("")
    print("🔧 For signup-enhanced page, use:")
    print("   API_BASE_URL = 'http://localhost:5002'")
    
    app.run(host='0.0.0.0', port=5002, debug=True)

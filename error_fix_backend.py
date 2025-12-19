#!/usr/bin/env python3
"""
Backend Error Fix and Connection Handler
Fixes common backend errors and establishes proper frontend connection
"""

import os
import sys
import logging
import traceback
from datetime import datetime
from typing import Dict, Any, Optional, List
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from functools import wraps
import psycopg2
import psycopg2.extras
import hashlib
import uuid
import json
import time
import threading
from contextlib import contextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BackendErrorHandler:
    """Comprehensive backend error handling and connection management"""
    
    def __init__(self):
        self.connection_pool = {}
        self.retry_attempts = 3
        self.timeout_seconds = 30
        self.setup_database_config()
    
    def setup_database_config(self):
        """Setup database configuration with fallbacks"""
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'trading_journal'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'password'),
            'port': int(os.getenv('DB_PORT', 5432)),
            'sslmode': os.getenv('DB_SSLMODE', 'prefer'),
            'connect_timeout': self.timeout_seconds
        }
    
    @contextmanager
    def get_db_connection(self):
        """Get database connection with proper error handling"""
        connection = None
        try:
            connection = psycopg2.connect(**self.db_config)
            connection.autocommit = False
            yield connection
        except psycopg2.OperationalError as e:
            logger.error(f"Database connection error: {e}")
            if connection:
                connection.rollback()
            raise ConnectionError(f"Database connection failed: {str(e)}")
        except psycopg2.Error as e:
            logger.error(f"Database error: {e}")
            if connection:
                connection.rollback()
            raise
        except Exception as e:
            logger.error(f"Unexpected database error: {e}")
            if connection:
                connection.rollback()
            raise
        finally:
            if connection:
                connection.close()
    
    def safe_execute_query(self, query: str, params: tuple = None, fetch: bool = False):
        """Safely execute database query with retry logic"""
        for attempt in range(self.retry_attempts):
            try:
                with self.get_db_connection() as conn:
                    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                        cursor.execute(query, params)
                        if fetch:
                            return cursor.fetchall()
                        conn.commit()
                        return cursor.rowcount
            except (psycopg2.OperationalError, ConnectionError) as e:
                if attempt == self.retry_attempts - 1:
                    logger.error(f"Database query failed after {self.retry_attempts} attempts: {e}")
                    raise
                logger.warning(f"Database query attempt {attempt + 1} failed, retrying: {e}")
                time.sleep(2 ** attempt)  # Exponential backoff
            except Exception as e:
                logger.error(f"Unexpected error in database query: {e}")
                raise
    
    def validate_request_data(self, data: Dict[str, Any], required_fields: List[str]) -> Dict[str, Any]:
        """Validate request data and handle missing fields"""
        if not data:
            raise ValueError("Request data is required")
        
        missing_fields = [field for field in required_fields if field not in data or data[field] is None]
        if missing_fields:
            raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
        
        return data
    
    def handle_key_error(self, error: KeyError, context: str = ""):
        """Handle KeyError with proper logging and user-friendly message"""
        logger.error(f"KeyError in {context}: {error}")
        return {
            "error": "Missing required data",
            "message": f"Required field '{error.args[0] if error.args else 'unknown'}' is missing",
            "context": context,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def handle_timeout_error(self, error: TimeoutError, context: str = ""):
        """Handle TimeoutError with proper logging and retry logic"""
        logger.error(f"TimeoutError in {context}: {error}")
        return {
            "error": "Request timeout",
            "message": "The request took too long to process. Please try again.",
            "context": context,
            "timestamp": datetime.utcnow().isoformat(),
            "retry_after": 5
        }
    
    def handle_connection_error(self, error: ConnectionError, context: str = ""):
        """Handle ConnectionError with proper logging and fallback"""
        logger.error(f"ConnectionError in {context}: {error}")
        return {
            "error": "Connection failed",
            "message": "Unable to connect to the service. Please try again later.",
            "context": context,
            "timestamp": datetime.utcnow().isoformat(),
            "retry_after": 10
        }
    
    def handle_value_error(self, error: ValueError, context: str = ""):
        """Handle ValueError with proper logging and validation message"""
        logger.error(f"ValueError in {context}: {error}")
        return {
            "error": "Invalid data",
            "message": str(error),
            "context": context,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def handle_type_error(self, error: TypeError, context: str = ""):
        """Handle TypeError with proper logging and type information"""
        logger.error(f"TypeError in {context}: {error}")
        return {
            "error": "Type mismatch",
            "message": f"Invalid data type: {str(error)}",
            "context": context,
            "timestamp": datetime.utcnow().isoformat()
        }

# Global error handler instance
error_handler = BackendErrorHandler()

def error_handler_decorator(func):
    """Decorator to handle common backend errors"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except KeyError as e:
            error_response = error_handler.handle_key_error(e, func.__name__)
            return jsonify(error_response), 400
        except TimeoutError as e:
            error_response = error_handler.handle_timeout_error(e, func.__name__)
            return jsonify(error_response), 408
        except ConnectionError as e:
            error_response = error_handler.handle_connection_error(e, func.__name__)
            return jsonify(error_response), 503
        except ValueError as e:
            error_response = error_handler.handle_value_error(e, func.__name__)
            return jsonify(error_response), 400
        except TypeError as e:
            error_response = error_handler.handle_type_error(e, func.__name__)
            return jsonify(error_response), 400
        except Exception as e:
            logger.error(f"Unexpected error in {func.__name__}: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return jsonify({
                "error": "Internal server error",
                "message": "An unexpected error occurred. Please try again.",
                "timestamp": datetime.utcnow().isoformat()
            }), 500
    return wrapper

def create_robust_backend_app():
    """Create Flask app with comprehensive error handling and frontend connection"""
    app = Flask(__name__)
    
    # Enhanced CORS configuration for frontend connection
    CORS(app, 
         origins=["*"], 
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
         supports_credentials=True,
         max_age=3600)
    
    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Not found",
            "message": "The requested endpoint was not found",
            "timestamp": datetime.utcnow().isoformat()
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "error": "Method not allowed",
            "message": "The HTTP method is not allowed for this endpoint",
            "timestamp": datetime.utcnow().isoformat()
        }), 405
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "error": "Internal server error",
            "message": "An unexpected error occurred on the server",
            "timestamp": datetime.utcnow().isoformat()
        }), 500
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    @error_handler_decorator
    def health_check():
        """Health check endpoint with database connectivity test"""
        try:
            # Test database connection
            with error_handler.get_db_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    db_status = "connected"
        except Exception as e:
            logger.warning(f"Database health check failed: {e}")
            db_status = "disconnected"
        
        return jsonify({
            "status": "healthy",
            "service": "trading-backend",
            "version": "2.0.0",
            "timestamp": datetime.utcnow().isoformat(),
            "database": db_status,
            "uptime": time.time()
        })
    
    # User registration endpoint with error handling
    @app.route('/api/user/register', methods=['POST'])
    @error_handler_decorator
    def register_user():
        """Register new user with comprehensive validation"""
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['firstName', 'lastName', 'email', 'password']
        validated_data = error_handler.validate_request_data(data, required_fields)
        
        # Additional validation
        if not validated_data['email'] or '@' not in validated_data['email']:
            raise ValueError("Invalid email format")
        
        if len(validated_data['password']) < 6:
            raise ValueError("Password must be at least 6 characters long")
        
        # Hash password
        password_hash = hashlib.sha256(validated_data['password'].encode()).hexdigest()
        
        # Insert user into database
        query = """
            INSERT INTO users (first_name, last_name, email, password_hash, created_at)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, first_name, last_name, email, created_at
        """
        
        params = (
            validated_data['firstName'],
            validated_data['lastName'],
            validated_data['email'],
            password_hash,
            datetime.utcnow()
        )
        
        result = error_handler.safe_execute_query(query, params, fetch=True)
        
        if result:
            user = result[0]
            return jsonify({
                "success": True,
                "message": "User registered successfully",
                "user": {
                    "id": user['id'],
                    "firstName": user['first_name'],
                    "lastName": user['last_name'],
                    "email": user['email'],
                    "createdAt": user['created_at'].isoformat()
                }
            }), 201
        else:
            raise ValueError("Failed to create user")
    
    # User login endpoint
    @app.route('/api/user/login', methods=['POST'])
    @error_handler_decorator
    def login_user():
        """User login with authentication"""
        data = request.get_json()
        
        required_fields = ['email', 'password']
        validated_data = error_handler.validate_request_data(data, required_fields)
        
        # Hash password for comparison
        password_hash = hashlib.sha256(validated_data['password'].encode()).hexdigest()
        
        # Query user from database
        query = """
            SELECT id, first_name, last_name, email, created_at
            FROM users 
            WHERE email = %s AND password_hash = %s
        """
        
        params = (validated_data['email'], password_hash)
        result = error_handler.safe_execute_query(query, params, fetch=True)
        
        if result:
            user = result[0]
            # Generate session token (simplified)
            session_token = str(uuid.uuid4())
            
            return jsonify({
                "success": True,
                "message": "Login successful",
                "token": session_token,
                "user": {
                    "id": user['id'],
                    "firstName": user['first_name'],
                    "lastName": user['last_name'],
                    "email": user['email']
                }
            }), 200
        else:
            raise ValueError("Invalid email or password")
    
    # Dashboard data endpoint
    @app.route('/api/dashboard', methods=['GET'])
    @error_handler_decorator
    def get_dashboard_data():
        """Get dashboard data for authenticated user"""
        # In a real app, you'd validate the token here
        user_id = request.headers.get('X-User-ID', '1')
        
        # Get user data
        user_query = "SELECT * FROM users WHERE id = %s"
        user_result = error_handler.safe_execute_query(user_query, (user_id,), fetch=True)
        
        if not user_result:
            raise ValueError("User not found")
        
        user = user_result[0]
        
        # Get dashboard statistics (mock data for now)
        dashboard_data = {
            "user": {
                "id": user['id'],
                "firstName": user['first_name'],
                "lastName": user['last_name'],
                "email": user['email']
            },
            "stats": {
                "totalTrades": 0,
                "winRate": 0,
                "totalProfit": 0,
                "activeSignals": 0
            },
            "recentActivity": [],
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return jsonify({
            "success": True,
            "data": dashboard_data
        }), 200
    
    # API status endpoint
    @app.route('/api/status', methods=['GET'])
    @error_handler_decorator
    def api_status():
        """API status and connection test"""
        return jsonify({
            "status": "operational",
            "backend": "connected",
            "frontend_connection": "ready",
            "timestamp": datetime.utcnow().isoformat(),
            "endpoints": {
                "health": "/health",
                "register": "/api/user/register",
                "login": "/api/user/login",
                "dashboard": "/api/dashboard",
                "status": "/api/status"
            }
        }), 200
    
    return app

if __name__ == '__main__':
    app = create_robust_backend_app()
    
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"🚀 Starting robust backend server on port {port}")
    logger.info(f"🔧 Debug mode: {debug}")
    logger.info("✅ Error handling and frontend connection ready")
    
    app.run(host='0.0.0.0', port=port, debug=debug)

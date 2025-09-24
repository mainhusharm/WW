"""
Journal Application Factory
Updated to include real-time signal system components and enhanced database routes
"""

import os
from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO
import logging
from .extensions import db, socketio

# Initialize extensions
jwt = JWTManager()

def create_app(config_object='journal.config.ProductionConfig', start_services=True):
    """Create Flask application with all extensions and blueprints"""
    
    app = Flask(__name__)
    app.config.from_object(config_object)
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    
    # Enhanced CORS configuration for production
    CORS(app, 
         origins=["*"], 
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
         supports_credentials=True,
         max_age=3600)
    
    socketio.init_app(app, cors_allowed_origins="*")
    
    # Add CORS preflight handler
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = jsonify({"status": "ok"})
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,X-Requested-With,Accept,Origin")
            response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
            response.headers.add('Access-Control-Max-Age', "3600")
            return response, 200
    
    # Add after_request handler for CORS
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Register existing blueprints
    from journal.auth import auth_bp
    from journal.user_routes import user_bp
    from journal.admin_auth import admin_auth_bp
    from journal.admin_signals_api import admin_signals_bp
    from journal.user_signals_api import user_signals_bp
    from journal.dashboard_routes import dashboard_bp
    from journal.signal_feed_routes import signal_feed_bp
    from journal.payment_routes import payment_bp
    from journal.api_routes import api_bp
    from journal.simple_api_routes import simple_api_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(admin_auth_bp, url_prefix='/api/admin')
    app.register_blueprint(admin_signals_bp, url_prefix='/api')
    app.register_blueprint(user_signals_bp, url_prefix='/api')
    app.register_blueprint(dashboard_bp, url_prefix='/api')
    app.register_blueprint(signal_feed_bp, url_prefix='/api')
    app.register_blueprint(payment_bp, url_prefix='/api')
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(simple_api_bp, url_prefix='/api')
    
    # Register enhanced database routes
    try:
        from journal.enhanced_user_routes import enhanced_user_bp
        app.register_blueprint(enhanced_user_bp, url_prefix='/api')
        logging.info("Enhanced database routes registered successfully")
    except ImportError as e:
        logging.warning(f"Enhanced routes not available: {e}")
    
    if start_services:
        # Initialize signal broadcaster
        from journal.signal_broadcaster import start_signal_broadcaster
        start_signal_broadcaster(socketio)
        
        # Create database tables (optional for development)
        with app.app_context():
            try:
                db.create_all()
                logging.info("Database tables created successfully")
            except Exception as e:
                logging.warning(f"Database connection failed: {e}")
                logging.warning("App will run without database - some features may be limited")
            
            # Initialize signal system within app context
            from journal.signal_system import start_signal_system
            start_signal_system()
    
    return app

def create_socketio_app(app):
    """Create Socket.IO application"""
    return socketio

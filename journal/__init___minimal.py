"""
Minimal Journal Application Factory
Updated to include real-time signal system components without Redis dependency
"""

import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import logging

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()

def create_app_minimal(config_object='journal.config.ProductionConfig'):
    """Create Flask application with minimal extensions (no Redis/Socket.IO)"""
    
    app = Flask(__name__)
    app.config.from_object(config_object)
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Register basic blueprints (no Redis-dependent ones)
    from journal.auth import auth_bp
    from journal.user_routes import user_bp
    from journal.admin_auth import admin_auth_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(admin_auth_bp, url_prefix='/api/admin')
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app

#!/usr/bin/env python3
"""
Main Application Entry Point for Render Deployment
"""

import os
import sys
import logging

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from journal import create_app, socketio
    
    # Create the Flask app
    app = create_app()
    
    # Add a simple health check route
    @app.route('/health')
    def health_check():
        return {"status": "ok", "service": "trading-backend", "version": "1.0.0"}
    
    
    # Export the Flask app for gunicorn (Socket.IO will be handled by eventlet)
    application = app
    
    logger.info("✅ Application created successfully")
    
except Exception as e:
    logger.error(f"❌ Failed to create application: {e}")
    # Create a minimal fallback app
    from flask import Flask
    app = Flask(__name__)
    
    @app.route('/health')
    def health():
        return {"status": "error", "message": "Application failed to initialize"}
    
    @app.route('/')
    def index():
        return {"status": "error", "message": "Application failed to initialize"}
    
    application = app
    logger.warning("⚠️ Using fallback application due to initialization error")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print("🚀 Journal Backend starting...")
    print(f"🔧 Running on port: {port}")
    print(f"🐛 Debug mode: {debug}")
    
    try:
        socketio.run(app, host='0.0.0.0', port=port, debug=debug)
    except Exception as e:
        print(f"❌ Failed to start with socketio: {e}")
        print("🔄 Starting with regular Flask...")
        app.run(host='0.0.0.0', port=port, debug=debug)

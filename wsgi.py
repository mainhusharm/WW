#!/usr/bin/env python3
"""
WSGI entry point for Render deployment
Simple and reliable startup
"""

import os
import sys
from pathlib import Path

# Add the current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

try:
    from render_backend_server import app
    
    # Ensure database is initialized
    from render_backend_server import init_db
    init_db()
    
    # Create the WSGI application
    application = app
    
    print("✅ WSGI application loaded successfully")
    print(f"📁 Current directory: {current_dir}")
    print(f"🐍 Python version: {sys.version}")
    print(f"🌐 Flask app: {app.name}")
    
except Exception as e:
    print(f"❌ Failed to load WSGI application: {e}")
    import traceback
    traceback.print_exc()
    
    # Create a minimal fallback app
    from flask import Flask, jsonify
    fallback_app = Flask(__name__)
    
    @fallback_app.route('/')
    def fallback():
        return jsonify({
            'error': 'Backend failed to start',
            'message': str(e),
            'status': 'error'
        }), 500
    
    application = fallback_app

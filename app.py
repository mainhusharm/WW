#!/usr/bin/env python3
"""
Main Application Entry Point for Render Deployment
"""

import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from journal import create_app, socketio

# Create the Flask app
app = create_app()

# Export the Flask app for gunicorn (Socket.IO will be handled by eventlet)
application = app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print("🚀 Journal Backend starting...")
    print(f"🔧 Running on port: {port}")
    print(f"🐛 Debug mode: {debug}")
    
    socketio.run(app, host='0.0.0.0', port=port, debug=debug)

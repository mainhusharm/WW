#!/usr/bin/env python3
"""
Main entry point for the journal backend service
"""
import os
import sys

# Add the parent directory to the system path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from journal import create_app, socketio

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print("🚀 Journal Backend starting...")
    print(f"🔧 Running on port: {port}")
    print(f"🐛 Debug mode: {debug}")
    
    socketio.run(app, host='0.0.0.0', port=port, debug=debug)

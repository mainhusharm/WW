#!/usr/bin/env python3
"""
Local Development Server for Enhanced Signal System
This script starts a local server with SQLite database for testing
"""

import os
import sys
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

# Set environment variables for local development
os.environ['FLASK_ENV'] = 'development'
os.environ['SECRET_KEY'] = 'local_development_secret_key_12345'
os.environ['JWT_SECRET_KEY'] = 'local_jwt_secret_key_67890'
os.environ['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/trading_journal.db'
os.environ['SQLALCHEMY_TRACK_MODIFICATIONS'] = 'False'
os.environ['DATABASE_URL'] = 'sqlite:///instance/trading_journal.db'

# Import the app after setting environment variables
from journal import create_app

def main():
    """Start the local development server"""
    print("🚀 Starting Enhanced Signal System Local Server...")
    print("=" * 50)
    
    # Create the app
    app = create_app()
    
    # Initialize CORS
    CORS(app, origins="*")
    
    # Initialize SocketIO
    socketio = SocketIO(app, cors_allowed_origins="*")
    
    # Create instance directory if it doesn't exist
    instance_dir = os.path.join(os.path.dirname(__file__), 'instance')
    os.makedirs(instance_dir, exist_ok=True)
    
    print("✅ Server configuration complete")
    print("📊 Database: SQLite (local)")
    print("🔌 WebSocket: Enabled")
    print("🌐 CORS: Enabled for all origins")
    print("=" * 50)
    
    # Start the server
    try:
        print("🚀 Starting server on http://127.0.0.1:5000")
        print("📡 WebSocket available at ws://127.0.0.1:5000")
        print("🛑 Press Ctrl+C to stop the server")
        print("=" * 50)
        
        socketio.run(app, 
                    host='127.0.0.1', 
                    port=5000, 
                    debug=True, 
                    allow_unsafe_werkzeug=True)
                    
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()

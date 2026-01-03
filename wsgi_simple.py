#!/usr/bin/env python3
"""
Simple WSGI entry point for Render deployment
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    # Import the Flask app
    from journal import create_app
    
    # Create the app instance
    application = create_app()
    
    print("✅ Flask application created successfully")
    print(f"App type: {type(application)}")
    
except Exception as e:
    print(f"❌ Error creating Flask app: {e}")
    import traceback
    traceback.print_exc()
    
    # Create a minimal Flask app as fallback
    from flask import Flask
    application = Flask(__name__)
    
    @application.route('/health')
    def health():
        return {'status': 'error', 'message': f'App creation failed: {str(e)}'}, 500
    
    @application.route('/')
    def home():
        return {'status': 'error', 'message': f'App creation failed: {str(e)}'}, 500

if __name__ == "__main__":
    # Get port from environment variable (Render requirement)
    port = int(os.environ.get("PORT", 8080))
    
    print(f"🚀 Starting Flask app on port {port}")
    application.run(host="0.0.0.0", port=port, debug=False)
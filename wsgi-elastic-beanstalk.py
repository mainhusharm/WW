#!/usr/bin/env python3
"""
WSGI entry point for Elastic Beanstalk deployment
"""

import os
import sys

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(__file__))

# Set environment variables
os.environ.setdefault('FLASK_ENV', 'production')
os.environ.setdefault('FLASK_APP', 'app.py')

# Import the Flask app
try:
    from app import app
except ImportError:
    # Fallback to journal app if main app not available
    try:
        from journal import create_app
        app = create_app()
    except ImportError:
        # Create a minimal app if nothing else works
        from flask import Flask
        app = Flask(__name__)
        
        @app.route('/')
        def health_check():
            return {'status': 'healthy', 'message': 'Trading Journal Backend'}, 200
        
        @app.route('/health')
        def health():
            return {'status': 'healthy'}, 200

# Configure for production
if __name__ == '__main__':
    # Get port from environment variable (Elastic Beanstalk sets this)
    port = int(os.environ.get('PORT', 5000))
    
    # Run the app
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False,
        threaded=True
    )

# For WSGI servers (like Gunicorn)
application = app

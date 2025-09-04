#!/usr/bin/env python3
"""
Minimal working Flask app to test basic functionality
"""
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/healthz')
def health_check():
    try:
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@app.route('/api/test')
def test_api():
    return jsonify({
        'message': 'API is working',
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/')
def index():
    return jsonify({
        'message': 'Trading Journal Backend',
        'status': 'running',
        'timestamp': datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    print("Starting minimal Flask app...")
    print(f"Environment: {os.getenv('FLASK_ENV', 'development')}")
    app.run(host='0.0.0.0', port=5000, debug=False)

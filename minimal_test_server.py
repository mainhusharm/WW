#!/usr/bin/env python3
"""
Minimal Test Server for Render Deployment
Tests basic functionality without complex dependencies
"""

from flask import Flask, jsonify
import os
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def root():
    """Root endpoint"""
    return jsonify({
        'message': 'Minimal Test Server',
        'status': 'running',
        'timestamp': datetime.now().isoformat(),
        'port': os.environ.get('PORT', '5000')
    }), 200

@app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'server': 'minimal-test'
    }), 200

@app.route('/api/test')
def test():
    """Test endpoint"""
    return jsonify({
        'message': 'Test endpoint working!',
        'timestamp': datetime.now().isoformat()
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Starting minimal test server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)

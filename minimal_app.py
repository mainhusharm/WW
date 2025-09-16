#!/usr/bin/env python3
"""
Minimal Flask App for Testing Render Deployment
"""

from flask import Flask, jsonify
import os

# Create a minimal Flask app
app = Flask(__name__)

@app.route('/')
def index():
    return jsonify({
        "status": "ok",
        "message": "Minimal app is running",
        "service": "trading-backend"
    })

@app.route('/health')
def health():
    return jsonify({
        "status": "ok",
        "service": "trading-backend",
        "version": "1.0.0"
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Minimal app starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
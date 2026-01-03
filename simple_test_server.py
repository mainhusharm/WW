#!/usr/bin/env python3
"""
Simple test server to serve the data flow test pages
"""

from flask import Flask, send_file
import os

app = Flask(__name__)

@app.route('/')
def index():
    return '''
    <html>
    <head><title>Data Flow Test Server</title></head>
    <body>
        <h1>🚀 Data Flow Test Server</h1>
        <p>Choose a test page:</p>
        <ul>
            <li><a href="/quick_test">Quick Data Flow Test</a></li>
            <li><a href="/working_test">Working Data Flow Test</a></li>
        </ul>
    </body>
    </html>
    '''

@app.route('/quick_test')
def quick_test():
    try:
        return send_file('quick_data_test.html')
    except FileNotFoundError:
        return "Test file not found", 404

@app.route('/working_test')
def working_test():
    try:
        return send_file('working_data_flow_test.html')
    except FileNotFoundError:
        return "Test file not found", 404

if __name__ == '__main__':
    print("🚀 Starting simple test server on port 3001...")
    print("📄 Access test pages at:")
    print("   http://localhost:3001/quick_test")
    print("   http://localhost:3001/working_test")
    app.run(host='0.0.0.0', port=3001, debug=True)

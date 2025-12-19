#!/usr/bin/env python3
"""
Simple HTTP Server for Frontend
Serves the frontend HTML file to avoid CORS issues
"""

import http.server
import socketserver
import os
import webbrowser
from threading import Timer

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler to serve files with proper CORS headers"""
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        super().end_headers()
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.end_headers()

def open_browser():
    """Open browser after a short delay"""
    webbrowser.open('http://localhost:8080/error_fix_frontend.html')

def main():
    """Start the HTTP server"""
    PORT = 8080
    
    # Change to the directory containing the HTML file
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"🌐 Frontend server starting on http://localhost:{PORT}")
        print(f"📄 Serving: error_fix_frontend.html")
        print(f"🔗 Backend should be running on: http://localhost:5001")
        print("=" * 60)
        
        # Open browser after 2 seconds
        Timer(2.0, open_browser).start()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user")
            httpd.shutdown()

if __name__ == '__main__':
    main()
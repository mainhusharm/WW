#!/usr/bin/env python3
"""
Simple HTTP Server for Futuristic Pages
Serves the new HTML pages on localhost:8000
"""

import http.server
import socketserver
import os
import webbrowser
import threading
import time

def start_http_server():
    """Start HTTP server to serve HTML pages"""
    PORT = 8000
    
    class CustomHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            super().end_headers()
    
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"🌐 Serving HTML pages at http://localhost:{PORT}")
        print(f"📁 Directory: {os.getcwd()}")
        print(f"🚀 Pages available:")
        print(f"   • http://localhost:{PORT}/signup-enhanced.html")
        print(f"   • http://localhost:{PORT}/payment-enhanced.html")
        print(f"   • http://localhost:{PORT}/questionnaire.html")
        print(f"\n⏳ Press Ctrl+C to stop the server")
        
        # Auto-open signup page
        def open_browser():
            time.sleep(2)
            webbrowser.open(f'http://localhost:{PORT}/signup-enhanced.html')
        
        threading.Thread(target=open_browser, daemon=True).start()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n🛑 HTTP server stopped")

if __name__ == "__main__":
    start_http_server()

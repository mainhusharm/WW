#!/usr/bin/env python3
"""
Quick Server Startup Script
Starts the working Flask database server for testing the new futuristic pages
"""

import subprocess
import sys
import os
import time
from datetime import datetime

def print_header(title):
    """Print formatted header"""
    print(f"\n{'='*60}")
    print(f"🚀 {title}")
    print('='*60)

def check_dependencies():
    """Check if required packages are installed"""
    print("📦 Checking dependencies...")
    
    required_packages = ['flask', 'flask_cors', 'requests']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} (missing)")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n⚠️  Installing missing packages...")
        subprocess.run([sys.executable, '-m', 'pip', 'install'] + missing_packages)
        print("✅ Dependencies installed!")
    
    return True

def start_flask_server():
    """Start the working Flask database server"""
    print("🔥 Starting Flask database server...")
    
    # Check if working_flask_app.py exists
    if not os.path.exists('working_flask_app.py'):
        print("❌ working_flask_app.py not found!")
        return False
    
    # Start the Flask server
    try:
        print("⏳ Starting server on http://localhost:5000...")
        subprocess.run([sys.executable, 'working_flask_app.py'])
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        return False
    
    return True

def show_test_urls():
    """Show the URLs for testing the new pages"""
    print_header("TEST YOUR NEW FUTURISTIC PAGES")
    
    print("🌐 Open these URLs in your browser:")
    print(f"   📝 Signup:        http://localhost:8000/signup-enhanced.html")
    print(f"   💳 Payment:       http://localhost:8000/payment-enhanced.html")
    print(f"   📋 Questionnaire: http://localhost:8000/questionnaire.html")
    
    print(f"\n🔧 API Server:       http://localhost:5000/api/working/health")
    
    print(f"\n📊 Test Flow:")
    print(f"   1. Start with signup page")
    print(f"   2. Complete payment (any method)")
    print(f"   3. Fill questionnaire")
    print(f"   4. Check database for stored data")

def main():
    """Main startup function"""
    print_header("FUTURISTIC PAGES SERVER STARTUP")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check dependencies
    if not check_dependencies():
        print("❌ Dependency check failed")
        return False
    
    # Show test URLs
    show_test_urls()
    
    print(f"\n🚀 Starting Flask database server...")
    print(f"   Press Ctrl+C to stop the server")
    print(f"   Server will run on http://localhost:5000")
    
    # Start Flask server
    start_flask_server()
    
    return True

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n👋 Server shutdown complete!")
        print(f"   Thank you for testing the pages!")
    except Exception as e:
        print(f"\n❌ Startup error: {e}")
        sys.exit(1)

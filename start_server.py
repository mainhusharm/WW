#!/usr/bin/env python3
"""
Simple server startup script
"""

import os
import sys
from pathlib import Path

# Add the journal directory to the Python path
journal_dir = Path(__file__).parent / 'journal'
sys.path.insert(0, str(journal_dir))

try:
    from __init__ import create_app
    from extensions import socketio
    
    print("🚀 Starting Trading Bot Server...")
    
    app = create_app()
    
    # Set environment variables
    os.environ['FLASK_ENV'] = 'development'
    os.environ['FLASK_DEBUG'] = '1'
    
    print("✅ Server created successfully")
    print("🌐 Starting on http://localhost:5000")
    print("📊 Health check: http://localhost:5000/api/health")
    print("🤖 Bot API: http://localhost:5000/api/bot/status")
    print("🔐 Database Dashboard: M-PIN 231806")
    print("\nPress Ctrl+C to stop the server")
    
    # Start the server
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running this from the project root directory")
except Exception as e:
    print(f"❌ Error starting server: {e}")
    import traceback
    traceback.print_exc()

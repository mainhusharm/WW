#!/usr/bin/env python3
"""
Start PostgreSQL backend with environment variable for password
"""

import os
import subprocess
import sys

def start_backend():
    """Start the PostgreSQL backend"""
    
    # Check if password is set in environment
    password = os.getenv('POSTGRES_PASSWORD')
    
    if not password:
        print("❌ POSTGRES_PASSWORD environment variable not set")
        print("Please set it with: export POSTGRES_PASSWORD=your_password")
        print("Or run: POSTGRES_PASSWORD=your_password python3 working_backend_with_postgresql.py")
        return False
    
    print("🚀 Starting PostgreSQL backend...")
    print(f"🔧 Using password: {password[:3]}***")
    
    try:
        # Start the backend
        subprocess.run([sys.executable, "working_backend_with_postgresql.py"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start backend: {e}")
        return False
    except KeyboardInterrupt:
        print("\n🛑 Backend stopped by user")
        return True

if __name__ == "__main__":
    start_backend()

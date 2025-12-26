#!/usr/bin/env python3
"""
Setup script for PostgreSQL backend
"""

import os
import subprocess
import sys

def install_requirements():
    """Install required packages"""
    print("📦 Installing PostgreSQL requirements...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary", "Flask-CORS"])
        print("✅ Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e}")
        return False

def setup_environment():
    """Setup environment variables"""
    print("🔧 Setting up environment...")
    
    # You need to set your PostgreSQL password here
    # Get it from your Render dashboard
    postgres_password = input("Enter your PostgreSQL password from Render: ").strip()
    
    if not postgres_password:
        print("❌ Password is required")
        return False
    
    # Set environment variable
    os.environ['POSTGRES_PASSWORD'] = postgres_password
    
    print("✅ Environment configured")
    return True

def test_connection():
    """Test PostgreSQL connection"""
    print("🔍 Testing PostgreSQL connection...")
    try:
        import psycopg2
        
        conn = psycopg2.connect(
            host='dpg-d37pd8nfte5s73bfl1ug-a',
            database='pghero_dpg_d2v9i7er433s73f0878g_a_cdm2',
            user='pghero_dpg_d2v9i7er433s73f0878g_a_cdm2',
            password=os.environ.get('POSTGRES_PASSWORD'),
            port=5432
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Connected to PostgreSQL: {version[0]}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Setting up PostgreSQL backend...")
    
    if not install_requirements():
        sys.exit(1)
    
    if not setup_environment():
        sys.exit(1)
    
    if not test_connection():
        sys.exit(1)
    
    print("✅ Setup complete! You can now run:")
    print("   POSTGRES_PASSWORD=your_password python3 working_backend_with_postgresql.py")

#!/usr/bin/env python3
"""
Simple database connection test
"""

import psycopg2
import ssl

# Database configuration
DATABASE_URL = "postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73f0878g-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2"

def test_connection():
    """Test database connection with SSL"""
    try:
        print("🔌 Testing database connection with SSL...")
        
        # Parse the database URL
        import urllib.parse
        parsed = urllib.parse.urlparse(DATABASE_URL)
        
        # Connect with SSL
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port,
            database=parsed.path[1:],  # Remove leading slash
            user=parsed.username,
            password=parsed.password,
            sslmode='require'
        )
        
        cur = conn.cursor()
        
        # Test basic query
        cur.execute("SELECT version();")
        version = cur.fetchone()
        print(f"✅ Database connected successfully!")
        print(f"📊 PostgreSQL version: {version[0]}")
        
        # Test current time
        cur.execute("SELECT NOW();")
        current_time = cur.fetchone()
        print(f"⏰ Current database time: {current_time[0]}")
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_without_ssl():
    """Test database connection without SSL"""
    try:
        print("\n🔌 Testing database connection without SSL...")
        
        # Parse the database URL
        import urllib.parse
        parsed = urllib.parse.urlparse(DATABASE_URL)
        
        # Connect without SSL
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port,
            database=parsed.path[1:],  # Remove leading slash
            user=parsed.username,
            password=parsed.password,
            sslmode='disable'
        )
        
        cur = conn.cursor()
        
        # Test basic query
        cur.execute("SELECT version();")
        version = cur.fetchone()
        print(f"✅ Database connected successfully!")
        print(f"📊 PostgreSQL version: {version[0]}")
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Simple Database Connection Test")
    print("=" * 50)
    
    # Try with SSL first
    if test_connection():
        print("\n✅ SSL connection successful!")
    else:
        # Try without SSL
        if test_without_ssl():
            print("\n✅ Non-SSL connection successful!")
        else:
            print("\n❌ Both connection methods failed.")
            print("Please check your database credentials and network connection.")

#!/usr/bin/env python3
"""
Setup script to create signal tables in PostgreSQL database
"""
import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def setup_signal_tables():
    """Setup signal tables in PostgreSQL database"""
    
    # Get database URL
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not found")
        return False
    
    try:
        # Connect to database
        print("🔌 Connecting to PostgreSQL database...")
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        print("✅ Connected to database successfully")
        
        # Read and execute SQL setup script
        with open('setup_signal_tables.sql', 'r') as f:
            sql_script = f.read()
        
        print("📝 Executing signal tables setup...")
        
        # Split script into individual statements and execute
        statements = [stmt.strip() for stmt in sql_script.split(';') if stmt.strip()]
        
        for i, statement in enumerate(statements):
            if statement:
                try:
                    cursor.execute(statement)
                    print(f"   ✅ Statement {i+1}/{len(statements)} executed")
                except Exception as e:
                    if "already exists" in str(e).lower():
                        print(f"   ⚠️  Statement {i+1}: {e}")
                    else:
                        print(f"   ❌ Statement {i+1} failed: {e}")
                        raise
        
        # Commit changes
        conn.commit()
        print("✅ All changes committed to database")
        
        # Verify tables were created
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('trading_signals', 'signal_feed')
        """)
        
        tables = cursor.fetchall()
        print(f"📊 Created tables: {[table[0] for table in tables]}")
        
        # Check if sample data was inserted
        cursor.execute("SELECT COUNT(*) FROM trading_signals")
        signal_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM signal_feed")
        feed_count = cursor.fetchone()[0]
        
        print(f"📈 Sample signals: {signal_count} in trading_signals, {feed_count} in signal_feed")
        
        cursor.close()
        conn.close()
        
        print("🎉 Signal system setup completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error setting up signal tables: {e}")
        return False

def test_signal_endpoints():
    """Test if signal endpoints are working"""
    import requests
    
    base_url = "https://backend-ox9b.onrender.com"
    
    try:
        # Test getting signals
        response = requests.get(f"{base_url}/api/signals", timeout=10)
        print(f"📡 GET /api/signals: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"   ✅ Found {data.get('count', 0)} signals")
            else:
                print(f"   ❌ Error: {data.get('error', 'Unknown error')}")
        
        # Test signal feed endpoint
        response = requests.get(f"{base_url}/api/signal-feed/api/signals/feed", timeout=10)
        print(f"📡 GET /api/signal-feed/api/signals/feed: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"   ✅ Found {data.get('count', 0)} signals in feed")
            else:
                print(f"   ❌ Error: {data.get('error', 'Unknown error')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing endpoints: {e}")
        return False

def main():
    print("🚀 Setting up Signal System for Trading Platform")
    print("=" * 50)
    
    # Setup signal tables
    if setup_signal_tables():
        print("\n🧪 Testing signal endpoints...")
        test_signal_endpoints()
        
        print("\n✅ Signal system setup completed!")
        print("\n📋 Next steps:")
        print("1. Your backend should now have signal endpoints working")
        print("2. Admin dashboard can create signals via POST /api/signals")
        print("3. User dashboard can fetch signals via GET /api/signals")
        print("4. Signals will automatically sync between admin and user feeds")
    else:
        print("\n❌ Signal system setup failed!")
        print("Please check your database connection and try again.")

if __name__ == "__main__":
    main()
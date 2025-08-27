#!/usr/bin/env python3
"""
Simple database initialization script
"""

import sqlite3
import os
from pathlib import Path

def create_database():
    """Create the database and tables"""
    
    # Create instance directory if it doesn't exist
    instance_dir = Path(__file__).parent.parent / 'instance'
    instance_dir.mkdir(exist_ok=True)
    
    # Database file path
    db_path = instance_dir / 'trading_bot.db'
    
    print(f"📁 Creating database at: {db_path}")
    
    # Connect to database (creates it if it doesn't exist)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Create bot_status table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bot_status (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bot_type VARCHAR(20) NOT NULL UNIQUE,
                is_active BOOLEAN NOT NULL DEFAULT FALSE,
                last_started DATETIME,
                last_stopped DATETIME,
                status_updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_by VARCHAR(50)
            )
        ''')
        print("✅ bot_status table created")
        
        # Create bot_data table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bot_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bot_type VARCHAR(20) NOT NULL,
                pair VARCHAR(20) NOT NULL,
                timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                price DECIMAL(20, 8) NOT NULL,
                signal_type VARCHAR(10),
                signal_strength DECIMAL(5, 2),
                is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                volume DECIMAL(20, 8),
                high DECIMAL(20, 8),
                low DECIMAL(20, 8),
                open_price DECIMAL(20, 8),
                close_price DECIMAL(20, 8),
                timeframe VARCHAR(10)
            )
        ''')
        print("✅ bot_data table created")
        
        # Create ohlc_data table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ohlc_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pair VARCHAR(20) NOT NULL,
                timeframe VARCHAR(10) NOT NULL,
                timestamp DATETIME NOT NULL,
                open_price DECIMAL(20, 8) NOT NULL,
                high_price DECIMAL(20, 8) NOT NULL,
                low_price DECIMAL(20, 8) NOT NULL,
                close_price DECIMAL(20, 8) NOT NULL,
                volume DECIMAL(20, 8),
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("✅ ohlc_data table created")
        
        # Create index for efficient querying
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_ohlc_pair_timeframe_timestamp 
            ON ohlc_data (pair, timeframe, timestamp)
        ''')
        print("✅ Database indexes created")
        
        # Insert initial bot status records
        cursor.execute('''
            INSERT OR IGNORE INTO bot_status (bot_type, is_active, updated_by)
            VALUES ('crypto', FALSE, 'system')
        ''')
        
        cursor.execute('''
            INSERT OR IGNORE INTO bot_status (bot_type, is_active, updated_by)
            VALUES ('forex', FALSE, 'system')
        ''')
        
        print("✅ Initial bot status records created")
        
        # Commit changes
        conn.commit()
        print("✅ Database changes committed")
        
        # Verify tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"📊 Available tables: {[table[0] for table in tables]}")
        
        # Check bot status
        cursor.execute("SELECT bot_type, is_active FROM bot_status")
        bots = cursor.fetchall()
        print("🤖 Bot status:")
        for bot in bots:
            status = "🟢 Active" if bot[1] else "🔴 Inactive"
            print(f"  {bot[0]}: {status}")
        
        print("\n🎉 Database initialization completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Initializing Trading Bot Database...")
    create_database()

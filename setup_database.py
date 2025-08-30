#!/usr/bin/env python3
"""
Simple Database Setup Script for Signal System
"""

import sqlite3
import os

def create_database():
    """Create the database and tables"""
    
    # Create instance directory if it doesn't exist
    instance_dir = os.path.join(os.path.dirname(__file__), 'instance')
    os.makedirs(instance_dir, exist_ok=True)
    
    # Database path
    db_path = os.path.join(instance_dir, 'journal.db')
    
    print(f"Creating database at: {db_path}")
    
    # Connect to database (will create if doesn't exist)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create signals table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            signal_id TEXT UNIQUE NOT NULL,
            pair TEXT NOT NULL,
            timeframe TEXT,
            direction TEXT NOT NULL,
            entry_price TEXT NOT NULL,
            stop_loss TEXT NOT NULL,
            take_profit TEXT NOT NULL,
            confidence INTEGER DEFAULT 90,
            analysis TEXT,
            ict_concepts TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'active',
            created_by TEXT DEFAULT 'admin'
        )
    ''')
    
    # Create signal_feed table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS signal_feed (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unique_key TEXT UNIQUE NOT NULL,
            signal_id TEXT NOT NULL,
            pair TEXT NOT NULL,
            direction TEXT NOT NULL,
            entry_price TEXT NOT NULL,
            stop_loss TEXT NOT NULL,
            take_profit TEXT NOT NULL,
            confidence INTEGER DEFAULT 90,
            analysis TEXT,
            ict_concepts TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'active',
            market TEXT DEFAULT 'forex',
            timeframe TEXT,
            created_by TEXT DEFAULT 'admin',
            outcome TEXT,
            pnl REAL,
            taken_by TEXT,
            taken_at DATETIME,
            is_recommended BOOLEAN DEFAULT 0
        )
    ''')
    
    # Create bot_data table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bot_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_type TEXT NOT NULL,
            pair TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            price TEXT NOT NULL,
            signal_type TEXT,
            signal_strength TEXT,
            is_recommended BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            volume TEXT,
            high TEXT,
            low TEXT,
            open_price TEXT,
            close_price TEXT,
            timeframe TEXT
        )
    ''')
    
    # Create bot_status table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bot_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_type TEXT UNIQUE NOT NULL,
            is_active BOOLEAN DEFAULT 0,
            last_started DATETIME,
            last_stopped DATETIME,
            status_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_by TEXT
        )
    ''')
    
    # Create ohlc_data table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ohlc_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pair TEXT NOT NULL,
            timeframe TEXT NOT NULL,
            timestamp DATETIME NOT NULL,
            open_price TEXT NOT NULL,
            high_price TEXT NOT NULL,
            low_price TEXT NOT NULL,
            close_price TEXT NOT NULL,
            volume TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create user_signals table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            pair TEXT NOT NULL,
            signal_type TEXT NOT NULL,
            result TEXT,
            confidence_pct TEXT,
            is_recommended BOOLEAN DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            entry_price TEXT,
            stop_loss TEXT,
            take_profit TEXT,
            analysis TEXT,
            ict_concepts TEXT,
            pnl TEXT,
            outcome_timestamp DATETIME,
            notes TEXT
        )
    ''')
    
    # Create unique index for signal_feed to prevent duplicates
    cursor.execute('''
        CREATE UNIQUE INDEX IF NOT EXISTS unique_signal_idx
        ON signal_feed(signal_id, pair, direction, entry_price, timestamp)
    ''')
    
    # Insert initial bot status records
    cursor.execute('''
        INSERT OR IGNORE INTO bot_status (bot_type, is_active, status_updated_at)
        VALUES ('crypto', 0, CURRENT_TIMESTAMP)
    ''')
    
    cursor.execute('''
        INSERT OR IGNORE INTO bot_status (bot_type, is_active, status_updated_at)
        VALUES ('forex', 0, CURRENT_TIMESTAMP)
    ''')
    
    # Commit changes
    conn.commit()
    
    # Verify tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    print("\n✅ Database setup completed successfully!")
    print(f"📊 Created tables: {[table[0] for table in tables]}")
    
    # Close connection
    conn.close()
    
    return db_path

if __name__ == "__main__":
    try:
        db_path = create_database()
        print(f"\n🎯 Database ready at: {db_path}")
        print("\n📝 Next steps:")
        print("1. Start your Flask application")
        print("2. Test signal generation from admin dashboard")
        print("3. Verify signals appear in user dashboard")
    except Exception as e:
        print(f"❌ Error setting up database: {str(e)}")

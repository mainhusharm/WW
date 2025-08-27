#!/usr/bin/env python3
"""
Database Initialization Script for Render Deployment
Creates necessary tables and initial data for the forex bot system
"""

import sqlite3
from pathlib import Path
import os

def init_database():
    """Initialize the database with required tables"""
    try:
        # Create instance directory if it doesn't exist
        instance_dir = Path(__file__).parent / 'instance'
        instance_dir.mkdir(exist_ok=True)
        
        # Database path
        db_path = instance_dir / 'trading_bot.db'
        
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create bot_data table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bot_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bot_type TEXT NOT NULL,
                pair TEXT NOT NULL,
                price REAL NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create ohlc_data table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ohlc_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                timeframe TEXT NOT NULL,
                open REAL NOT NULL,
                high REAL NOT NULL,
                low REAL NOT NULL,
                close REAL NOT NULL,
                volume INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_bot_data_type ON bot_data(bot_type)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_bot_data_timestamp ON bot_data(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_ohlc_symbol ON ohlc_data(symbol)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_ohlc_timestamp ON ohlc_data(timestamp)')
        
        # Insert some sample data
        cursor.execute('''
            INSERT OR IGNORE INTO bot_data (bot_type, pair, price)
            VALUES (?, ?, ?)
        ''', ('forex', 'EUR/USD', 1.1640))
        
        cursor.execute('''
            INSERT OR IGNORE INTO bot_data (bot_type, pair, price)
            VALUES (?, ?, ?)
        ''', ('forex', 'GBP/USD', 1.3490))
        
        # Commit changes
        conn.commit()
        conn.close()
        
        print(f"✅ Database initialized successfully at {db_path}")
        print(f"📊 Tables created: bot_data, ohlc_data")
        print(f"🔍 Indexes created for optimal performance")
        print(f"📈 Sample data inserted")
        
        return True
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

if __name__ == "__main__":
    success = init_database()
    if success:
        print("🚀 Database ready for production use!")
    else:
        print("💥 Database initialization failed!")
        exit(1)

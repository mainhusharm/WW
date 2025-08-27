#!/usr/bin/env python3
"""
Database initialization script for the Forex Bot System
This script creates the necessary database tables if they don't exist
"""

import sqlite3
import os
from pathlib import Path

def create_database():
    """Create the database and tables"""
    
    # Create instance directory if it doesn't exist
    instance_dir = Path(__file__).parent / 'instance'
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
        
        # Insert initial bot status if not exists
        cursor.execute('''
            INSERT OR IGNORE INTO bot_status (bot_type, is_active, updated_by)
            VALUES 
                ('crypto', FALSE, 'system'),
                ('forex', FALSE, 'system')
        ''')
        print("✅ Initial bot status inserted")
        
        # Create indexes for better performance
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_bot_data_bot_type_timestamp 
            ON bot_data (bot_type, timestamp)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_bot_data_pair_timestamp 
            ON bot_data (pair, timestamp)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_ohlc_data_pair_timeframe_timestamp 
            ON ohlc_data (pair, timeframe, timestamp)
        ''')
        print("✅ Database indexes created")
        
        conn.commit()
        print("✅ Database initialized successfully!")
        
        # Show table info
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"📊 Available tables: {[table[0] for table in tables]}")
        
        # Show sample data
        cursor.execute("SELECT COUNT(*) FROM bot_data")
        bot_data_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM ohlc_data")
        ohlc_data_count = cursor.fetchone()[0]
        
        print(f"📈 Current data counts:")
        print(f"   bot_data: {bot_data_count} records")
        print(f"   ohlc_data: {ohlc_data_count} records")
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

def test_database_connection():
    """Test the database connection and basic operations"""
    try:
        db_path = Path(__file__).parent / 'instance' / 'trading_bot.db'
        
        if not db_path.exists():
            print("❌ Database file not found. Run create_database() first.")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Test basic operations
        cursor.execute("SELECT COUNT(*) FROM bot_data")
        count = cursor.fetchone()[0]
        print(f"✅ Database connection test successful. bot_data count: {count}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
        return False

def insert_sample_data():
    """Insert sample data for testing"""
    try:
        db_path = Path(__file__).parent / 'instance' / 'trading_bot.db'
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Insert sample forex data
        sample_forex_data = [
            ('forex', 'EUR/USD', 1.0850, 'neutral', 0, False, 1000000, 1.0855, 1.0845, 1.0848, 1.0850, '1m'),
            ('forex', 'GBP/USD', 1.2650, 'neutral', 0, False, 800000, 1.2655, 1.2645, 1.2648, 1.2650, '1m'),
            ('forex', 'USD/JPY', 149.50, 'neutral', 0, False, 1200000, 149.55, 149.45, 149.48, 149.50, '1m'),
        ]
        
        cursor.executemany('''
            INSERT INTO bot_data (bot_type, pair, price, signal_type, signal_strength, 
                                is_recommended, volume, high, low, open_price, close_price, timeframe)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_forex_data)
        
        # Insert sample OHLC data
        sample_ohlc_data = [
            ('EUR/USD', '1m', '2024-01-01 12:00:00', 1.0848, 1.0855, 1.0845, 1.0850, 1000000),
            ('GBP/USD', '1m', '2024-01-01 12:00:00', 1.2648, 1.2655, 1.2645, 1.2650, 800000),
            ('USD/JPY', '1m', '2024-01-01 12:00:00', 149.48, 149.55, 149.45, 149.50, 1200000),
        ]
        
        cursor.executemany('''
            INSERT INTO ohlc_data (pair, timeframe, timestamp, open_price, high_price, low_price, close_price, volume)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_ohlc_data)
        
        conn.commit()
        print("✅ Sample data inserted successfully!")
        
        # Show updated counts
        cursor.execute("SELECT COUNT(*) FROM bot_data")
        bot_data_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM ohlc_data")
        ohlc_data_count = cursor.fetchone()[0]
        
        print(f"📈 Updated data counts:")
        print(f"   bot_data: {bot_data_count} records")
        print(f"   ohlc_data: {ohlc_data_count} records")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error inserting sample data: {e}")

if __name__ == "__main__":
    print("🚀 Forex Bot System - Database Initialization")
    print("=" * 50)
    
    try:
        # Create database and tables
        create_database()
        
        # Test connection
        if test_database_connection():
            print("\n✅ Database is ready!")
            
            # Ask if user wants sample data
            response = input("\n🤔 Would you like to insert sample data for testing? (y/n): ")
            if response.lower() in ['y', 'yes']:
                insert_sample_data()
        else:
            print("\n❌ Database setup failed!")
            
    except Exception as e:
        print(f"\n❌ Database initialization failed: {e}")
        print("Please check the error message above and try again.")

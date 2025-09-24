#!/usr/bin/env python3
"""
Initialize SQLite database for the trading platform
"""

import sqlite3
import os

def init_database():
    """Initialize the database with required tables"""
    db_path = "trading_bots.db"
    
    # Remove existing database if it exists
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Removed existing database: {db_path}")
    
    # Create new database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            plan_type TEXT DEFAULT 'premium',
            normalized_email TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    
    # Create signals table
    cursor.execute("""
        CREATE TABLE signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            signal_type TEXT NOT NULL,
            price REAL NOT NULL,
            confidence REAL NOT NULL,
            timestamp TEXT NOT NULL,
            status TEXT DEFAULT 'active'
        )
    """)
    
    # Insert some test signals
    test_signals = [
        ('EURUSD', 'BUY', 1.0850, 85.5, '2024-01-15T10:30:00Z', 'active'),
        ('GBPUSD', 'SELL', 1.2650, 78.2, '2024-01-15T11:15:00Z', 'active'),
        ('USDJPY', 'BUY', 149.50, 92.1, '2024-01-15T12:00:00Z', 'active'),
        ('AUDUSD', 'SELL', 0.6580, 73.8, '2024-01-15T13:45:00Z', 'active'),
        ('USDCAD', 'BUY', 1.3520, 81.3, '2024-01-15T14:20:00Z', 'active')
    ]
    
    cursor.executemany("""
        INSERT INTO signals (symbol, signal_type, price, confidence, timestamp, status)
        VALUES (?, ?, ?, ?, ?, ?)
    """, test_signals)
    
    # Insert a test user
    cursor.execute("""
        INSERT INTO users (username, email, password_hash, plan_type, normalized_email, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, ('Test User', 'test@example.com', 'hashed_password', 'premium', 'test@example.com', '2024-01-15T10:00:00Z'))
    
    conn.commit()
    conn.close()
    
    print(f"Database initialized successfully: {db_path}")
    print("Created tables: users, signals")
    print("Inserted test data")

if __name__ == "__main__":
    init_database()

#!/usr/bin/env python3
"""
Initialize authentication database
"""

import sqlite3
import os
from datetime import datetime

def init_database():
    """Initialize the database with users table"""
    db_path = 'trading_platform.db'
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            plan_type TEXT DEFAULT 'premium',
            created_at TEXT,
            updated_at TEXT
        )
    ''')
    
    # Create a test user if none exists
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    
    if user_count == 0:
        # Create test user
        test_user_id = 'test-user-123'
        test_username = 'testuser'
        test_email = 'anchlshrma18@gmail.com'
        test_password_hash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'  # 'password' hashed with SHA-256
        created_at = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO users (id, username, email, password_hash, plan_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (test_user_id, test_username, test_email, test_password_hash, 'premium', created_at))
        
        print(f"✅ Created test user: {test_email}")
    
    conn.commit()
    conn.close()
    
    print(f"✅ Database initialized: {db_path}")

if __name__ == "__main__":
    init_database()

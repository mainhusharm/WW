#!/usr/bin/env python3
"""
Test script to add a new user to the database
This simulates a new user signup to test the Enhanced Data tab
"""

import sqlite3
from datetime import datetime

def add_test_user():
    """Add a new test user to the database"""
    conn = sqlite3.connect('trading_bots.db')
    cursor = conn.cursor()
    
    # Get the next available ID
    cursor.execute("SELECT MAX(id) FROM users")
    max_id = cursor.fetchone()[0] or 0
    new_id = max_id + 1
    
    # Create a new user with current timestamp
    current_time = datetime.now().isoformat()
    username = f"TestUser{new_id}"
    email = f"testuser{new_id}@example.com"
    
    cursor.execute("""
        INSERT INTO users (id, username, email, created_at, plan_type, unique_id, normalized_email)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (new_id, username, email, current_time, 'free', f'CUS-{new_id:03d}', email.lower()))
    
    conn.commit()
    conn.close()
    
    print(f"✅ Added new user: {username} ({email}) with ID {new_id}")
    print(f"📅 Signup time: {current_time}")
    print(f"🎯 This user should now appear in the Enhanced Data tab!")
    
    return new_id, username, email

if __name__ == '__main__':
    print("🧪 Testing new user signup...")
    user_id, username, email = add_test_user()
    print(f"\n🔍 Check the Enhanced Data tab - you should see:")
    print(f"   - Name: {username}")
    print(f"   - Email: {email}")
    print(f"   - ID: CUS-{user_id:03d}")
    print(f"   - Plan: free")
    print(f"   - Status: pending")

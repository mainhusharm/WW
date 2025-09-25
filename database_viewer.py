#!/usr/bin/env python3
"""
Database Viewer - Check all entries in the database
"""

import sqlite3
import json
from datetime import datetime

def view_database():
    """View all database entries"""
    try:
        # Connect to database
        conn = sqlite3.connect('users_database.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        print("🔍 DATABASE ENTRIES VIEWER")
        print("=" * 50)
        
        # Get all users
        cursor.execute('SELECT * FROM users ORDER BY created_at DESC')
        users = cursor.fetchall()
        
        print(f"\n👥 USERS TABLE ({len(users)} entries):")
        print("-" * 30)
        
        if users:
            for user in users:
                print(f"ID: {user['id']}")
                print(f"Email: {user['email']}")
                print(f"Name: {user['first_name']} {user['last_name']}")
                print(f"Password: {user['password']}")
                print(f"Created: {user['created_at']}")
                print(f"Updated: {user['updated_at']}")
                print("-" * 30)
        else:
            print("No users found in database")
        
        # Get all sessions
        cursor.execute('SELECT * FROM user_sessions ORDER BY created_at DESC')
        sessions = cursor.fetchall()
        
        print(f"\n🔐 USER SESSIONS TABLE ({len(sessions)} entries):")
        print("-" * 30)
        
        if sessions:
            for session in sessions:
                print(f"Session ID: {session['id']}")
                print(f"User ID: {session['user_id']}")
                print(f"Token: {session['token']}")
                print(f"Created: {session['created_at']}")
                print(f"Expires: {session['expires_at']}")
                print("-" * 30)
        else:
            print("No sessions found in database")
        
        # Database statistics
        cursor.execute('SELECT COUNT(*) as total_users FROM users')
        total_users = cursor.fetchone()['total_users']
        
        cursor.execute('SELECT COUNT(*) as total_sessions FROM user_sessions')
        total_sessions = cursor.fetchone()['total_sessions']
        
        print(f"\n📊 DATABASE STATISTICS:")
        print(f"Total Users: {total_users}")
        print(f"Total Sessions: {total_sessions}")
        print(f"Database File: users_database.db")
        print(f"Last Checked: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error viewing database: {e}")

def export_to_json():
    """Export database to JSON file"""
    try:
        conn = sqlite3.connect('users_database.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get all data
        cursor.execute('SELECT * FROM users ORDER BY created_at DESC')
        users = [dict(user) for user in cursor.fetchall()]
        
        cursor.execute('SELECT * FROM user_sessions ORDER BY created_at DESC')
        sessions = [dict(session) for session in cursor.fetchall()]
        
        # Create export data
        export_data = {
            "export_timestamp": datetime.now().isoformat(),
            "users": users,
            "sessions": sessions,
            "statistics": {
                "total_users": len(users),
                "total_sessions": len(sessions)
            }
        }
        
        # Save to JSON file
        with open('database_export.json', 'w') as f:
            json.dump(export_data, f, indent=2)
        
        print(f"✅ Database exported to: database_export.json")
        print(f"📁 Users: {len(users)}, Sessions: {len(sessions)}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error exporting database: {e}")

if __name__ == '__main__':
    print("Choose an option:")
    print("1. View database entries")
    print("2. Export to JSON")
    print("3. Both")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == '1':
        view_database()
    elif choice == '2':
        export_to_json()
    elif choice == '3':
        view_database()
        print("\n" + "="*50)
        export_to_json()
    else:
        print("Invalid choice. Running default view...")
        view_database()

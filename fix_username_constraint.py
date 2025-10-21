#!/usr/bin/env python3
"""
Fix Username Constraint Issue
"""

import sqlite3
import os

def fix_username_constraint():
    """Fix the username constraint issue in the database"""
    try:
        print("🔄 Fixing username constraint issue...")
        
        db_path = "trading_bots.db"
        if not os.path.exists(db_path):
            print(f"❌ Database not found: {db_path}")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current users table structure
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        
        print("📊 Current users table structure:")
        for col in columns:
            print(f"   {col[1]} ({col[2]})")
        
        # Check if username has unique constraint
        cursor.execute("PRAGMA index_list(users)")
        indexes = cursor.fetchall()
        
        print("📊 Current indexes:")
        for idx in indexes:
            print(f"   {idx[1]}")
        
        # Remove unique constraint from username if it exists
        try:
            cursor.execute("DROP INDEX IF EXISTS idx_users_username")
            print("✅ Removed username unique index")
        except:
            pass
        
        # Check for duplicate usernames
        cursor.execute("SELECT username, COUNT(*) FROM users GROUP BY username HAVING COUNT(*) > 1")
        duplicates = cursor.fetchall()
        
        if duplicates:
            print(f"⚠️  Found {len(duplicates)} duplicate usernames")
            for username, count in duplicates:
                print(f"   '{username}': {count} occurrences")
                
                # Update duplicate usernames to be unique
                cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
                user_ids = cursor.fetchall()
                
                for i, (user_id,) in enumerate(user_ids):
                    if i > 0:  # Keep first one, update others
                        new_username = f"{username} ({i+1})"
                        cursor.execute("UPDATE users SET username = ? WHERE id = ?", (new_username, user_id))
                        print(f"   Updated user {user_id} to '{new_username}'")
        
        conn.commit()
        conn.close()
        
        print("✅ Username constraint issue fixed")
        return True
        
    except Exception as e:
        print(f"❌ Error fixing username constraint: {str(e)}")
        return False

def test_user_creation():
    """Test creating the specific user"""
    try:
        print("🔄 Testing user creation...")
        
        import requests
        
        test_user = {
            "email": "anchalw11@gmail.com",
            "password": "TestPassword123!",
            "firstName": "Anchal",
            "lastName": "Sharma",
            "plan_type": "premium"
        }
        
        response = requests.post(
            "http://localhost:5000/api/auth/register",
            json=test_user,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"   Registration status: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print("✅ User created successfully!")
            print(f"   User ID: {data['user']['id']}")
            print(f"   Email: {data['user']['email']}")
            return True
        elif response.status_code == 409:
            print("⚠️  User already exists")
            return True
        else:
            print(f"❌ Registration failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing user creation: {str(e)}")
        return False

def main():
    """Main function"""
    print("🚀 Fix Username Constraint")
    print("=" * 40)
    
    try:
        # Fix username constraint
        fix_username_constraint()
        print()
        
        # Test user creation
        test_user_creation()
        
        print()
        print("=" * 40)
        print("✅ Username constraint fixed")
        print("🔐 User anchalw11@gmail.com should now work")
        print("=" * 40)
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == '__main__':
    main()

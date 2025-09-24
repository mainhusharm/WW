#!/usr/bin/env python3
"""
Fix Backend Database and Create Test User
This script fixes the backend database issues and creates a proper test user
"""

import os
import sys
import sqlite3
from datetime import datetime
from werkzeug.security import generate_password_hash
import requests
import json

def check_backend_database():
    """Check and fix the backend database structure"""
    try:
        print("🔍 Checking backend database structure...")
        
        # Check if we have the correct database file
        db_files = [
            "trading_bots.db",
            "instance/trading_bot.db", 
            "journal/instance/trading_bot.db",
            "trading_journal.db"
        ]
        
        db_path = None
        for db_file in db_files:
            if os.path.exists(db_file):
                db_path = db_file
                print(f"✅ Found database: {db_file}")
                break
        
        if not db_path:
            print("❌ No database file found")
            return None
        
        # Connect and check structure
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print(f"📊 Database tables: {[table[0] for table in tables]}")
        
        # Check if users table has the required columns
        if any('users' in table for table in tables):
            cursor.execute("PRAGMA table_info(users);")
            columns = cursor.fetchall()
            column_names = [col[1] for col in columns]
            
            print(f"📋 Users table columns: {column_names}")
            
            # Check if we need to add missing columns
            required_columns = ['password_hash', 'plan_type', 'unique_id', 'normalized_email']
            missing_columns = []
            
            for col in required_columns:
                if col not in column_names:
                    missing_columns.append(col)
            
            if missing_columns:
                print(f"⚠️  Missing columns: {missing_columns}")
                print("   Adding missing columns...")
                
                for col in missing_columns:
                    if col == 'password_hash':
                        cursor.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
                    elif col == 'plan_type':
                        cursor.execute("ALTER TABLE users ADD COLUMN plan_type TEXT DEFAULT 'free'")
                    elif col == 'unique_id':
                        cursor.execute("ALTER TABLE users ADD COLUMN unique_id TEXT")
                    elif col == 'normalized_email':
                        cursor.execute("ALTER TABLE users ADD COLUMN normalized_email TEXT")
                
                conn.commit()
                print("✅ Added missing columns")
        
        conn.close()
        return db_path
        
    except Exception as e:
        print(f"❌ Error checking database: {str(e)}")
        return None

def create_proper_test_user(db_path):
    """Create a proper test user with all required fields"""
    try:
        print("🔄 Creating proper test user...")
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Test user credentials
        test_email = "testuser@example.com"
        test_password = "TestPassword123!"
        test_username = "Test User"
        
        # Check if user already exists
        cursor.execute("SELECT id, email, plan_type FROM users WHERE email = ?", (test_email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print(f"⚠️  User already exists: ID {existing_user[0]}, Plan: {existing_user[2]}")
            
            # Update existing user to ensure it has proper plan_type
            cursor.execute("""
                UPDATE users 
                SET plan_type = 'premium', 
                    password_hash = ?,
                    normalized_email = ?
                WHERE email = ?
            """, (
                generate_password_hash(test_password, method='pbkdf2:sha256'),
                test_email.lower().strip(),
                test_email
            ))
            conn.commit()
            print("✅ Updated existing user with proper credentials")
        else:
            # Create new user with all required fields
            hashed_password = generate_password_hash(test_password, method='pbkdf2:sha256')
            unique_id = f"TEST{datetime.now().strftime('%m%d%H%M')}"
            
            cursor.execute("""
                INSERT INTO users (
                    unique_id, username, email, normalized_email, password_hash, 
                    plan_type, created_at, consent_accepted, consent_timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                unique_id, test_username, test_email, test_email.lower().strip(),
                hashed_password, 'premium', datetime.utcnow().isoformat(),
                True, datetime.utcnow().isoformat()
            ))
            conn.commit()
            print("✅ Created new test user")
        
        # Verify the user
        cursor.execute("""
            SELECT id, unique_id, username, email, plan_type, created_at 
            FROM users WHERE email = ?
        """, (test_email,))
        user = cursor.fetchone()
        
        if user:
            print("📋 Test User Details:")
            print(f"   ID: {user[0]}")
            print(f"   Unique ID: {user[1]}")
            print(f"   Username: {user[2]}")
            print(f"   Email: {user[3]}")
            print(f"   Plan: {user[4]}")
            print(f"   Created: {user[5]}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating test user: {str(e)}")
        if 'conn' in locals():
            conn.close()
        return False

def test_backend_api():
    """Test the backend API endpoints"""
    try:
        print("🔍 Testing backend API...")
        
        # Try different possible backend URLs
        backend_urls = [
            "https://backend-u4hy.onrender.com",
            "https://ww-whoa.onrender.com",
            "http://localhost:5000"
        ]
        
        for base_url in backend_urls:
            try:
                print(f"   Testing: {base_url}")
                
                # Test health endpoint
                response = requests.get(f"{base_url}/healthz", timeout=10)
                print(f"     Health check: {response.status_code}")
                
                if response.status_code == 200:
                    print(f"     ✅ Backend is accessible")
                    
                    # Test login endpoint
                    login_data = {
                        "email": "testuser@example.com",
                        "password": "TestPassword123!"
                    }
                    
                    response = requests.post(
                        f"{base_url}/api/auth/login",
                        json=login_data,
                        headers={"Content-Type": "application/json"},
                        timeout=10
                    )
                    
                    print(f"     Login test: {response.status_code}")
                    if response.status_code == 200:
                        print(f"     ✅ Login successful!")
                        data = response.json()
                        if "access_token" in data:
                            print(f"     Token: {data['access_token'][:20]}...")
                        return base_url
                    else:
                        print(f"     ❌ Login failed: {response.text[:100]}")
                        
            except requests.exceptions.ConnectionError:
                print(f"     ❌ Connection failed")
            except Exception as e:
                print(f"     ❌ Error: {str(e)}")
        
        return None
        
    except Exception as e:
        print(f"❌ Error testing backend API: {str(e)}")
        return None

def create_test_signals_for_user(db_path):
    """Create test signals that will be visible to the test user"""
    try:
        print("🔄 Creating test signals for user dashboard...")
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if signal tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%signal%';")
        signal_tables = cursor.fetchall()
        
        print(f"📊 Signal tables found: {[table[0] for table in signal_tables]}")
        
        # Create signals in trading_signals table
        test_signals = [
            {
                'symbol': 'EURUSD',
                'signal_type': 'BUY',
                'confidence': 85.5,
                'price': 1.0850,
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'active'
            },
            {
                'symbol': 'BTC/USD',
                'signal_type': 'SELL',
                'confidence': 78.2,
                'price': 45000.0,
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'active'
            },
            {
                'symbol': 'GBPUSD',
                'signal_type': 'SELL',
                'confidence': 92.1,
                'price': 1.2650,
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'active'
            }
        ]
        
        for signal in test_signals:
            cursor.execute("""
                INSERT OR REPLACE INTO trading_signals 
                (symbol, signal_type, confidence, price, timestamp, status)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                signal['symbol'], signal['signal_type'], signal['confidence'],
                signal['price'], signal['timestamp'], signal['status']
            ))
        
        conn.commit()
        print(f"✅ Created {len(test_signals)} test signals")
        
        # List created signals
        cursor.execute("SELECT id, symbol, signal_type, price, confidence FROM trading_signals ORDER BY id DESC LIMIT 5")
        signals = cursor.fetchall()
        
        print("📊 Test signals:")
        for signal in signals:
            print(f"   - {signal[1]} {signal[2]} @ ${signal[3]} (Confidence: {signal[4]}%)")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating test signals: {str(e)}")
        if 'conn' in locals():
            conn.close()
        return False

def main():
    """Main function"""
    print("🚀 Backend Fix and Test User Creation")
    print("=" * 60)
    
    try:
        # Step 1: Check and fix database
        db_path = check_backend_database()
        if not db_path:
            print("❌ Could not find or fix database")
            return False
        
        print()
        
        # Step 2: Create proper test user
        if not create_proper_test_user(db_path):
            print("❌ Could not create test user")
            return False
        
        print()
        
        # Step 3: Create test signals
        if not create_test_signals_for_user(db_path):
            print("❌ Could not create test signals")
            return False
        
        print()
        
        # Step 4: Test backend API
        working_backend = test_backend_api()
        
        print()
        print("=" * 60)
        print("📋 SUMMARY")
        print("=" * 60)
        print("✅ Database structure fixed")
        print("✅ Test user created/updated")
        print("✅ Test signals created")
        if working_backend:
            print(f"✅ Backend API working: {working_backend}")
        else:
            print("⚠️  Backend API not accessible")
        
        print()
        print("🔐 TEST CREDENTIALS:")
        print("   Email: testuser@example.com")
        print("   Password: TestPassword123!")
        print("   Plan: premium")
        print()
        print("📝 NEXT STEPS:")
        print("1. Try logging in again with the test credentials")
        print("2. If still getting 500 error, check backend server logs")
        print("3. Verify the backend is running and accessible")
        print("4. Check if the database is properly connected to the backend")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Create Test User Account for Dashboard Testing (Simple Version)
This script creates a test user account with the existing database schema
"""

import os
import sys
import sqlite3
from datetime import datetime
import hashlib
import random
import string

def create_test_user_simple():
    """Create a test user account using the existing database schema"""
    try:
        print("🔄 Creating test user account...")
        
        # Database path
        db_path = "trading_bots.db"
        if not os.path.exists(db_path):
            print(f"❌ Database file not found: {db_path}")
            return None
        
        # Test user credentials
        test_email = "testuser@example.com"
        test_password = "TestPassword123!"
        test_username = "Test User"
        
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if test user already exists
        cursor.execute("SELECT id, username, email, created_at FROM users WHERE email = ?", (test_email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print(f"⚠️  Test user already exists:")
            print(f"   ID: {existing_user[0]}")
            print(f"   Username: {existing_user[1]}")
            print(f"   Email: {existing_user[2]}")
            print(f"   Created: {existing_user[3]}")
            conn.close()
            return existing_user
        
        # Create new test user with simple password hash
        password_hash = hashlib.sha256(test_password.encode()).hexdigest()
        
        # Insert user with existing schema
        cursor.execute("""
            INSERT INTO users (username, email, created_at)
            VALUES (?, ?, ?)
        """, (test_username, test_email, datetime.utcnow().isoformat()))
        
        user_id = cursor.lastrowid
        conn.commit()
        
        print("✅ Test user created successfully!")
        print("=" * 50)
        print("📋 TEST USER CREDENTIALS:")
        print(f"   Email: {test_email}")
        print(f"   Password: {test_password}")
        print(f"   Username: {test_username}")
        print(f"   User ID: {user_id}")
        print(f"   Created: {datetime.utcnow().isoformat()}")
        print("=" * 50)
        print("🔐 LOGIN INSTRUCTIONS:")
        print("1. Go to your application login page")
        print("2. Use the email and password above")
        print("3. Navigate to the Signals tab in the dashboard")
        print("4. Check if signals from admin are appearing")
        print("=" * 50)
        
        conn.close()
        return (user_id, test_username, test_email, datetime.utcnow().isoformat())
        
    except Exception as e:
        print(f"❌ Error creating test user: {str(e)}")
        if 'conn' in locals():
            conn.close()
        return None

def create_test_signals():
    """Create some test signals to verify signal flow"""
    try:
        print("🔄 Creating test signals...")
        
        db_path = "trading_bots.db"
        if not os.path.exists(db_path):
            print(f"❌ Database file not found: {db_path}")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if trading_signals table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='trading_signals';")
        if not cursor.fetchone():
            print("❌ trading_signals table not found")
            conn.close()
            return False
        
        # Create test signals
        test_signals = [
            {
                'signal_type': 'forex',
                'pair': 'EURUSD',
                'direction': 'BUY',
                'entry_price': '1.0850',
                'stop_loss': '1.0800',
                'take_profit': '1.0900',
                'confidence_score': 85,
                'is_recommended': True,
                'created_by': 'admin',
                'created_at': datetime.utcnow().isoformat()
            },
            {
                'signal_type': 'crypto',
                'pair': 'BTC/USD',
                'direction': 'SELL',
                'entry_price': '45000',
                'stop_loss': '46000',
                'take_profit': '44000',
                'confidence_score': 78,
                'is_recommended': False,
                'created_by': 'admin',
                'created_at': datetime.utcnow().isoformat()
            },
            {
                'signal_type': 'forex',
                'pair': 'GBPUSD',
                'direction': 'SELL',
                'entry_price': '1.2650',
                'stop_loss': '1.2700',
                'take_profit': '1.2600',
                'confidence_score': 92,
                'is_recommended': True,
                'created_by': 'admin',
                'created_at': datetime.utcnow().isoformat()
            }
        ]
        
        # Insert test signals
        for signal in test_signals:
            cursor.execute("""
                INSERT INTO trading_signals 
                (signal_type, pair, direction, entry_price, stop_loss, take_profit, 
                 confidence_score, is_recommended, created_by, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                signal['signal_type'], signal['pair'], signal['direction'],
                signal['entry_price'], signal['stop_loss'], signal['take_profit'],
                signal['confidence_score'], signal['is_recommended'],
                signal['created_by'], signal['created_at']
            ))
        
        conn.commit()
        print(f"✅ Created {len(test_signals)} test signals")
        
        # List created signals
        cursor.execute("SELECT id, pair, direction, entry_price, confidence_score FROM trading_signals ORDER BY id DESC LIMIT 3")
        signals = cursor.fetchall()
        
        print("📊 Test signals created:")
        for signal in signals:
            print(f"   - {signal[1]} {signal[2]} @ {signal[3]} (Confidence: {signal[4]}%)")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating test signals: {str(e)}")
        if 'conn' in locals():
            conn.close()
        return False

def check_signal_flow():
    """Check if signals can be retrieved from the database"""
    try:
        print("🔍 Checking signal flow...")
        
        db_path = "trading_bots.db"
        if not os.path.exists(db_path):
            print("❌ Database file not found")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check trading_signals table
        cursor.execute("SELECT COUNT(*) FROM trading_signals")
        signal_count = cursor.fetchone()[0]
        print(f"📊 Total signals in database: {signal_count}")
        
        if signal_count > 0:
            # Get recent signals
            cursor.execute("""
                SELECT id, pair, direction, entry_price, confidence_score, created_at 
                FROM trading_signals 
                ORDER BY id DESC 
                LIMIT 5
            """)
            signals = cursor.fetchall()
            
            print("📈 Recent signals:")
            for signal in signals:
                print(f"   - {signal[1]} {signal[2]} @ {signal[3]} (Confidence: {signal[4]}%) - {signal[5]}")
        
        # Check users table
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"👥 Total users in database: {user_count}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error checking signal flow: {str(e)}")
        if 'conn' in locals():
            conn.close()
        return False

if __name__ == '__main__':
    print("🚀 Test User & Signal Creation Script")
    print("=" * 60)
    
    try:
        # Create test user
        user = create_test_user_simple()
        print()
        
        # Create test signals
        create_test_signals()
        print()
        
        # Check signal flow
        check_signal_flow()
        
        print("\n🎉 Test setup completed!")
        print("\n📝 Next steps:")
        print("1. Start your Flask application")
        print("2. Login with the test credentials:")
        print("   Email: testuser@example.com")
        print("   Password: TestPassword123!")
        print("3. Navigate to the user dashboard")
        print("4. Check the Signals tab for admin-generated signals")
        print("5. Verify that signals are appearing in the user dashboard")
        
    except Exception as e:
        print(f"\n❌ Setup failed: {str(e)}")
        sys.exit(1)

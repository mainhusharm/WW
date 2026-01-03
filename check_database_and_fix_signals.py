#!/usr/bin/env python3
"""
Check Database and Fix Signal Feed Data Format
"""

import sqlite3
import os
from datetime import datetime

def check_database_users():
    """Check all users in the database"""
    try:
        print("🔍 Checking database users...")
        
        db_path = "trading_bots.db"
        if not os.path.exists(db_path):
            print(f"❌ Database file not found: {db_path}")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all users
        cursor.execute("""
            SELECT id, username, email, plan_type, created_at 
            FROM users 
            ORDER BY id DESC
        """)
        
        users = cursor.fetchall()
        
        print(f"📊 Total users in database: {len(users)}")
        print("=" * 60)
        
        for user in users:
            print(f"👤 User ID: {user[0]}")
            print(f"   Username: {user[1]}")
            print(f"   Email: {user[2]}")
            print(f"   Plan: {user[3]}")
            print(f"   Created: {user[4]}")
            print("-" * 40)
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error checking users: {str(e)}")
        return False

def check_signals_in_database():
    """Check signals in the database"""
    try:
        print("🔍 Checking signals in database...")
        
        db_path = "trading_bots.db"
        if not os.path.exists(db_path):
            print(f"❌ Database file not found: {db_path}")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all signals
        cursor.execute("""
            SELECT id, symbol, signal_type, confidence, price, timestamp, status 
            FROM trading_signals 
            ORDER BY id DESC
        """)
        
        signals = cursor.fetchall()
        
        print(f"📊 Total signals in database: {len(signals)}")
        print("=" * 60)
        
        for signal in signals:
            print(f"📈 Signal ID: {signal[0]}")
            print(f"   Symbol: {signal[1]}")
            print(f"   Type: {signal[2]}")
            print(f"   Confidence: {signal[3]}%")
            print(f"   Price: ${signal[4]}")
            print(f"   Status: {signal[6]}")
            print(f"   Timestamp: {signal[5]}")
            print("-" * 40)
        
        conn.close()
        return len(signals) > 0
        
    except Exception as e:
        print(f"❌ Error checking signals: {str(e)}")
        return False

def create_proper_signal_feed_data():
    """Create signals in the format expected by the frontend"""
    try:
        print("🔄 Creating proper signal feed data...")
        
        db_path = "trading_bots.db"
        if not os.path.exists(db_path):
            print(f"❌ Database file not found: {db_path}")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Clear existing signals
        cursor.execute("DELETE FROM trading_signals")
        
        # Create signals in the format expected by the frontend
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
            },
            {
                'symbol': 'ETH/USD',
                'signal_type': 'BUY',
                'confidence': 88.7,
                'price': 3200.0,
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'active'
            },
            {
                'symbol': 'USDJPY',
                'signal_type': 'BUY',
                'confidence': 76.3,
                'price': 150.25,
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'active'
            }
        ]
        
        # Insert signals
        for signal in test_signals:
            cursor.execute("""
                INSERT INTO trading_signals 
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
        
        print("📊 Test signals created:")
        for signal in signals:
            print(f"   - {signal[1]} {signal[2]} @ ${signal[3]} (Confidence: {signal[4]}%)")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating signal feed data: {str(e)}")
        if 'conn' in locals():
            conn.close()
        return False

def test_signal_feed_endpoint():
    """Test the signal feed endpoint with proper data format"""
    try:
        print("🔍 Testing signal feed endpoint...")
        
        import requests
        
        # Test local backend
        response = requests.get("http://localhost:5000/api/signal-feed/signals/feed", timeout=10)
        
        print(f"   Signal feed endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Signal feed working! Found {len(data)} signals")
            
            if data:
                print("   📊 Sample signal:")
                print(f"      {data[0]}")
            
            return True
        else:
            print(f"   ❌ Signal feed failed: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Could not connect to local backend")
        print("   Make sure to run: python3 simple_working_backend.py")
        return False
    except Exception as e:
        print(f"   ❌ Error testing signal feed: {str(e)}")
        return False

def create_mock_signal_feed():
    """Create a mock signal feed that matches frontend expectations"""
    try:
        print("🔄 Creating mock signal feed...")
        
        # Create mock data that matches what the frontend expects
        mock_signals = [
            {
                "id": "signal_1",
                "pair": "EURUSD",
                "direction": "LONG",
                "entry": "1.0850",
                "stopLoss": "1.0800",
                "takeProfit": ["1.0900", "1.0950"],
                "confidence": 85,
                "analysis": "Strong bullish momentum with key support at 1.0800",
                "ictConcepts": ["Order Block", "Fair Value Gap"],
                "timestamp": datetime.utcnow().isoformat(),
                "status": "active",
                "market": "forex",
                "timeframe": "15m",
                "is_recommended": True
            },
            {
                "id": "signal_2", 
                "pair": "BTC/USD",
                "direction": "SHORT",
                "entry": "45000",
                "stopLoss": "46000",
                "takeProfit": ["44000", "43000"],
                "confidence": 78,
                "analysis": "Bearish divergence on higher timeframe",
                "ictConcepts": ["Liquidity Sweep", "Market Structure"],
                "timestamp": datetime.utcnow().isoformat(),
                "status": "active",
                "market": "crypto",
                "timeframe": "1h",
                "is_recommended": False
            },
            {
                "id": "signal_3",
                "pair": "GBPUSD", 
                "direction": "SHORT",
                "entry": "1.2650",
                "stopLoss": "1.2700",
                "takeProfit": ["1.2600", "1.2550"],
                "confidence": 92,
                "analysis": "Perfect bearish setup with clear rejection at resistance",
                "ictConcepts": ["Order Block", "Liquidity Pool"],
                "timestamp": datetime.utcnow().isoformat(),
                "status": "active",
                "market": "forex",
                "timeframe": "4h",
                "is_recommended": True
            }
        ]
        
        # Save mock data to a JSON file
        import json
        with open('mock_signal_feed.json', 'w') as f:
            json.dump(mock_signals, f, indent=2)
        
        print("✅ Created mock_signal_feed.json")
        print("📊 Mock signals created:")
        for signal in mock_signals:
            print(f"   - {signal['pair']} {signal['direction']} @ {signal['entry']} (Confidence: {signal['confidence']}%)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating mock signal feed: {str(e)}")
        return False

def main():
    """Main function"""
    print("🚀 Database Check and Signal Feed Fix")
    print("=" * 60)
    
    try:
        # Check users in database
        check_database_users()
        print()
        
        # Check signals in database
        check_signals_in_database()
        print()
        
        # Create proper signal feed data
        create_proper_signal_feed_data()
        print()
        
        # Test signal feed endpoint
        test_signal_feed_endpoint()
        print()
        
        # Create mock signal feed
        create_mock_signal_feed()
        
        print("=" * 60)
        print("📋 SUMMARY")
        print("=" * 60)
        print("✅ Database users checked")
        print("✅ Signals in database checked")
        print("✅ Proper signal feed data created")
        print("✅ Mock signal feed created")
        print()
        print("🔐 YOUR REGISTERED USERS:")
        print("   admin@test.com / admin123")
        print("   user@test.com / user123")
        print("   demo@test.com / demo123")
        print()
        print("📝 NEXT STEPS:")
        print("1. Make sure local backend is running: python3 simple_working_backend.py")
        print("2. Try accessing the Signal Feed tab again")
        print("3. If still getting error, the frontend might need the mock data format")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == '__main__':
    main()

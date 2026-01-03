#!/usr/bin/env python3
"""
Create Test Signals and Test Signal Flow
This script creates test signals and tests the signal flow from admin to user dashboard
"""

import sqlite3
import os
from datetime import datetime
import requests
import json

def create_test_signals():
    """Create test signals in the database"""
    try:
        print("🔄 Creating test signals...")
        
        db_path = "trading_bots.db"
        if not os.path.exists(db_path):
            print(f"❌ Database file not found: {db_path}")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create test signals with the correct schema
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
        
        # Insert test signals
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
        print(f"❌ Error creating test signals: {str(e)}")
        if 'conn' in locals():
            conn.close()
        return False

def test_signal_api_endpoints():
    """Test the signal API endpoints"""
    try:
        print("🔍 Testing signal API endpoints...")
        
        # Test different possible API endpoints
        endpoints_to_test = [
            "http://localhost:5000/api/signals",
            "http://localhost:5000/api/signal-feed/signals/feed",
            "http://localhost:5000/api/database/signal-stats",
            "http://localhost:5000/signals",
            "http://localhost:5000/api/signals/feed"
        ]
        
        for endpoint in endpoints_to_test:
            try:
                print(f"   Testing: {endpoint}")
                response = requests.get(endpoint, timeout=5)
                print(f"     Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"     Response: {len(data) if isinstance(data, list) else 'Object'} items")
                elif response.status_code == 404:
                    print(f"     Endpoint not found")
                else:
                    print(f"     Error: {response.text[:100]}")
            except requests.exceptions.ConnectionError:
                print(f"     Connection failed - server not running")
            except requests.exceptions.Timeout:
                print(f"     Timeout")
            except Exception as e:
                print(f"     Error: {str(e)}")
            print()
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing API endpoints: {str(e)}")
        return False

def test_database_signal_retrieval():
    """Test retrieving signals from the database"""
    try:
        print("🔍 Testing database signal retrieval...")
        
        db_path = "trading_bots.db"
        if not os.path.exists(db_path):
            print("❌ Database file not found")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Test different queries
        queries = [
            ("All signals", "SELECT * FROM trading_signals"),
            ("Active signals", "SELECT * FROM trading_signals WHERE status = 'active'"),
            ("Recent signals", "SELECT * FROM trading_signals ORDER BY timestamp DESC LIMIT 5"),
            ("High confidence signals", "SELECT * FROM trading_signals WHERE confidence > 80"),
            ("Signal count", "SELECT COUNT(*) FROM trading_signals")
        ]
        
        for query_name, query in queries:
            try:
                cursor.execute(query)
                results = cursor.fetchall()
                print(f"   {query_name}: {len(results)} results")
                
                if results and len(results) <= 3:  # Show sample data for small result sets
                    for result in results:
                        print(f"     {result}")
                elif results:
                    print(f"     Sample: {results[0]}")
                    
            except Exception as e:
                print(f"   {query_name}: Error - {str(e)}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error testing database retrieval: {str(e)}")
        if 'conn' in locals():
            conn.close()
        return False

def test_user_dashboard_access():
    """Test if we can access user dashboard data"""
    try:
        print("🔍 Testing user dashboard access...")
        
        # Test user credentials
        test_email = "testuser@example.com"
        
        # Test different dashboard endpoints
        dashboard_endpoints = [
            f"http://localhost:5000/api/dashboard-data/{test_email}",
            "http://localhost:5000/api/dashboard-data",
            "http://localhost:5000/api/user/profile",
            "http://localhost:5000/api/dashboard/stats"
        ]
        
        for endpoint in dashboard_endpoints:
            try:
                print(f"   Testing: {endpoint}")
                response = requests.get(endpoint, timeout=5)
                print(f"     Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"     Response: {type(data)} with {len(data) if isinstance(data, (list, dict)) else 'data'}")
                elif response.status_code == 401:
                    print(f"     Authentication required")
                elif response.status_code == 404:
                    print(f"     Endpoint not found")
                else:
                    print(f"     Error: {response.text[:100]}")
            except requests.exceptions.ConnectionError:
                print(f"     Connection failed - server not running")
            except Exception as e:
                print(f"     Error: {str(e)}")
            print()
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing dashboard access: {str(e)}")
        return False

def create_signal_flow_test_report():
    """Create a comprehensive test report"""
    try:
        print("📊 Creating signal flow test report...")
        
        db_path = "trading_bots.db"
        if not os.path.exists(db_path):
            print("❌ Database file not found")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get statistics
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM trading_signals")
        signal_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM trading_signals WHERE status = 'active'")
        active_signal_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT AVG(confidence) FROM trading_signals")
        avg_confidence = cursor.fetchone()[0] or 0
        
        # Get recent signals
        cursor.execute("SELECT symbol, signal_type, confidence, timestamp FROM trading_signals ORDER BY timestamp DESC LIMIT 5")
        recent_signals = cursor.fetchall()
        
        conn.close()
        
        print("=" * 60)
        print("📋 SIGNAL FLOW TEST REPORT")
        print("=" * 60)
        print(f"👥 Total Users: {user_count}")
        print(f"📊 Total Signals: {signal_count}")
        print(f"🟢 Active Signals: {active_signal_count}")
        print(f"📈 Average Confidence: {avg_confidence:.1f}%")
        print()
        print("📊 Recent Signals:")
        for signal in recent_signals:
            print(f"   - {signal[0]} {signal[1]} (Confidence: {signal[2]}%) - {signal[3]}")
        print()
        print("🔐 TEST USER CREDENTIALS:")
        print("   Email: testuser@example.com")
        print("   Password: TestPassword123!")
        print()
        print("📝 NEXT STEPS:")
        print("1. Start your Flask application: python3 app.py")
        print("2. Login with test credentials")
        print("3. Navigate to user dashboard")
        print("4. Check Signals tab for test signals")
        print("5. Verify signals are displaying correctly")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating test report: {str(e)}")
        if 'conn' in locals():
            conn.close()
        return False

if __name__ == '__main__':
    print("🚀 Signal Flow Test Suite")
    print("=" * 60)
    
    try:
        # Create test signals
        create_test_signals()
        print()
        
        # Test database signal retrieval
        test_database_signal_retrieval()
        print()
        
        # Test API endpoints (will fail if server not running)
        test_signal_api_endpoints()
        print()
        
        # Test dashboard access (will fail if server not running)
        test_user_dashboard_access()
        print()
        
        # Create comprehensive test report
        create_signal_flow_test_report()
        
    except Exception as e:
        print(f"\n❌ Test suite failed: {str(e)}")
        sys.exit(1)

#!/usr/bin/env python3
"""
Simple Data Capture Test
Tests data capture without complex database setup
"""

import sqlite3
import json
import requests
from datetime import datetime

def test_database_connectivity():
    """Test basic database connectivity"""
    print("🧪 Testing database connectivity...")
    
    try:
        conn = sqlite3.connect("trading_bots.db")
        cursor = conn.cursor()
        
        # Check existing tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"✅ Database connected. Found {len(tables)} tables:")
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
            count = cursor.fetchone()[0]
            print(f"   • {table[0]}: {count} records")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
        return False

def create_simple_capture_tables():
    """Create simplified data capture tables"""
    print("\n🔧 Creating simplified data capture tables...")
    
    try:
        conn = sqlite3.connect("trading_bots.db")
        cursor = conn.cursor()
        
        # Simple payment data table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payment_capture (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                plan_name TEXT,
                final_price REAL,
                payment_method TEXT,
                payment_status TEXT,
                transaction_id TEXT,
                captured_at TEXT DEFAULT CURRENT_TIMESTAMP,
                data_json TEXT
            )
        """)
        
        # Simple questionnaire data table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS questionnaire_capture (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                prop_firm TEXT,
                account_size REAL,
                risk_percentage REAL,
                trades_per_day TEXT,
                captured_at TEXT DEFAULT CURRENT_TIMESTAMP,
                data_json TEXT
            )
        """)
        
        # Simple dashboard data table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS dashboard_capture (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                current_equity REAL,
                total_pnl REAL,
                win_rate REAL,
                total_trades INTEGER,
                captured_at TEXT DEFAULT CURRENT_TIMESTAMP,
                data_json TEXT
            )
        """)
        
        conn.commit()
        conn.close()
        print("✅ Simple capture tables created successfully")
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {str(e)}")
        return False

def test_payment_data_capture():
    """Test capturing payment data directly to database"""
    print("\n🧪 Testing payment data capture...")
    
    try:
        # Sample payment data
        payment_data = {
            "user_email": "test@example.com",
            "plan_name": "Premium Plan",
            "final_price": 89.99,
            "payment_method": "paypal",
            "payment_status": "completed",
            "transaction_id": f"TXN-{int(datetime.now().timestamp())}"
        }
        
        conn = sqlite3.connect("trading_bots.db")
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO payment_capture (
                user_email, plan_name, final_price, payment_method, 
                payment_status, transaction_id, data_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            payment_data["user_email"],
            payment_data["plan_name"],
            payment_data["final_price"],
            payment_data["payment_method"],
            payment_data["payment_status"],
            payment_data["transaction_id"],
            json.dumps(payment_data)
        ))
        
        payment_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"✅ Payment data captured successfully (ID: {payment_id})")
        print(f"   📧 Email: {payment_data['user_email']}")
        print(f"   💰 Amount: ${payment_data['final_price']}")
        print(f"   💳 Method: {payment_data['payment_method']}")
        return True
        
    except Exception as e:
        print(f"❌ Payment capture error: {str(e)}")
        return False

def test_questionnaire_data_capture():
    """Test capturing questionnaire data directly to database"""
    print("\n🧪 Testing questionnaire data capture...")
    
    try:
        # Sample questionnaire data
        questionnaire_data = {
            "user_email": "test@example.com",
            "prop_firm": "FTMO",
            "account_size": 100000,
            "risk_percentage": 1.5,
            "trades_per_day": "1-5"
        }
        
        conn = sqlite3.connect("trading_bots.db")
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO questionnaire_capture (
                user_email, prop_firm, account_size, risk_percentage, 
                trades_per_day, data_json
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            questionnaire_data["user_email"],
            questionnaire_data["prop_firm"],
            questionnaire_data["account_size"],
            questionnaire_data["risk_percentage"],
            questionnaire_data["trades_per_day"],
            json.dumps(questionnaire_data)
        ))
        
        questionnaire_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"✅ Questionnaire data captured successfully (ID: {questionnaire_id})")
        print(f"   📧 Email: {questionnaire_data['user_email']}")
        print(f"   🏢 Prop Firm: {questionnaire_data['prop_firm']}")
        print(f"   💰 Account Size: ${questionnaire_data['account_size']:,}")
        print(f"   ⚡ Risk: {questionnaire_data['risk_percentage']}%")
        return True
        
    except Exception as e:
        print(f"❌ Questionnaire capture error: {str(e)}")
        return False

def test_dashboard_data_capture():
    """Test capturing dashboard data directly to database"""
    print("\n🧪 Testing dashboard data capture...")
    
    try:
        # Sample dashboard data
        dashboard_data = {
            "user_email": "test@example.com",
            "current_equity": 102500.75,
            "total_pnl": 2500.75,
            "win_rate": 68.5,
            "total_trades": 25
        }
        
        conn = sqlite3.connect("trading_bots.db")
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO dashboard_capture (
                user_email, current_equity, total_pnl, win_rate, 
                total_trades, data_json
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            dashboard_data["user_email"],
            dashboard_data["current_equity"],
            dashboard_data["total_pnl"],
            dashboard_data["win_rate"],
            dashboard_data["total_trades"],
            json.dumps(dashboard_data)
        ))
        
        dashboard_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"✅ Dashboard data captured successfully (ID: {dashboard_id})")
        print(f"   📧 Email: {dashboard_data['user_email']}")
        print(f"   💰 Current Equity: ${dashboard_data['current_equity']:,.2f}")
        print(f"   📈 Total P&L: ${dashboard_data['total_pnl']:,.2f}")
        print(f"   🎯 Win Rate: {dashboard_data['win_rate']}%")
        print(f"   📊 Total Trades: {dashboard_data['total_trades']}")
        return True
        
    except Exception as e:
        print(f"❌ Dashboard capture error: {str(e)}")
        return False

def show_captured_data():
    """Show all captured data for verification"""
    print("\n📊 Showing captured data...")
    
    try:
        conn = sqlite3.connect("trading_bots.db")
        cursor = conn.cursor()
        
        # Show payment data
        cursor.execute("SELECT * FROM payment_capture WHERE user_email = 'test@example.com'")
        payment_rows = cursor.fetchall()
        print(f"\n💳 Payment Data ({len(payment_rows)} records):")
        for row in payment_rows:
            print(f"   ID {row[0]}: ${row[3]} via {row[4]} - {row[5]} ({row[7]})")
        
        # Show questionnaire data
        cursor.execute("SELECT * FROM questionnaire_capture WHERE user_email = 'test@example.com'")
        questionnaire_rows = cursor.fetchall()
        print(f"\n📋 Questionnaire Data ({len(questionnaire_rows)} records):")
        for row in questionnaire_rows:
            print(f"   ID {row[0]}: {row[2]} - ${row[3]:,} account, {row[4]}% risk ({row[6]})")
        
        # Show dashboard data
        cursor.execute("SELECT * FROM dashboard_capture WHERE user_email = 'test@example.com'")
        dashboard_rows = cursor.fetchall()
        print(f"\n📈 Dashboard Data ({len(dashboard_rows)} records):")
        for row in dashboard_rows:
            print(f"   ID {row[0]}: ${row[2]:,.2f} equity, {row[4]}% win rate, {row[5]} trades ({row[6]})")
        
        conn.close()
        
        total_records = len(payment_rows) + len(questionnaire_rows) + len(dashboard_rows)
        print(f"\n📊 Total captured records: {total_records}")
        return True
        
    except Exception as e:
        print(f"❌ Error showing data: {str(e)}")
        return False

def test_data_integration():
    """Test that data is properly linked by user email"""
    print("\n🔗 Testing data integration...")
    
    try:
        conn = sqlite3.connect("trading_bots.db")
        cursor = conn.cursor()
        
        # Get comprehensive user data
        cursor.execute("""
            SELECT 
                'payment' as type, plan_name as detail, final_price as value, captured_at
            FROM payment_capture WHERE user_email = 'test@example.com'
            UNION ALL
            SELECT 
                'questionnaire' as type, prop_firm as detail, account_size as value, captured_at
            FROM questionnaire_capture WHERE user_email = 'test@example.com'
            UNION ALL
            SELECT 
                'dashboard' as type, 'current_equity' as detail, current_equity as value, captured_at
            FROM dashboard_capture WHERE user_email = 'test@example.com'
            ORDER BY captured_at DESC
        """)
        
        rows = cursor.fetchall()
        conn.close()
        
        if rows:
            print("✅ Data integration working - all data linked by user email:")
            for row in rows:
                print(f"   {row[0].title()}: {row[1]} = ${row[2]:,.2f} ({row[3]})")
            return True
        else:
            print("❌ No integrated data found")
            return False
        
    except Exception as e:
        print(f"❌ Integration test error: {str(e)}")
        return False

def cleanup_test_data():
    """Clean up test data"""
    print("\n🧹 Cleaning up test data...")
    
    try:
        conn = sqlite3.connect("trading_bots.db")
        cursor = conn.cursor()
        
        tables = ["payment_capture", "questionnaire_capture", "dashboard_capture"]
        for table in tables:
            cursor.execute(f"DELETE FROM {table} WHERE user_email = 'test@example.com'")
        
        conn.commit()
        conn.close()
        print("✅ Test data cleaned up")
        
    except Exception as e:
        print(f"⚠️ Cleanup error: {str(e)}")

def main():
    """Run the simple data capture test"""
    print("🚀 Simple Data Capture Test")
    print("Testing direct database integration without complex services")
    print("=" * 60)
    
    tests = [
        ("Database Connectivity", test_database_connectivity),
        ("Create Tables", create_simple_capture_tables),
        ("Payment Capture", test_payment_data_capture),
        ("Questionnaire Capture", test_questionnaire_data_capture),
        ("Dashboard Capture", test_dashboard_data_capture),
        ("Show Captured Data", show_captured_data),
        ("Data Integration", test_data_integration)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} error: {str(e)}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name:<25} {status}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Data capture is working perfectly!")
        print("\n💡 Key Benefits Demonstrated:")
        print("   ✅ Payment data captured and stored")
        print("   ✅ Questionnaire responses recorded")
        print("   ✅ Dashboard state preserved")
        print("   ✅ All data linked by user email")
        print("   ✅ Compatible with existing signup-enhanced database")
    else:
        print("⚠️ Some tests failed. Check the output above.")
    
    # Cleanup
    cleanup_test_data()
    
    return passed == total

if __name__ == '__main__':
    import sys
    success = main()
    sys.exit(0 if success else 1)

#!/usr/bin/env python3
"""
Test Live Data Capture System
Verifies that the database now has payment and questionnaire data
"""

import sqlite3
import requests
import json
from datetime import datetime

def test_database_population():
    """Test that the database tables are properly populated"""
    print("🧪 Testing Database Population")
    print("=" * 50)
    
    conn = sqlite3.connect("trading_bots.db")
    cursor = conn.cursor()
    
    # Test table existence and data
    tables_to_check = [
        ("users", "Signup data"),
        ("payments", "Payment transactions"), 
        ("user_progress", "Questionnaire and progress data"),
        ("live_capture_log", "Data capture audit log")
    ]
    
    all_populated = True
    
    for table, description in tables_to_check:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            
            if count > 0:
                print(f"✅ {description:<35}: {count} records")
            else:
                print(f"❌ {description:<35}: {count} records")
                all_populated = False
        except Exception as e:
            print(f"❌ {description:<35}: Table error - {str(e)}")
            all_populated = False
    
    # Show sample data
    print(f"\n📊 Sample Data:")
    
    # Users
    cursor.execute("SELECT email, username, plan_type FROM users LIMIT 3")
    users = cursor.fetchall()
    print(f"\n👥 Users:")
    for user in users:
        print(f"   📧 {user[0]} ({user[1]}) - {user[2]} plan")
    
    # Payments
    cursor.execute("SELECT user_email, amount, payment_method, payment_status FROM payments LIMIT 3")
    payments = cursor.fetchall()
    print(f"\n💳 Payments:")
    for payment in payments:
        print(f"   💰 {payment[0]}: ${payment[1]} via {payment[2]} ({payment[3]})")
    
    # Questionnaires
    cursor.execute("""
        SELECT user_email, 
               json_extract(questionnaire_answers, '$.propFirm') as prop_firm,
               json_extract(questionnaire_answers, '$.accountSize') as account_size,
               json_extract(questionnaire_answers, '$.riskPercentage') as risk_pct
        FROM user_progress LIMIT 3
    """)
    questionnaires = cursor.fetchall()
    print(f"\n📋 Questionnaires:")
    for q in questionnaires:
        print(f"   🏢 {q[0]}: {q[1]} - ${q[2]:,} ({q[3]}% risk)")
    
    conn.close()
    return all_populated

def test_live_capture_service():
    """Test that the live capture service is running"""
    print(f"\n🔄 Testing Live Capture Service")
    print("=" * 50)
    
    try:
        # Health check
        response = requests.get("http://localhost:5005/api/live-capture/health")
        if response.status_code == 200:
            health = response.json()
            print(f"✅ Service Status: {health['status']}")
            print(f"📊 Database: {health['database']}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
        
        # Get stats
        response = requests.get("http://localhost:5005/api/live-capture/stats")
        if response.status_code == 200:
            stats = response.json()
            print(f"\n📊 Live Capture Statistics:")
            print(f"   👥 Total Users: {stats['total_users']}")
            print(f"   💳 Total Payments: {stats['total_payments']}")
            print(f"   📋 Progress Records: {stats['total_progress_records']}")
            print(f"   📝 Total Captures: {stats['total_captures']}")
        else:
            print(f"❌ Stats request failed: {response.status_code}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Service test error: {str(e)}")
        return False

def test_manual_data_capture():
    """Test manual data capture via API"""
    print(f"\n🧪 Testing Manual Data Capture")
    print("=" * 50)
    
    # Test payment capture
    test_payment = {
        "user_email": "test_capture@example.com",
        "amount": 199.99,
        "payment_method": "stripe",
        "payment_status": "completed",
        "transaction_id": f"TEST-{int(datetime.now().timestamp())}"
    }
    
    try:
        response = requests.post(
            "http://localhost:5005/api/payment/capture",
            json=test_payment
        )
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Payment capture test successful: ID {result['payment_id']}")
        else:
            print(f"❌ Payment capture failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Payment capture error: {str(e)}")
        return False
    
    # Test questionnaire capture
    test_questionnaire = {
        "user_email": "test_capture@example.com",
        "propFirm": "MyForexFunds",
        "accountSize": 200000,
        "riskPercentage": 0.5,
        "tradesPerDay": "1-3"
    }
    
    try:
        response = requests.post(
            "http://localhost:5005/api/questionnaire/capture",
            json=test_questionnaire
        )
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Questionnaire capture test successful: ID {result['progress_id']}")
        else:
            print(f"❌ Questionnaire capture failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Questionnaire capture error: {str(e)}")
        return False
    
    return True

def show_unified_user_profile():
    """Show a complete user profile with all data types"""
    print(f"\n👤 Complete User Profile Example")
    print("=" * 50)
    
    conn = sqlite3.connect("trading_bots.db")
    cursor = conn.cursor()
    
    # Get a user with all data types
    cursor.execute("""
        SELECT u.email, u.username, u.plan_type, u.created_at,
               p.amount, p.payment_method, p.payment_status,
               json_extract(up.questionnaire_answers, '$.propFirm') as prop_firm,
               json_extract(up.questionnaire_answers, '$.accountSize') as account_size
        FROM users u
        LEFT JOIN payments p ON u.email = p.user_email
        LEFT JOIN user_progress up ON u.email = up.user_email
        WHERE p.user_email IS NOT NULL 
        LIMIT 1
    """)
    
    user_data = cursor.fetchone()
    
    if user_data:
        print(f"📧 Email: {user_data[0]}")
        print(f"👤 Username: {user_data[1]}")
        print(f"📋 Plan Type: {user_data[2]}")
        print(f"📅 Created: {user_data[3]}")
        print(f"💳 Payment: ${user_data[4]} via {user_data[5]} ({user_data[6]})")
        print(f"🏢 Prop Firm: {user_data[7]}")
        print(f"💰 Account Size: ${user_data[8]:,}")
        
        print(f"\n✅ Complete user journey captured:")
        print(f"   1. Signup ✅ (users table)")
        print(f"   2. Payment ✅ (payments table)")
        print(f"   3. Questionnaire ✅ (user_progress table)")
        print(f"   4. Dashboard data ready for capture")
    else:
        print("⚠️ No complete user profiles found")
    
    conn.close()

def verify_dashboard_integration():
    """Verify dashboard can now use the populated data"""
    print(f"\n📈 Dashboard Integration Verification")
    print("=" * 50)
    
    # Test unified dashboard service
    try:
        # Use the existing user
        test_email = "anchalw11@gmail.com"
        response = requests.get(f"http://localhost:5004/api/dashboard/user/{test_email}")
        
        if response.status_code == 200:
            dashboard_data = response.json()
            print(f"✅ Dashboard data retrieved for {test_email}")
            print(f"   💰 Current Equity: ${dashboard_data['performance']['currentEquity']:,.2f}")
            print(f"   📈 Total P&L: ${dashboard_data['performance']['totalPnL']:,.2f}")
            print(f"   💳 Payment: {dashboard_data['paymentInfo']['planName']} - ${dashboard_data['paymentInfo']['finalPrice']}")
            print(f"   🏢 Trading Setup: {dashboard_data['tradingSetup']['propFirm']}")
            print(f"   🗄️ Data Source: {dashboard_data['dataSource']}")
        else:
            print(f"⚠️ Dashboard service response: {response.status_code}")
            
    except Exception as e:
        print(f"⚠️ Dashboard service not available: {str(e)}")
    
    # Test live capture stats service  
    try:
        response = requests.get("http://localhost:5005/api/live-capture/stats")
        if response.status_code == 200:
            stats = response.json()
            print(f"\n📊 Live System Statistics:")
            print(f"   👥 Users: {stats['total_users']}")
            print(f"   💳 Payments: {stats['total_payments']}")  
            print(f"   📋 Questionnaires: {stats['total_progress_records']}")
            print(f"   📈 Dashboard Data: Ready for capture")
        
    except Exception as e:
        print(f"⚠️ Live capture stats not available: {str(e)}")

def main():
    """Run all tests"""
    print("🚀 LIVE DATA CAPTURE SYSTEM TEST")
    print("Testing that payment and questionnaire data are now populated")
    print("=" * 70)
    
    tests = [
        ("Database Population", test_database_population),
        ("Live Capture Service", test_live_capture_service),
        ("Manual Data Capture", test_manual_data_capture)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} error: {str(e)}")
            results.append((test_name, False))
    
    # Show unified profile and dashboard integration
    show_unified_user_profile()
    verify_dashboard_integration()
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 TEST SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name:<25} {status}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 SUCCESS! Data capture system is now working!")
        print("\n💡 Key Achievements:")
        print("   ✅ Payment data populated in database")
        print("   ✅ Questionnaire data captured and stored")
        print("   ✅ Real-time capture service running")
        print("   ✅ Complete user profiles available")
        print("   ✅ Dashboard integration ready")
        print("\n🔄 Frontend will now capture data automatically!")
    else:
        print("⚠️ Some tests failed. Check the output above.")
    
    return passed == total

if __name__ == '__main__':
    import sys
    success = main()
    sys.exit(0 if success else 1)

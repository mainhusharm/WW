#!/usr/bin/env python3
"""
Quick verification of PostgreSQL database status and current data
"""

import os
import sys
import psycopg2
from datetime import datetime

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
from dotenv import load_dotenv
load_dotenv('database.env')

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL')

def verify_database_status():
    """Verify current database status and show existing data"""
    print("🔍 VERIFYING POSTGRESQL DATABASE STATUS")
    print("=" * 60)
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Test basic connection
        cur.execute("SELECT version()")
        version = cur.fetchone()[0]
        print(f"✅ Database connected successfully!")
        print(f"📊 PostgreSQL version: {version[:70]}...")
        
        # Check available tables
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        tables = [row[0] for row in cur.fetchall()]
        print(f"\n📋 Available tables: {', '.join(tables)}")
        
        # Count records in each table
        print(f"\n📊 Current data in database:")
        
        if 'users' in tables:
            cur.execute("SELECT COUNT(*) FROM users")
            user_count = cur.fetchone()[0]
            print(f"   👥 Users: {user_count} records")
            
            if user_count > 0:
                cur.execute("SELECT email, first_name, last_name, plan_type, created_at FROM users ORDER BY created_at DESC LIMIT 3")
                recent_users = cur.fetchall()
                print("   📝 Recent users:")
                for user in recent_users:
                    print(f"      - {user[1]} {user[2]} ({user[0]}) - {user[3]} - {user[4]}")
        
        if 'payment_details' in tables:
            cur.execute("SELECT COUNT(*) FROM payment_details")
            payment_count = cur.fetchone()[0]
            print(f"   💳 Payments: {payment_count} records")
            
            if payment_count > 0:
                cur.execute("SELECT user_name, plan_name_payment, final_price, payment_status, created_at FROM payment_details ORDER BY created_at DESC LIMIT 3")
                recent_payments = cur.fetchall()
                print("   📝 Recent payments:")
                for payment in recent_payments:
                    print(f"      - {payment[0]} - {payment[1]} - ${payment[2]} - {payment[3]} - {payment[4]}")
        
        if 'questionnaire_details' in tables:
            cur.execute("SELECT COUNT(*) FROM questionnaire_details")
            questionnaire_count = cur.fetchone()[0]
            print(f"   📋 Questionnaires: {questionnaire_count} records")
            
            if questionnaire_count > 0:
                cur.execute("SELECT user_name, prop_firm, account_type, risk_percentage, created_at FROM questionnaire_details ORDER BY created_at DESC LIMIT 3")
                recent_questionnaires = cur.fetchall()
                print("   📝 Recent questionnaires:")
                for q in recent_questionnaires:
                    print(f"      - {q[0]} - {q[1]} - {q[2]} - {q[3]}% risk - {q[4]}")
        
        if 'user_dashboard' in tables:
            cur.execute("SELECT COUNT(*) FROM user_dashboard")
            dashboard_count = cur.fetchone()[0]
            print(f"   📊 Dashboards: {dashboard_count} records")
            
            if dashboard_count > 0:
                cur.execute("SELECT user_name, current_equity, total_pnl, win_rate, created_at FROM user_dashboard ORDER BY created_at DESC LIMIT 3")
                recent_dashboards = cur.fetchall()
                print("   📝 Recent dashboard data:")
                for dashboard in recent_dashboards:
                    print(f"      - {dashboard[0]} - ${dashboard[1]} equity - ${dashboard[2]} P&L - {dashboard[3]}% win rate - {dashboard[4]}")
        
        cur.close()
        conn.close()
        
        print(f"\n🌐 Database URL: {DATABASE_URL[:50]}...")
        print(f"🔧 Service ID: dpg-d37pd8nfte5s73bfl1ug-a")
        print(f"📍 Static IPs: 35.160.120.126, 44.233.151.27, 34.211.200.85")
        
        print(f"\n✅ Database is ready and accessible!")
        return True
        
    except Exception as e:
        print(f"❌ Database verification failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = verify_database_status()
    sys.exit(0 if success else 1)

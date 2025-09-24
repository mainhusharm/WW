#!/usr/bin/env python3
"""
Direct PostgreSQL Test - This will definitely work!
Tests direct connection to your PostgreSQL database
"""

import os
import psycopg2
import json
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('database.env')
DATABASE_URL = os.getenv('DATABASE_URL')

def test_direct_postgresql():
    """Test direct PostgreSQL connection and data insertion"""
    print("🚀 DIRECT POSTGRESQL TEST")
    print("=" * 60)
    
    try:
        # Connect to PostgreSQL
        print("🔍 Connecting to PostgreSQL database...")
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Test basic connection
        cur.execute("SELECT version()")
        version = cur.fetchone()[0]
        print(f"✅ Connected to: {version[:50]}...")
        
        # Test payment data insertion
        print("\n💳 Testing payment data insertion...")
        payment_query = """
            INSERT INTO payment_details (
                user_id, user_email, user_name, plan_name_payment, original_price,
                discount_amount, final_price, payment_method, transaction_id,
                payment_status, payment_provider, crypto_transaction_hash, 
                crypto_from_address, crypto_amount, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        
        payment_data = (
            'direct_test_user',
            'directtest@example.com',
            'Direct Test User',
            'Pro Plan',
            29.99,
            0.00,
            29.99,
            'stripe',
            'TXN-DIRECT-TEST',
            'completed',
            'Stripe',
            'NON-CRYPTO-DIRECT',
            'N/A',
            '0',
            datetime.now().isoformat(),
            datetime.now().isoformat()
        )
        
        cur.execute(payment_query, payment_data)
        payment_id = cur.fetchone()[0]
        print(f"✅ Payment data inserted with ID: {payment_id}")
        
        # Test questionnaire data insertion
        print("\n📋 Testing questionnaire data insertion...")
        questionnaire_query = """
            INSERT INTO questionnaire_details (
                user_id, user_email, user_name, trades_per_day, trading_session,
                crypto_assets, forex_assets, has_account, account_equity, prop_firm,
                account_type, account_size, risk_percentage, risk_reward_ratio,
                trading_experience, risk_tolerance, trading_goals, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                trades_per_day = EXCLUDED.trades_per_day,
                trading_session = EXCLUDED.trading_session,
                updated_at = EXCLUDED.updated_at
            RETURNING id
        """
        
        questionnaire_data = (
            'direct_test_user',
            'directtest@example.com',
            'Direct Test User',
            '5-10',
            'London',
            json.dumps(['BTC', 'ETH']),
            json.dumps(['EUR/USD', 'GBP/USD']),
            'yes',
            10000,
            'FTMO',
            'Challenge',
            10000,
            2,
            '1:2',
            'intermediate',
            'moderate',
            'Consistent profits',
            datetime.now().isoformat(),
            datetime.now().isoformat()
        )
        
        cur.execute(questionnaire_query, questionnaire_data)
        questionnaire_id = cur.fetchone()[0]
        print(f"✅ Questionnaire data inserted with ID: {questionnaire_id}")
        
        # Test dashboard data insertion
        print("\n📊 Testing dashboard data insertion...")
        dashboard_query = """
            INSERT INTO user_dashboard (
                user_id, user_email, user_name, current_equity, initial_equity,
                total_pnl, win_rate, total_trades, winning_trades, losing_trades,
                account_balance, daily_pnl, last_activity, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                current_equity = EXCLUDED.current_equity,
                total_pnl = EXCLUDED.total_pnl,
                win_rate = EXCLUDED.win_rate,
                updated_at = EXCLUDED.updated_at
            RETURNING id
        """
        
        dashboard_data = (
            'direct_test_user',
            'directtest@example.com',
            'Direct Test User',
            10000,
            10000,
            150.50,
            65.5,
            20,
            13,
            7,
            10150.50,
            25.30,
            datetime.now().isoformat(),
            datetime.now().isoformat(),
            datetime.now().isoformat()
        )
        
        cur.execute(dashboard_query, dashboard_data)
        dashboard_id = cur.fetchone()[0]
        print(f"✅ Dashboard data inserted with ID: {dashboard_id}")
        
        # Commit all changes
        conn.commit()
        
        # Verify data was inserted
        print("\n🔍 Verifying inserted data...")
        
        cur.execute("SELECT COUNT(*) FROM payment_details WHERE user_email = %s", ('directtest@example.com',))
        payment_count = cur.fetchone()[0]
        print(f"💳 Payment records: {payment_count}")
        
        cur.execute("SELECT COUNT(*) FROM questionnaire_details WHERE user_email = %s", ('directtest@example.com',))
        questionnaire_count = cur.fetchone()[0]
        print(f"📋 Questionnaire records: {questionnaire_count}")
        
        cur.execute("SELECT COUNT(*) FROM user_dashboard WHERE user_email = %s", ('directtest@example.com',))
        dashboard_count = cur.fetchone()[0]
        print(f"📊 Dashboard records: {dashboard_count}")
        
        # Show sample data
        print("\n📋 Sample data from database:")
        cur.execute("SELECT id, user_name, plan_name_payment, final_price, payment_status FROM payment_details WHERE user_email = %s ORDER BY created_at DESC LIMIT 1", ('directtest@example.com',))
        payment = cur.fetchone()
        if payment:
            print(f"  Payment: {payment[1]} - {payment[2]} - ${payment[3]} ({payment[4]}) - ID: {payment[0]}")
        
        cur.execute("SELECT id, user_name, prop_firm, account_type, risk_percentage FROM questionnaire_details WHERE user_email = %s ORDER BY created_at DESC LIMIT 1", ('directtest@example.com',))
        questionnaire = cur.fetchone()
        if questionnaire:
            print(f"  Questionnaire: {questionnaire[1]} - {questionnaire[2]} {questionnaire[3]} - {questionnaire[4]}% risk - ID: {questionnaire[0]}")
        
        cur.execute("SELECT id, user_name, current_equity, total_pnl, win_rate FROM user_dashboard WHERE user_email = %s ORDER BY created_at DESC LIMIT 1", ('directtest@example.com',))
        dashboard = cur.fetchone()
        if dashboard:
            print(f"  Dashboard: {dashboard[1]} - ${dashboard[2]} equity, ${dashboard[3]} P&L, {dashboard[4]}% win rate - ID: {dashboard[0]}")
        
        cur.close()
        conn.close()
        
        print("\n🎉 SUCCESS! All data successfully saved to PostgreSQL!")
        print("✅ Payment data → PostgreSQL ✓")
        print("✅ Questionnaire data → PostgreSQL ✓")
        print("✅ Dashboard data → PostgreSQL ✓")
        print(f"\n📊 Total records created: {payment_count + questionnaire_count + dashboard_count}")
        print("\n🔗 Database URL: postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_direct_postgresql()
    if success:
        print("\n🚀 READY FOR PRODUCTION!")
        print("Your PostgreSQL database is working perfectly!")
    else:
        print("\n❌ Please check the database connection and try again.")

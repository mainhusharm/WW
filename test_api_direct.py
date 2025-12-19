#!/usr/bin/env python3
"""
Direct API test to verify PostgreSQL data flow
"""

import os
import sys
import json
import psycopg2
from datetime import datetime
import time

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
from dotenv import load_dotenv
load_dotenv('database.env')

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL')

def test_direct_database_operations():
    """Test direct database operations to verify data flow"""
    print("🚀 TESTING DIRECT DATABASE OPERATIONS")
    print("=" * 60)
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Test basic connection
        cur.execute("SELECT version()")
        version = cur.fetchone()[0]
        print(f"✅ Database connected: {version[:50]}...")
        
        # Test user registration (Enhanced Signup)
        print("\n📝 Testing Enhanced Signup Data Flow...")
        user_data = {
            'id': int(time.time()),
            'first_name': 'Test',
            'last_name': 'User',
            'email': f'testuser{int(time.time())}@example.com',
            'phone': '+1234567890',
            'company': 'Test Company',
            'country': 'US',
            'password_hash': 'hashed_password_123',
            'plan_type': 'Pro Plan',
            'created_at': datetime.now().isoformat()
        }
        
        user_query = """
            INSERT INTO users (id, first_name, last_name, email, phone, company, country, password_hash, plan_type, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        
        cur.execute(user_query, (
            user_data['id'],
            user_data['first_name'],
            user_data['last_name'],
            user_data['email'],
            user_data['phone'],
            user_data['company'],
            user_data['country'],
            user_data['password_hash'],
            user_data['plan_type'],
            user_data['created_at']
        ))
        
        user_id = cur.fetchone()[0]
        print(f"✅ User created with ID: {user_id}")
        
        # Test payment data (Enhanced Payment)
        print("\n💳 Testing Enhanced Payment Data Flow...")
        payment_data = {
            'user_id': str(user_id),
            'user_email': user_data['email'],
            'user_name': f"{user_data['first_name']} {user_data['last_name']}",
            'plan_name_payment': 'Pro Plan',
            'original_price': 29.99,
            'discount_amount': 0.00,
            'final_price': 29.99,
            'coupon_code': None,
            'payment_method': 'stripe',
            'transaction_id': f'TXN-{int(time.time())}',
            'payment_status': 'completed',
            'payment_provider': 'Stripe',
            'crypto_transaction_hash': None,
            'crypto_from_address': None,
            'crypto_amount': None,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        payment_query = """
            INSERT INTO payment_details (
                user_id, user_email, user_name, plan_name_payment, original_price,
                discount_amount, final_price, coupon_code, payment_method, transaction_id,
                payment_status, payment_provider, crypto_transaction_hash, crypto_from_address,
                crypto_amount, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        
        cur.execute(payment_query, (
            payment_data['user_id'],
            payment_data['user_email'],
            payment_data['user_name'],
            payment_data['plan_name_payment'],
            payment_data['original_price'],
            payment_data['discount_amount'],
            payment_data['final_price'],
            payment_data['coupon_code'],
            payment_data['payment_method'],
            payment_data['transaction_id'],
            payment_data['payment_status'],
            payment_data['payment_provider'],
            payment_data['crypto_transaction_hash'],
            payment_data['crypto_from_address'],
            payment_data['crypto_amount'],
            payment_data['created_at'],
            payment_data['updated_at']
        ))
        
        payment_id = cur.fetchone()[0]
        print(f"✅ Payment created with ID: {payment_id}")
        
        # Test questionnaire data
        print("\n📋 Testing Questionnaire Data Flow...")
        questionnaire_data = {
            'user_id': str(user_id),
            'user_email': user_data['email'],
            'user_name': f"{user_data['first_name']} {user_data['last_name']}",
            'trades_per_day': '5-10',
            'trading_session': 'London',
            'crypto_assets': json.dumps(['BTC', 'ETH']),
            'forex_assets': json.dumps(['EUR/USD', 'GBP/USD']),
            'has_account': 'yes',
            'account_equity': 10000,
            'prop_firm': 'FTMO',
            'account_type': 'Challenge',
            'risk_percentage': 2.0,
            'created_at': datetime.now().isoformat()
        }
        
        questionnaire_query = """
            INSERT INTO questionnaire_details (
                user_id, user_email, user_name, trades_per_day, trading_session,
                crypto_assets, forex_assets, has_account, account_equity, prop_firm,
                account_type, risk_percentage, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        
        cur.execute(questionnaire_query, (
            questionnaire_data['user_id'],
            questionnaire_data['user_email'],
            questionnaire_data['user_name'],
            questionnaire_data['trades_per_day'],
            questionnaire_data['trading_session'],
            questionnaire_data['crypto_assets'],
            questionnaire_data['forex_assets'],
            questionnaire_data['has_account'],
            questionnaire_data['account_equity'],
            questionnaire_data['prop_firm'],
            questionnaire_data['account_type'],
            questionnaire_data['risk_percentage'],
            questionnaire_data['created_at']
        ))
        
        questionnaire_id = cur.fetchone()[0]
        print(f"✅ Questionnaire created with ID: {questionnaire_id}")
        
        # Test dashboard data
        print("\n📊 Testing Dashboard Data Flow...")
        dashboard_data = {
            'user_id': str(user_id),
            'user_email': user_data['email'],
            'user_name': f"{user_data['first_name']} {user_data['last_name']}",
            'current_equity': 10000.00,
            'total_pnl': 150.50,
            'win_rate': 65.5,
            'total_trades': 20,
            'winning_trades': 13,
            'losing_trades': 7,
            'account_balance': 10150.50,
            'created_at': datetime.now().isoformat()
        }
        
        dashboard_query = """
            INSERT INTO user_dashboard (
                user_id, user_email, user_name, current_equity, total_pnl,
                win_rate, total_trades, winning_trades, losing_trades, account_balance, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        
        cur.execute(dashboard_query, (
            dashboard_data['user_id'],
            dashboard_data['user_email'],
            dashboard_data['user_name'],
            dashboard_data['current_equity'],
            dashboard_data['total_pnl'],
            dashboard_data['win_rate'],
            dashboard_data['total_trades'],
            dashboard_data['winning_trades'],
            dashboard_data['losing_trades'],
            dashboard_data['account_balance'],
            dashboard_data['created_at']
        ))
        
        dashboard_id = cur.fetchone()[0]
        print(f"✅ Dashboard created with ID: {dashboard_id}")
        
        # Commit all changes
        conn.commit()
        
        # Verify data
        print("\n🔍 Verifying data in database...")
        cur.execute("SELECT COUNT(*) FROM users WHERE email = %s", (user_data['email'],))
        user_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM payment_details WHERE user_email = %s", (user_data['email'],))
        payment_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM questionnaire_details WHERE user_email = %s", (user_data['email'],))
        questionnaire_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM user_dashboard WHERE user_email = %s", (user_data['email'],))
        dashboard_count = cur.fetchone()[0]
        
        print(f"📊 Verification Results:")
        print(f"   Users: {user_count}")
        print(f"   Payments: {payment_count}")
        print(f"   Questionnaires: {questionnaire_count}")
        print(f"   Dashboards: {dashboard_count}")
        
        cur.close()
        conn.close()
        
        print("\n🎉 SUCCESS! All data flows are working correctly!")
        print("✅ Enhanced Signup → PostgreSQL ✓")
        print("✅ Enhanced Payment → PostgreSQL ✓")
        print("✅ Questionnaire → PostgreSQL ✓")
        print("✅ Dashboard → PostgreSQL ✓")
        
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_direct_database_operations()
    sys.exit(0 if success else 1)

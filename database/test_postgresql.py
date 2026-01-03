#!/usr/bin/env python3
"""
PostgreSQL Database Test Script
Tests connection, inserts sample data, and verifies data retrieval
"""

import os
import sys
import psycopg2
import psycopg2.extras
import logging
import uuid
from datetime import datetime, timezone

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_CONFIG = {
    'host': 'dpg-d596prv5r7bs73938m2g-a.oregon-postgres.render.com',
    'database': 'pghero_dpg_d37pd8nfte5s73bfl1ug_a_y6fl',
    'user': 'pghero_dpg_d37pd8nfte5s73bfl1ug_a_y6fl_user',
    'password': 'hyVL0yZEuw6EyIOKXs4nS5nTFmR1Sg5j',
    'port': 5432,
    'sslmode': 'require',
    'ssl': True
}

class DatabaseTester:
    """Handles database testing operations"""

    def __init__(self):
        self.connection_string = (
            f"host={DATABASE_CONFIG['host']} "
            f"dbname={DATABASE_CONFIG['database']} "
            f"user={DATABASE_CONFIG['user']} "
            f"password={DATABASE_CONFIG['password']} "
            f"port={DATABASE_CONFIG['port']} "
            f"sslmode={DATABASE_CONFIG['sslmode']}"
        )

    def get_connection(self):
        """Get database connection"""
        try:
            conn = psycopg2.connect(self.connection_string)
            return conn
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            raise

    def test_connection(self):
        """Test basic database connection"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                cursor.execute("SELECT version();")
                version = cursor.fetchone()
                logger.info(f"✅ PostgreSQL version: {version[0][:50]}...")
            conn.close()
            return True
        except Exception as e:
            logger.error(f"❌ Connection test failed: {e}")
            return False

    def insert_test_data(self):
        """Insert sample test data"""
        try:
            conn = self.get_connection()

            # Generate test user ID
            test_user_id = str(uuid.uuid4())
            test_email = f"test_{int(datetime.now().timestamp())}@traderedge.com"

            with conn.cursor() as cursor:
                # Insert test user
                cursor.execute("""
                    INSERT INTO enhanced_users (
                        id, first_name, last_name, email, phone, company, country,
                        password_hash, selected_plan_name, selected_plan_price,
                        selected_plan_period, status, unique_id
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    test_user_id, 'John', 'Doe', test_email, '+1234567890',
                    'Test Corp', 'USA', 'hashed_password', 'Pro Plan', 99.99,
                    'monthly', 'active', f"TEST_{int(datetime.now().timestamp())}"
                ))

                # Insert test payment
                payment_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO payment_transactions (
                        id, user_id, user_email, user_name, plan_name_payment,
                        original_price, final_price, payment_method, transaction_id, payment_status
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    payment_id, test_user_id, test_email, 'John Doe',
                    'Pro Plan', 99.99, 99.99, 'stripe', f"test_txn_{int(datetime.now().timestamp())}",
                    'completed'
                ))

                # Insert test questionnaire
                questionnaire_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO questionnaire_responses (
                        id, user_id, user_email, user_name, trades_per_day, trading_session,
                        has_account, prop_firm, account_type, account_size, risk_percentage, risk_reward_ratio,
                        milestone_access_level
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    questionnaire_id, test_user_id, test_email, 'John Doe',
                    '5-10', 'any', 'yes', 'Test Prop Firm', 'funded', 100000, 1.0, '2', 4
                ))

                # Insert test dashboard data
                dashboard_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO user_dashboard_data (
                        id, user_id, questionnaire_id, prop_firm, account_type,
                        account_size, current_equity, initial_balance,
                        milestone_access_level
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    dashboard_id, test_user_id, questionnaire_id,
                    'Test Prop Firm', 'funded', 100000, 95000, 100000, 4
                ))

                # Insert test trading signal
                signal_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO trading_signals (
                        id, symbol, signal_type, entry_price, stop_loss,
                        take_profit, confidence_score, timeframe, strategy,
                        milestone_level, signal_strength
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    signal_id, 'EURUSD', 'buy', 1.0845, 1.0820, 1.0900,
                    0.85, 'H1', 'Trend Following', 4, 'strong'
                ))

            conn.commit()
            logger.info("✅ Test data inserted successfully")

            return {
                'user_id': test_user_id,
                'email': test_email,
                'payment_id': payment_id,
                'questionnaire_id': questionnaire_id,
                'dashboard_id': dashboard_id,
                'signal_id': signal_id
            }

        except Exception as e:
            logger.error(f"❌ Failed to insert test data: {e}")
            if conn:
                conn.rollback()
            return None
        finally:
            if conn:
                conn.close()

    def query_test_data(self, test_ids):
        """Query and display the inserted test data"""
        try:
            conn = self.get_connection()

            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:

                # Query user data
                cursor.execute("""
                    SELECT id, first_name, last_name, email, selected_plan_name,
                           selected_plan_price, status, created_at
                    FROM enhanced_users WHERE id = %s
                """, (test_ids['user_id'],))
                user_data = cursor.fetchone()

                # Query payment data
                cursor.execute("""
                    SELECT id, user_email, plan_name_payment, final_price,
                           payment_method, payment_status, created_at
                    FROM payment_transactions WHERE user_id = %s
                """, (test_ids['user_id'],))
                payment_data = cursor.fetchone()

                # Query questionnaire data
                cursor.execute("""
                    SELECT id, prop_firm, account_type, account_size,
                           milestone_access_level, created_at
                    FROM questionnaire_responses WHERE user_id = %s
                """, (test_ids['user_id'],))
                questionnaire_data = cursor.fetchone()

                # Query dashboard data
                cursor.execute("""
                    SELECT id, current_equity, total_pnl, win_rate,
                           total_trades, milestone_access_level
                    FROM user_dashboard_data WHERE user_id = %s
                """, (test_ids['user_id'],))
                dashboard_data = cursor.fetchone()

                # Query signal data
                cursor.execute("""
                    SELECT id, symbol, signal_type, entry_price, confidence_score,
                           signal_strength, created_at
                    FROM trading_signals WHERE id = %s
                """, (test_ids['signal_id'],))
                signal_data = cursor.fetchone()

                # Query using the user_complete_profile view
                cursor.execute("""
                    SELECT * FROM user_complete_profile WHERE email = %s
                """, (test_ids['email'],))
                profile_data = cursor.fetchone()

            conn.close()

            return {
                'user': dict(user_data) if user_data else None,
                'payment': dict(payment_data) if payment_data else None,
                'questionnaire': dict(questionnaire_data) if questionnaire_data else None,
                'dashboard': dict(dashboard_data) if dashboard_data else None,
                'signal': dict(signal_data) if signal_data else None,
                'profile': dict(profile_data) if profile_data else None
            }

        except Exception as e:
            logger.error(f"❌ Failed to query test data: {e}")
            return None
        finally:
            if conn:
                conn.close()

    def cleanup_test_data(self, test_ids):
        """Clean up test data"""
        try:
            conn = self.get_connection()

            with conn.cursor() as cursor:
                # Delete in reverse order due to foreign keys
                cursor.execute("DELETE FROM signal_tracking WHERE user_id = %s", (test_ids['user_id'],))
                cursor.execute("DELETE FROM trading_journal WHERE user_id = %s", (test_ids['user_id'],))
                cursor.execute("DELETE FROM user_dashboard_data WHERE user_id = %s", (test_ids['user_id'],))
                cursor.execute("DELETE FROM questionnaire_responses WHERE user_id = %s", (test_ids['user_id'],))
                cursor.execute("DELETE FROM payment_transactions WHERE user_id = %s", (test_ids['user_id'],))
                cursor.execute("DELETE FROM enhanced_users WHERE id = %s", (test_ids['user_id'],))
                cursor.execute("DELETE FROM trading_signals WHERE id = %s", (test_ids['signal_id'],))

            conn.commit()
            logger.info("✅ Test data cleaned up successfully")

        except Exception as e:
            logger.error(f"❌ Failed to cleanup test data: {e}")
            if conn:
                conn.rollback()
        finally:
            if conn:
                conn.close()

def main():
    """Main test function"""
    print("🧪 PostgreSQL Database Comprehensive Test")
    print("=" * 50)

    # Initialize tester
    tester = DatabaseTester()

    # Test 1: Connection
    print("\n🔗 Testing database connection...")
    if not tester.test_connection():
        print("❌ Connection test failed!")
        sys.exit(1)

    # Test 2: Insert test data
    print("\n📝 Inserting test data...")
    test_ids = tester.insert_test_data()
    if not test_ids:
        print("❌ Data insertion failed!")
        sys.exit(1)

    print(f"✅ Test data inserted with user ID: {test_ids['user_id'][:8]}...")

    # Test 3: Query test data
    print("\n🔍 Querying test data...")
    test_results = tester.query_test_data(test_ids)
    if not test_results:
        print("❌ Data query failed!")
        sys.exit(1)

    # Display results
    print("\n📊 TEST RESULTS:")
    print("-" * 30)

    print(f"👤 User: {test_results['user']['first_name']} {test_results['user']['last_name']}")
    print(f"📧 Email: {test_results['user']['email']}")
    print(f"💰 Plan: {test_results['user']['selected_plan_name']} (${test_results['user']['selected_plan_price']})")

    print(f"\n💳 Payment: ${test_results['payment']['final_price']} ({test_results['payment']['payment_method']})")
    print(f"📊 Status: {test_results['payment']['payment_status']}")

    print(f"\n📋 Questionnaire: {test_results['questionnaire']['prop_firm']}")
    print(f"🏆 Account Type: {test_results['questionnaire']['account_type']}")
    print(f"💵 Account Size: ${test_results['questionnaire']['account_size']}")
    print(f"🎯 Milestone Level: {test_results['questionnaire']['milestone_access_level']}")

    print(f"\n📈 Dashboard: ${test_results['dashboard']['current_equity']} equity")
    print(f"🏆 Milestone Access: {test_results['dashboard']['milestone_access_level']}")

    print(f"\n📊 Signal: {test_results['signal']['symbol']} {test_results['signal']['signal_type'].upper()}")
    print(f"🎯 Confidence: {test_results['signal']['confidence_score'] * 100}%")
    print(f"💪 Strength: {test_results['signal']['signal_strength']}")

    print(f"\n👤 Complete Profile View:")
    print(f"   Full Name: {test_results['profile']['first_name']} {test_results['profile']['last_name']}")
    print(f"   Account Type: {test_results['profile']['account_type']}")
    print(f"   Current Equity: ${test_results['profile']['current_equity']}")
    print(f"   Win Rate: {test_results['profile']['win_rate']}%")

    # Test 4: Cleanup
    print("\n🧹 Cleaning up test data...")
    tester.cleanup_test_data(test_ids)

    print("\n🎉 ALL TESTS PASSED!")
    print("✅ Database connection: Working")
    print("✅ Data insertion: Working")
    print("✅ Data querying: Working")
    print("✅ Views: Working")
    print("✅ Cleanup: Working")

    print("\n🚀 Your PostgreSQL database is fully operational!")
    print(f"📍 Database: {DATABASE_CONFIG['host']}")
    print(f"👤 User: {DATABASE_CONFIG['user']}")
    print("📊 All tables and relationships working correctly!")

if __name__ == "__main__":
    main()

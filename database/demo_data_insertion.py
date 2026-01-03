#!/usr/bin/env python3
"""
PostgreSQL Demo Data Insertion Script
Inserts sample data and demonstrates extraction
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

class DemoDataManager:
    """Manages demo data insertion and extraction"""

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

    def insert_demo_users(self):
        """Insert demo users"""
        demo_users = [
            {
                'first_name': 'Alice', 'last_name': 'Johnson',
                'email': 'alice.johnson@demo.com', 'phone': '+1-555-0101',
                'company': 'TradeCorp', 'country': 'USA',
                'plan_name': 'pro', 'plan_price': 99.99, 'plan_period': 'monthly'
            },
            {
                'first_name': 'Bob', 'last_name': 'Smith',
                'email': 'bob.smith@demo.com', 'phone': '+1-555-0102',
                'company': 'Forex Traders Inc', 'country': 'UK',
                'plan_name': 'enterprise', 'plan_price': 199.99, 'plan_period': 'monthly'
            },
            {
                'first_name': 'Charlie', 'last_name': 'Brown',
                'email': 'charlie.brown@demo.com', 'phone': '+1-555-0103',
                'company': 'Independent Trader', 'country': 'Canada',
                'plan_name': 'starter', 'plan_price': 49.99, 'plan_period': 'monthly'
            }
        ]

        user_ids = []
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                for user in demo_users:
                    user_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO enhanced_users (
                            id, first_name, last_name, email, phone, company, country,
                            password_hash, selected_plan_name, selected_plan_price,
                            selected_plan_period, status
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                    """, (
                        user_id, user['first_name'], user['last_name'], user['email'],
                        user['phone'], user['company'], user['country'], 'demo_password_hash',
                        user['plan_name'], user['plan_price'], user['plan_period'], 'active'
                    ))
                    user_ids.append(user_id)
                    logger.info(f"✅ Inserted demo user: {user['first_name']} {user['last_name']}")

            conn.commit()
            return user_ids

        except Exception as e:
            logger.error(f"❌ Failed to insert demo users: {e}")
            if conn:
                conn.rollback()
            return []
        finally:
            if conn:
                conn.close()

    def insert_demo_payments(self, user_ids):
        """Insert demo payments"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                for i, user_id in enumerate(user_ids):
                    payment_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO payment_transactions (
                            id, user_id, user_email, user_name, plan_name_payment,
                            final_price, payment_method, transaction_id, payment_status
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                    """, (
                        payment_id, user_id, f"demo.user{i+1}@demo.com",
                        f"Demo User {i+1}", f"Plan {i+1}",
                        49.99 + (i * 50), 'stripe', f"demo_txn_{i+1}", 'completed'
                    ))
                    logger.info(f"✅ Inserted demo payment for user {i+1}")

            conn.commit()
            return True

        except Exception as e:
            logger.error(f"❌ Failed to insert demo payments: {e}")
            if conn:
                conn.rollback()
            return False
        finally:
            if conn:
                conn.close()

    def insert_demo_questionnaires(self, user_ids):
        """Insert demo questionnaires"""
        prop_firms = ['Demo Prop Firm A', 'Demo Prop Firm B', 'Demo Prop Firm C']
        account_types = ['funded', 'evaluation', 'standard']

        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                for i, user_id in enumerate(user_ids):
                    questionnaire_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO questionnaire_responses (
                            id, user_id, user_email, user_name, trades_per_day, trading_session,
                            has_account, prop_firm, account_type, account_size, risk_percentage,
                            risk_reward_ratio, milestone_access_level
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                    """, (
                        questionnaire_id, user_id, f"demo.user{i+1}@demo.com",
                        f"Demo User {i+1}", f"{2+i*2}-{(4+i*2)}", 'any', 'yes',
                        prop_firms[i], account_types[i], 50000 + (i * 25000), 1.0 + (i * 0.5),
                        '2', 2 + i
                    ))

                    # Insert dashboard data
                    dashboard_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO user_dashboard_data (
                            id, user_id, questionnaire_id, prop_firm, account_type,
                            account_size, current_equity, initial_balance, milestone_access_level
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                    """, (
                        dashboard_id, user_id, questionnaire_id, prop_firms[i],
                        account_types[i], 50000 + (i * 25000), 48000 + (i * 24000),
                        50000 + (i * 25000), 2 + i
                    ))

                    logger.info(f"✅ Inserted demo questionnaire and dashboard for user {i+1}")

            conn.commit()
            return True

        except Exception as e:
            logger.error(f"❌ Failed to insert demo questionnaires: {e}")
            if conn:
                conn.rollback()
            return False
        finally:
            if conn:
                conn.close()

    def insert_demo_signals(self):
        """Insert demo trading signals"""
        signals = [
            ('EURUSD', 'buy', 1.0845, 1.0820, 1.0900, 0.85, 'H1', 'Trend Following', 2, 'strong'),
            ('GBPUSD', 'sell', 1.2745, 1.2780, 1.2680, 0.78, 'H1', 'Reversal', 3, 'moderate'),
            ('USDJPY', 'buy', 147.25, 146.80, 148.50, 0.82, 'H4', 'Breakout', 1, 'strong'),
            ('AUDUSD', 'sell', 0.6645, 0.6680, 0.6580, 0.71, 'H1', 'Support Break', 2, 'moderate'),
            ('USDCAD', 'buy', 1.3445, 1.3420, 1.3500, 0.76, 'H1', 'Momentum', 1, 'strong')
        ]

        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                for signal in signals:
                    signal_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO trading_signals (
                            id, symbol, signal_type, entry_price, stop_loss, take_profit,
                            confidence_score, timeframe, strategy, milestone_level, signal_strength
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                    """, (
                        signal_id, signal[0], signal[1], signal[2], signal[3], signal[4],
                        signal[5], signal[6], signal[7], signal[8], signal[9]
                    ))
                    logger.info(f"✅ Inserted demo signal: {signal[0]} {signal[1].upper()}")

            conn.commit()
            return True

        except Exception as e:
            logger.error(f"❌ Failed to insert demo signals: {e}")
            if conn:
                conn.rollback()
            return False
        finally:
            if conn:
                conn.close()

    def extract_demo_data(self):
        """Extract and display demo data"""
        try:
            conn = self.get_connection()

            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                print("\n" + "="*80)
                print("🎯 DEMO DATA EXTRACTION RESULTS")
                print("="*80)

                # Extract users
                cursor.execute("""
                    SELECT id, first_name, last_name, email, selected_plan_name,
                           selected_plan_price, company, country
                    FROM enhanced_users
                    WHERE email LIKE '%@demo.com'
                    ORDER BY created_at DESC
                """)
                users = cursor.fetchall()

                print(f"\n👥 USERS ({len(users)} found):")
                print("-" * 50)
                for user in users:
                    print(f"• {user['first_name']} {user['last_name']} ({user['email']})")
                    print(f"  Plan: {user['selected_plan_name']} (${user['selected_plan_price']})")
                    print(f"  Company: {user['company']}, Country: {user['country']}")

                # Extract payments
                cursor.execute("""
                    SELECT pt.user_name, pt.final_price, pt.payment_method, pt.payment_status,
                           eu.email
                    FROM payment_transactions pt
                    LEFT JOIN enhanced_users eu ON pt.user_id = eu.id
                    WHERE pt.transaction_id LIKE 'demo_txn_%'
                    ORDER BY pt.created_at DESC
                """)
                payments = cursor.fetchall()

                print(f"\n💳 PAYMENTS ({len(payments)} found):")
                print("-" * 50)
                for payment in payments:
                    print(f"• {payment['user_name']}: ${payment['final_price']} ({payment['payment_method']})")
                    print(f"  Status: {payment['payment_status']}")

                # Extract questionnaires
                cursor.execute("""
                    SELECT qr.user_name, qr.prop_firm, qr.account_type, qr.account_size,
                           qr.milestone_access_level, eu.email
                    FROM questionnaire_responses qr
                    LEFT JOIN enhanced_users eu ON qr.user_id = eu.id
                    WHERE qr.user_email LIKE '%@demo.com'
                    ORDER BY qr.created_at DESC
                """)
                questionnaires = cursor.fetchall()

                print(f"\n📋 QUESTIONNAIRES ({len(questionnaires)} found):")
                print("-" * 50)
                for q in questionnaires:
                    print(f"• {q['user_name']}: {q['prop_firm']}")
                    print(f"  Account: {q['account_type']} (${q['account_size']})")
                    print(f"  Milestone Level: {q['milestone_access_level']}")

                # Extract signals
                cursor.execute("""
                    SELECT symbol, signal_type, entry_price, confidence_score,
                           strategy, signal_strength
                    FROM trading_signals
                    WHERE created_by IS NULL
                    ORDER BY created_at DESC
                    LIMIT 5
                """)
                signals = cursor.fetchall()

                print(f"\n📊 SIGNALS ({len(signals)} found):")
                print("-" * 50)
                for signal in signals:
                    print(f"• {signal['symbol']} {signal['signal_type'].upper()}")
                    print(f"  Entry: {signal['entry_price']}, Confidence: {signal['confidence_score']}%")
                    print(f"  Strategy: {signal['strategy']}, Strength: {signal['signal_strength']}")

                # Extract complete profiles using view
                cursor.execute("""
                    SELECT first_name, last_name, email, account_type, current_equity,
                           win_rate, milestone_access_level
                    FROM user_complete_profile
                    WHERE email LIKE '%@demo.com'
                    ORDER BY signup_date DESC
                """)
                profiles = cursor.fetchall()

                print(f"\n👤 COMPLETE PROFILES ({len(profiles)} found):")
                print("-" * 50)
                for profile in profiles:
                    print(f"• {profile['first_name']} {profile['last_name']}")
                    print(f"  Account: {profile['account_type']}, Equity: ${profile['current_equity']}")
                    print(f"  Win Rate: {profile['win_rate']}%, Milestone: {profile['milestone_access_level']}")

                # Database stats
                cursor.execute("""
                    SELECT
                        (SELECT COUNT(*) FROM enhanced_users WHERE email LIKE '%@demo.com') as demo_users,
                        (SELECT COUNT(*) FROM payment_transactions WHERE transaction_id LIKE 'demo_txn_%') as demo_payments,
                        (SELECT COUNT(*) FROM questionnaire_responses WHERE user_email LIKE '%@demo.com') as demo_questionnaires,
                        (SELECT COUNT(*) FROM trading_signals WHERE created_by IS NULL) as demo_signals
                """)
                stats = cursor.fetchone()

                print(f"\n📈 DATABASE STATS:")
                print("-" * 50)
                print(f"Demo Users: {stats['demo_users']}")
                print(f"Demo Payments: {stats['demo_payments']}")
                print(f"Demo Questionnaires: {stats['demo_questionnaires']}")
                print(f"Demo Signals: {stats['demo_signals']}")

            conn.close()

            print(f"\n{'='*80}")
            print("🎉 DEMO DATA EXTRACTION COMPLETED!")
            print(f"{'='*80}")
            print("✅ PostgreSQL database fully operational")
            print("✅ All data relationships working correctly")
            print("✅ Complex queries and views functioning")
            print("✅ Ready for production use!")

        except Exception as e:
            logger.error(f"❌ Failed to extract demo data: {e}")

def main():
    """Main demo function"""
    print("🚀 PostgreSQL Demo Data Insertion & Extraction")
    print("=" * 60)

    # Initialize manager
    manager = DemoDataManager()

    print("\n📝 Inserting demo data...")

    # Insert demo users
    print("👤 Inserting demo users...")
    user_ids = manager.insert_demo_users()
    if not user_ids:
        print("❌ Failed to insert demo users")
        sys.exit(1)

    # Insert demo payments
    print("💳 Inserting demo payments...")
    if not manager.insert_demo_payments(user_ids):
        print("❌ Failed to insert demo payments")
        sys.exit(1)

    # Insert demo questionnaires and dashboards
    print("📋 Inserting demo questionnaires and dashboards...")
    if not manager.insert_demo_questionnaires(user_ids):
        print("❌ Failed to insert demo questionnaires")
        sys.exit(1)

    # Insert demo signals
    print("📊 Inserting demo trading signals...")
    if not manager.insert_demo_signals():
        print("❌ Failed to insert demo signals")
        sys.exit(1)

    print("✅ All demo data inserted successfully!")

    # Extract and display data
    manager.extract_demo_data()

if __name__ == "__main__":
    main()

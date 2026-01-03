#!/usr/bin/env python3
"""
Working Database Fix - Direct PostgreSQL Integration
This script will directly insert data into your PostgreSQL database
"""

import psycopg2
import hashlib
import uuid
from datetime import datetime, timezone
from decimal import Decimal
import json

# Your PostgreSQL database configuration
DATABASE_URL = "postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73f0878g-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2"

def get_db_connection():
    """Get database connection with proper SSL settings"""
    try:
        # Parse the database URL
        import urllib.parse
        parsed = urllib.parse.urlparse(DATABASE_URL)
        
        # Connect with proper SSL settings
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port,
            database=parsed.path[1:],  # Remove leading slash
            user=parsed.username,
            password=parsed.password,
            sslmode='require',
            connect_timeout=10
        )
        return conn
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return None

def create_tables_if_not_exist():
    """Create tables if they don't exist"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
        # Create users table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                company VARCHAR(255),
                country VARCHAR(10),
                agree_to_terms BOOLEAN DEFAULT false,
                agree_to_marketing BOOLEAN DEFAULT false,
                plan_type VARCHAR(50) DEFAULT 'premium',
                plan_name VARCHAR(100),
                plan_price DECIMAL(10,2),
                plan_period VARCHAR(20),
                plan_description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            );
        """)
        
        # Create payments table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS payments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                user_email VARCHAR(255) NOT NULL,
                user_name VARCHAR(255) NOT NULL,
                plan_name_payment VARCHAR(100) NOT NULL,
                original_price DECIMAL(10,2) NOT NULL,
                discount_amount DECIMAL(10,2) DEFAULT 0,
                final_price DECIMAL(10,2) NOT NULL,
                coupon_code VARCHAR(50),
                coupon_applied BOOLEAN DEFAULT false,
                payment_method VARCHAR(50) NOT NULL,
                payment_provider VARCHAR(50),
                transaction_id VARCHAR(255) UNIQUE NOT NULL,
                payment_status VARCHAR(20) DEFAULT 'pending',
                crypto_transaction_hash VARCHAR(255),
                crypto_from_address VARCHAR(255),
                crypto_amount VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create questionnaire table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS questionnaire (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                user_email VARCHAR(255) NOT NULL,
                user_name VARCHAR(255) NOT NULL,
                trades_per_day VARCHAR(10) NOT NULL,
                trading_session VARCHAR(20) NOT NULL,
                crypto_assets TEXT[] DEFAULT '{}',
                forex_assets TEXT[] DEFAULT '{}',
                custom_forex_pairs TEXT[] DEFAULT '{}',
                has_account VARCHAR(3) NOT NULL,
                account_equity DECIMAL(15,2),
                prop_firm VARCHAR(255) NOT NULL,
                account_type VARCHAR(100) NOT NULL,
                account_size DECIMAL(15,2) NOT NULL,
                risk_percentage DECIMAL(4,2) NOT NULL,
                risk_reward_ratio VARCHAR(10) NOT NULL,
                account_number VARCHAR(100) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create user_dashboard table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_dashboard (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                user_email VARCHAR(255) NOT NULL,
                user_name VARCHAR(255) NOT NULL,
                prop_firm VARCHAR(255),
                account_type VARCHAR(100),
                account_size DECIMAL(15,2),
                risk_per_trade DECIMAL(4,2),
                experience VARCHAR(50),
                unique_id VARCHAR(100),
                account_balance DECIMAL(15,2),
                total_pnl DECIMAL(15,2) DEFAULT 0,
                win_rate DECIMAL(5,2) DEFAULT 0,
                total_trades INTEGER DEFAULT 0,
                winning_trades INTEGER DEFAULT 0,
                losing_trades INTEGER DEFAULT 0,
                average_win DECIMAL(15,2) DEFAULT 0,
                average_loss DECIMAL(15,2) DEFAULT 0,
                profit_factor DECIMAL(8,2) DEFAULT 0,
                max_drawdown DECIMAL(8,2) DEFAULT 0,
                current_drawdown DECIMAL(8,2) DEFAULT 0,
                gross_profit DECIMAL(15,2) DEFAULT 0,
                gross_loss DECIMAL(15,2) DEFAULT 0,
                consecutive_wins INTEGER DEFAULT 0,
                consecutive_losses INTEGER DEFAULT 0,
                sharpe_ratio DECIMAL(8,4),
                max_daily_risk DECIMAL(8,2),
                risk_per_trade_amount DECIMAL(15,2),
                max_drawdown_limit DECIMAL(8,2),
                initial_equity DECIMAL(15,2),
                current_equity DECIMAL(15,2),
                daily_pnl DECIMAL(15,2) DEFAULT 0,
                daily_trades INTEGER DEFAULT 0,
                daily_initial_equity DECIMAL(15,2),
                risk_per_trade_percentage DECIMAL(4,2),
                daily_loss_limit DECIMAL(4,2),
                consecutive_losses_limit INTEGER,
                selected_theme VARCHAR(50) DEFAULT 'concept1',
                notifications_enabled BOOLEAN DEFAULT true,
                auto_refresh BOOLEAN DEFAULT true,
                refresh_interval INTEGER DEFAULT 5000,
                language VARCHAR(10) DEFAULT 'en',
                timezone VARCHAR(50) DEFAULT 'UTC',
                real_time_data JSONB,
                last_signal JSONB,
                market_status VARCHAR(20) DEFAULT 'open',
                connection_status VARCHAR(20) DEFAULT 'online',
                open_positions JSONB DEFAULT '[]',
                trade_history JSONB DEFAULT '[]',
                signals JSONB DEFAULT '[]',
                dashboard_layout JSONB,
                widget_settings JSONB,
                alert_settings JSONB,
                last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        print("✅ All tables created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False
    finally:
        cur.close()
        conn.close()

def insert_signup_data():
    """Insert sample signup data"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
        # Sample signup data
        user_id = str(uuid.uuid4())
        password_hash = hashlib.sha256("SecurePassword123!".encode()).hexdigest()
        
        cur.execute("""
            INSERT INTO users (
                id, first_name, last_name, email, password_hash, phone, company, country,
                agree_to_terms, agree_to_marketing, plan_type, plan_name, plan_price,
                plan_period, plan_description, created_at, updated_at, is_active
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (email) DO NOTHING
            RETURNING id;
        """, (
            user_id, "John", "Doe", "john.doe@example.com", password_hash, 
            "+1-555-123-4567", "Trading Corp Inc", "US", True, True, 
            "premium", "Elite Plan", 1299.00, "month", 
            "Complete MT5 bot development service",
            datetime.now(timezone.utc), datetime.now(timezone.utc), True
        ))
        
        result = cur.fetchone()
        if result:
            print(f"✅ Signup data inserted successfully! User ID: {result[0]}")
            conn.commit()
            return result[0]
        else:
            print("ℹ️  User already exists, getting existing user ID")
            cur.execute("SELECT id FROM users WHERE email = %s", ("john.doe@example.com",))
            existing_user = cur.fetchone()
            if existing_user:
                return existing_user[0]
            return None
            
    except Exception as e:
        print(f"❌ Error inserting signup data: {e}")
        return None
    finally:
        cur.close()
        conn.close()

def insert_payment_data(user_id):
    """Insert sample payment data"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
        payment_id = str(uuid.uuid4())
        
        cur.execute("""
            INSERT INTO payments (
                id, user_id, user_email, user_name, plan_name_payment, original_price,
                discount_amount, final_price, coupon_code, coupon_applied, payment_method,
                payment_provider, transaction_id, payment_status, crypto_transaction_hash,
                crypto_from_address, crypto_amount, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            payment_id, user_id, "john.doe@example.com", "John Doe", "Elite Plan",
            1299.00, 0.00, 1299.00, None, False, "cryptomus", "Cryptomus",
            f"TXN_{int(datetime.now().timestamp())}", "completed",
            f"CRYPTO_{int(datetime.now().timestamp())}", "0x1234567890abcdef",
            "1299.00", datetime.now(timezone.utc), datetime.now(timezone.utc)
        ))
        
        result = cur.fetchone()
        if result:
            print(f"✅ Payment data inserted successfully! Payment ID: {result[0]}")
            conn.commit()
            return result[0]
        return None
        
    except Exception as e:
        print(f"❌ Error inserting payment data: {e}")
        return None
    finally:
        cur.close()
        conn.close()

def insert_questionnaire_data(user_id):
    """Insert sample questionnaire data"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
        questionnaire_id = str(uuid.uuid4())
        
        cur.execute("""
            INSERT INTO questionnaire (
                id, user_id, user_email, user_name, trades_per_day, trading_session,
                crypto_assets, forex_assets, custom_forex_pairs, has_account, account_equity,
                prop_firm, account_type, account_size, risk_percentage, risk_reward_ratio,
                account_number, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            questionnaire_id, user_id, "john.doe@example.com", "John Doe", "1-2", "any",
            ["BTC", "ETH", "SOL", "XRP", "ADA"], ["EURUSD", "GBPUSD", "USDJPY"], 
            ["EURNOK", "USDSEK"], "yes", 100000.00, "FTMO", "Challenge", 100000.00,
            1.5, "2", f"FTMO{int(datetime.now().timestamp())}",
            datetime.now(timezone.utc), datetime.now(timezone.utc)
        ))
        
        result = cur.fetchone()
        if result:
            print(f"✅ Questionnaire data inserted successfully! Questionnaire ID: {result[0]}")
            conn.commit()
            return result[0]
        return None
        
    except Exception as e:
        print(f"❌ Error inserting questionnaire data: {e}")
        return None
    finally:
        cur.close()
        conn.close()

def insert_dashboard_data(user_id):
    """Insert sample dashboard data (based on questionnaire)"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
        dashboard_id = str(uuid.uuid4())
        
        cur.execute("""
            INSERT INTO user_dashboard (
                id, user_id, user_email, user_name, prop_firm, account_type, account_size,
                risk_per_trade, experience, unique_id, account_balance, total_pnl, win_rate,
                total_trades, winning_trades, losing_trades, average_win, average_loss,
                profit_factor, max_drawdown, current_drawdown, gross_profit, gross_loss,
                consecutive_wins, consecutive_losses, sharpe_ratio, max_daily_risk,
                risk_per_trade_amount, max_drawdown_limit, initial_equity, current_equity,
                daily_pnl, daily_trades, daily_initial_equity, risk_per_trade_percentage,
                daily_loss_limit, consecutive_losses_limit, selected_theme,
                notifications_enabled, auto_refresh, refresh_interval, language, timezone,
                real_time_data, last_signal, market_status, connection_status,
                open_positions, trade_history, signals, dashboard_layout,
                widget_settings, alert_settings, created_at, updated_at, last_activity
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            dashboard_id, user_id, "john.doe@example.com", "John Doe", "FTMO", "Challenge", 100000.00,
            1.5, "intermediate", f"UNIQUE_{user_id[:8]}", 100000.00, 0.00, 0.00,
            0, 0, 0, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, None, 5.00,
            1500.00, 10.00, 100000.00, 100000.00, 0.00, 0, 100000.00, 1.5,
            5.00, 3, "concept1", True, True, 5000, "en", "UTC",
            json.dumps({"market_status": "open", "last_update": datetime.now(timezone.utc).isoformat()}),
            None, "open", "online", json.dumps([]), json.dumps([]), json.dumps([]),
            None, None, None, datetime.now(timezone.utc), datetime.now(timezone.utc), datetime.now(timezone.utc)
        ))
        
        result = cur.fetchone()
        if result:
            print(f"✅ Dashboard data inserted successfully! Dashboard ID: {result[0]}")
            conn.commit()
            return result[0]
        return None
        
    except Exception as e:
        print(f"❌ Error inserting dashboard data: {e}")
        return None
    finally:
        cur.close()
        conn.close()

def verify_data():
    """Verify all data was inserted correctly"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
        print("\n🔍 Verifying data in database...")
        
        # Check users
        cur.execute("SELECT COUNT(*) FROM users;")
        user_count = cur.fetchone()[0]
        print(f"📊 Users table: {user_count} records")
        
        # Check payments
        cur.execute("SELECT COUNT(*) FROM payments;")
        payment_count = cur.fetchone()[0]
        print(f"📊 Payments table: {payment_count} records")
        
        # Check questionnaire
        cur.execute("SELECT COUNT(*) FROM questionnaire;")
        questionnaire_count = cur.fetchone()[0]
        print(f"📊 Questionnaire table: {questionnaire_count} records")
        
        # Check user_dashboard
        cur.execute("SELECT COUNT(*) FROM user_dashboard;")
        dashboard_count = cur.fetchone()[0]
        print(f"📊 User Dashboard table: {dashboard_count} records")
        
        # Show sample data
        print("\n📋 Sample data from users table:")
        cur.execute("SELECT first_name, last_name, email, plan_name FROM users LIMIT 3;")
        users = cur.fetchall()
        for user in users:
            print(f"   - {user[0]} {user[1]} ({user[2]}) - {user[3]}")
        
        print("\n📋 Sample data from questionnaire table:")
        cur.execute("SELECT prop_firm, account_type, account_size, risk_percentage FROM questionnaire LIMIT 3;")
        questionnaires = cur.fetchall()
        for q in questionnaires:
            print(f"   - {q[0]} {q[1]} ${q[2]} - {q[3]}% risk")
        
        print("\n✅ Data verification complete!")
        return True
        
    except Exception as e:
        print(f"❌ Error verifying data: {e}")
        return False
    finally:
        cur.close()
        conn.close()

def main():
    """Main function to test database connection and insert data"""
    print("🚀 Working Database Fix - Direct PostgreSQL Integration")
    print("=" * 60)
    
    # Test database connection
    print("🔌 Testing database connection...")
    conn = get_db_connection()
    if not conn:
        print("❌ Cannot connect to database. Please check your credentials.")
        return False
    
    print("✅ Database connection successful!")
    conn.close()
    
    # Create tables
    print("\n🏗️  Creating tables...")
    if not create_tables_if_not_exist():
        print("❌ Failed to create tables.")
        return False
    
    # Insert sample data
    print("\n📝 Inserting sample data...")
    
    # Insert signup data
    user_id = insert_signup_data()
    if not user_id:
        print("❌ Failed to insert signup data.")
        return False
    
    # Insert payment data
    payment_id = insert_payment_data(user_id)
    if not payment_id:
        print("❌ Failed to insert payment data.")
        return False
    
    # Insert questionnaire data
    questionnaire_id = insert_questionnaire_data(user_id)
    if not questionnaire_id:
        print("❌ Failed to insert questionnaire data.")
        return False
    
    # Insert dashboard data
    dashboard_id = insert_dashboard_data(user_id)
    if not dashboard_id:
        print("❌ Failed to insert dashboard data.")
        return False
    
    # Verify data
    if not verify_data():
        print("❌ Data verification failed.")
        return False
    
    print("\n" + "=" * 60)
    print("🎉 SUCCESS! Data is now going to your PostgreSQL database!")
    print("=" * 60)
    print("✅ All tables created")
    print("✅ Sample data inserted")
    print("✅ Data verification passed")
    print("✅ Your database is ready to receive data from all pages!")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    main()

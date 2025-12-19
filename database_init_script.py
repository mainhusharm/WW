#!/usr/bin/env python3
"""
Direct database initialization script
This can be run to initialize the database directly
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://username:password@localhost:5432/database')

def initialize_database():
    """Initialize database with required tables"""
    try:
        print("Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        print("Database connected successfully")
        
        # Create users table
        print("Creating users table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
                username VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                normalized_email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                full_name VARCHAR(200),
                phone VARCHAR(20),
                company VARCHAR(200),
                country VARCHAR(50),
                trading_experience VARCHAR(50),
                trading_goals TEXT,
                risk_tolerance VARCHAR(50),
                preferred_markets VARCHAR(100),
                trading_style VARCHAR(50),
                agree_to_marketing BOOLEAN DEFAULT false,
                plan_type VARCHAR(50) DEFAULT 'free',
                unique_id VARCHAR(50) UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP WITH TIME ZONE,
                is_active BOOLEAN DEFAULT true,
                is_verified BOOLEAN DEFAULT false,
                verification_token VARCHAR(255),
                reset_token VARCHAR(255),
                reset_token_expires TIMESTAMP WITH TIME ZONE
            )
        """)
        print("Users table created")
        
        # Create customer_data table
        print("Creating customer_data table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS customer_data (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                customer_uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
                full_name_encrypted TEXT,
                phone_encrypted TEXT,
                address_encrypted TEXT,
                date_of_birth_encrypted TEXT,
                membership_tier VARCHAR(50) DEFAULT 'free',
                account_status VARCHAR(50) DEFAULT 'active',
                payment_status VARCHAR(50) DEFAULT 'pending',
                payment_method VARCHAR(50),
                payment_amount DECIMAL(10,2) DEFAULT 0,
                payment_date TIMESTAMP WITH TIME ZONE,
                account_type VARCHAR(50),
                prop_firm VARCHAR(100),
                account_size DECIMAL(15,2) DEFAULT 0,
                trading_experience VARCHAR(50),
                risk_tolerance VARCHAR(50),
                trading_goals TEXT,
                ip_address INET,
                user_agent TEXT,
                signup_source VARCHAR(100) DEFAULT 'website',
                referral_code VARCHAR(50),
                questionnaire_data JSONB,
                admin_verified BOOLEAN DEFAULT false,
                admin_notes TEXT,
                data_capture_complete BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Customer_data table created")
        
        # Create other tables...
        print("Creating additional tables...")
        
        # Create risk_plans table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS risk_plans (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                prop_firm VARCHAR(100),
                account_type VARCHAR(50),
                account_size DECIMAL(15,2),
                risk_percentage DECIMAL(5,2),
                has_account BOOLEAN DEFAULT false,
                account_equity DECIMAL(15,2),
                trading_session VARCHAR(50),
                crypto_assets JSONB,
                forex_assets JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create payment_transactions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payment_transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                transaction_uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'USD',
                payment_method VARCHAR(50) NOT NULL,
                payment_provider VARCHAR(50),
                transaction_id VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                gateway_response JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create user_activities table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_activities (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                activity_type VARCHAR(100) NOT NULL,
                activity_data JSONB,
                ip_address INET,
                user_agent TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create admin_access_logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admin_access_logs (
                id SERIAL PRIMARY KEY,
                admin_user_id INTEGER,
                action_type VARCHAR(100) NOT NULL,
                target_user_id INTEGER,
                action_data JSONB,
                ip_address INET,
                user_agent TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes
        print("Creating indexes...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_normalized_email ON users(normalized_email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_customer_data_user_id ON customer_data(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_customer_data_uuid ON customer_data(customer_uuid)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_risk_plans_user_id ON risk_plans(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at)")
        
        conn.commit()
        conn.close()
        print("✅ Database initialized successfully!")
        
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    initialize_database()

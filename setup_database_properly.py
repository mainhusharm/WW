#!/usr/bin/env python3
"""
Setup database properly with users table and test data
"""

import os
import psycopg2
import bcrypt
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def setup_database():
    """Setup the database with proper tables and test data."""
    conn = None
    try:
        # Connect to the database
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("DATABASE_URL environment variable not set")
            return False
            
        conn = psycopg2.connect(database_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        print("Connected to database successfully")
        
        # Enable UUID extension
        cur.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
        print("UUID extension enabled")
        
        # Create users table
        users_table_sql = """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            username VARCHAR(100),
            membership_tier VARCHAR(50) DEFAULT 'professional',
            account_type VARCHAR(50) DEFAULT 'personal',
            risk_tolerance VARCHAR(50) DEFAULT 'moderate',
            is_authenticated BOOLEAN DEFAULT false,
            setup_complete BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP WITH TIME ZONE
        );
        """
        cur.execute(users_table_sql)
        print("Users table created")
        
        # Create index on email
        cur.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
        print("Email index created")
        
        # Create update trigger function
        trigger_function_sql = """
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        """
        cur.execute(trigger_function_sql)
        print("Update trigger function created")
        
        # Create trigger
        trigger_sql = """
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """
        cur.execute(trigger_sql)
        print("Update trigger created")
        
        # Hash password for test user
        password = "Anchalsharma1806@"
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Insert test user
        insert_user_sql = """
        INSERT INTO users (email, password, first_name, last_name, username, membership_tier, is_authenticated, setup_complete)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (email) DO UPDATE SET
            password = EXCLUDED.password,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            username = EXCLUDED.username,
            membership_tier = EXCLUDED.membership_tier,
            is_authenticated = EXCLUDED.is_authenticated,
            setup_complete = EXCLUDED.setup_complete;
        """
        
        cur.execute(insert_user_sql, (
            'anchlshrma18@gmail.com',
            hashed_password,
            'Anchal',
            'Sharma',
            'anchal',
            'professional',
            True,
            True
        ))
        print("Test user created/updated")
        
        # Verify user was created
        cur.execute("SELECT id, email, first_name, last_name FROM users WHERE email = %s", ('anchlshrma18@gmail.com',))
        user = cur.fetchone()
        if user:
            print(f"User verified: {user}")
        else:
            print("User creation failed")
            return False
            
        cur.close()
        print("Database setup completed successfully!")
        return True
        
    except Exception as error:
        print(f"Database setup failed: {error}")
        return False
    finally:
        if conn is not None:
            conn.close()

if __name__ == '__main__':
    success = setup_database()
    if success:
        print("✅ Database setup completed successfully!")
    else:
        print("❌ Database setup failed!")

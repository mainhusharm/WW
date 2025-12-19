#!/usr/bin/env python3
"""
Setup backend database with users table
This script will be run during deployment to ensure the database is properly set up
"""

import os
import psycopg2
import bcrypt
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def setup_backend_database():
    """Setup the backend database with users table and test data."""
    try:
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL environment variable not set")
            return False
            
        print(f"🔗 Connecting to database: {database_url[:20]}...")
        
        # Connect to the database
        conn = psycopg2.connect(database_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        print("✅ Connected to database successfully")
        
        # Enable UUID extension
        cur.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
        print("✅ UUID extension enabled")
        
        # Create users table
        users_table_sql = """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            username VARCHAR(100),
            plan_type VARCHAR(50) DEFAULT 'professional',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
        cur.execute(users_table_sql)
        print("✅ Users table created")
        
        # Create index on email
        cur.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
        print("✅ Email index created")
        
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
        print("✅ Update trigger function created")
        
        # Create trigger
        trigger_sql = """
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """
        cur.execute(trigger_sql)
        print("✅ Update trigger created")
        
        # Hash password for test user
        password = "Anchalsharma1806@"
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Insert test user
        insert_user_sql = """
        INSERT INTO users (email, password_hash, username, plan_type)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (email) DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            username = EXCLUDED.username,
            plan_type = EXCLUDED.plan_type;
        """
        
        cur.execute(insert_user_sql, (
            'anchlshrma18@gmail.com',
            hashed_password,
            'anchal',
            'professional'
        ))
        print("✅ Test user created/updated")
        
        # Verify user was created
        cur.execute("SELECT id, email, username, plan_type FROM users WHERE email = %s", ('anchlshrma18@gmail.com',))
        user = cur.fetchone()
        if user:
            print(f"✅ User verified: ID={user[0]}, Email={user[1]}, Username={user[2]}, Plan={user[3]}")
        else:
            print("❌ User creation failed")
            return False
            
        cur.close()
        conn.close()
        print("🎉 Backend database setup completed successfully!")
        return True
        
    except Exception as error:
        print(f"❌ Backend database setup failed: {error}")
        return False

if __name__ == '__main__':
    success = setup_backend_database()
    if success:
        print("✅ Backend database setup completed successfully!")
        exit(0)
    else:
        print("❌ Backend database setup failed!")
        exit(1)

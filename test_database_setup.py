#!/usr/bin/env python3
"""
Test database setup locally
"""

import os
import psycopg2
import bcrypt
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def test_database_setup():
    """Test the database setup locally"""
    try:
        # Use a test database URL (you can change this to your actual database)
        database_url = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost:5432/testdb')
        
        print(f"🔗 Testing database connection: {database_url[:30]}...")
        
        # Connect to the database
        conn = psycopg2.connect(database_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        print("✅ Connected to database successfully")
        
        # Check if users table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        """)
        
        table_exists = cur.fetchone()[0]
        print(f"📊 Users table exists: {table_exists}")
        
        if table_exists:
            # Check if test user exists
            cur.execute("SELECT id, email, username FROM users WHERE email = %s", ('anchlshrma18@gmail.com',))
            user = cur.fetchone()
            
            if user:
                print(f"✅ Test user found: ID={user[0]}, Email={user[1]}, Username={user[2]}")
            else:
                print("❌ Test user not found")
                
                # Create test user
                password = "Anchalsharma1806@"
                hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                cur.execute("""
                    INSERT INTO users (email, password_hash, username, plan_type)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (email) DO UPDATE SET
                        password_hash = EXCLUDED.password_hash,
                        username = EXCLUDED.username,
                        plan_type = EXCLUDED.plan_type;
                """, (
                    'anchlshrma18@gmail.com',
                    hashed_password,
                    'anchal',
                    'professional'
                ))
                
                print("✅ Test user created")
        else:
            print("❌ Users table does not exist - database setup needed")
            
        cur.close()
        conn.close()
        print("🎉 Database test completed!")
        return True
        
    except Exception as error:
        print(f"❌ Database test failed: {error}")
        return False

if __name__ == '__main__':
    success = test_database_setup()
    if success:
        print("✅ Database test completed successfully!")
    else:
        print("❌ Database test failed!")
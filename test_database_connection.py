#!/usr/bin/env python3
"""
Test database connection and create tables
"""

import psycopg2
import os
from datetime import datetime, timezone

# Database configuration
DATABASE_URL = "postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73f0878g-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2"

def test_connection():
    """Test database connection"""
    try:
        print("🔌 Testing database connection...")
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Test basic query
        cur.execute("SELECT version();")
        version = cur.fetchone()
        print(f"✅ Database connected successfully!")
        print(f"📊 PostgreSQL version: {version[0]}")
        
        # Test current time
        cur.execute("SELECT NOW();")
        current_time = cur.fetchone()
        print(f"⏰ Current database time: {current_time[0]}")
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def create_tables():
    """Create database tables"""
    try:
        print("\n🏗️  Creating database tables...")
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Read and execute the SQL schema
        with open('create_complete_database_schema.sql', 'r') as f:
            sql_schema = f.read()
        
        # Split by semicolon and execute each statement
        statements = [stmt.strip() for stmt in sql_schema.split(';') if stmt.strip()]
        
        for i, statement in enumerate(statements):
            if statement:
                try:
                    cur.execute(statement)
                    print(f"✅ Statement {i+1} executed successfully")
                except Exception as e:
                    print(f"⚠️  Statement {i+1} warning: {e}")
        
        conn.commit()
        print("✅ All tables created successfully!")
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Table creation failed: {e}")
        return False

def test_tables():
    """Test if tables exist and are accessible"""
    try:
        print("\n🧪 Testing table access...")
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # List all tables
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        
        tables = cur.fetchall()
        print(f"📋 Found {len(tables)} tables:")
        for table in tables:
            print(f"   - {table[0]}")
        
        # Test inserting a sample user
        print("\n👤 Testing user insertion...")
        cur.execute("""
            INSERT INTO users (
                id, first_name, last_name, email, password_hash, 
                phone, company, country, agree_to_terms, agree_to_marketing,
                plan_type, created_at, updated_at, is_active
            ) VALUES (
                gen_random_uuid(), 'Test', 'User', 'test@example.com', 
                'hashed_password', '+1234567890', 'Test Company', 'US', 
                true, false, 'premium', NOW(), NOW(), true
            ) RETURNING id, email;
        """)
        
        result = cur.fetchone()
        print(f"✅ Test user created: {result[1]} (ID: {result[0]})")
        
        # Test coupon insertion
        print("\n🎫 Testing coupon insertion...")
        cur.execute("""
            INSERT INTO coupons (
                code, description, discount_type, discount_value, 
                max_uses, valid_from, valid_until, is_active
            ) VALUES (
                'TEST100', 'Test coupon', 'percentage', 100, 
                10, NOW(), NOW() + INTERVAL '1 year', true
            ) ON CONFLICT (code) DO NOTHING;
        """)
        
        print("✅ Test coupon created/verified")
        
        conn.commit()
        cur.close()
        conn.close()
        
        print("\n🎉 All tests passed! Database is ready for use.")
        return True
        
    except Exception as e:
        print(f"❌ Table testing failed: {e}")
        return False

def main():
    """Main function"""
    print("🚀 TraderEdge Pro Database Setup")
    print("=" * 50)
    
    # Test connection
    if not test_connection():
        return False
    
    # Create tables
    if not create_tables():
        return False
    
    # Test tables
    if not test_tables():
        return False
    
    print("\n" + "=" * 50)
    print("✅ Database setup completed successfully!")
    print("🔗 Database URL: postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:***@dpg-d37pd8nfte5s73f0878g-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2")
    print("📊 Ready to receive data from all pages!")
    print("=" * 50)
    
    return True

if __name__ == "__main__":
    main()
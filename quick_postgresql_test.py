#!/usr/bin/env python3
"""
Quick PostgreSQL connection test
"""

import os
import psycopg2

def quick_test():
    """Quick test of PostgreSQL connection"""
    
    password = os.getenv('POSTGRES_PASSWORD')
    
    if not password:
        print("❌ Please set POSTGRES_PASSWORD environment variable first")
        print("Run: export POSTGRES_PASSWORD=your_password")
        return False
    
    try:
        print("🔍 Testing PostgreSQL connection...")
        
        conn = psycopg2.connect(
            host='dpg-d37pd8nfte5s73bfl1ug-a',
            database='pghero_dpg_d2v9i7er433s73f0878g_a_cdm2',
            user='pghero_dpg_d2v9i7er433s73f0878g_a_cdm2',
            password=password,
            port=5432
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users;")
        count = cursor.fetchone()[0]
        
        print(f"✅ Connected successfully! Users in database: {count}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    quick_test()

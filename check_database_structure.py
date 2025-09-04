#!/usr/bin/env python3
"""
Check Database Structure and Create Test Data
"""

import sqlite3
import os

def check_database_structure():
    """Check the structure of all tables in the database"""
    try:
        db_path = "trading_bots.db"
        if not os.path.exists(db_path):
            print(f"❌ Database file not found: {db_path}")
            return
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("📊 Database tables found:")
        for table in tables:
            table_name = table[0]
            print(f"\n🔍 Table: {table_name}")
            
            # Get table structure
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            
            print("   Columns:")
            for col in columns:
                print(f"     - {col[1]} ({col[2]}) {'NOT NULL' if col[3] else 'NULL'} {'PRIMARY KEY' if col[5] else ''}")
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
            count = cursor.fetchone()[0]
            print(f"   Rows: {count}")
            
            # Show sample data if any
            if count > 0:
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 3;")
                sample_data = cursor.fetchall()
                print("   Sample data:")
                for row in sample_data:
                    print(f"     {row}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error checking database: {str(e)}")

if __name__ == '__main__':
    check_database_structure()

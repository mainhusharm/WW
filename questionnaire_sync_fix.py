#!/usr/bin/env python3
"""
Questionnaire Synchronization Fix
This script fixes the issues with questionnaire data not properly syncing with the user dashboard.
"""

import sqlite3
import json
from datetime import datetime

class QuestionnaireSyncFix:
    def __init__(self, db_path="trading_bots.db"):
        self.db_path = db_path
        
    def create_customer_service_table(self):
        """Create the customer_service_data table if it doesn't exist"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customer_service_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                account_type TEXT NOT NULL,
                package_value INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ customer_service_data table created/verified")
    
    def insert_questionnaire_data(self, user_id, account_type, package_value):
        """Insert or update questionnaire data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO customer_service_data (user_id, account_type, package_value, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (user_id) DO UPDATE SET
                    account_type = excluded.account_type,
                    package_value = excluded.package_value,
                    updated_at = excluded.updated_at
            ''', (user_id, account_type, package_value, datetime.now()))
            
            conn.commit()
            print(f"✅ Questionnaire data saved for user {user_id}")
            return True
            
        except Exception as e:
            print(f"❌ Error saving questionnaire data: {e}")
            return False
        finally:
            conn.close()
    
    def get_user_questionnaire_data(self, user_id):
        """Get questionnaire data for a specific user"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT account_type, package_value, created_at, updated_at
            FROM customer_service_data
            WHERE user_id = ?
        ''', (user_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                'account_type': result[0],
                'package_value': result[1],
                'created_at': result[2],
                'updated_at': result[3]
            }
        return None
    
    def get_all_questionnaire_data(self):
        """Get all questionnaire data for debugging"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT user_id, account_type, package_value, created_at, updated_at
            FROM customer_service_data
            ORDER BY updated_at DESC
        ''')
        
        results = cursor.fetchall()
        conn.close()
        
        return [
            {
                'user_id': row[0],
                'account_type': row[1],
                'package_value': row[2],
                'created_at': row[3],
                'updated_at': row[4]
            }
            for row in results
        ]
    
    def fix_existing_data(self):
        """Fix any existing data inconsistencies"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Fix package values for QuantTekel Instant accounts
        cursor.execute('''
            UPDATE customer_service_data
            SET package_value = 10450
            WHERE account_type = 'QuantTekel Instant' AND package_value != 10450
        ''')
        
        updated_rows = cursor.rowcount
        conn.commit()
        conn.close()
        
        if updated_rows > 0:
            print(f"✅ Fixed {updated_rows} package value inconsistencies")
        else:
            print("✅ No data inconsistencies found")
    
    def test_questionnaire_flow(self):
        """Test the complete questionnaire flow"""
        print("\n🧪 Testing Questionnaire Flow...")
        
        # Test user ID
        test_user_id = 1
        
        # Test 1: Insert QuantTekel Instant account
        print(f"\n1. Inserting QuantTekel Instant account for user {test_user_id}")
        self.insert_questionnaire_data(test_user_id, "QuantTekel Instant", 10450)
        
        # Test 2: Retrieve and verify data
        print(f"\n2. Retrieving data for user {test_user_id}")
        data = self.get_user_questionnaire_data(test_user_id)
        if data:
            print(f"   Account Type: {data['account_type']}")
            print(f"   Package Value: {data['package_value']}")
            print(f"   Updated At: {data['updated_at']}")
        else:
            print("   ❌ No data found")
        
        # Test 3: Update existing data
        print(f"\n3. Updating package value for user {test_user_id}")
        self.insert_questionnaire_data(test_user_id, "QuantTekel Instant", 10450)
        
        # Test 4: Verify update
        print(f"\n4. Verifying update for user {test_user_id}")
        updated_data = self.get_user_questionnaire_data(test_user_id)
        if updated_data:
            print(f"   Account Type: {updated_data['account_type']}")
            print(f"   Package Value: {updated_data['package_value']}")
            print(f"   Updated At: {updated_data['updated_at']}")
        
        print("\n✅ Questionnaire flow test completed")

def main():
    """Main function to run the fix"""
    print("🔧 Questionnaire Synchronization Fix")
    print("=" * 50)
    
    fixer = QuestionnaireSyncFix()
    
    # Step 1: Create/verify table
    fixer.create_customer_service_table()
    
    # Step 2: Fix existing data
    fixer.fix_existing_data()
    
    # Step 3: Test the flow
    fixer.test_questionnaire_flow()
    
    # Step 4: Show all data
    print("\n📊 Current Questionnaire Data:")
    print("-" * 50)
    all_data = fixer.get_all_questionnaire_data()
    for item in all_data:
        print(f"User {item['user_id']}: {item['account_type']} - {item['package_value']}")
    
    print("\n🎯 Next Steps:")
    print("1. Update your frontend to use the correct API endpoint")
    print("2. Ensure your dashboard fetches from customer_service_data table")
    print("3. Test the complete flow end-to-end")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Migrate existing users from the users table to the enhanced customer data system
"""

import sqlite3
import json
import requests
from datetime import datetime

def get_existing_users():
    """Get all existing users from the database"""
    conn = sqlite3.connect('trading_bots.db')
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, username, email, created_at, password_hash, plan_type, unique_id, normalized_email
        FROM users
    """)
    
    users = cursor.fetchall()
    conn.close()
    
    return users

def migrate_user_to_enhanced(user_data):
    """Migrate a single user to the enhanced system"""
    user_id, username, email, created_at, password_hash, plan_type, unique_id, normalized_email = user_data
    
    # Prepare the customer data
    customer_data = {
        "customer_id": user_id,
        "unique_id": unique_id or f"CUS-{user_id}",
        "email": email,
        "name": username,
        "phone": "",
        "membership_tier": plan_type or "free",
        "payment_status": "pending",
        "payment_method": "unknown",
        "payment_amount": 0,
        "payment_date": "",
        "join_date": created_at,
        "last_active": created_at,
        "status": "active",
        "questionnaire_data": {},
        "account_type": "unknown",
        "prop_firm": "unknown",
        "account_size": 0,
        "trading_experience": "unknown",
        "risk_tolerance": "unknown",
        "trading_goals": "unknown",
        "ip_address": "unknown",
        "signup_source": "website",
        "referral_code": "",
        "data_capture_complete": False,
        "admin_verified": False,
        "admin_notes": f"Migrated from existing user data on {datetime.now().isoformat()}",
        "created_at": created_at,
        "updated_at": created_at
    }
    
    # Send to enhanced system
    try:
        response = requests.post(
            "http://localhost:5004/api/customer-data/capture-signup",
            json=customer_data,
            headers={
                "Content-Type": "application/json",
                "X-Admin-Username": "admin",
                "X-Admin-MPIN": "180623"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✅ Migrated user {username} (ID: {user_id})")
            return True
        else:
            print(f"❌ Failed to migrate user {username}: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error migrating user {username}: {str(e)}")
        return False

def main():
    """Main migration function"""
    print("🔄 Starting migration of existing users to enhanced customer data system...")
    
    # Get existing users
    users = get_existing_users()
    print(f"📊 Found {len(users)} existing users to migrate")
    
    if not users:
        print("⚠️ No users found to migrate")
        return
    
    # Migrate each user
    successful_migrations = 0
    for user in users:
        if migrate_user_to_enhanced(user):
            successful_migrations += 1
    
    print(f"\n🎉 Migration complete!")
    print(f"✅ Successfully migrated: {successful_migrations}/{len(users)} users")
    
    if successful_migrations > 0:
        print("\n🔍 Testing the enhanced system...")
        try:
            response = requests.get(
                "http://localhost:5004/api/customer-data/get-all",
                headers={
                    "X-Admin-Username": "admin",
                    "X-Admin-MPIN": "180623"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Enhanced system now has {len(data.get('customers', []))} customers")
            else:
                print(f"❌ Failed to verify migration: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error verifying migration: {str(e)}")

if __name__ == "__main__":
    main()

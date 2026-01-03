#!/usr/bin/env python3
"""
Dashboard Questionnaire Synchronization
This script ensures the dashboard properly fetches and displays questionnaire data.
"""

import sqlite3
import json
from datetime import datetime

class DashboardQuestionnaireSync:
    def __init__(self, db_path="trading_bots.db"):
        self.db_path = db_path
        
    def get_user_dashboard_data(self, user_id):
        """Get complete user data for dashboard including questionnaire"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get questionnaire data
            cursor.execute('''
                SELECT account_type, package_value, created_at, updated_at
                FROM customer_service_data
                WHERE user_id = ?
            ''', (user_id,))
            
            questionnaire_data = cursor.fetchone()
            
            # Get user profile data (assuming you have a users table)
            cursor.execute('''
                SELECT id, username, email, created_at
                FROM users
                WHERE id = ?
            ''', (user_id,))
            
            user_data = cursor.fetchone()
            
            conn.close()
            
            # Prepare dashboard data
            dashboard_data = {
                "user_id": user_id,
                "questionnaire": None,
                "user_profile": None,
                "last_sync": datetime.now().isoformat()
            }
            
            if questionnaire_data:
                dashboard_data["questionnaire"] = {
                    "account_type": questionnaire_data[0],
                    "package_value": questionnaire_data[1],
                    "created_at": questionnaire_data[2],
                    "updated_at": questionnaire_data[3]
                }
                
                # Add account-specific rules and features
                dashboard_data["account_rules"] = self.get_account_rules(questionnaire_data[0])
                dashboard_data["account_features"] = self.get_account_features(questionnaire_data[0])
            
            if user_data:
                dashboard_data["user_profile"] = {
                    "username": user_data[1],
                    "email": user_data[2],
                    "created_at": user_data[3]
                }
            
            return dashboard_data
            
        except Exception as e:
            print(f"❌ Error getting dashboard data: {e}")
            return None
    
    def get_account_rules(self, account_type):
        """Get account-specific rules based on account type"""
        rules = {
            "QuantTekel Instant": {
                "trading_hours": "24/7",
                "minimum_deposit": "$100",
                "leverage": "1:500",
                "spread": "0.1 pips",
                "commission": "No commission",
                "stop_loss": "Optional",
                "take_profit": "Optional"
            },
            "QuantTekel 2-Step": {
                "trading_hours": "24/7",
                "minimum_deposit": "$250",
                "leverage": "1:400",
                "spread": "0.2 pips",
                "commission": "Low commission",
                "stop_loss": "Required",
                "take_profit": "Required"
            },
            "QuantTekel Pro": {
                "trading_hours": "24/7",
                "minimum_deposit": "$500",
                "leverage": "1:300",
                "spread": "0.3 pips",
                "commission": "Standard commission",
                "stop_loss": "Required",
                "take_profit": "Required"
            },
            "QuantTekel Premium": {
                "trading_hours": "24/7",
                "minimum_deposit": "$1000",
                "leverage": "1:200",
                "spread": "0.5 pips",
                "commission": "Premium commission",
                "stop_loss": "Required",
                "take_profit": "Required"
            }
        }
        
        return rules.get(account_type, {})
    
    def get_account_features(self, account_type):
        """Get account-specific features based on account type"""
        features = {
            "QuantTekel Instant": [
                "Instant account activation",
                "Basic trading signals",
                "Email support",
                "Mobile app access",
                "Basic chart analysis"
            ],
            "QuantTekel 2-Step": [
                "2-step verification process",
                "Enhanced trading signals",
                "Priority email support",
                "Mobile app access",
                "Advanced chart analysis",
                "Risk management tools"
            ],
            "QuantTekel Pro": [
                "Professional account setup",
                "Premium trading signals",
                "24/7 live chat support",
                "Mobile app access",
                "Professional chart analysis",
                "Advanced risk management",
                "Portfolio tracking"
            ],
            "QuantTekel Premium": [
                "VIP account setup",
                "Exclusive trading signals",
                "Dedicated account manager",
                "Mobile app access",
                "Premium chart analysis",
                "Advanced risk management",
                "Portfolio tracking",
                "Custom alerts",
                "Priority withdrawal"
            ]
        }
        
        return features.get(account_type, [])
    
    def sync_questionnaire_with_dashboard(self, user_id):
        """Ensure questionnaire data is properly synced with dashboard"""
        try:
            # Get current questionnaire data
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT account_type, package_value, updated_at
                FROM customer_service_data
                WHERE user_id = ?
            ''', (user_id,))
            
            questionnaire = cursor.fetchone()
            conn.close()
            
            if not questionnaire:
                print(f"⚠️ No questionnaire data found for user {user_id}")
                return False
            
            # Verify data consistency
            account_type = questionnaire[0]
            package_value = questionnaire[1]
            
            # Expected package values
            expected_values = {
                "QuantTekel Instant": 10450,
                "QuantTekel 2-Step": 10448,
                "QuantTekel Pro": 10452,
                "QuantTekel Premium": 10455
            }
            
            expected_value = expected_values.get(account_type)
            
            if expected_value and package_value != expected_value:
                print(f"⚠️ Package value mismatch for user {user_id}")
                print(f"   Expected: {expected_value}, Found: {package_value}")
                
                # Fix the mismatch
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                cursor.execute('''
                    UPDATE customer_service_data
                    SET package_value = ?, updated_at = ?
                    WHERE user_id = ?
                ''', (expected_value, datetime.now(), user_id))
                
                conn.commit()
                conn.close()
                
                print(f"✅ Fixed package value for user {user_id}")
                return True
            
            print(f"✅ Questionnaire data synced for user {user_id}")
            return True
            
        except Exception as e:
            print(f"❌ Error syncing questionnaire: {e}")
            return False
    
    def get_dashboard_summary(self):
        """Get summary of all dashboard data for admin view"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get all questionnaire data
            cursor.execute('''
                SELECT user_id, account_type, package_value, updated_at
                FROM customer_service_data
                ORDER BY updated_at DESC
            ''')
            
            results = cursor.fetchall()
            conn.close()
            
            summary = {
                "total_users": len(results),
                "account_types": {},
                "recent_updates": [],
                "data_quality": {
                    "complete": 0,
                    "incomplete": 0
                }
            }
            
            for row in results:
                user_id, account_type, package_value, updated_at = row
                
                # Count account types
                if account_type not in summary["account_types"]:
                    summary["account_types"][account_type] = 0
                summary["account_types"][account_type] += 1
                
                # Check data quality
                if account_type and package_value:
                    summary["data_quality"]["complete"] += 1
                else:
                    summary["data_quality"]["incomplete"] += 1
                
                # Recent updates
                summary["recent_updates"].append({
                    "user_id": user_id,
                    "account_type": account_type,
                    "package_value": package_value,
                    "updated_at": updated_at
                })
            
            return summary
            
        except Exception as e:
            print(f"❌ Error getting dashboard summary: {e}")
            return None

def main():
    """Main function to test dashboard synchronization"""
    print("🔄 Dashboard Questionnaire Synchronization")
    print("=" * 50)
    
    sync = DashboardQuestionnaireSync()
    
    # Test user ID
    test_user_id = 1
    
    print(f"\n1. Testing dashboard data for user {test_user_id}")
    dashboard_data = sync.get_user_dashboard_data(test_user_id)
    
    if dashboard_data:
        print("✅ Dashboard data retrieved successfully")
        print(f"   Account Type: {dashboard_data.get('questionnaire', {}).get('account_type', 'N/A')}")
        print(f"   Package Value: {dashboard_data.get('questionnaire', {}).get('package_value', 'N/A')}")
        
        if dashboard_data.get('account_rules'):
            print(f"   Trading Hours: {dashboard_data['account_rules'].get('trading_hours', 'N/A')}")
            print(f"   Minimum Deposit: {dashboard_data['account_rules'].get('minimum_deposit', 'N/A')}")
    else:
        print("❌ Failed to retrieve dashboard data")
    
    print(f"\n2. Syncing questionnaire with dashboard for user {test_user_id}")
    sync_result = sync.sync_questionnaire_with_dashboard(test_user_id)
    
    if sync_result:
        print("✅ Questionnaire synced successfully")
    else:
        print("❌ Failed to sync questionnaire")
    
    print(f"\n3. Getting dashboard summary")
    summary = sync.get_dashboard_summary()
    
    if summary:
        print(f"   Total Users: {summary['total_users']}")
        print(f"   Account Types: {summary['account_types']}")
        print(f"   Complete Data: {summary['data_quality']['complete']}")
        print(f"   Incomplete Data: {summary['data_quality']['incomplete']}")
    
    print("\n🎯 Dashboard Integration Complete!")
    print("Next steps:")
    print("1. Update your frontend to call these endpoints")
    print("2. Ensure real-time sync between questionnaire and dashboard")
    print("3. Test the complete user flow")

if __name__ == "__main__":
    main()

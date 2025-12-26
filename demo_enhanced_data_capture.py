#!/usr/bin/env python3
"""
Enhanced Data Capture Demo
Demonstrates how the system captures data from payment-enhanced, questionnaire, and dashboard
"""

import json
import sqlite3
import time
from datetime import datetime

def show_database_structure():
    """Show the current database structure"""
    print("🗄️ Current Database Structure")
    print("=" * 50)
    
    conn = sqlite3.connect("trading_bots.db")
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    print("📋 Existing Tables:")
    for table in tables:
        table_name = table[0]
        if table_name == 'sqlite_sequence':
            continue
            
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"   • {table_name:<20} ({count} records)")
    
    conn.close()

def show_sample_data():
    """Show sample data from each table for a specific user"""
    print("\n📊 Sample Data Structure")
    print("=" * 50)
    
    conn = sqlite3.connect("trading_bots.db")
    cursor = conn.cursor()
    
    # Check if we have any users
    cursor.execute("SELECT email FROM users LIMIT 1")
    user_row = cursor.fetchone()
    
    if not user_row:
        print("ℹ️ No users found. Here's what data would look like:")
        show_sample_json_structures()
        conn.close()
        return
    
    user_email = user_row[0]
    print(f"👤 Showing data for user: {user_email}")
    
    # Show data from each enhanced table
    tables_and_descriptions = [
        ("payment_data", "💳 Payment Information"),
        ("questionnaire_data", "📋 Questionnaire Responses"), 
        ("dashboard_data", "📈 Dashboard/Trading State"),
        ("data_capture_audit", "🔍 Audit Trail")
    ]
    
    for table_name, description in tables_and_descriptions:
        print(f"\n{description}")
        print("-" * 30)
        
        try:
            cursor.execute(f"SELECT * FROM {table_name} WHERE user_email = ? LIMIT 1", (user_email,))
            columns = [desc[0] for desc in cursor.description]
            row = cursor.fetchone()
            
            if row:
                # Show key fields only for readability
                key_fields = get_key_fields_for_table(table_name)
                for field in key_fields:
                    if field in columns:
                        idx = columns.index(field)
                        value = row[idx]
                        # Truncate long values
                        if isinstance(value, str) and len(value) > 50:
                            value = value[:47] + "..."
                        print(f"   {field:<20}: {value}")
            else:
                print("   No data found")
        except sqlite3.OperationalError:
            print("   ⚠️ Table not created yet (run enhanced data capture system to create)")
    
    conn.close()

def get_key_fields_for_table(table_name):
    """Get key fields to display for each table"""
    field_mappings = {
        "payment_data": ["user_email", "plan_name", "final_price", "payment_method", "payment_status", "created_at"],
        "questionnaire_data": ["user_email", "prop_firm", "account_size", "risk_percentage", "trades_per_day", "created_at"],
        "dashboard_data": ["user_email", "current_equity", "total_pnl", "win_rate", "total_trades", "updated_at"],
        "data_capture_audit": ["user_email", "capture_type", "status", "timestamp"]
    }
    return field_mappings.get(table_name, ["user_email", "created_at"])

def show_sample_json_structures():
    """Show what the JSON data structures look like"""
    
    samples = {
        "Payment Data": {
            "user_email": "user@example.com",
            "plan_name": "Premium Plan", 
            "original_price": 99.99,
            "final_price": 89.99,
            "payment_method": "paypal",
            "payment_status": "completed",
            "transaction_id": "TXN-12345"
        },
        "Questionnaire Data": {
            "user_email": "user@example.com",
            "prop_firm": "FTMO",
            "account_size": 100000,
            "risk_percentage": 1.5,
            "trades_per_day": "1-5",
            "trading_session": "london",
            "crypto_assets": ["BTC/USD", "ETH/USD"],
            "forex_assets": ["EUR/USD", "GBP/USD"]
        },
        "Dashboard Data": {
            "user_email": "user@example.com",
            "current_equity": 102500.75,
            "total_pnl": 2500.75,
            "win_rate": 68.5,
            "total_trades": 25,
            "theme": "dark"
        }
    }
    
    for data_type, sample in samples.items():
        print(f"\n📝 {data_type}:")
        print(json.dumps(sample, indent=2))

def show_integration_benefits():
    """Show the benefits of the integration"""
    print("\n🎯 Integration Benefits")
    print("=" * 50)
    
    benefits = [
        "✅ Zero Code Changes: Existing signup-enhanced functionality unchanged",
        "✅ Comprehensive Capture: Payment, questionnaire, and dashboard data stored",
        "✅ Unified Database: All data in same trading_bots.db as signup-enhanced", 
        "✅ Automatic Integration: Frontend captures data automatically",
        "✅ Audit Trail: Complete logging of all data capture operations",
        "✅ User-Centric: All data linked by user email for easy retrieval",
        "✅ Production Ready: Health checks, error handling, retry logic",
        "✅ Privacy Compliant: IP tracking and audit trails for GDPR"
    ]
    
    for benefit in benefits:
        print(f"   {benefit}")

def show_api_usage_examples():
    """Show API usage examples"""
    print("\n🔌 API Usage Examples")
    print("=" * 50)
    
    examples = {
        "Capture Payment": """curl -X POST http://localhost:5003/api/data-capture/payment \\
  -H "Content-Type: application/json" \\
  -d '{
    "user_email": "user@example.com",
    "plan_name_payment": "Premium Plan",
    "final_price": 89.99,
    "payment_method": "paypal",
    "payment_status": "completed"
  }'""",
        
        "Capture Questionnaire": """curl -X POST http://localhost:5003/api/data-capture/questionnaire \\
  -H "Content-Type: application/json" \\
  -d '{
    "user_email": "user@example.com",
    "prop_firm": "FTMO",
    "account_size": 100000,
    "risk_percentage": 1.5
  }'""",
        
        "Get User Stats": """curl http://localhost:5003/api/data-capture/stats/user@example.com"""
    }
    
    for title, example in examples.items():
        print(f"\n📡 {title}:")
        print(f"```bash\n{example}\n```")

def show_data_flow():
    """Show how data flows through the system"""
    print("\n🔄 Data Flow Diagram")
    print("=" * 50)
    
    flow = """
1. User Signup (Existing - Unchanged)
   Frontend → Enhanced Signup Handler → users table
   
2. Payment Data Capture (New)
   Payment Form → Frontend Integration → Enhanced Data Capture → payment_data table
                                     → Original Supabase     → [existing flow]
                                     
3. Questionnaire Data Capture (New)  
   Questionnaire → Frontend Integration → Enhanced Data Capture → questionnaire_data table
                                       → Original Backend       → [existing flow]
                                       
4. Dashboard Data Capture (New)
   Dashboard → Frontend Integration → Enhanced Data Capture → dashboard_data table
                                   → Original Supabase     → [existing flow]
   
🔍 All operations logged in data_capture_audit table
📧 All data linked by user_email for easy retrieval
🛡️ IP address and user agent captured for security
    """
    
    print(flow)

def main():
    """Main demo function"""
    print("🚀 Enhanced Data Capture System Demo")
    print("🔗 Integration with Signup-Enhanced")
    print("=" * 70)
    
    print("\nℹ️ This system extends signup-enhanced to capture data from:")
    print("   • Payment-enhanced endpoint")
    print("   • Questionnaire endpoint") 
    print("   • Dashboard endpoint")
    print("   • All stored in the same trading_bots.db database")
    
    # Show current database structure
    show_database_structure()
    
    # Show sample data if available
    show_sample_data()
    
    # Show integration benefits
    show_integration_benefits()
    
    # Show data flow
    show_data_flow()
    
    # Show API examples
    show_api_usage_examples()
    
    print("\n" + "=" * 70)
    print("🎉 Enhanced Data Capture Integration Complete!")
    print("📚 See ENHANCED_DATA_CAPTURE_INTEGRATION.md for full documentation")
    print("🧪 Run 'python test_enhanced_data_capture.py' to test the system")
    print("🚀 Run 'python start_enhanced_data_capture.py' to start all services")
    print("=" * 70)

if __name__ == '__main__':
    main()

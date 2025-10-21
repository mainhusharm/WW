#!/usr/bin/env python3
"""
Check Database Contents
Shows exactly what data is stored in the PostgreSQL database
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv('database.env')

def check_database_contents():
    """Check what's actually in the database"""
    print("🔍 Checking Database Contents...")
    print("=" * 50)
    
    try:
        # Import the app's database configuration
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from journal import create_app, db
        from journal.models import User, UserProgress, RiskPlan
        
        # Create app without starting services
        app = create_app(start_services=False)
        
        with app.app_context():
            print("📊 USERS TABLE:")
            print("-" * 30)
            users = User.query.all()
            print(f"Total users: {len(users)}")
            
            for user in users:
                print(f"\n👤 User ID: {user.id}")
                print(f"   Username: {user.username}")
                print(f"   Email: {user.email}")
                print(f"   First Name: {user.first_name}")
                print(f"   Last Name: {user.last_name}")
                print(f"   Phone: {user.phone}")
                print(f"   Company: {user.company}")
                print(f"   Country: {user.country}")
                print(f"   Agree to Marketing: {user.agree_to_marketing}")
                print(f"   Created At: {user.created_at}")
                print(f"   Plan Type: {user.plan_type}")
            
            print("\n📊 USER_PROGRESS TABLE:")
            print("-" * 30)
            user_progress = UserProgress.query.all()
            print(f"Total user progress records: {len(user_progress)}")
            
            for progress in user_progress:
                print(f"\n📈 Progress ID: {progress.id}")
                print(f"   User ID: {progress.user_id}")
                print(f"   Questionnaire Answers: {progress.questionnaire_answers}")
                print(f"   Trading Data: {progress.trading_data}")
                print(f"   Created At: {progress.created_at}")
            
            print("\n📊 RISK_PLANS TABLE:")
            print("-" * 30)
            risk_plans = RiskPlan.query.all()
            print(f"Total risk plans: {len(risk_plans)}")
            
            for plan in risk_plans:
                print(f"\n🎯 Risk Plan ID: {plan.id}")
                print(f"   User ID: {plan.user_id}")
                print(f"   Prop Firm: {plan.prop_firm}")
                print(f"   Account Type: {plan.account_type}")
                print(f"   Account Size: {plan.account_size}")
                print(f"   Risk Percentage: {plan.risk_percentage}")
                print(f"   Created At: {plan.created_at}")
            
            print("\n" + "=" * 50)
            print("✅ Database check completed successfully!")
            
    except Exception as e:
        print(f"❌ Error checking database: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_database_contents()

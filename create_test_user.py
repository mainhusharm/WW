#!/usr/bin/env python3
"""
Create Test User Account for Dashboard Testing
This script creates a test user account with premium plan to test signal flow
"""

import os
import sys
from datetime import datetime
from werkzeug.security import generate_password_hash

# Add the journal directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'journal'))

from journal import create_app
from journal.extensions import db
from journal.models import User

def create_test_user():
    """Create a test user account for dashboard testing"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔄 Creating test user account...")
            
            # Test user credentials
            test_email = "testuser@example.com"
            test_password = "TestPassword123!"
            test_username = "Test User"
            
            # Check if test user already exists
            existing_user = User.query.filter_by(email=test_email).first()
            if existing_user:
                print(f"⚠️  Test user already exists with ID: {existing_user.unique_id}")
                print(f"   Email: {existing_user.email}")
                print(f"   Plan: {existing_user.plan_type}")
                print(f"   Created: {existing_user.created_at}")
                return existing_user
            
            # Create new test user
            hashed_password = generate_password_hash(test_password, method='pbkdf2:sha256')
            
            new_user = User(
                username=test_username,
                email=test_email,
                normalized_email=User.normalize_email(test_email),
                password_hash=hashed_password,
                plan_type='premium',  # Set to premium to allow login
                consent_accepted=True,
                consent_timestamp=datetime.utcnow()
            )
            
            db.session.add(new_user)
            db.session.commit()
            
            print("✅ Test user created successfully!")
            print("=" * 50)
            print("📋 TEST USER CREDENTIALS:")
            print(f"   Email: {test_email}")
            print(f"   Password: {test_password}")
            print(f"   User ID: {new_user.unique_id}")
            print(f"   Plan: {new_user.plan_type}")
            print(f"   Created: {new_user.created_at}")
            print("=" * 50)
            print("🔐 LOGIN INSTRUCTIONS:")
            print("1. Go to your application login page")
            print("2. Use the email and password above")
            print("3. Navigate to the Signals tab in the dashboard")
            print("4. Check if signals from admin are appearing")
            print("=" * 50)
            
            return new_user
            
        except Exception as e:
            print(f"❌ Error creating test user: {str(e)}")
            db.session.rollback()
            raise

def verify_test_user():
    """Verify test user can login and has proper permissions"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔍 Verifying test user...")
            
            test_user = User.query.filter_by(email="testuser@example.com").first()
            if not test_user:
                print("❌ Test user not found")
                return False
            
            # Check user properties
            print(f"✅ User found: {test_user.username}")
            print(f"   Email: {test_user.email}")
            print(f"   Plan: {test_user.plan_type}")
            print(f"   Unique ID: {test_user.unique_id}")
            print(f"   Consent: {test_user.consent_accepted}")
            
            # Verify plan allows login
            if test_user.plan_type == 'free':
                print("⚠️  Warning: User has 'free' plan - login may be restricted")
                print("   Consider upgrading to 'premium' or 'enterprise'")
            else:
                print("✅ User plan allows login")
            
            return True
            
        except Exception as e:
            print(f"❌ Error verifying test user: {str(e)}")
            return False

if __name__ == '__main__':
    print("🚀 Test User Creation Script")
    print("=" * 60)
    
    try:
        # Create test user
        user = create_test_user()
        print()
        
        # Verify test user
        verify_test_user()
        
        print("\n🎉 Test user setup completed!")
        print("\n📝 Next steps:")
        print("1. Start your Flask application")
        print("2. Login with the test credentials")
        print("3. Navigate to the user dashboard")
        print("4. Check the Signals tab for admin-generated signals")
        print("5. Run signal flow tests to verify delivery")
        
    except Exception as e:
        print(f"\n❌ Setup failed: {str(e)}")
        sys.exit(1)

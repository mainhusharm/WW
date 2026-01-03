#!/usr/bin/env python3
"""
Database Migration Script for Email Normalization
Run this script to apply email normalization to your existing database
"""

import os
import sys
from datetime import datetime

# Add the journal directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'journal'))

from journal import create_app
from journal.extensions import db
from journal.models import User

def normalize_email(email):
    """Normalize email to prevent duplicates"""
    if not email:
        return email
    
    email = email.lower().strip()
    
    if '@' not in email:
        return email
    
    local_part, domain = email.split('@', 1)
    
    if domain == 'gmail.com':
        local_part = local_part.replace('.', '')
        local_part = local_part.split('+')[0]
    
    return f"{local_part}@{domain}"

def migrate_email_normalization():
    """Migrate existing users to use normalized emails"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔄 Starting email normalization migration...")
            
            # Get all users
            users = User.query.all()
            print(f"📊 Found {len(users)} users to migrate")
            
            updated_count = 0
            for user in users:
                if user.email:
                    normalized = normalize_email(user.email)
                    if normalized != user.email:
                        user.normalized_email = normalized
                        updated_count += 1
                        print(f"✅ Normalized {user.email} -> {normalized}")
                    else:
                        user.normalized_email = user.email
            
            # Commit all changes
            db.session.commit()
            print(f"✅ Successfully migrated {updated_count} users")
            
            # Verify the migration
            print("\n🔍 Verifying migration...")
            total_users = User.query.count()
            users_with_normalized = User.query.filter(User.normalized_email.isnot(None)).count()
            
            print(f"📊 Total users: {total_users}")
            print(f"📊 Users with normalized emails: {users_with_normalized}")
            
            if total_users == users_with_normalized:
                print("✅ Migration completed successfully!")
            else:
                print("⚠️  Some users may not have normalized emails")
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    migrate_email_normalization()

#!/usr/bin/env python3
"""
Email Normalization Implementation Script
This script implements the one email - one account restriction by:
1. Adding normalized_email field to users table
2. Implementing email normalization logic
3. Updating the User model
4. Adding database constraints
"""

import os
import sys
import sqlite3
from datetime import datetime

# Add the journal directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'journal'))

def normalize_email(email):
    """
    Normalize email to prevent duplicates:
    - Convert to lowercase
    - Remove dots from Gmail addresses
    - Remove everything after + in Gmail addresses
    """
    if not email:
        return email
    
    email = email.lower().strip()
    
    # Split email into local and domain parts
    if '@' not in email:
        return email
    
    local_part, domain = email.split('@', 1)
    
    # Special handling for Gmail
    if domain == 'gmail.com':
        # Remove dots
        local_part = local_part.replace('.', '')
        # Remove everything after +
        local_part = local_part.split('+')[0]
    
    return f"{local_part}@{domain}"

def update_database_schema():
    """Update the database schema to add normalized_email field"""
    
    # Connect to the database
    db_path = 'instance/trading_journal.db'
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("🔄 Updating database schema...")
        
        # Check if normalized_email column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'normalized_email' not in columns:
            # Add normalized_email column
            cursor.execute("ALTER TABLE users ADD COLUMN normalized_email TEXT")
            print("✅ Added normalized_email column")
        else:
            print("ℹ️  normalized_email column already exists")
        
        # Create index for better performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_normalized_email ON users(normalized_email)")
        print("✅ Created index on normalized_email")
        
        # Update existing users with normalized emails
        cursor.execute("SELECT id, email FROM users")
        users = cursor.fetchall()
        
        updated_count = 0
        for user_id, email in users:
            if email:
                normalized = normalize_email(email)
                cursor.execute(
                    "UPDATE users SET normalized_email = ? WHERE id = ?",
                    (normalized, user_id)
                )
                updated_count += 1
        
        print(f"✅ Updated {updated_count} existing users with normalized emails")
        
        # Commit changes
        conn.commit()
        print("✅ Database schema updated successfully!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error updating database schema: {str(e)}")
        conn.rollback()
        return False
    finally:
        conn.close()

def update_user_model():
    """Update the User model to include email normalization"""
    
    models_file = 'journal/models.py'
    if not os.path.exists(models_file):
        print(f"Models file not found at {models_file}")
        return False
    
    try:
        print("🔄 Updating User model...")
        
        # Read the current models file
        with open(models_file, 'r') as f:
            content = f.read()
        
        # Check if normalized_email is already in the model
        if 'normalized_email' in content:
            print("ℹ️  User model already has normalized_email field")
            return True
        
        # Add normalized_email field to User model
        # Find the line with email field and add normalized_email after it
        lines = content.split('\n')
        new_lines = []
        
        for i, line in enumerate(lines):
            new_lines.append(line)
            if 'email = db.Column(db.String(120), unique=True, nullable=False, index=True)' in line:
                # Add normalized_email field after email
                new_lines.append('    normalized_email = db.Column(db.String(120), unique=True, nullable=False, index=True)')
        
        # Write the updated content back
        with open(models_file, 'w') as f:
            f.write('\n'.join(new_lines))
        
        print("✅ Updated User model with normalized_email field")
        return True
        
    except Exception as e:
        print(f"❌ Error updating User model: {str(e)}")
        return False

def update_auth_system():
    """Update the auth system to use email normalization"""
    
    auth_file = 'journal/auth.py'
    if not os.path.exists(auth_file):
        print(f"Auth file not found at {auth_file}")
        return False
    
    try:
        print("🔄 Updating auth system...")
        
        # Read the current auth file
        with open(auth_file, 'r') as f:
            content = f.read()
        
        # Check if email normalization is already implemented
        if 'normalize_email(' in content:
            print("ℹ️  Auth system already has email normalization")
            return True
        
        # Import the normalize_email function
        lines = content.split('\n')
        new_lines = []
        
        # Add normalize_email function after imports
        for i, line in enumerate(lines):
            new_lines.append(line)
            if 'from .schemas import RegisterSchema' in line:
                # Add normalize_email function
                new_lines.append('')
                new_lines.append('def normalize_email(email):')
                new_lines.append('    """')
                new_lines.append('    Normalize email to prevent duplicates:')
                new_lines.append('    - Convert to lowercase')
                new_lines.append('    - Remove dots from Gmail addresses')
                new_lines.append('    - Remove everything after + in Gmail addresses')
                new_lines.append('    """')
                new_lines.append('    if not email:')
                new_lines.append('        return email')
                new_lines.append('    ')
                new_lines.append('    email = email.lower().strip()')
                new_lines.append('    ')
                new_lines.append('    # Split email into local and domain parts')
                new_lines.append('    if \'@\' not in email:')
                new_lines.append('        return email')
                new_lines.append('    ')
                new_lines.append('    local_part, domain = email.split(\'@\', 1)')
                new_lines.append('    ')
                new_lines.append('    # Special handling for Gmail')
                new_lines.append('    if domain == \'gmail.com\':')
                new_lines.append('        # Remove dots')
                new_lines.append('        local_part = local_part.replace(\'.\', \'\')')
                new_lines.append('        # Remove everything after +')
                new_lines.append('        local_part = local_part.split(\'+\')[0]')
                new_lines.append('    ')
                new_lines.append('    return f"{local_part}@{domain}"')
                new_lines.append('')
                break
        
        # Update the registration logic to use normalized_email
        for i, line in enumerate(new_lines):
            if 'normalized_email = email.lower().strip()' in line:
                new_lines[i] = '    normalized_email = normalize_email(email)'
                break
        
        # Write the updated content back
        with open(auth_file, 'w') as f:
            f.write('\n'.join(new_lines))
        
        print("✅ Updated auth system with email normalization")
        return True
        
    except Exception as e:
        print(f"❌ Error updating auth system: {str(e)}")
        return False

def create_migration_script():
    """Create a migration script for the database"""
    
    migration_file = 'migrate_email_normalization.py'
    
    try:
        print("🔄 Creating migration script...")
        
        migration_content = '''#!/usr/bin/env python3
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
            print("\\n🔍 Verifying migration...")
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
'''
        
        with open(migration_file, 'w') as f:
            f.write(migration_content)
        
        print(f"✅ Created migration script: {migration_file}")
        return True
        
    except Exception as e:
        print(f"❌ Error creating migration script: {str(e)}")
        return False

def main():
    """Main function to implement email normalization"""
    
    print("🚀 Implementing Email Normalization and One Email - One Account Restriction")
    print("=" * 70)
    
    # Step 1: Update database schema
    if not update_database_schema():
        print("❌ Failed to update database schema")
        return False
    
    # Step 2: Update User model
    if not update_user_model():
        print("❌ Failed to update User model")
        return False
    
    # Step 3: Update auth system
    if not update_auth_system():
        print("❌ Failed to update auth system")
        return False
    
    # Step 4: Create migration script
    if not create_migration_script():
        print("❌ Failed to create migration script")
        return False
    
    print("\\n🎉 Email normalization implementation completed successfully!")
    print("\\n📝 Next steps:")
    print("1. Run the migration script: python migrate_email_normalization.py")
    print("2. Test user registration with different email formats")
    print("3. Verify that duplicate emails are blocked")
    
    return True

if __name__ == '__main__':
    main()

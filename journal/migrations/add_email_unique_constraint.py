"""
Migration script to add email uniqueness constraint and handle existing duplicates
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

def migrate_email_uniqueness():
    """Add email uniqueness constraint and handle existing duplicates"""
    
    # Database connection
    database_url = os.getenv('DATABASE_URL', 'sqlite:///journal.db')
    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Check if we're using SQLite or PostgreSQL
        if 'sqlite' in database_url.lower():
            # SQLite - check if unique constraint exists
            result = session.execute(text("""
                SELECT sql FROM sqlite_master 
                WHERE type='table' AND name='users'
            """)).fetchone()
            
            if result and 'UNIQUE(email)' not in result[0]:
                # Add unique constraint
                session.execute(text("""
                    CREATE UNIQUE INDEX idx_users_email_unique ON users(email)
                """))
                print("Added unique index on users.email for SQLite")
            
        else:
            # PostgreSQL - check if unique constraint exists
            result = session.execute(text("""
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'users' 
                AND constraint_type = 'UNIQUE' 
                AND constraint_name LIKE '%email%'
            """)).fetchone()
            
            if not result:
                # Add unique constraint
                session.execute(text("""
                    ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email)
                """))
                print("Added unique constraint on users.email for PostgreSQL")
        
        # Handle existing duplicates by keeping the most recent account
        print("Checking for existing email duplicates...")
        
        if 'sqlite' in database_url.lower():
            # SQLite - find duplicates
            duplicates = session.execute(text("""
                SELECT email, COUNT(*) as count, MAX(created_at) as latest_created
                FROM users 
                GROUP BY email 
                HAVING COUNT(*) > 1
            """)).fetchall()
        else:
            # PostgreSQL - find duplicates
            duplicates = session.execute(text("""
                SELECT email, COUNT(*) as count, MAX(created_at) as latest_created
                FROM users 
                GROUP BY email 
                HAVING COUNT(*) > 1
            """)).fetchall()
        
        if duplicates:
            print(f"Found {len(duplicates)} email addresses with duplicates")
            
            for duplicate in duplicates:
                email = duplicate[0]
                count = duplicate[1]
                latest_created = duplicate[2]
                
                print(f"Processing {email}: {count} accounts")
                
                # Keep the most recent account, flag others for review
                if 'sqlite' in database_url.lower():
                    session.execute(text("""
                        UPDATE users 
                        SET status = 'duplicate_flagged', 
                            updated_at = CURRENT_TIMESTAMP
                        WHERE email = :email 
                        AND created_at != :latest_created
                    """), {'email': email, 'latest_created': latest_created})
                else:
                    session.execute(text("""
                        UPDATE users 
                        SET status = 'duplicate_flagged', 
                            updated_at = CURRENT_TIMESTAMP
                        WHERE email = :email 
                        AND created_at != :latest_created
                    """), {'email': email, 'latest_created': latest_created})
                
                print(f"  - Kept 1 account, flagged {count-1} as duplicates")
        else:
            print("No email duplicates found")
        
        # Add status column if it doesn't exist
        if 'sqlite' in database_url.lower():
            # Check if status column exists
            result = session.execute(text("""
                PRAGMA table_info(users)
            """)).fetchall()
            
            columns = [col[1] for col in result]
            if 'status' not in columns:
                session.execute(text("""
                    ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'
                """))
                print("Added status column to users table")
        else:
            # PostgreSQL - check if status column exists
            result = session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'status'
            """)).fetchone()
            
            if not result:
                session.execute(text("""
                    ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'
                """))
                print("Added status column to users table")
        
        session.commit()
        print("Migration completed successfully")
        
    except Exception as e:
        session.rollback()
        print(f"Migration failed: {str(e)}")
        raise
    finally:
        session.close()

if __name__ == '__main__':
    migrate_email_uniqueness()

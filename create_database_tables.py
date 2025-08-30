#!/usr/bin/env python3
"""
Database Migration Script for Enhanced Features
Creates new tables for bot data, user signals, bot status, and OHLC data
"""

import os
import sys
from datetime import datetime

# Add the journal directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'journal'))

from journal import create_app
from journal.extensions import db
from journal.models import BotData, BotStatus, OHLCData, UserSignal

def create_database_tables():
    """Create all new database tables"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔄 Creating database tables...")
            
            # Create new tables
            db.create_all()
            
            print("✅ Database tables created successfully!")
            
            # Initialize bot status records
            print("🔄 Initializing bot status records...")
            
            # Check if bot status records exist
            crypto_bot = BotStatus.query.filter_by(bot_type='crypto').first()
            forex_bot = BotStatus.query.filter_by(bot_type='forex').first()
            
            if not crypto_bot:
                crypto_bot = BotStatus(
                    bot_type='crypto',
                    is_active=False,
                    status_updated_at=datetime.utcnow()
                )
                db.session.add(crypto_bot)
                print("✅ Created crypto bot status record")
            
            if not forex_bot:
                forex_bot = BotStatus(
                    bot_type='forex',
                    is_active=False,
                    status_updated_at=datetime.utcnow()
                )
                db.session.add(forex_bot)
                print("✅ Created forex bot status record")
            
            # Commit changes
            db.session.commit()
            print("✅ Bot status records initialized!")
            
            # Verify tables were created
            print("\n📊 Database Schema Summary:")
            print("=" * 50)
            
            # Get table names
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            
            for table in tables:
                if table in ['bot_data', 'bot_status', 'ohlc_data', 'user_signals', 'signal_feed']:
                    columns = inspector.get_columns(table)
                    print(f"\n{table}:")
                    for col in columns:
                        print(f"  - {col['name']}: {col['type']}")
            
            print("\n🎉 Database setup completed successfully!")
            print("\n📝 Next steps:")
            print("1. Start your Flask application")
            print("2. Access the Database Dashboard at /database")
            print("3. Use M-PIN: 231806 to authenticate")
            print("4. Configure bot status and monitor data")
            
        except Exception as e:
            print(f"❌ Error creating database tables: {str(e)}")
            db.session.rollback()
            raise

def verify_existing_tables():
    """Verify that existing tables have the new columns"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔍 Verifying existing table structure...")
            
            # Check if signal_feed table has is_recommended column
            inspector = db.inspect(db.engine)
            columns = inspector.get_columns('signal_feed')
            column_names = [col['name'] for col in columns]
            
            if 'is_recommended' not in column_names:
                print("⚠️  signal_feed table missing 'is_recommended' column")
                print("   Run database migration to add this column")
            else:
                print("✅ signal_feed table has 'is_recommended' column")
            
            # Check other required tables
            required_tables = ['bot_data', 'bot_status', 'ohlc_data', 'user_signals']
            for table in required_tables:
                if table in inspector.get_table_names():
                    print(f"✅ {table} table exists")
                else:
                    print(f"❌ {table} table missing")
            
        except Exception as e:
            print(f"❌ Error verifying tables: {str(e)}")

if __name__ == '__main__':
    print("🚀 Database Migration Script for Enhanced Features")
    print("=" * 60)
    
    try:
        # First verify existing structure
        verify_existing_tables()
        print()
        
        # Create new tables
        create_database_tables()
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        sys.exit(1)

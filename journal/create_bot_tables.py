#!/usr/bin/env python3
"""
Database initialization script for bot-related tables
"""

import os
import sys
from pathlib import Path

# Add the journal directory to the Python path
journal_dir = Path(__file__).parent
sys.path.insert(0, str(journal_dir))

from journal import create_app
from journal.extensions import db
from journal.models import BotStatus, BotData, OHLCData

def create_bot_tables():
    """Create bot-related database tables"""
    app = create_app()
    
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("✅ Database tables created successfully")
            
            # Initialize bot status records if they don't exist
            crypto_bot = BotStatus.query.filter_by(bot_type='crypto').first()
            if not crypto_bot:
                crypto_bot = BotStatus(
                    bot_type='crypto',
                    is_active=False,
                    updated_by='system'
                )
                db.session.add(crypto_bot)
                print("✅ Crypto bot status record created")
            
            forex_bot = BotStatus.query.filter_by(bot_type='forex').first()
            if not forex_bot:
                forex_bot = BotStatus(
                    bot_type='forex',
                    is_active=False,
                    updated_by='system'
                )
                db.session.add(forex_bot)
                print("✅ Forex bot status record created")
            
            db.session.commit()
            print("✅ Bot status records initialized")
            
            # Verify tables exist
            tables = db.engine.table_names()
            print(f"📊 Available tables: {', '.join(tables)}")
            
            # Check if bot tables exist
            required_tables = ['bot_status', 'bot_data', 'ohlc_data']
            for table in required_tables:
                if table in tables:
                    print(f"✅ Table '{table}' exists")
                else:
                    print(f"❌ Table '{table}' missing")
            
            print("\n🎉 Database initialization completed successfully!")
            
        except Exception as e:
            print(f"❌ Error creating tables: {str(e)}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    print("🚀 Initializing bot database tables...")
    create_bot_tables()

import os
import sys
from journal import create_app

try:
    # Use production config for deployment
    application = create_app('journal.config.ProductionConfig')
    
    # Create database tables if they don't exist
    with application.app_context():
        from journal.extensions import db
        db.create_all()
        print("Database tables created successfully")
        
except Exception as e:
    print(f"Error initializing application: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

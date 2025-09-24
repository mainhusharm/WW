import os
import logging
from sqlalchemy import text
from journal import create_app, db
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def main():
    """
    Drops and recreates the database tables to apply the latest schema.
    """
    # Load environment variables from .env.production
    env_path = os.path.join(os.path.dirname(__file__), '.env.production')
    if os.path.exists(env_path):
        load_dotenv(dotenv_path=env_path)
        logging.info(f"Loaded environment variables from {env_path}")
    else:
        logging.warning(f"Environment file not found at {env_path}")

    logging.info("Creating Flask app for database operations...")
    app = create_app(start_services=False)

    with app.app_context():
        logging.info("Dropping all tables...")
        try:
            db.drop_all()
            logging.info("✅ All tables dropped successfully.")
        except Exception as e:
            logging.error(f"❌ Error dropping tables: {e}")
            return

        logging.info("Recreating all database tables...")
        try:
            db.create_all()
            logging.info("✅ All tables recreated successfully based on current models.")
        except Exception as e:
            logging.error(f"❌ Error recreating tables: {e}")
            return

    logging.info("Database schema reset complete.")

if __name__ == "__main__":
    main()

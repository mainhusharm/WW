
import psycopg2
import psycopg2.extras
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database configuration 
DATABASE_CONFIG = {
    'host': 'dpg-d596prv5r7bs73938m2g-a.oregon-postgres.render.com',
    'database': 'pghero_dpg_d37pd8nfte5s73bfl1ug_a_y6fl',
    'user': 'pghero_dpg_d37pd8nfte5s73bfl1ug_a_y6fl_user',
    'password': 'hyVL0yZEuw6EyIOKXs4nS5nTFmR1Sg5j',
    'port': 5432,
    'sslmode': 'require'
}

def get_user_by_email(email_address):
    """
    Connects to the database and retrieves a specific user by email.
    """
    logger.info(f"Attempting to find user with email: {email_address}")
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        logger.info("Database connection successful.")

        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
            # Use a parameterized query to prevent SQL injection
            query = "SELECT * FROM users WHERE email = %s;"
            logger.info(f"Executing query: {query}")
            cursor.execute(query, (email_address,))
            
            user = cursor.fetchone()

        conn.close()
        logger.info("Database connection closed.")
        
        return user

    except psycopg2.OperationalError as e:
        logger.error(f"Connection Error: Could not connect to the database. Details: {e}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}")
        return None

if __name__ == "__main__":
    target_email = "traderredgepro@gmail.com"
    logger.info(f"Running script to extract data for user: {target_email}")
    user_data = get_user_by_email(target_email)
    
    if user_data:
        logger.info("Successfully retrieved user data.")
        # Pretty-print the dictionary using json for nice formatting
        print(json.dumps(dict(user_data), indent=4, default=str))
    elif user_data is not None:
         logger.info(f"Query successful, but no user found with the email: {target_email}")
    else:
        logger.error("Failed to retrieve user data.")

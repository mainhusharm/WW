import os
import psycopg2

def create_tables():
    """Create tables in the PostgreSQL database."""
    conn = None
    try:
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cur = conn.cursor()
        with open('setup_signal_tables.sql', 'r') as f:
            cur.execute(f.read())
        conn.commit()
        cur.close()
        print("Tables created successfully.")
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    finally:
        if conn is not None:
            conn.close()

if __name__ == '__main__':
    create_tables()

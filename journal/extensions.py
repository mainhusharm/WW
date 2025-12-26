from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from supabase import create_client, Client
import os

db = SQLAlchemy()
socketio = SocketIO()

# Supabase client (primary database)
supabase: Client = None

def init_supabase():
    """Initialize Supabase client"""
    global supabase
    try:
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_ANON_KEY')

        if supabase_url and supabase_key:
            supabase = create_client(supabase_url, supabase_key)
            print("✅ Supabase client initialized successfully")
        else:
            print("⚠️ Supabase credentials not found - running with PostgreSQL only")
            supabase = None
    except Exception as e:
        print(f"❌ Failed to initialize Supabase: {e}")
        supabase = None

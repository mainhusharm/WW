
import os

class Config:
    """Application configuration class"""

    # Database Configuration
    SQLALCHEMY_DATABASE_URI = "postgresql://pghero_dpg_d37pd8nfte5s73bfl1ug_a_y6fl_user:hyVL0yZEuw6EyIOKXs4nS5nTFmR1Sg5j@dpg-d596prv5r7bs73938m2g-a.oregon-postgres.render.com/pghero_dpg_d37pd8nfte5s73bfl1ug_a_y6fl"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Dual Database Configuration
    DUAL_DB_SYNC_ENABLED = False
    SUPABASE_PRIMARY = False
    POSTGRES_BACKUP = False
    
    # JWT & Security Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-change-in-production')

class ProductionConfig(Config):
    """Production configuration class"""
    FLASK_DEBUG = False

# Create global config instance
config = Config()

# Export configuration
__all__ = ['Config', 'ProductionConfig', 'config']

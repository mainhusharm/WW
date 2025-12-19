import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env files
def load_environment():
    """Load environment variables from .env files"""
    # Get the project root directory
    project_root = Path(__file__).parent.parent
    
    # Try to load .env.local first (development)
    env_local = project_root / '.env.local'
    if env_local.exists():
        load_dotenv(env_local)
        print(f"Loaded environment from: {env_local}")
    
    # Try to load .env.production (production)
    env_production = project_root / '.env.production'
    if env_production.exists():
        load_dotenv(env_production)
        print(f"Loaded environment from: {env_production}")
    
    # Try to load .env (fallback)
    env_file = project_root / '.env'
    if env_file.exists():
        load_dotenv(env_file)
        print(f"Loaded environment from: {env_file}")
    
    # Load from system environment variables as fallback
    load_dotenv(override=True)

# Load environment variables
load_environment()

class Config:
    """Application configuration class"""
    
    # Database Configuration
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///instance/trading_bot.db')
    SQLALCHEMY_DATABASE_URI = os.getenv('SQLALCHEMY_DATABASE_URI', DATABASE_URL)
    DATABASE_PATH = os.getenv('DATABASE_PATH', './instance/trading_bot.db')
    
    # JWT & Security Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-change-in-production')
    VALID_API_KEYS = os.getenv('VALID_API_KEYS', 'dev_key_1,dev_key_2,dev_key_3').split(',')
    
    # Stripe Payment Configuration
    STRIPE_PUBLISHABLE_KEY = os.getenv('STRIPE_PUBLISHABLE_KEY', '')
    STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '')
    STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', '')
    
    # PayPal Payment Configuration
    PAYPAL_CLIENT_ID = os.getenv('PAYPAL_CLIENT_ID', '')
    PAYPAL_CLIENT_SECRET = os.getenv('PAYPAL_CLIENT_SECRET', '')
    PAYPAL_ENVIRONMENT = os.getenv('PAYPAL_ENVIRONMENT', 'sandbox')
    
    # AI Coach Configuration
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    
    # Backend Configuration
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001,http://localhost:3005').split(',')
    
    # Trading Service Configuration
    BINANCE_API_KEY = os.getenv('BINANCE_API_KEY', '')
    BINANCE_SECRET_KEY = os.getenv('BINANCE_SECRET_KEY', '')
    
    # Logging & Monitoring
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = os.getenv('LOG_FORMAT', '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS = int(os.getenv('RATE_LIMIT_REQUESTS', '200'))
    RATE_LIMIT_WINDOW = int(os.getenv('RATE_LIMIT_WINDOW', '60000'))
    
    # API Timeouts
    API_TIMEOUT = int(os.getenv('API_TIMEOUT', '10000'))
    API_RETRY_ATTEMPTS = int(os.getenv('API_RETRY_ATTEMPTS', '3'))
    API_RETRY_DELAY = int(os.getenv('API_RETRY_DELAY', '1000'))
    
    # Customer Service
    CS_DB_CONNECTION = os.getenv('CS_DB_CONNECTION', '')
    
    # Environment Flags
    NODE_ENV = os.getenv('NODE_ENV', 'development')
    
    @classmethod
    def is_production(cls):
        """Check if running in production mode"""
        return not cls.FLASK_DEBUG
    
    @classmethod
    def is_development(cls):
        """Check if running in development mode"""
        return cls.FLASK_DEBUG
    
    @classmethod
    def has_payment_keys(cls):
        """Check if payment API keys are configured"""
        return bool(
            cls.STRIPE_SECRET_KEY and 
            cls.PAYPAL_CLIENT_ID and 
            cls.PAYPAL_CLIENT_SECRET
        )
    
    @classmethod
    def has_ai_coach_key(cls):
        """Check if AI coach API key is configured"""
        return bool(cls.GEMINI_API_KEY)
    
    @classmethod
    def get_payment_status(cls):
        """Get payment system status"""
        return {
            'stripe': bool(cls.STRIPE_SECRET_KEY),
            'paypal': bool(cls.PAYPAL_CLIENT_ID and cls.PAYPAL_CLIENT_SECRET),
            'ai_coach': bool(cls.GEMINI_API_KEY),
            'overall': cls.has_payment_keys() and cls.has_ai_coach_key()
        }

class ProductionConfig(Config):
    """Production configuration class"""
    FLASK_DEBUG = False
    
    # Override database URL from environment
    DATABASE_URL = os.getenv('DATABASE_URL', Config.DATABASE_URL)
    SQLALCHEMY_DATABASE_URI = os.getenv('SQLALCHEMY_DATABASE_URI', DATABASE_URL)
    
    # Override other production settings from environment
    SECRET_KEY = os.getenv('SECRET_KEY', Config.SECRET_KEY)
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', Config.JWT_SECRET_KEY)

# Create global config instance
config = Config()

# Export configuration
__all__ = ['Config', 'ProductionConfig', 'config']

from flask import Flask, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
import os
from datetime import datetime, timedelta
import hashlib
import hmac

# Rate limiting configuration
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

def init_security(app: Flask):
    """Initialize security features for the Flask app"""
    
    # Initialize rate limiter
    limiter.init_app(app)
    
    # Configure CORS for production
    if app.config.get('ENV') == 'production':
        allowed_origins = [
            'https://www.traderedgepro.com',
            'https://traderedgepro.com',
            'https://main.d2at8owu9hshr.amplifyapp.com'
        ]
        
        CORS(app, 
             origins=allowed_origins,
             methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
             supports_credentials=True,
             max_age=3600)
    else:
        # Development CORS - more permissive
        CORS(app, origins="*")
    
    # Security headers middleware
    @app.after_request
    def add_security_headers(response):
        # Security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        # Content Security Policy
        csp_policy = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.paypal.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://api.stripe.com https://api.paypal.com https://generativelanguage.googleapis.com; "
            "frame-src https://js.stripe.com https://www.paypal.com; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self';"
        )
        response.headers['Content-Security-Policy'] = csp_policy
        
        return response
    
    # Rate limiting for sensitive endpoints
    @app.before_request
    def check_rate_limits():
        # Apply stricter rate limiting to payment endpoints
        if request.path.startswith('/api/payment'):
            # Check if user is authenticated
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Apply payment-specific rate limits
            if request.method == 'POST':
                # Limit payment attempts to 10 per hour per user
                user_id = get_user_id_from_token(auth_header)
                if user_id:
                    key = f"payment:{user_id}"
                    if limiter.limiter.is_allowed(key, 10, timedelta(hours=1)):
                        return None
                    else:
                        return jsonify({'error': 'Too many payment attempts. Please try again later.'}), 429
        
        return None

def get_user_id_from_token(auth_header: str) -> str:
    """Extract user ID from JWT token"""
    try:
        # Remove 'Bearer ' prefix
        token = auth_header.replace('Bearer ', '')
        
        # In production, you'd verify the JWT token here
        # For now, return a hash of the token as user identifier
        return hashlib.sha256(token.encode()).hexdigest()[:16]
    except:
        return None

# Specific rate limit decorators
def payment_rate_limit():
    """Rate limit decorator for payment endpoints"""
    def decorator(f):
        @limiter.limit("10 per hour")
        def wrapped(*args, **kwargs):
            return f(*args, **kwargs)
        return wrapped
    return decorator

def auth_rate_limit():
    """Rate limit decorator for authentication endpoints"""
    def decorator(f):
        @limiter.limit("5 per hour")
        def wrapped(*args, **kwargs):
            return f(*args, **kwargs)
        return wrapped
    return decorator

def api_rate_limit():
    """Rate limit decorator for general API endpoints"""
    def decorator(f):
        @limiter.limit("100 per hour")
        def wrapped(*args, **kwargs):
            return f(*args, **kwargs)
        return wrapped
    return decorator

# Security utilities
def validate_input(data: dict, required_fields: list, optional_fields: list = None) -> tuple[bool, str]:
    """Validate input data for security"""
    try:
        # Check required fields
        for field in required_fields:
            if field not in data or data[field] is None:
                return False, f"Missing required field: {field}"
        
        # Check for potentially dangerous content
        for field, value in data.items():
            if isinstance(value, str):
                # Check for SQL injection attempts
                dangerous_patterns = [
                    "';", "--", "/*", "*/", "xp_", "sp_", 
                    "UNION", "SELECT", "INSERT", "UPDATE", "DELETE", "DROP"
                ]
                
                for pattern in dangerous_patterns:
                    if pattern.lower() in value.lower():
                        return False, f"Potentially dangerous content detected in field: {field}"
                
                # Check for XSS attempts
                xss_patterns = [
                    "<script", "javascript:", "onload=", "onerror=", "onclick="
                ]
                
                for pattern in xss_patterns:
                    if pattern.lower() in value.lower():
                        return False, f"Potentially dangerous content detected in field: {field}"
        
        return True, "Validation passed"
        
    except Exception as e:
        return False, f"Validation error: {str(e)}"

def sanitize_input(data: dict) -> dict:
    """Sanitize input data"""
    sanitized = {}
    
    for key, value in data.items():
        if isinstance(value, str):
            # Remove potentially dangerous characters
            sanitized_value = value.replace("'", "''").replace('"', '""')
            sanitized_value = sanitized_value.replace('<', '&lt;').replace('>', '&gt;')
            sanitized[key] = sanitized_value
        else:
            sanitized[key] = value
    
    return sanitized

def generate_csrf_token() -> str:
    """Generate CSRF token"""
    import secrets
    return secrets.token_hex(32)

def verify_csrf_token(token: str, stored_token: str) -> bool:
    """Verify CSRF token"""
    return hmac.compare_digest(token, stored_token)

# Security middleware for specific routes
def require_https():
    """Middleware to require HTTPS in production"""
    def decorator(f):
        def wrapped(*args, **kwargs):
            if request.headers.get('X-Forwarded-Proto') == 'https':
                return f(*args, **kwargs)
            elif request.is_secure:
                return f(*args, **kwargs)
            else:
                return jsonify({'error': 'HTTPS required'}), 403
        return wrapped
    return decorator

def validate_api_key():
    """Middleware to validate API key"""
    def decorator(f):
        def wrapped(*args, **kwargs):
            api_key = request.headers.get('X-API-Key')
            if not api_key:
                return jsonify({'error': 'API key required'}), 401
            
            # In production, validate against stored API keys
            valid_keys = os.environ.get('VALID_API_KEYS', '').split(',')
            if api_key not in valid_keys:
                return jsonify({'error': 'Invalid API key'}), 401
            
            return f(*args, **kwargs)
        return wrapped
    return decorator

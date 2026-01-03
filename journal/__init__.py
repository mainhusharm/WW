
from flask import Flask, request, make_response
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from .extensions import db, socketio
from .config import ProductionConfig

def create_app(config_object=ProductionConfig):
    app = Flask(__name__)
    app.config.from_object(config_object)

    # Initialize extensions
    db.init_app(app)
    JWTManager(app)
    
    # More specific CORS configuration
    CORS(app, 
         resources={r"/api/*": { 
             "origins": ["https://www.traderedgepro.com", "http://localhost:3000", "http://127.0.0.1:5173"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True
         }})
         
    socketio.init_app(app, cors_allowed_origins=["https://www.traderedgepro.com", "http://localhost:3000", "http://127.0.0.1:5173"])

    # Register blueprints
    from .auth import auth_bp
    from .user_routes import user_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/user')

    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()

    return app

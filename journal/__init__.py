from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .extensions import db, socketio
from .routes import trades_bp, risk_plan_bp, plan_generation_bp
from .auth import auth_bp
from .user_routes import user_bp
from .admin_auth import admin_auth_bp
from .telegram_routes import telegram_bp
from .account_routes import account_bp
from .signals_routes import signals_bp
from .payment_routes import payment_bp
from .crypto_payment_routes import crypto_payment_bp
from .database_routes import database_bp
from .yfinance_routes import yfinance_bp
from .landing_routes import landing_bp
from .bot_routes import bot_bp
import os
import sys
from dotenv import load_dotenv

def create_app(config_object='journal.config.ProductionConfig'):
    load_dotenv()
    app = Flask(__name__, static_folder='../dist', static_url_path='')
    
    # Determine config based on environment
    flask_env = os.getenv('FLASK_ENV', 'production')
    if flask_env == 'development':
        config_object = 'journal.config.DevelopmentConfig'
    else:
        config_object = 'journal.config.ProductionConfig'
    
    try:
        app.config.from_object(config_object)
    except ImportError as e:
        print(f"Warning: Configuration object '{config_object}' not found. Using fallback config.")
        # Fallback configuration
        app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'fallback_secret_key')
        app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'fallback_jwt_secret')
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Set DATABASE_URL with fallback
    db_url = os.environ.get('DATABASE_URL') or app.config.get('SQLALCHEMY_DATABASE_URI')
    if not db_url:
        # Create fallback SQLite database
        instance_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', 'instance')
        os.makedirs(instance_dir, exist_ok=True)
        db_url = f"sqlite:///{os.path.join(instance_dir, 'fallback.db')}"
        print("Warning: Using fallback SQLite database")
    
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    print(f"Database URL configured: {db_url[:50]}...")

    # Initialize extensions with comprehensive CORS
    db.init_app(app)
    jwt = JWTManager(app)
    CORS(app, 
         origins=["*"], 
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
         supports_credentials=True,
         expose_headers=["Content-Type", "Authorization"],
         max_age=3600)
    socketio.init_app(app, cors_allowed_origins="*")

    # Add comprehensive CORS preflight handler for all routes
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = jsonify({"status": "ok"})
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,X-Requested-With,Accept,Origin")
            response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS,PATCH")
            response.headers.add('Access-Control-Max-Age', "3600")
            return response, 200
    
    # Add after_request handler for all responses
    @app.after_request
    def after_request(response):
        # Allow requests from any origin in development, but restrict in production
        allowed_origins = [
            'http://localhost:5173',  # Local development
            'https://main.d2at8owu9hshr.amplifyapp.com',  # Amplify domain
            'https://traderedgepro.com'  # Production domain
        ]
        
        origin = request.headers.get('Origin')
        if origin in allowed_origins:
            response.headers.add('Access-Control-Allow-Origin', origin)
        
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
        
        # Handle preflight requests
        if request.method == 'OPTIONS':
            response.status_code = 200
        return response
    
    # Handle 405 Method Not Allowed errors - REMOVE THIS TO AVOID CONFLICTS
    # @app.errorhandler(405)
    # def method_not_allowed(e):
    #     response = jsonify({
    #         "error": "Method Not Allowed",
    #         "message": "The method is not allowed for the requested URL.",
    #         "allowed_methods": list(e.valid_methods) if hasattr(e, 'valid_methods') else []
    #     })
    #     response.headers.add("Access-Control-Allow-Origin", "*")
    #     response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,X-Requested-With")
    #     response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
    #     return response, 405

    # Add a debug route to check registered routes
    @app.route('/debug/routes')
    def list_routes():
        from urllib import parse
        output = []
        for rule in app.url_map.iter_rules():
            methods = ','.join(rule.methods or [])
            line = parse.unquote("{:50s} {:20s} {}".format(rule.endpoint, methods, rule))
            output.append(line)
        return '<br>'.join(sorted(output))

    # Health check endpoint for Render
    @app.route('/healthz')
    def health_check():
        try:
            # Check database connection
            from sqlalchemy import text
            db.session.execute(text('SELECT 1'))
            return jsonify({
                'status': 'healthy',
                'database': 'connected',
                'timestamp': datetime.utcnow().isoformat()
            }), 200
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'database': 'disconnected',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }), 500

    # Register blueprints - AUTH FIRST to ensure it's properly registered
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_auth_bp, url_prefix='/api/admin')
    app.register_blueprint(trades_bp, url_prefix='/api')
    app.register_blueprint(risk_plan_bp, url_prefix='/api')
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(telegram_bp, url_prefix='/api/telegram')
    app.register_blueprint(plan_generation_bp, url_prefix='/api')
    app.register_blueprint(account_bp, url_prefix='/api/accounts')
    app.register_blueprint(signals_bp, url_prefix='/api')
    app.register_blueprint(payment_bp, url_prefix='/api/payment')
    app.register_blueprint(crypto_payment_bp, url_prefix='/api/crypto-payment')
    app.register_blueprint(database_bp, url_prefix='/api')
    app.register_blueprint(yfinance_bp, url_prefix='/api')
    app.register_blueprint(landing_bp, url_prefix='/api')
    app.register_blueprint(bot_bp, url_prefix='/api')
    
    # Log registered routes for debugging
    print("Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.endpoint}: {rule.rule} [{','.join(rule.methods or [])}]")

    # Move catch-all route to the very end, after all blueprints
    @app.route('/', defaults={'path': ''}, methods=['GET'])
    @app.route('/<path:path>', methods=['GET'])
    def serve(path):
        # Only handle non-API routes for static files and SPA routing
        if path.startswith('api'):
            # Let Flask handle API routes through blueprints
            from flask import abort
            abort(404)
        
        # Handle static files
        if path != "" and os.path.exists(os.path.join(app.static_folder or '', path)):
            return send_from_directory(app.static_folder or '', path)
        else:
            # For SPA routing, always serve index.html for non-API routes
            try:
                return send_from_directory(app.static_folder or '', 'index.html')
            except Exception:
                # Fallback HTML if index.html doesn't exist
                return '''
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Trading Journal</title>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        .loading-container { text-align: center; padding: 50px; }
                    </style>
                </head>
                <body>
                    <div id="root">
                        <div class="loading-container">
                            <h1>Trading Journal</h1>
                            <p>Application is loading...</p>
                        </div>
                    </div>
                    <script>
                        if (window.location.pathname.startsWith('/admin')) {
                            window.location.hash = '#/admin';
                        }
                    </script>
                </body>
                </html>
                '''

    # Start bot service in background
    try:
        from .bot_service import start_bot_service
        start_bot_service()
        print("Bot service started successfully")
    except Exception as e:
        print(f"Failed to start bot service: {str(e)}")

    # Database tables are created via create_db.py

    @app.errorhandler(Exception)
    def handle_exception(e):
        """Return JSON instead of HTML for any other server error."""
        import traceback
        print(f"Application error: {str(e)}")
        traceback.print_exc()
        response = { "msg": "An unexpected error occurred. Please try again.", "error": str(e) }
        return jsonify(response), 500

    return app

def create_production_app():
    return create_app('journal.config.ProductionConfig')

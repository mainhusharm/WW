"""
Journal Application Factory
Updated to include real-time signal system components and enhanced database routes
"""

import os
from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO
import logging
from .extensions import db, socketio

# Initialize extensions
jwt = JWTManager()

def create_app(config_object='journal.config.ProductionConfig', start_services=True):
    """Create Flask application with all extensions and blueprints"""
    
    app = Flask(__name__)
    app.config.from_object(config_object)
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    
    # Simple CORS configuration - no duplicates
    CORS(app, 
         origins=["*"], 
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
         supports_credentials=False,
         max_age=3600)
    
    socketio.init_app(app, cors_allowed_origins="*")
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Register existing blueprints
    from journal.auth import auth_bp
    from journal.user_routes import user_bp
    from journal.admin_auth import admin_auth_bp
    from journal.admin_signals_api import admin_signals_bp
    from journal.user_signals_api import user_signals_bp
    from journal.dashboard_routes import dashboard_bp
    from journal.signal_feed_routes import signal_feed_bp
    from journal.payment_routes import payment_bp
    from journal.api_routes import api_bp
    from journal.simple_api_routes import simple_api_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(admin_auth_bp, url_prefix='/api/admin')
    app.register_blueprint(admin_signals_bp, url_prefix='/api')
    app.register_blueprint(user_signals_bp, url_prefix='/api')
    app.register_blueprint(dashboard_bp, url_prefix='/api')
    app.register_blueprint(signal_feed_bp, url_prefix='/api')
    app.register_blueprint(payment_bp, url_prefix='/api')
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(simple_api_bp, url_prefix='/api')
    
    # Register enhanced database routes
    try:
        from journal.enhanced_user_routes import enhanced_user_bp
        app.register_blueprint(enhanced_user_bp, url_prefix='/api')
        logging.info("Enhanced database routes registered successfully")
    except ImportError as e:
        logging.warning(f"Enhanced routes not available: {e}")
    
    # Add test routes
    @app.route('/test')
    def test_page():
        return '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Backend Test Page</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .test { margin: 20px 0; padding: 15px; border: 1px solid #ccc; border-radius: 5px; }
                .success { background: #d4edda; border-color: #c3e6cb; }
                .error { background: #f8d7da; border-color: #f5c6cb; }
                button { padding: 10px 20px; margin: 5px; cursor: pointer; }
                pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
            </style>
        </head>
        <body>
            <h1>🔧 Backend Test Page</h1>
            <p>This page is served by the Flask backend, so CORS should work perfectly.</p>

            <div class="test">
                <h3>Test Registration</h3>
                <button onclick="testRegistration()">Test Registration</button>
                <div id="result"></div>
            </div>

            <script>
                async function testRegistration() {
                    const resultDiv = document.getElementById('result');
                    resultDiv.innerHTML = 'Testing...';
                    
                    const userData = {
                        firstName: "Backend",
                        lastName: "Test",
                        email: `backend_test_${Date.now()}@example.com`,
                        password: "test123",
                        phone: "1234567890",
                        company: "Test Company",
                        country: "US",
                        terms: true,
                        newsletter: false
                    };

                    try {
                        const response = await fetch('/api/user/register', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(userData)
                        });
                        
                        const data = await response.json();
                        resultDiv.innerHTML = `<pre>${response.ok ? '✅' : '❌'} Registration ${response.ok ? 'Success' : 'Failed'}:\\nStatus: ${response.status}\\nResponse: ${JSON.stringify(data, null, 2)}</pre>`;
                        resultDiv.className = response.ok ? 'success' : 'error';
                    } catch (error) {
                        resultDiv.innerHTML = `<pre>❌ Registration Error:\\n${error.message}</pre>`;
                        resultDiv.className = 'error';
                    }
                }
            </script>
        </body>
        </html>
        '''
    
    # Serve static HTML files with proper CORS
    @app.route('/signup-enhanced')
    def serve_signup_enhanced():
        try:
            with open('signup-enhanced.html', 'r') as f:
                content = f.read()
                # Update API_BASE_URL to use relative path (same origin)
                content = content.replace('http://localhost:8080/api', '/api')
                return content
        except FileNotFoundError:
            return "File not found", 404
    
    @app.route('/questionnaire')
    def serve_questionnaire():
        try:
            with open('questionnaire.html', 'r') as f:
                content = f.read()
                # Update API_BASE_URL to use relative path (same origin)
                content = content.replace('http://localhost:8080/api', '/api')
                return content
        except FileNotFoundError:
            return "File not found", 404
    
    @app.route('/payment')
    def serve_payment():
        try:
            with open('payment.html', 'r') as f:
                content = f.read()
                # Update API_BASE_URL to use relative path (same origin)
                content = content.replace('http://localhost:8080/api', '/api')
                return content
        except FileNotFoundError:
            return "File not found", 404
    
    @app.route('/working-signup')
    def serve_working_signup():
        try:
            with open('simple_working_form.html', 'r') as f:
                content = f.read()
                # Update API_BASE_URL to use relative path (same origin)
                content = content.replace('http://localhost:8080/api', '/api')
                content = content.replace('http://localhost:8080/health', '/health')
                return content
        except FileNotFoundError:
            return "File not found", 404
    
    @app.route('/frontend_working_form.html')
    def serve_frontend_working_form():
        try:
            with open('frontend_working_form.html', 'r') as f:
                return f.read()
        except FileNotFoundError:
            return "File not found", 404
    
    @app.route('/quick_data_test')
    def serve_quick_data_test():
        try:
            with open('quick_data_test.html', 'r') as f:
                return f.read()
        except FileNotFoundError:
            return "File not found", 404
    
    @app.route('/working_data_flow_test')
    def serve_working_data_flow_test():
        try:
            with open('working_data_flow_test.html', 'r') as f:
                return f.read()
        except FileNotFoundError:
            return "File not found", 404
    
    if start_services:
        # Initialize signal broadcaster
        from journal.signal_broadcaster import start_signal_broadcaster
        start_signal_broadcaster(socketio)
        
        # Create database tables (optional for development)
        with app.app_context():
            try:
                db.create_all()
                logging.info("Database tables created successfully")
            except Exception as e:
                logging.warning(f"Database connection failed: {e}")
                logging.warning("App will run without database - some features may be limited")
            
            # Initialize signal system within app context
            from journal.signal_system import start_signal_system
            start_signal_system()
    
    return app

def create_socketio_app(app):
    """Create Socket.IO application"""
    return socketio

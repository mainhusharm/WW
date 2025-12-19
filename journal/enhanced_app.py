from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from datetime import timedelta

# Import the enhanced routes
from enhanced_user_routes import enhanced_user_bp

def create_enhanced_app():
    """Create Flask app with enhanced database routes"""
    app = Flask(__name__)
    
    # Configuration
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    
    # Initialize extensions
    jwt = JWTManager(app)
    
    # Configure CORS for production
    CORS(app, origins=[
        "https://www.traderedgepro.com",
        "https://traderedgepro.com", 
        "http://localhost:3000",
        "http://localhost:5000"
    ])
    
    # Register enhanced blueprints
    app.register_blueprint(enhanced_user_bp, url_prefix='/api')
    
    # Root health check
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'message': 'TraderEdgePro Enhanced API',
            'status': 'running',
            'version': '2.0.0',
            'endpoints': {
                'register': '/api/enhanced/register',
                'payment': '/api/enhanced/payment', 
                'questionnaire': '/api/enhanced/questionnaire',
                'dashboard': '/api/enhanced/dashboard-data',
                'health': '/api/enhanced/health'
            }
        })
    
    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'msg': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'msg': 'Invalid token'}), 401
    
    return app

if __name__ == '__main__':
    app = create_enhanced_app()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

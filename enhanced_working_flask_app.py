#!/usr/bin/env python3
"""
Enhanced Working Flask App - Updated to use the enhanced database routes
This integrates the enhanced database routes with proper CORS for the new forms
"""

from flask import Flask, jsonify
from flask_cors import CORS
import os

# Import the enhanced working database routes
from enhanced_working_database_routes import enhanced_working_db_bp

def create_enhanced_working_app():
    """Create Flask app with enhanced working database routes"""
    app = Flask(__name__)
    
    # Configure CORS - allow all origins for development
    CORS(app, origins=["*"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Enhanced CORS configuration for production compatibility
    @app.after_request
    def after_request(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With,Accept,Origin'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    # Handle preflight requests
    @app.before_request
    def handle_preflight():
        from flask import request
        if request.method == "OPTIONS":
            response = app.make_response("")
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With,Accept,Origin'
            response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
            response.headers['Access-Control-Max-Age'] = '3600'
            return response, 200
    
    # Register enhanced working database blueprint
    app.register_blueprint(enhanced_working_db_bp, url_prefix='/api')
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'message': 'TraderEdge Pro Enhanced Database API',
            'status': 'running',
            'version': 'enhanced-2.0.0',
            'method': 'enhanced PostgreSQL integration',
            'endpoints': {
                'health': '/api/working/health',
                'register': '/api/working/register',
                'payment': '/api/working/payment', 
                'questionnaire': '/api/working/questionnaire',
                'dashboard': '/api/working/dashboard-data'
            },
            'features': [
                'Enhanced signup form support',
                'Cryptomus payment integration', 
                'Advanced questionnaire with prop firms',
                'Complete user profile management',
                'PostgreSQL with JSONB support'
            ]
        })
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({
            'status': 'healthy',
            'service': 'enhanced-traderedge-api',
            'database': 'postgresql',
            'timestamp': '2025-09-21T18:39:51+05:30'
        })
    
    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Endpoint not found',
            'available_endpoints': [
                '/api/working/health',
                '/api/working/register',
                '/api/working/payment',
                '/api/working/questionnaire',
                '/api/working/dashboard-data'
            ]
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'error': 'Internal server error',
            'message': 'Please check server logs for details'
        }), 500
    
    return app

if __name__ == '__main__':
    app = create_enhanced_working_app()
    port = int(os.environ.get('PORT', 5000))
    
    print("🚀 Starting Enhanced TraderEdge Pro Database API")
    print(f"   Port: {port}")
    print(f"   Method: Enhanced PostgreSQL integration")
    print(f"   Health: http://localhost:{port}/api/working/health")
    print(f"   Features: Enhanced forms, Cryptomus payments, Advanced questionnaire")
    
    app.run(host='0.0.0.0', port=port, debug=True)

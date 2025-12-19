#!/usr/bin/env python3
"""
Working Flask App - Using the exact method from database done copy
This integrates the working database routes with proper CORS
"""

from flask import Flask, jsonify
from flask_cors import CORS
import os

# Import the working database routes
from working_database_routes import working_db_bp

def create_working_app():
    """Create Flask app with working database routes"""
    app = Flask(__name__)
    
    # Configure CORS - exactly like the working version
    CORS(app, origins=["*"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Simple CORS configuration - exact method from working version
    @app.after_request
    def after_request(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With,Accept,Origin'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
        return response

    # Handle preflight requests - exact method from working version
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
    
    # Register working database blueprint
    app.register_blueprint(working_db_bp, url_prefix='/api')
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'message': 'TraderEdgePro Working Database API',
            'status': 'running',
            'version': 'working-1.0.0',
            'method': 'extracted from database done copy',
            'endpoints': {
                'health': '/api/working/health',
                'register': '/api/working/register',
                'payment': '/api/working/payment', 
                'questionnaire': '/api/working/questionnaire',
                'dashboard': '/api/working/dashboard-data'
            }
        })
    
    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

if __name__ == '__main__':
    app = create_working_app()
    port = int(os.environ.get('PORT', 5000))
    
    print("🚀 Starting Working Database Flask App")
    print(f"   Port: {port}")
    print(f"   Method: Extracted from database done copy")
    print(f"   Health: http://localhost:{port}/api/working/health")
    
    app.run(host='0.0.0.0', port=port, debug=True)

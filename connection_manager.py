#!/usr/bin/env python3
"""
Backend-Frontend Connection Manager
Manages the connection between backend and frontend with comprehensive error handling
"""

import os
import sys
import logging
import traceback
import time
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Callable
from flask import Flask, request, jsonify, g, session
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from functools import wraps
import json
import uuid
import hashlib
from contextlib import contextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages backend-frontend connections with error handling and monitoring"""
    
    def __init__(self):
        self.active_connections = {}
        self.connection_history = []
        self.error_counts = {}
        self.health_status = {
            'backend': 'unknown',
            'frontend': 'unknown',
            'database': 'unknown',
            'last_check': None
        }
        self.setup_connection_monitoring()
    
    def setup_connection_monitoring(self):
        """Setup connection monitoring and health checks"""
        self.monitoring_thread = threading.Thread(target=self._monitor_connections, daemon=True)
        self.monitoring_thread.start()
    
    def _monitor_connections(self):
        """Background thread to monitor connection health"""
        while True:
            try:
                self._check_connection_health()
                time.sleep(30)  # Check every 30 seconds
            except Exception as e:
                logger.error(f"Connection monitoring error: {e}")
                time.sleep(60)  # Wait longer on error
    
    def _check_connection_health(self):
        """Check the health of all connections"""
        current_time = datetime.utcnow()
        
        # Check backend health
        try:
            # Simulate backend health check
            self.health_status['backend'] = 'healthy'
        except Exception as e:
            self.health_status['backend'] = 'unhealthy'
            logger.error(f"Backend health check failed: {e}")
        
        # Check frontend connections
        active_frontend_connections = len([conn for conn in self.active_connections.values() 
                                         if conn.get('type') == 'frontend'])
        if active_frontend_connections > 0:
            self.health_status['frontend'] = 'connected'
        else:
            self.health_status['frontend'] = 'disconnected'
        
        self.health_status['last_check'] = current_time.isoformat()
    
    def register_connection(self, connection_id: str, connection_type: str, 
                          metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """Register a new connection"""
        connection_data = {
            'id': connection_id,
            'type': connection_type,
            'metadata': metadata or {},
            'connected_at': datetime.utcnow().isoformat(),
            'last_activity': datetime.utcnow().isoformat(),
            'error_count': 0,
            'status': 'active'
        }
        
        self.active_connections[connection_id] = connection_data
        self.connection_history.append(connection_data.copy())
        
        logger.info(f"Connection registered: {connection_id} ({connection_type})")
        return connection_data
    
    def update_connection_activity(self, connection_id: str):
        """Update connection activity timestamp"""
        if connection_id in self.active_connections:
            self.active_connections[connection_id]['last_activity'] = datetime.utcnow().isoformat()
    
    def record_connection_error(self, connection_id: str, error: Exception, context: str = ""):
        """Record an error for a specific connection"""
        if connection_id in self.active_connections:
            self.active_connections[connection_id]['error_count'] += 1
            self.active_connections[connection_id]['last_error'] = {
                'message': str(error),
                'type': type(error).__name__,
                'context': context,
                'timestamp': datetime.utcnow().isoformat()
            }
        
        # Update global error counts
        error_type = type(error).__name__
        self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1
        
        logger.error(f"Connection error recorded for {connection_id}: {error}")
    
    def get_connection_status(self, connection_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific connection"""
        return self.active_connections.get(connection_id)
    
    def get_all_connections(self) -> Dict[str, Any]:
        """Get all active connections"""
        return {
            'active_connections': self.active_connections,
            'connection_count': len(self.active_connections),
            'error_counts': self.error_counts,
            'health_status': self.health_status
        }
    
    def cleanup_stale_connections(self, timeout_minutes: int = 30):
        """Remove stale connections"""
        cutoff_time = datetime.utcnow() - timedelta(minutes=timeout_minutes)
        stale_connections = []
        
        for conn_id, conn_data in self.active_connections.items():
            last_activity = datetime.fromisoformat(conn_data['last_activity'])
            if last_activity < cutoff_time:
                stale_connections.append(conn_id)
        
        for conn_id in stale_connections:
            del self.active_connections[conn_id]
            logger.info(f"Removed stale connection: {conn_id}")
        
        return len(stale_connections)

# Global connection manager instance
connection_manager = ConnectionManager()

def connection_required(connection_type: str = 'frontend'):
    """Decorator to require an active connection"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            connection_id = request.headers.get('X-Connection-ID')
            if not connection_id:
                return jsonify({
                    'error': 'Connection required',
                    'message': 'X-Connection-ID header is required',
                    'timestamp': datetime.utcnow().isoformat()
                }), 400
            
            connection_status = connection_manager.get_connection_status(connection_id)
            if not connection_status:
                return jsonify({
                    'error': 'Invalid connection',
                    'message': 'Connection not found or expired',
                    'timestamp': datetime.utcnow().isoformat()
                }), 401
            
            if connection_status['type'] != connection_type:
                return jsonify({
                    'error': 'Invalid connection type',
                    'message': f'Expected {connection_type} connection',
                    'timestamp': datetime.utcnow().isoformat()
                }), 400
            
            # Update connection activity
            connection_manager.update_connection_activity(connection_id)
            
            try:
                return func(*args, **kwargs)
            except Exception as e:
                connection_manager.record_connection_error(connection_id, e, func.__name__)
                raise
        
        return wrapper
    return decorator

def create_connection_app():
    """Create Flask app with connection management"""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    
    # Enhanced CORS configuration
    CORS(app, 
         origins=["*"], 
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With", "X-Connection-ID"],
         supports_credentials=True,
         max_age=3600)
    
    # Initialize SocketIO for real-time communication
    socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)
    
    # Connection establishment endpoint
    @app.route('/api/connect', methods=['POST'])
    def establish_connection():
        """Establish a new connection between frontend and backend"""
        try:
            data = request.get_json() or {}
            connection_type = data.get('type', 'frontend')
            metadata = data.get('metadata', {})
            
            # Generate unique connection ID
            connection_id = str(uuid.uuid4())
            
            # Register connection
            connection_data = connection_manager.register_connection(
                connection_id, connection_type, metadata
            )
            
            logger.info(f"New connection established: {connection_id}")
            
            return jsonify({
                'success': True,
                'connection_id': connection_id,
                'connection_data': connection_data,
                'message': 'Connection established successfully',
                'timestamp': datetime.utcnow().isoformat()
            }), 201
            
        except Exception as e:
            logger.error(f"Connection establishment failed: {e}")
            return jsonify({
                'error': 'Connection failed',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }), 500
    
    # Connection status endpoint
    @app.route('/api/connection/status', methods=['GET'])
    def get_connection_status():
        """Get connection status and health information"""
        try:
            connection_id = request.headers.get('X-Connection-ID')
            
            if connection_id:
                # Get specific connection status
                status = connection_manager.get_connection_status(connection_id)
                if not status:
                    return jsonify({
                        'error': 'Connection not found',
                        'timestamp': datetime.utcnow().isoformat()
                    }), 404
                
                return jsonify({
                    'success': True,
                    'connection_status': status,
                    'timestamp': datetime.utcnow().isoformat()
                }), 200
            else:
                # Get all connections status
                all_connections = connection_manager.get_all_connections()
                return jsonify({
                    'success': True,
                    'connections': all_connections,
                    'timestamp': datetime.utcnow().isoformat()
                }), 200
                
        except Exception as e:
            logger.error(f"Connection status check failed: {e}")
            return jsonify({
                'error': 'Status check failed',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }), 500
    
    # Health check endpoint with connection info
    @app.route('/health', methods=['GET'])
    def health_check():
        """Comprehensive health check including connection status"""
        try:
            all_connections = connection_manager.get_all_connections()
            
            return jsonify({
                'status': 'healthy',
                'service': 'connection-manager',
                'version': '2.0.0',
                'timestamp': datetime.utcnow().isoformat(),
                'connections': {
                    'active_count': all_connections['connection_count'],
                    'health_status': all_connections['health_status'],
                    'error_counts': all_connections['error_counts']
                },
                'uptime': time.time()
            }), 200
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return jsonify({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }), 500
    
    # Protected endpoint example
    @app.route('/api/protected', methods=['GET'])
    @connection_required('frontend')
    def protected_endpoint():
        """Example of a protected endpoint that requires a connection"""
        connection_id = request.headers.get('X-Connection-ID')
        connection_status = connection_manager.get_connection_status(connection_id)
        
        return jsonify({
            'success': True,
            'message': 'Access granted to protected endpoint',
            'connection_id': connection_id,
            'connection_info': connection_status,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    
    # Error handling endpoints
    @app.route('/api/error/test', methods=['POST'])
    def test_error_handling():
        """Test error handling with different error types"""
        try:
            data = request.get_json() or {}
            error_type = data.get('error_type', 'generic')
            connection_id = request.headers.get('X-Connection-ID')
            
            if error_type == 'keyerror':
                raise KeyError('Test KeyError')
            elif error_type == 'valueerror':
                raise ValueError('Test ValueError')
            elif error_type == 'typeerror':
                raise TypeError('Test TypeError')
            elif error_type == 'connectionerror':
                raise ConnectionError('Test ConnectionError')
            else:
                raise Exception('Test Generic Error')
                
        except Exception as e:
            if connection_id:
                connection_manager.record_connection_error(connection_id, e, 'test_error_handling')
            
            return jsonify({
                'error': 'Test error triggered',
                'error_type': type(e).__name__,
                'message': str(e),
                'connection_id': connection_id,
                'timestamp': datetime.utcnow().isoformat()
            }), 400
    
    # SocketIO events for real-time communication
    @socketio.on('connect')
    def handle_connect():
        """Handle SocketIO connection"""
        connection_id = str(uuid.uuid4())
        connection_data = connection_manager.register_connection(
            connection_id, 'socketio', {'socket_id': request.sid}
        )
        
        join_room(connection_id)
        emit('connection_established', {
            'connection_id': connection_id,
            'message': 'SocketIO connection established'
        })
        
        logger.info(f"SocketIO connection established: {connection_id}")
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle SocketIO disconnection"""
        # Find connection by socket ID
        for conn_id, conn_data in connection_manager.active_connections.items():
            if conn_data.get('metadata', {}).get('socket_id') == request.sid:
                del connection_manager.active_connections[conn_id]
                logger.info(f"SocketIO connection closed: {conn_id}")
                break
    
    @socketio.on('ping')
    def handle_ping():
        """Handle ping from frontend"""
        emit('pong', {'timestamp': datetime.utcnow().isoformat()})
    
    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Not found',
            'message': 'The requested endpoint was not found',
            'timestamp': datetime.utcnow().isoformat()
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred on the server',
            'timestamp': datetime.utcnow().isoformat()
        }), 500
    
    return app, socketio

if __name__ == '__main__':
    app, socketio = create_connection_app()
    
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"🚀 Starting connection manager on port {port}")
    logger.info(f"🔧 Debug mode: {debug}")
    logger.info("✅ Backend-frontend connection management ready")
    
    socketio.run(app, host='0.0.0.0', port=port, debug=debug)

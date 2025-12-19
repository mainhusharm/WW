#!/usr/bin/env python3
"""
Comprehensive Error Handling Middleware
Provides centralized error handling for both backend and frontend
"""

import os
import sys
import logging
import traceback
import time
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Callable, Union
from flask import Flask, request, jsonify, g, session, Response
from flask_cors import CORS
from functools import wraps
import uuid
import hashlib
from contextlib import contextmanager
from collections import defaultdict, deque
import threading

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ErrorMetrics:
    """Track error metrics and patterns"""
    
    def __init__(self, max_history: int = 1000):
        self.error_counts = defaultdict(int)
        self.error_history = deque(maxlen=max_history)
        self.error_patterns = defaultdict(int)
        self.recovery_attempts = defaultdict(int)
        self.last_error_time = {}
        self.error_rate_window = 300  # 5 minutes
        self.error_rate_threshold = 10  # errors per window
    
    def record_error(self, error_type: str, error_message: str, context: str = "", 
                    severity: str = "medium", user_id: str = None):
        """Record an error with metadata"""
        error_record = {
            'id': str(uuid.uuid4()),
            'type': error_type,
            'message': error_message,
            'context': context,
            'severity': severity,
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat(),
            'request_id': getattr(g, 'request_id', None),
            'ip_address': request.remote_addr if request else None,
            'user_agent': request.headers.get('User-Agent') if request else None
        }
        
        self.error_counts[error_type] += 1
        self.error_history.append(error_record)
        self.last_error_time[error_type] = datetime.utcnow()
        
        # Track error patterns
        pattern_key = f"{error_type}:{context}"
        self.error_patterns[pattern_key] += 1
        
        logger.error(f"Error recorded: {error_type} - {error_message}")
        return error_record
    
    def get_error_rate(self, error_type: str = None) -> float:
        """Get error rate for a specific type or overall"""
        cutoff_time = datetime.utcnow() - timedelta(seconds=self.error_rate_window)
        
        if error_type:
            recent_errors = [e for e in self.error_history 
                           if e['type'] == error_type and 
                           datetime.fromisoformat(e['timestamp']) > cutoff_time]
        else:
            recent_errors = [e for e in self.error_history 
                           if datetime.fromisoformat(e['timestamp']) > cutoff_time]
        
        return len(recent_errors) / (self.error_rate_window / 60)  # errors per minute
    
    def is_error_rate_high(self, error_type: str = None) -> bool:
        """Check if error rate is above threshold"""
        return self.get_error_rate(error_type) > self.error_rate_threshold
    
    def get_error_summary(self) -> Dict[str, Any]:
        """Get summary of error metrics"""
        return {
            'total_errors': len(self.error_history),
            'error_counts': dict(self.error_counts),
            'error_patterns': dict(self.error_patterns),
            'recent_error_rate': self.get_error_rate(),
            'high_error_rate': self.is_error_rate_high(),
            'last_errors': list(self.error_history)[-10:] if self.error_history else []
        }

class ErrorRecovery:
    """Handle error recovery and mitigation strategies"""
    
    def __init__(self):
        self.recovery_strategies = {}
        self.circuit_breakers = {}
        self.setup_default_strategies()
    
    def setup_default_strategies(self):
        """Setup default error recovery strategies"""
        self.recovery_strategies = {
            'ConnectionError': self._handle_connection_error,
            'TimeoutError': self._handle_timeout_error,
            'ValueError': self._handle_value_error,
            'KeyError': self._handle_key_error,
            'TypeError': self._handle_type_error,
            'PermissionError': self._handle_permission_error,
            'FileNotFoundError': self._handle_file_not_found,
            'DatabaseError': self._handle_database_error
        }
    
    def _handle_connection_error(self, error: Exception, context: str = "") -> Dict[str, Any]:
        """Handle connection errors with retry logic"""
        return {
            'recovery_action': 'retry',
            'retry_after': 5,
            'max_retries': 3,
            'fallback_action': 'use_cached_data',
            'message': 'Connection error detected, attempting recovery'
        }
    
    def _handle_timeout_error(self, error: Exception, context: str = "") -> Dict[str, Any]:
        """Handle timeout errors"""
        return {
            'recovery_action': 'extend_timeout',
            'timeout_extension': 30,
            'fallback_action': 'return_partial_data',
            'message': 'Timeout error detected, extending timeout'
        }
    
    def _handle_value_error(self, error: Exception, context: str = "") -> Dict[str, Any]:
        """Handle value errors with validation"""
        return {
            'recovery_action': 'validate_input',
            'validation_rules': ['required', 'format', 'range'],
            'fallback_action': 'use_default_value',
            'message': 'Value error detected, validating input'
        }
    
    def _handle_key_error(self, error: Exception, context: str = "") -> Dict[str, Any]:
        """Handle key errors"""
        return {
            'recovery_action': 'check_keys',
            'fallback_action': 'use_default_keys',
            'message': 'Key error detected, checking available keys'
        }
    
    def _handle_type_error(self, error: Exception, context: str = "") -> Dict[str, Any]:
        """Handle type errors"""
        return {
            'recovery_action': 'type_conversion',
            'fallback_action': 'use_default_type',
            'message': 'Type error detected, attempting type conversion'
        }
    
    def _handle_permission_error(self, error: Exception, context: str = "") -> Dict[str, Any]:
        """Handle permission errors"""
        return {
            'recovery_action': 'check_permissions',
            'fallback_action': 'request_elevation',
            'message': 'Permission error detected, checking permissions'
        }
    
    def _handle_file_not_found(self, error: Exception, context: str = "") -> Dict[str, Any]:
        """Handle file not found errors"""
        return {
            'recovery_action': 'create_file',
            'fallback_action': 'use_template',
            'message': 'File not found, attempting to create or use template'
        }
    
    def _handle_database_error(self, error: Exception, context: str = "") -> Dict[str, Any]:
        """Handle database errors"""
        return {
            'recovery_action': 'reconnect',
            'retry_after': 10,
            'max_retries': 2,
            'fallback_action': 'use_readonly_mode',
            'message': 'Database error detected, attempting reconnection'
        }
    
    def get_recovery_strategy(self, error: Exception, context: str = "") -> Dict[str, Any]:
        """Get recovery strategy for an error"""
        error_type = type(error).__name__
        strategy_func = self.recovery_strategies.get(error_type)
        
        if strategy_func:
            return strategy_func(error, context)
        else:
            return {
                'recovery_action': 'log_and_continue',
                'fallback_action': 'return_error_response',
                'message': f'Unknown error type: {error_type}'
            }

class ErrorHandlingMiddleware:
    """Comprehensive error handling middleware"""
    
    def __init__(self, app: Flask = None):
        self.app = app
        self.error_metrics = ErrorMetrics()
        self.error_recovery = ErrorRecovery()
        self.error_handlers = {}
        self.setup_default_handlers()
        
        if app:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        """Initialize the middleware with Flask app"""
        self.app = app
        
        # Register error handlers
        app.register_error_handler(400, self.handle_bad_request)
        app.register_error_handler(401, self.handle_unauthorized)
        app.register_error_handler(403, self.handle_forbidden)
        app.register_error_handler(404, self.handle_not_found)
        app.register_error_handler(405, self.handle_method_not_allowed)
        app.register_error_handler(500, self.handle_internal_error)
        app.register_error_handler(Exception, self.handle_generic_error)
        
        # Add before request handler
        app.before_request(self.before_request)
        
        # Add after request handler
        app.after_request(self.after_request)
    
    def setup_default_handlers(self):
        """Setup default error handlers"""
        self.error_handlers = {
            'KeyError': self._handle_key_error,
            'ValueError': self._handle_value_error,
            'TypeError': self._handle_type_error,
            'ConnectionError': self._handle_connection_error,
            'TimeoutError': self._handle_timeout_error,
            'PermissionError': self._handle_permission_error,
            'FileNotFoundError': self._handle_file_not_found,
            'DatabaseError': self._handle_database_error
        }
    
    def before_request(self):
        """Before request handler"""
        g.request_id = str(uuid.uuid4())
        g.start_time = time.time()
        g.error_count = 0
    
    def after_request(self, response: Response) -> Response:
        """After request handler"""
        if hasattr(g, 'start_time'):
            g.request_duration = time.time() - g.start_time
        
        # Add request ID to response headers
        if hasattr(g, 'request_id'):
            response.headers['X-Request-ID'] = g.request_id
        
        return response
    
    def handle_bad_request(self, error):
        """Handle 400 Bad Request errors"""
        return self._create_error_response(
            'Bad Request',
            'The request was invalid or cannot be served',
            400,
            str(error)
        )
    
    def handle_unauthorized(self, error):
        """Handle 401 Unauthorized errors"""
        return self._create_error_response(
            'Unauthorized',
            'Authentication is required to access this resource',
            401,
            str(error)
        )
    
    def handle_forbidden(self, error):
        """Handle 403 Forbidden errors"""
        return self._create_error_response(
            'Forbidden',
            'You do not have permission to access this resource',
            403,
            str(error)
        )
    
    def handle_not_found(self, error):
        """Handle 404 Not Found errors"""
        return self._create_error_response(
            'Not Found',
            'The requested resource was not found',
            404,
            str(error)
        )
    
    def handle_method_not_allowed(self, error):
        """Handle 405 Method Not Allowed errors"""
        return self._create_error_response(
            'Method Not Allowed',
            'The HTTP method is not allowed for this endpoint',
            405,
            str(error)
        )
    
    def handle_internal_error(self, error):
        """Handle 500 Internal Server Error"""
        return self._create_error_response(
            'Internal Server Error',
            'An unexpected error occurred on the server',
            500,
            str(error)
        )
    
    def handle_generic_error(self, error):
        """Handle generic exceptions"""
        error_type = type(error).__name__
        handler = self.error_handlers.get(error_type)
        
        if handler:
            return handler(error)
        else:
            return self._create_error_response(
                'Internal Server Error',
                'An unexpected error occurred',
                500,
                str(error)
            )
    
    def _handle_key_error(self, error: KeyError):
        """Handle KeyError"""
        self.error_metrics.record_error('KeyError', str(error), 'key_error_handler')
        recovery = self.error_recovery.get_recovery_strategy(error, 'key_error_handler')
        
        return self._create_error_response(
            'Missing Required Data',
            f'Required field "{error.args[0] if error.args else "unknown"}" is missing',
            400,
            str(error),
            recovery
        )
    
    def _handle_value_error(self, error: ValueError):
        """Handle ValueError"""
        self.error_metrics.record_error('ValueError', str(error), 'value_error_handler')
        recovery = self.error_recovery.get_recovery_strategy(error, 'value_error_handler')
        
        return self._create_error_response(
            'Invalid Data',
            str(error),
            400,
            str(error),
            recovery
        )
    
    def _handle_type_error(self, error: TypeError):
        """Handle TypeError"""
        self.error_metrics.record_error('TypeError', str(error), 'type_error_handler')
        recovery = self.error_recovery.get_recovery_strategy(error, 'type_error_handler')
        
        return self._create_error_response(
            'Type Mismatch',
            f'Invalid data type: {str(error)}',
            400,
            str(error),
            recovery
        )
    
    def _handle_connection_error(self, error: ConnectionError):
        """Handle ConnectionError"""
        self.error_metrics.record_error('ConnectionError', str(error), 'connection_error_handler')
        recovery = self.error_recovery.get_recovery_strategy(error, 'connection_error_handler')
        
        return self._create_error_response(
            'Connection Failed',
            'Unable to connect to the service. Please try again later.',
            503,
            str(error),
            recovery
        )
    
    def _handle_timeout_error(self, error: TimeoutError):
        """Handle TimeoutError"""
        self.error_metrics.record_error('TimeoutError', str(error), 'timeout_error_handler')
        recovery = self.error_recovery.get_recovery_strategy(error, 'timeout_error_handler')
        
        return self._create_error_response(
            'Request Timeout',
            'The request took too long to process. Please try again.',
            408,
            str(error),
            recovery
        )
    
    def _handle_permission_error(self, error: PermissionError):
        """Handle PermissionError"""
        self.error_metrics.record_error('PermissionError', str(error), 'permission_error_handler')
        recovery = self.error_recovery.get_recovery_strategy(error, 'permission_error_handler')
        
        return self._create_error_response(
            'Permission Denied',
            'You do not have permission to perform this action',
            403,
            str(error),
            recovery
        )
    
    def _handle_file_not_found(self, error: FileNotFoundError):
        """Handle FileNotFoundError"""
        self.error_metrics.record_error('FileNotFoundError', str(error), 'file_not_found_handler')
        recovery = self.error_recovery.get_recovery_strategy(error, 'file_not_found_handler')
        
        return self._create_error_response(
            'File Not Found',
            'The requested file was not found',
            404,
            str(error),
            recovery
        )
    
    def _handle_database_error(self, error: Exception):
        """Handle DatabaseError"""
        self.error_metrics.record_error('DatabaseError', str(error), 'database_error_handler')
        recovery = self.error_recovery.get_recovery_strategy(error, 'database_error_handler')
        
        return self._create_error_response(
            'Database Error',
            'A database error occurred. Please try again later.',
            500,
            str(error),
            recovery
        )
    
    def _create_error_response(self, error_type: str, message: str, status_code: int, 
                             details: str = "", recovery: Dict[str, Any] = None) -> tuple:
        """Create standardized error response"""
        error_response = {
            'error': error_type,
            'message': message,
            'status_code': status_code,
            'timestamp': datetime.utcnow().isoformat(),
            'request_id': getattr(g, 'request_id', None)
        }
        
        if details:
            error_response['details'] = details
        
        if recovery:
            error_response['recovery'] = recovery
        
        # Add error metrics if available
        if hasattr(g, 'error_count'):
            error_response['error_count'] = g.error_count
        
        return jsonify(error_response), status_code
    
    def get_error_metrics(self) -> Dict[str, Any]:
        """Get error metrics summary"""
        return self.error_metrics.get_error_summary()
    
    def register_error_handler(self, error_type: str, handler: Callable):
        """Register custom error handler"""
        self.error_handlers[error_type] = handler
    
    def error_handler_decorator(self, error_types: List[str] = None):
        """Decorator for handling specific errors in routes"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    error_type = type(e).__name__
                    
                    if error_types and error_type not in error_types:
                        raise
                    
                    if hasattr(g, 'error_count'):
                        g.error_count += 1
                    
                    self.error_metrics.record_error(
                        error_type, 
                        str(e), 
                        func.__name__,
                        user_id=getattr(g, 'user_id', None)
                    )
                    
                    handler = self.error_handlers.get(error_type)
                    if handler:
                        return handler(e)
                    else:
                        return self._create_error_response(
                            'Internal Server Error',
                            'An unexpected error occurred',
                            500,
                            str(e)
                        )
            
            return wrapper
        return decorator

def create_middleware_app():
    """Create Flask app with comprehensive error handling middleware"""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    
    # Initialize CORS
    CORS(app, origins=["*"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Initialize error handling middleware
    error_middleware = ErrorHandlingMiddleware(app)
    
    # Test endpoints
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({
            'status': 'healthy',
            'service': 'error-handling-middleware',
            'version': '2.0.0',
            'timestamp': datetime.utcnow().isoformat(),
            'error_metrics': error_middleware.get_error_metrics()
        }), 200
    
    @app.route('/api/error/test', methods=['POST'])
    @error_middleware.error_handler_decorator(['KeyError', 'ValueError', 'TypeError'])
    def test_error_handling():
        """Test error handling with different error types"""
        data = request.get_json() or {}
        error_type = data.get('error_type', 'generic')
        
        if error_type == 'keyerror':
            raise KeyError('Test KeyError')
        elif error_type == 'valueerror':
            raise ValueError('Test ValueError')
        elif error_type == 'typeerror':
            raise TypeError('Test TypeError')
        elif error_type == 'connectionerror':
            raise ConnectionError('Test ConnectionError')
        elif error_type == 'timeouterror':
            raise TimeoutError('Test TimeoutError')
        else:
            raise Exception('Test Generic Error')
    
    @app.route('/api/error/metrics', methods=['GET'])
    def get_error_metrics():
        """Get error metrics"""
        return jsonify({
            'success': True,
            'metrics': error_middleware.get_error_metrics(),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    
    return app, error_middleware

if __name__ == '__main__':
    app, error_middleware = create_middleware_app()
    
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"🚀 Starting error handling middleware on port {port}")
    logger.info(f"🔧 Debug mode: {debug}")
    logger.info("✅ Comprehensive error handling ready")
    
    app.run(host='0.0.0.0', port=port, debug=debug)

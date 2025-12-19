#!/usr/bin/env python3
"""
Comprehensive Backend Logging Configuration
Provides detailed logging for Flask backend and API server
"""

import os
import sys
import logging
import json
import time
from datetime import datetime
from functools import wraps
from typing import Dict, Any, Optional
import traceback

class BackendLogger:
    """Enhanced logging system for backend services"""
    
    def __init__(self, service_name: str = "backend", log_level: str = "INFO"):
        self.service_name = service_name
        self.log_level = getattr(logging, log_level.upper())
        self.setup_logging()
        
    def setup_logging(self):
        """Setup comprehensive logging configuration"""
        
        # Create logs directory if it doesn't exist
        os.makedirs("logs", exist_ok=True)
        
        # Create formatters
        detailed_formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(name)-20s | %(funcName)-15s | %(lineno)-4d | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        json_formatter = logging.Formatter(
            '%(message)s'
        )
        
        # Setup console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(self.log_level)
        console_handler.setFormatter(detailed_formatter)
        
        # Setup file handler for detailed logs
        file_handler = logging.FileHandler(f'logs/{self.service_name}_detailed.log')
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(detailed_formatter)
        
        # Setup JSON file handler for structured logs
        json_handler = logging.FileHandler(f'logs/{self.service_name}_structured.json')
        json_handler.setLevel(logging.INFO)
        json_handler.setFormatter(json_formatter)
        
        # Setup error handler
        error_handler = logging.FileHandler(f'logs/{self.service_name}_errors.log')
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(detailed_formatter)
        
        # Setup performance handler
        perf_handler = logging.FileHandler(f'logs/{self.service_name}_performance.log')
        perf_handler.setLevel(logging.INFO)
        perf_handler.setFormatter(detailed_formatter)
        
        # Configure root logger
        logger = logging.getLogger()
        logger.setLevel(logging.DEBUG)
        logger.addHandler(console_handler)
        logger.addHandler(file_handler)
        logger.addHandler(json_handler)
        logger.addHandler(error_handler)
        logger.addHandler(perf_handler)
        
        # Create service-specific logger
        self.logger = logging.getLogger(self.service_name)
        
        # Add custom handlers for structured logging
        self.json_handler = json_handler
        self.perf_handler = perf_handler
        
    def log_request(self, method: str, path: str, headers: Dict, body: Any = None, 
                   user_id: Optional[str] = None, ip: Optional[str] = None):
        """Log incoming requests with full context"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "service": self.service_name,
            "type": "request",
            "method": method,
            "path": path,
            "headers": dict(headers) if headers else {},
            "body": body,
            "user_id": user_id,
            "ip": ip,
            "request_id": f"req_{int(time.time() * 1000)}"
        }
        
        self.logger.info(f"REQUEST: {method} {path} | User: {user_id} | IP: {ip}")
        self._log_json(log_data)
        
    def log_response(self, status_code: int, response_data: Any, 
                    execution_time: float, request_id: str):
        """Log outgoing responses with performance metrics"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "service": self.service_name,
            "type": "response",
            "status_code": status_code,
            "response_data": response_data,
            "execution_time_ms": round(execution_time * 1000, 2),
            "request_id": request_id
        }
        
        self.logger.info(f"RESPONSE: {status_code} | Time: {execution_time:.3f}s")
        self._log_json(log_data)
        
    def log_database_operation(self, operation: str, table: str, 
                              query: str, execution_time: float, 
                              affected_rows: int = 0):
        """Log database operations with performance metrics"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "service": self.service_name,
            "type": "database",
            "operation": operation,
            "table": table,
            "query": query,
            "execution_time_ms": round(execution_time * 1000, 2),
            "affected_rows": affected_rows
        }
        
        self.logger.info(f"DB: {operation} on {table} | Time: {execution_time:.3f}s | Rows: {affected_rows}")
        self._log_json(log_data)
        
    def log_external_api_call(self, api_name: str, endpoint: str, 
                             method: str, status_code: int, 
                             response_time: float, response_size: int = 0):
        """Log external API calls with performance metrics"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "service": self.service_name,
            "type": "external_api",
            "api_name": api_name,
            "endpoint": endpoint,
            "method": method,
            "status_code": status_code,
            "response_time_ms": round(response_time * 1000, 2),
            "response_size_bytes": response_size
        }
        
        self.logger.info(f"API: {api_name} {method} {endpoint} | Status: {status_code} | Time: {response_time:.3f}s")
        self._log_json(log_data)
        
    def log_business_logic(self, operation: str, details: Dict[str, Any], 
                          execution_time: float = None):
        """Log business logic operations"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "service": self.service_name,
            "type": "business_logic",
            "operation": operation,
            "details": details,
            "execution_time_ms": round(execution_time * 1000, 2) if execution_time else None
        }
        
        self.logger.info(f"BUSINESS: {operation} | Details: {details}")
        self._log_json(log_data)
        
    def log_error(self, error: Exception, context: Dict[str, Any] = None):
        """Log errors with full context and stack trace"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "service": self.service_name,
            "type": "error",
            "error_type": type(error).__name__,
            "error_message": str(error),
            "stack_trace": traceback.format_exc(),
            "context": context or {}
        }
        
        self.logger.error(f"ERROR: {type(error).__name__}: {str(error)}")
        self._log_json(log_data)
        
    def log_performance_metric(self, metric_name: str, value: float, 
                              unit: str = "ms", context: Dict[str, Any] = None):
        """Log performance metrics"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "service": self.service_name,
            "type": "performance",
            "metric_name": metric_name,
            "value": value,
            "unit": unit,
            "context": context or {}
        }
        
        self.logger.info(f"PERF: {metric_name}: {value} {unit}")
        self._log_json(log_data)
        
    def _log_json(self, data: Dict[str, Any]):
        """Log structured JSON data"""
        try:
            json_str = json.dumps(data, default=str)
            # Create a custom logger for JSON output
            json_logger = logging.getLogger(f"{self.service_name}_json")
            json_logger.addHandler(self.json_handler)
            json_logger.setLevel(logging.INFO)
            json_logger.info(json_str)
        except Exception as e:
            self.logger.error(f"Failed to log JSON data: {e}")

# Decorator for automatic request/response logging
def log_endpoint(logger: BackendLogger):
    """Decorator to automatically log endpoint requests and responses"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            request_id = f"req_{int(time.time() * 1000)}"
            
            try:
                # Log request
                from flask import request
                logger.log_request(
                    method=request.method,
                    path=request.path,
                    headers=dict(request.headers),
                    body=request.get_json() if request.is_json else None,
                    ip=request.remote_addr
                )
                
                # Execute function
                result = func(*args, **kwargs)
                
                # Log response
                execution_time = time.time() - start_time
                logger.log_response(
                    status_code=200,
                    response_data=result,
                    execution_time=execution_time,
                    request_id=request_id
                )
                
                return result
                
            except Exception as e:
                execution_time = time.time() - start_time
                logger.log_error(e, {"request_id": request_id, "execution_time": execution_time})
                raise
                
        return wrapper
    return decorator

# Performance monitoring decorator
def monitor_performance(logger: BackendLogger, operation_name: str):
    """Decorator to monitor function performance"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time
                logger.log_performance_metric(
                    f"{operation_name}_execution_time",
                    execution_time * 1000,
                    "ms",
                    {"function": func.__name__}
                )
                return result
            except Exception as e:
                execution_time = time.time() - start_time
                logger.log_error(e, {
                    "operation": operation_name,
                    "function": func.__name__,
                    "execution_time": execution_time
                })
                raise
        return wrapper
    return decorator

# Initialize loggers for different services
flask_logger = BackendLogger("flask_backend", "INFO")
api_logger = BackendLogger("api_server", "INFO")
database_logger = BackendLogger("database", "DEBUG")
external_api_logger = BackendLogger("external_apis", "INFO")

if __name__ == "__main__":
    # Test the logging system
    logger = BackendLogger("test_service")
    
    # Test different log types
    logger.log_request("GET", "/test", {"User-Agent": "Test"}, {"test": "data"})
    logger.log_response(200, {"success": True}, 0.123, "req_123")
    logger.log_database_operation("SELECT", "users", "SELECT * FROM users", 0.045, 5)
    logger.log_external_api_call("yfinance", "/api/v1/quote", "GET", 200, 0.234, 1024)
    logger.log_business_logic("calculate_signal", {"symbol": "EURUSD", "confidence": 85}, 0.067)
    logger.log_performance_metric("memory_usage", 45.2, "MB", {"component": "signal_processor"})
    
    print("✅ Backend logging system test completed. Check logs/ directory for output files.")

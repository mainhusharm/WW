#!/usr/bin/env python3
"""
Enhanced Backend Logging System
Generates comprehensive backend logs for comparison with frontend logs
"""

import os
import sys
import logging
import json
import time
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List
import traceback

class EnhancedBackendLogger:
    """Enhanced logging system for backend services with separate log files"""
    
    def __init__(self, service_name: str = "backend", log_level: str = "INFO"):
        self.service_name = service_name
        self.log_level = getattr(logging, log_level.upper())
        self.setup_logging()
        
    def setup_logging(self):
        """Setup comprehensive logging configuration with separate files"""
        
        # Create logs directory if it doesn't exist
        os.makedirs("logs", exist_ok=True)
        
        # Create formatters
        detailed_formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(name)-20s | %(funcName)-15s | %(lineno)-4d | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        json_formatter = logging.Formatter('%(message)s')
        
        # Setup console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(self.log_level)
        console_handler.setFormatter(detailed_formatter)
        
        # Setup separate file handlers for different log types
        self.handlers = {}
        
        # Main backend log file
        self.handlers['main'] = logging.FileHandler(f'logs/backend_main.log')
        self.handlers['main'].setLevel(logging.DEBUG)
        self.handlers['main'].setFormatter(detailed_formatter)
        
        # Backend errors log file
        self.handlers['errors'] = logging.FileHandler(f'logs/backend_errors.log')
        self.handlers['errors'].setLevel(logging.ERROR)
        self.handlers['errors'].setFormatter(detailed_formatter)
        
        # Backend performance log file
        self.handlers['performance'] = logging.FileHandler(f'logs/backend_performance.log')
        self.handlers['performance'].setLevel(logging.INFO)
        self.handlers['performance'].setFormatter(detailed_formatter)
        
        # Backend API calls log file
        self.handlers['api'] = logging.FileHandler(f'logs/backend_api.log')
        self.handlers['api'].setLevel(logging.INFO)
        self.handlers['api'].setFormatter(detailed_formatter)
        
        # Backend database operations log file
        self.handlers['database'] = logging.FileHandler(f'logs/backend_database.log')
        self.handlers['database'].setLevel(logging.INFO)
        self.handlers['database'].setFormatter(detailed_formatter)
        
        # Backend business logic log file
        self.handlers['business'] = logging.FileHandler(f'logs/backend_business.log')
        self.handlers['business'].setLevel(logging.INFO)
        self.handlers['business'].setFormatter(detailed_formatter)
        
        # JSON structured log file
        self.handlers['json'] = logging.FileHandler(f'logs/backend_structured.json')
        self.handlers['json'].setLevel(logging.INFO)
        self.handlers['json'].setFormatter(json_formatter)
        
        # Configure root logger
        logger = logging.getLogger()
        logger.setLevel(logging.DEBUG)
        logger.addHandler(console_handler)
        
        # Add all file handlers
        for handler in self.handlers.values():
            logger.addHandler(handler)
        
        # Create service-specific logger
        self.logger = logging.getLogger(self.service_name)
        
    def log_request(self, method: str, path: str, headers: Dict, body: Any = None, 
                   user_id: str = None, ip: str = None, request_id: str = None):
        """Log incoming requests with full context"""
        if not request_id:
            request_id = f"req_{int(time.time() * 1000)}"
            
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
            "request_id": request_id
        }
        
        message = f"REQUEST: {method} {path} | User: {user_id} | IP: {ip} | ID: {request_id}"
        self.logger.info(message)
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
        
        message = f"RESPONSE: {status_code} | Time: {execution_time:.3f}s | ID: {request_id}"
        self.logger.info(message)
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
        
        message = f"DB: {operation} on {table} | Time: {execution_time:.3f}s | Rows: {affected_rows}"
        self.logger.info(message)
        self._log_json(log_data)
        
    def log_api_call(self, api_name: str, endpoint: str, 
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
        
        message = f"API: {api_name} {method} {endpoint} | Status: {status_code} | Time: {response_time:.3f}s"
        self.logger.info(message)
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
        
        message = f"BUSINESS: {operation} | Details: {details}"
        self.logger.info(message)
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
        
        message = f"ERROR: {type(error).__name__}: {str(error)}"
        self.logger.error(message)
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
        
        message = f"PERF: {metric_name}: {value} {unit}"
        self.logger.info(message)
        self._log_json(log_data)
        
    def _log_json(self, data: Dict[str, Any]):
        """Log structured JSON data"""
        try:
            json_str = json.dumps(data, default=str)
            # Create a custom logger for JSON output
            json_logger = logging.getLogger(f"{self.service_name}_json")
            json_logger.addHandler(self.handlers['json'])
            json_logger.setLevel(logging.INFO)
            json_logger.info(json_str)
        except Exception as e:
            self.logger.error(f"Failed to log JSON data: {e}")

def generate_backend_logs(num_logs: int = 100):
    """Generate sample backend logs for testing and comparison"""
    logger = EnhancedBackendLogger("backend_service")
    
    # Sample data for generating realistic logs
    methods = ["GET", "POST", "PUT", "DELETE", "PATCH"]
    paths = ["/api/users", "/api/signals", "/api/trades", "/api/auth/login", "/api/auth/register", 
             "/api/dashboard", "/api/settings", "/api/portfolio", "/api/analytics", "/api/notifications"]
    api_names = ["yfinance", "binance", "forex_factory", "tradingview", "alpha_vantage"]
    operations = ["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "DROP"]
    tables = ["users", "trades", "signals", "portfolios", "settings", "analytics"]
    business_operations = ["calculate_signal", "process_trade", "update_portfolio", 
                          "send_notification", "validate_user", "generate_report"]
    
    print(f"Generating {num_logs} backend log entries...")
    
    for i in range(num_logs):
        # Simulate different types of backend operations
        operation_type = random.choice(["request", "response", "database", "api", "business", "error", "performance"])
        
        if operation_type == "request":
            method = random.choice(methods)
            path = random.choice(paths)
            headers = {"User-Agent": "Mozilla/5.0", "Content-Type": "application/json"}
            body = {"test": "data"} if method in ["POST", "PUT", "PATCH"] else None
            user_id = f"user_{random.randint(1, 100)}"
            ip = f"192.168.1.{random.randint(1, 255)}"
            request_id = f"req_{int(time.time() * 1000)}_{i}"
            
            logger.log_request(method, path, headers, body, user_id, ip, request_id)
            
        elif operation_type == "response":
            status_code = random.choice([200, 201, 400, 401, 404, 500])
            response_data = {"success": status_code < 400, "data": "sample_response"}
            execution_time = random.uniform(0.01, 2.0)
            request_id = f"req_{int(time.time() * 1000)}_{i}"
            
            logger.log_response(status_code, response_data, execution_time, request_id)
            
        elif operation_type == "database":
            operation = random.choice(operations)
            table = random.choice(tables)
            query = f"{operation} * FROM {table} WHERE id = {random.randint(1, 1000)}"
            execution_time = random.uniform(0.001, 0.5)
            affected_rows = random.randint(0, 100)
            
            logger.log_database_operation(operation, table, query, execution_time, affected_rows)
            
        elif operation_type == "api":
            api_name = random.choice(api_names)
            endpoint = f"/api/v1/{random.choice(['quote', 'price', 'data', 'signal'])}"
            method = random.choice(["GET", "POST"])
            status_code = random.choice([200, 201, 400, 401, 429, 500])
            response_time = random.uniform(0.1, 3.0)
            response_size = random.randint(100, 10000)
            
            logger.log_api_call(api_name, endpoint, method, status_code, response_time, response_size)
            
        elif operation_type == "business":
            operation = random.choice(business_operations)
            details = {
                "symbol": random.choice(["EURUSD", "GBPUSD", "USDJPY", "BTCUSD"]),
                "confidence": random.randint(50, 100),
                "timestamp": datetime.utcnow().isoformat()
            }
            execution_time = random.uniform(0.01, 1.0)
            
            logger.log_business_logic(operation, details, execution_time)
            
        elif operation_type == "error":
            error_types = [ValueError, TypeError, ConnectionError, TimeoutError, KeyError]
            error_type = random.choice(error_types)
            error_message = f"Sample {error_type.__name__} error occurred"
            context = {"operation": "sample_operation", "user_id": f"user_{random.randint(1, 100)}"}
            
            try:
                raise error_type(error_message)
            except Exception as e:
                logger.log_error(e, context)
                
        elif operation_type == "performance":
            metrics = ["memory_usage", "cpu_usage", "response_time", "database_connections", "cache_hit_rate"]
            metric_name = random.choice(metrics)
            value = random.uniform(1, 100)
            unit = random.choice(["ms", "MB", "%", "count"])
            context = {"component": "backend_service", "instance": f"instance_{random.randint(1, 5)}"}
            
            logger.log_performance_metric(metric_name, value, unit, context)
        
        # Add small delay to simulate real-time logging
        time.sleep(0.01)
    
    print(f"✅ Generated {num_logs} backend log entries")
    print("📁 Backend log files created:")
    print("   - logs/backend_main.log")
    print("   - logs/backend_errors.log") 
    print("   - logs/backend_performance.log")
    print("   - logs/backend_api.log")
    print("   - logs/backend_database.log")
    print("   - logs/backend_business.log")
    print("   - logs/backend_structured.json")

if __name__ == "__main__":
    # Generate sample backend logs
    generate_backend_logs(150)

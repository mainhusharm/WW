#!/usr/bin/env python3
"""
Enhanced Frontend Logging System
Generates comprehensive frontend logs for comparison with backend logs
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

class EnhancedFrontendLogger:
    """Enhanced logging system for frontend services with separate log files"""
    
    def __init__(self, service_name: str = "frontend", log_level: str = "INFO"):
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
        
        # Main frontend log file
        self.handlers['main'] = logging.FileHandler(f'logs/frontend_main.log')
        self.handlers['main'].setLevel(logging.DEBUG)
        self.handlers['main'].setFormatter(detailed_formatter)
        
        # Frontend errors log file
        self.handlers['errors'] = logging.FileHandler(f'logs/frontend_errors.log')
        self.handlers['errors'].setLevel(logging.ERROR)
        self.handlers['errors'].setFormatter(detailed_formatter)
        
        # Frontend performance log file
        self.handlers['performance'] = logging.FileHandler(f'logs/frontend_performance.log')
        self.handlers['performance'].setLevel(logging.INFO)
        self.handlers['performance'].setFormatter(detailed_formatter)
        
        # Frontend user actions log file
        self.handlers['user_actions'] = logging.FileHandler(f'logs/frontend_user_actions.log')
        self.handlers['user_actions'].setLevel(logging.INFO)
        self.handlers['user_actions'].setFormatter(detailed_formatter)
        
        # Frontend API calls log file
        self.handlers['api'] = logging.FileHandler(f'logs/frontend_api.log')
        self.handlers['api'].setLevel(logging.INFO)
        self.handlers['api'].setFormatter(detailed_formatter)
        
        # Frontend component lifecycle log file
        self.handlers['components'] = logging.FileHandler(f'logs/frontend_components.log')
        self.handlers['components'].setLevel(logging.INFO)
        self.handlers['components'].setFormatter(detailed_formatter)
        
        # Frontend navigation log file
        self.handlers['navigation'] = logging.FileHandler(f'logs/frontend_navigation.log')
        self.handlers['navigation'].setLevel(logging.INFO)
        self.handlers['navigation'].setFormatter(detailed_formatter)
        
        # JSON structured log file
        self.handlers['json'] = logging.FileHandler(f'logs/frontend_structured.json')
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
        
    def log_user_action(self, action: str, component: str, details: Dict[str, Any] = None, 
                       user_id: str = None, session_id: str = None):
        """Log user actions with full context"""
        if not session_id:
            session_id = f"session_{int(time.time() * 1000)}"
            
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "service": self.service_name,
            "type": "user_action",
            "action": action,
            "component": component,
            "details": details or {},
            "user_id": user_id,
            "session_id": session_id,
            "url": "https://example.com/dashboard",  # Simulated URL
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        message = f"USER ACTION: {action} in {component} | User: {user_id} | Session: {session_id}"
        self.logger.info(message)
        self._log_json(log_data)
        
    def log_api_call(self, method: str, url: str, status: int, 
                     response_time: float, request_size: int = 0, 
                     response_size: int = 0, error: str = None):
        """Log frontend API calls with performance metrics"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "service": self.service_name,
            "type": "api_call",
            "method": method,
            "url": url,
            "status": status,
            "response_time_ms": round(response_time * 1000, 2),
            "request_size_bytes": request_size,
            "response_size_bytes": response_size,
            "error": error
        }
        
        message = f"API CALL: {method} {url} | Status: {status} | Time: {response_time:.3f}s"
        if error:
            message += f" | Error: {error}"
        self.logger.info(message)
        self._log_json(log_data)
        
    def log_component_lifecycle(self, component: str, phase: str, 
                               props: Dict[str, Any] = None, 
                               state: Dict[str, Any] = None, 
                               duration: float = None):
        """Log component lifecycle events"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "service": self.service_name,
            "type": "component_lifecycle",
            "component": component,
            "phase": phase,
            "props": props or {},
            "state": state or {},
            "duration_ms": round(duration * 1000, 2) if duration else None
        }
        
        message = f"COMPONENT: {component} {phase}"
        if duration:
            message += f" | Duration: {duration:.3f}s"
        self.logger.info(message)
        self._log_json(log_data)
        
    def log_performance_metric(self, name: str, value: float, 
                              unit: str = "ms", context: Dict[str, Any] = None):
        """Log performance metrics"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "service": self.service_name,
            "type": "performance",
            "metric_name": name,
            "value": value,
            "unit": unit,
            "context": context or {}
        }
        
        message = f"PERF: {name}: {value} {unit}"
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
            "context": context or {},
            "url": "https://example.com/dashboard",  # Simulated URL
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        message = f"ERROR: {type(error).__name__}: {str(error)}"
        self.logger.error(message)
        self._log_json(log_data)
        
    def log_navigation(self, from_page: str, to_page: str, method: str = "click"):
        """Log navigation events"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "service": self.service_name,
            "type": "navigation",
            "from": from_page,
            "to": to_page,
            "method": method
        }
        
        message = f"NAVIGATION: {from_page} → {to_page} ({method})"
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

def generate_frontend_logs(num_logs: int = 100):
    """Generate sample frontend logs for testing and comparison"""
    logger = EnhancedFrontendLogger("frontend_service")
    
    # Sample data for generating realistic logs
    user_actions = ["click", "scroll", "input", "submit", "hover", "focus", "blur", "resize"]
    components = ["Dashboard", "LoginForm", "TradingChart", "PortfolioView", "SettingsPanel", 
                  "NotificationCenter", "UserProfile", "TradeHistory", "SignalFeed", "Analytics"]
    api_urls = ["/api/users/profile", "/api/trades", "/api/signals", "/api/portfolio", 
                "/api/analytics", "/api/notifications", "/api/settings", "/api/auth/refresh"]
    pages = ["/dashboard", "/trading", "/portfolio", "/analytics", "/settings", "/profile", 
             "/signals", "/history", "/notifications", "/help"]
    business_operations = ["calculate_portfolio_value", "process_trade_signal", 
                          "update_user_preferences", "validate_form_data", "format_chart_data"]
    
    print(f"Generating {num_logs} frontend log entries...")
    
    for i in range(num_logs):
        # Simulate different types of frontend operations
        operation_type = random.choice(["user_action", "api_call", "component", "performance", 
                                       "error", "navigation", "business"])
        
        if operation_type == "user_action":
            action = random.choice(user_actions)
            component = random.choice(components)
            details = {
                "element_id": f"element_{random.randint(1, 100)}",
                "coordinates": {"x": random.randint(0, 1920), "y": random.randint(0, 1080)},
                "timestamp": datetime.utcnow().isoformat()
            }
            user_id = f"user_{random.randint(1, 100)}"
            session_id = f"session_{random.randint(1000, 9999)}"
            
            logger.log_user_action(action, component, details, user_id, session_id)
            
        elif operation_type == "api_call":
            method = random.choice(["GET", "POST", "PUT", "DELETE"])
            url = random.choice(api_urls)
            status = random.choice([200, 201, 400, 401, 404, 500])
            response_time = random.uniform(0.1, 2.0)
            request_size = random.randint(50, 2000)
            response_size = random.randint(100, 10000)
            error = f"API Error: {random.choice(['Timeout', 'Network Error', 'Invalid Response'])}" if status >= 400 else None
            
            logger.log_api_call(method, url, status, response_time, request_size, response_size, error)
            
        elif operation_type == "component":
            component = random.choice(components)
            phase = random.choice(["mount", "update", "unmount"])
            props = {"id": f"component_{random.randint(1, 100)}", "visible": random.choice([True, False])}
            state = {"loading": random.choice([True, False]), "data": "sample_data"}
            duration = random.uniform(0.001, 0.5)
            
            logger.log_component_lifecycle(component, phase, props, state, duration)
            
        elif operation_type == "performance":
            metrics = ["page_load_time", "component_render_time", "api_response_time", 
                      "memory_usage", "dom_manipulation_time", "animation_frame_time"]
            metric_name = random.choice(metrics)
            value = random.uniform(1, 1000)
            unit = random.choice(["ms", "MB", "count", "fps"])
            context = {"component": random.choice(components), "browser": "Chrome"}
            
            logger.log_performance_metric(metric_name, value, unit, context)
            
        elif operation_type == "error":
            error_types = [ValueError, TypeError, ReferenceError, SyntaxError, IndexError]
            error_type = random.choice(error_types)
            error_message = f"Frontend {error_type.__name__} error occurred"
            context = {"component": random.choice(components), "action": random.choice(user_actions)}
            
            try:
                raise error_type(error_message)
            except Exception as e:
                logger.log_error(e, context)
                
        elif operation_type == "navigation":
            from_page = random.choice(pages)
            to_page = random.choice(pages)
            method = random.choice(["click", "programmatic", "back_button", "forward_button"])
            
            logger.log_navigation(from_page, to_page, method)
            
        elif operation_type == "business":
            operation = random.choice(business_operations)
            details = {
                "data_size": random.randint(10, 1000),
                "processing_time": random.uniform(0.01, 0.5),
                "user_id": f"user_{random.randint(1, 100)}"
            }
            execution_time = random.uniform(0.01, 1.0)
            
            logger.log_business_logic(operation, details, execution_time)
        
        # Add small delay to simulate real-time logging
        time.sleep(0.01)
    
    print(f"✅ Generated {num_logs} frontend log entries")
    print("📁 Frontend log files created:")
    print("   - logs/frontend_main.log")
    print("   - logs/frontend_errors.log")
    print("   - logs/frontend_performance.log")
    print("   - logs/frontend_user_actions.log")
    print("   - logs/frontend_api.log")
    print("   - logs/frontend_components.log")
    print("   - logs/frontend_navigation.log")
    print("   - logs/frontend_structured.json")

if __name__ == "__main__":
    # Generate sample frontend logs
    generate_frontend_logs(150)

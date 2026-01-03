#!/usr/bin/env python3
"""
Sample Log Generator
Generates realistic sample logs for backend and frontend to test the logging system
"""

import os
import json
import random
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any
import argparse

class SampleLogGenerator:
    """Generates realistic sample logs for testing"""
    
    def __init__(self, output_dir: str = "logs"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
        # Sample data for realistic logs
        self.backend_services = [
            "flask_backend", "api_server", "database", "external_apis"
        ]
        
        self.frontend_services = [
            "frontend_app", "react_component"
        ]
        
        self.api_endpoints = [
            "/api/signals/dashboard",
            "/api/prop-firm/rules", 
            "/api/news/forex-factory",
            "/api/customers/dashboard",
            "/api/auth/login",
            "/api/auth/register",
            "/api/payment/process",
            "/api/user/profile",
            "/api/trading/signals",
            "/api/analytics/metrics"
        ]
        
        self.error_types = [
            "DatabaseConnectionError",
            "ValidationError", 
            "AuthenticationError",
            "RateLimitExceeded",
            "ExternalAPIError",
            "TimeoutError",
            "MemoryError",
            "FileNotFoundError"
        ]
        
        self.user_actions = [
            "login", "logout", "signup", "view_dashboard", "view_signals",
            "make_payment", "update_profile", "view_analytics", "export_data",
            "change_settings", "view_help", "contact_support"
        ]
        
        self.components = [
            "Dashboard", "SignalsFeed", "PaymentModal", "LoginForm",
            "UserProfile", "Analytics", "Settings", "HelpCenter"
        ]
        
    def generate_backend_logs(self, count: int = 1000) -> List[Dict[str, Any]]:
        """Generate sample backend logs"""
        logs = []
        base_time = datetime.now() - timedelta(hours=24)
        
        for i in range(count):
            # Random time within last 24 hours
            log_time = base_time + timedelta(
                seconds=random.randint(0, 24 * 60 * 60),
                microseconds=random.randint(0, 999999)
            )
            
            service = random.choice(self.backend_services)
            log_type = random.choices(
                ['request', 'response', 'database', 'external_api', 'business_logic', 'error', 'performance'],
                weights=[20, 20, 15, 15, 15, 10, 5]
            )[0]
            
            log_entry = {
                "timestamp": log_time.isoformat() + "Z",
                "service": service,
                "type": log_type,
                "request_id": f"req_{int(time.time() * 1000)}_{i}"
            }
            
            if log_type == 'request':
                log_entry.update({
                    "method": random.choice(['GET', 'POST', 'PUT', 'DELETE']),
                    "path": random.choice(self.api_endpoints),
                    "headers": {
                        "User-Agent": "Mozilla/5.0 (compatible; TestBot/1.0)",
                        "Content-Type": "application/json",
                        "Authorization": "Bearer token123"
                    },
                    "body": {"test": "data"} if random.choice([True, False]) else None,
                    "ip": f"192.168.1.{random.randint(1, 254)}"
                })
                
            elif log_type == 'response':
                log_entry.update({
                    "status_code": random.choices([200, 201, 400, 401, 404, 500], weights=[60, 10, 10, 5, 10, 5])[0],
                    "response_data": {"success": True, "data": "sample response"},
                    "execution_time_ms": round(random.uniform(10, 500), 2)
                })
                
            elif log_type == 'database':
                log_entry.update({
                    "operation": random.choice(['SELECT', 'INSERT', 'UPDATE', 'DELETE']),
                    "table": random.choice(['users', 'signals', 'payments', 'sessions', 'analytics']),
                    "query": f"SELECT * FROM {random.choice(['users', 'signals', 'payments'])} WHERE id = ?",
                    "execution_time_ms": round(random.uniform(5, 100), 2),
                    "affected_rows": random.randint(0, 100)
                })
                
            elif log_type == 'external_api':
                log_entry.update({
                    "api_name": random.choice(['yfinance', 'forex_factory', 'stripe', 'sendgrid']),
                    "endpoint": random.choice(['/api/v1/quote', '/api/news', '/v1/charges', '/v3/mail/send']),
                    "method": random.choice(['GET', 'POST']),
                    "status_code": random.choices([200, 201, 400, 429, 500], weights=[70, 10, 10, 5, 5])[0],
                    "response_time_ms": round(random.uniform(50, 2000), 2),
                    "response_size_bytes": random.randint(100, 10000)
                })
                
            elif log_type == 'business_logic':
                log_entry.update({
                    "operation": random.choice([
                        'calculate_signal_confidence',
                        'process_payment',
                        'validate_user_input',
                        'generate_analytics_report',
                        'send_notification'
                    ]),
                    "details": {
                        "input_size": random.randint(1, 1000),
                        "complexity": random.choice(['low', 'medium', 'high']),
                        "cache_hit": random.choice([True, False])
                    },
                    "execution_time_ms": round(random.uniform(1, 100), 2)
                })
                
            elif log_type == 'error':
                log_entry.update({
                    "error_type": random.choice(self.error_types),
                    "error_message": f"Sample error message for {random.choice(self.error_types)}",
                    "stack_trace": "Traceback (most recent call last):\n  File \"app.py\", line 123, in <module>\n    raise Exception('Sample error')",
                    "context": {
                        "user_id": f"user_{random.randint(1, 1000)}",
                        "request_id": f"req_{int(time.time() * 1000)}_{i}",
                        "component": random.choice(['auth', 'payment', 'signals', 'analytics'])
                    }
                })
                
            elif log_type == 'performance':
                log_entry.update({
                    "metric_name": random.choice([
                        'response_time', 'memory_usage', 'cpu_usage', 
                        'database_connections', 'cache_hit_rate'
                    ]),
                    "value": round(random.uniform(1, 1000), 2),
                    "unit": random.choice(['ms', 'MB', '%', 'count']),
                    "context": {
                        "component": random.choice(['api', 'database', 'cache', 'external_apis']),
                        "load_level": random.choice(['low', 'medium', 'high'])
                    }
                })
            
            logs.append(log_entry)
            
        return logs
        
    def generate_frontend_logs(self, count: int = 800) -> List[Dict[str, Any]]:
        """Generate sample frontend logs"""
        logs = []
        base_time = datetime.now() - timedelta(hours=24)
        
        for i in range(count):
            log_time = base_time + timedelta(
                seconds=random.randint(0, 24 * 60 * 60),
                microseconds=random.randint(0, 999999)
            )
            
            service = random.choice(self.frontend_services)
            log_type = random.choices(
                ['user_action', 'api_call', 'component_lifecycle', 'performance', 'error', 'navigation'],
                weights=[30, 25, 15, 15, 10, 5]
            )[0]
            
            session_id = f"session_{random.randint(1000, 9999)}"
            user_id = f"user_{random.randint(1, 100)}" if random.random() > 0.3 else None
            
            log_entry = {
                "timestamp": log_time.isoformat() + "Z",
                "service": service,
                "type": log_type,
                "sessionId": session_id,
                "userId": user_id,
                "url": f"https://example.com{random.choice(self.api_endpoints)}",
                "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            
            if log_type == 'user_action':
                log_entry.update({
                    "action": random.choice(self.user_actions),
                    "component": random.choice(self.components),
                    "details": {
                        "element": random.choice(['button', 'link', 'form', 'modal']),
                        "value": random.choice(['click', 'submit', 'change', 'focus']),
                        "data": {"test": "user_action_data"}
                    }
                })
                
            elif log_type == 'api_call':
                log_entry.update({
                    "method": random.choice(['GET', 'POST', 'PUT', 'DELETE']),
                    "url": random.choice(self.api_endpoints),
                    "status": random.choices([200, 201, 400, 401, 404, 500], weights=[70, 10, 8, 5, 5, 2])[0],
                    "responseTime": round(random.uniform(50, 2000), 2),
                    "requestSize": random.randint(100, 5000),
                    "responseSize": random.randint(200, 10000),
                    "error": None if random.random() > 0.1 else "Network timeout"
                })
                
            elif log_type == 'component_lifecycle':
                log_entry.update({
                    "component": random.choice(self.components),
                    "phase": random.choice(['mount', 'update', 'unmount']),
                    "props": {"testProp": "testValue"},
                    "state": {"testState": "testValue"},
                    "duration": round(random.uniform(1, 100), 2)
                })
                
            elif log_type == 'performance':
                log_entry.update({
                    "name": random.choice([
                        'page_load_time', 'component_render_time', 'api_response_time',
                        'memory_usage', 'bundle_size', 'first_paint'
                    ]),
                    "value": round(random.uniform(1, 1000), 2),
                    "unit": random.choice(['ms', 'MB', 'KB', 'count']),
                    "context": {
                        "component": random.choice(self.components),
                        "browser": random.choice(['Chrome', 'Firefox', 'Safari', 'Edge']),
                        "device": random.choice(['desktop', 'mobile', 'tablet'])
                    }
                })
                
            elif log_type == 'error':
                log_entry.update({
                    "error": {
                        "message": f"Frontend error: {random.choice(['TypeError', 'ReferenceError', 'NetworkError'])}",
                        "stack": "Error: Sample frontend error\n    at Component.render (Component.js:123:45)",
                        "name": random.choice(['TypeError', 'ReferenceError', 'NetworkError', 'ValidationError'])
                    },
                    "context": {
                        "component": random.choice(self.components),
                        "action": random.choice(self.user_actions),
                        "browser": random.choice(['Chrome', 'Firefox', 'Safari', 'Edge'])
                    }
                })
                
            elif log_type == 'navigation':
                log_entry.update({
                    "from": random.choice(['/dashboard', '/signals', '/profile', '/settings']),
                    "to": random.choice(['/dashboard', '/signals', '/profile', '/settings', '/payment']),
                    "method": random.choice(['link_click', 'form_submit', 'programmatic', 'browser_back'])
                })
            
            logs.append(log_entry)
            
        return logs
        
    def save_logs_to_files(self, backend_logs: List[Dict], frontend_logs: List[Dict]):
        """Save logs to structured JSON files"""
        
        # Group backend logs by service
        backend_by_service = {}
        for log in backend_logs:
            service = log['service']
            if service not in backend_by_service:
                backend_by_service[service] = []
            backend_by_service[service].append(log)
            
        # Save backend logs
        for service, logs in backend_by_service.items():
            file_path = os.path.join(self.output_dir, f"{service}_structured.json")
            with open(file_path, 'w') as f:
                for log in logs:
                    f.write(json.dumps(log) + '\n')
            print(f"✅ Saved {len(logs)} logs to {file_path}")
            
        # Group frontend logs by service
        frontend_by_service = {}
        for log in frontend_logs:
            service = log['service']
            if service not in frontend_by_service:
                frontend_by_service[service] = []
            frontend_by_service[service].append(log)
            
        # Save frontend logs
        for service, logs in frontend_by_service.items():
            file_path = os.path.join(self.output_dir, f"{service}_structured.json")
            with open(file_path, 'w') as f:
                for log in logs:
                    f.write(json.dumps(log) + '\n')
            print(f"✅ Saved {len(logs)} logs to {file_path}")
            
    def generate_summary_report(self, backend_logs: List[Dict], frontend_logs: List[Dict]):
        """Generate a summary report of the generated logs"""
        
        # Backend summary
        backend_summary = {
            'total_logs': len(backend_logs),
            'by_service': {},
            'by_type': {},
            'time_range': {
                'start': min(log['timestamp'] for log in backend_logs),
                'end': max(log['timestamp'] for log in backend_logs)
            }
        }
        
        for log in backend_logs:
            service = log['service']
            log_type = log['type']
            
            backend_summary['by_service'][service] = backend_summary['by_service'].get(service, 0) + 1
            backend_summary['by_type'][log_type] = backend_summary['by_type'].get(log_type, 0) + 1
            
        # Frontend summary
        frontend_summary = {
            'total_logs': len(frontend_logs),
            'by_service': {},
            'by_type': {},
            'time_range': {
                'start': min(log['timestamp'] for log in frontend_logs),
                'end': max(log['timestamp'] for log in frontend_logs)
            }
        }
        
        for log in frontend_logs:
            service = log['service']
            log_type = log['type']
            
            frontend_summary['by_service'][service] = frontend_summary['by_service'].get(service, 0) + 1
            frontend_summary['by_type'][log_type] = frontend_summary['by_type'].get(log_type, 0) + 1
            
        # Save summary
        summary = {
            'generated_at': datetime.now().isoformat(),
            'backend': backend_summary,
            'frontend': frontend_summary,
            'total_logs': len(backend_logs) + len(frontend_logs)
        }
        
        summary_path = os.path.join(self.output_dir, 'log_generation_summary.json')
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
            
        print(f"✅ Summary report saved to {summary_path}")
        
        # Print summary to console
        print("\n📊 Log Generation Summary:")
        print(f"Total Backend Logs: {len(backend_logs)}")
        print(f"Total Frontend Logs: {len(frontend_logs)}")
        print(f"Total Logs: {len(backend_logs) + len(frontend_logs)}")
        
        print("\nBackend Log Types:")
        for log_type, count in backend_summary['by_type'].items():
            print(f"  {log_type}: {count}")
            
        print("\nFrontend Log Types:")
        for log_type, count in frontend_summary['by_type'].items():
            print(f"  {log_type}: {count}")

def main():
    parser = argparse.ArgumentParser(description='Generate sample logs for testing')
    parser.add_argument('--backend-count', type=int, default=1000, help='Number of backend logs to generate')
    parser.add_argument('--frontend-count', type=int, default=800, help='Number of frontend logs to generate')
    parser.add_argument('--output-dir', default='logs', help='Output directory for log files')
    
    args = parser.parse_args()
    
    print("🚀 Generating sample logs...")
    
    generator = SampleLogGenerator(args.output_dir)
    
    # Generate logs
    backend_logs = generator.generate_backend_logs(args.backend_count)
    frontend_logs = generator.generate_frontend_logs(args.frontend_count)
    
    # Save to files
    generator.save_logs_to_files(backend_logs, frontend_logs)
    
    # Generate summary
    generator.generate_summary_report(backend_logs, frontend_logs)
    
    print(f"\n🎉 Sample log generation completed!")
    print(f"📁 Logs saved to: {args.output_dir}/")
    print(f"📊 Use the log analysis tool to analyze these logs:")
    print(f"   python log_analysis_tool.py --logs-dir {args.output_dir} --generate-report --create-visualizations")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Backend Log Generator for TraderEdgePro
Generates comprehensive logs for all backend services and APIs
"""

import os
import sys
import json
import logging
import datetime
import subprocess
import psutil
import requests
from pathlib import Path
import sqlite3
import psycopg2
from urllib.parse import urlparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backend_logs.txt'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class BackendLogGenerator:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.logs = {
            'timestamp': datetime.datetime.now().isoformat(),
            'system_info': {},
            'database_status': {},
            'api_endpoints': {},
            'services_status': {},
            'file_structure': {},
            'environment_variables': {},
            'process_status': {},
            'network_status': {},
            'errors': []
        }
    
    def generate_system_info(self):
        """Generate system information logs"""
        logger.info("Generating system information...")
        try:
            self.logs['system_info'] = {
                'platform': sys.platform,
                'python_version': sys.version,
                'cpu_count': psutil.cpu_count(),
                'memory_total': psutil.virtual_memory().total,
                'memory_available': psutil.virtual_memory().available,
                'disk_usage': psutil.disk_usage('/').percent,
                'current_directory': str(self.project_root),
                'user': os.getenv('USER', 'unknown')
            }
        except Exception as e:
            self.logs['errors'].append(f"System info error: {str(e)}")
            logger.error(f"System info error: {e}")
    
    def check_database_connections(self):
        """Check all database connections"""
        logger.info("Checking database connections...")
        
        # PostgreSQL connection
        try:
            postgres_url = "postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2"
            conn = psycopg2.connect(postgres_url)
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            
            # Get table list
            cursor.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            tables = [row[0] for row in cursor.fetchall()]
            
            # Get user count
            try:
                cursor.execute("SELECT COUNT(*) FROM enhanced_users;")
                user_count = cursor.fetchone()[0]
            except:
                user_count = "Table not found"
            
            self.logs['database_status']['postgresql'] = {
                'status': 'connected',
                'version': str(version[0]) if version else 'unknown',
                'tables': tables,
                'user_count': user_count
            }
            
            conn.close()
            logger.info("PostgreSQL connection successful")
            
        except Exception as e:
            self.logs['database_status']['postgresql'] = {
                'status': 'failed',
                'error': str(e)
            }
            logger.error(f"PostgreSQL connection failed: {e}")
        
        # SQLite connection
        try:
            sqlite_path = self.project_root / 'database.db'
            if sqlite_path.exists():
                conn = sqlite3.connect(str(sqlite_path))
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = [row[0] for row in cursor.fetchall()]
                
                self.logs['database_status']['sqlite'] = {
                    'status': 'connected',
                    'path': str(sqlite_path),
                    'tables': tables,
                    'size': sqlite_path.stat().st_size
                }
                conn.close()
                logger.info("SQLite connection successful")
            else:
                self.logs['database_status']['sqlite'] = {
                    'status': 'file_not_found',
                    'path': str(sqlite_path)
                }
        except Exception as e:
            self.logs['database_status']['sqlite'] = {
                'status': 'failed',
                'error': str(e)
            }
            logger.error(f"SQLite connection failed: {e}")
    
    def check_api_endpoints(self):
        """Check all API endpoints"""
        logger.info("Checking API endpoints...")
        
        endpoints = [
            'http://localhost:3000/api/health',
            'http://localhost:5000/api/health',
            'http://localhost:8000/api/health',
            'https://backend-topb.onrender.com/api/health',
            'https://trading-cors-proxy-gbhz.onrender.com/api/health',
            'http://localhost:3000/api/auth/register',
            'http://localhost:3000/api/payments',
            'http://localhost:3000/api/questionnaire',
            'http://localhost:3000/api/dashboard',
            'http://localhost:3000/api/signals',
        ]
        
        for endpoint in endpoints:
            try:
                response = requests.get(endpoint, timeout=5)
                self.logs['api_endpoints'][endpoint] = {
                    'status_code': response.status_code,
                    'response_time': response.elapsed.total_seconds(),
                    'headers': dict(response.headers),
                    'content_length': len(response.content)
                }
                logger.info(f"Endpoint {endpoint}: {response.status_code}")
            except Exception as e:
                self.logs['api_endpoints'][endpoint] = {
                    'status': 'failed',
                    'error': str(e)
                }
                logger.error(f"Endpoint {endpoint} failed: {e}")
    
    def check_running_processes(self):
        """Check running processes related to the project"""
        logger.info("Checking running processes...")
        
        relevant_processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'cpu_percent', 'memory_percent']):
            try:
                cmdline = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''
                if any(keyword in cmdline.lower() for keyword in ['python', 'flask', 'node', 'npm', 'vite']):
                    if any(keyword in cmdline.lower() for keyword in ['app.py', 'server', 'backend', 'api']):
                        relevant_processes.append({
                            'pid': proc.info['pid'],
                            'name': proc.info['name'],
                            'cmdline': cmdline,
                            'cpu_percent': proc.info['cpu_percent'],
                            'memory_percent': proc.info['memory_percent']
                        })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        self.logs['process_status'] = relevant_processes
        logger.info(f"Found {len(relevant_processes)} relevant processes")
    
    def scan_backend_files(self):
        """Scan backend file structure"""
        logger.info("Scanning backend files...")
        
        backend_files = {
            'python_files': [],
            'config_files': [],
            'database_files': [],
            'log_files': []
        }
        
        for file_path in self.project_root.rglob('*'):
            if file_path.is_file():
                if file_path.suffix == '.py':
                    backend_files['python_files'].append({
                        'path': str(file_path.relative_to(self.project_root)),
                        'size': file_path.stat().st_size,
                        'modified': datetime.datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                    })
                elif file_path.name in ['requirements.txt', 'package.json', 'render.yaml', '.env']:
                    backend_files['config_files'].append({
                        'path': str(file_path.relative_to(self.project_root)),
                        'size': file_path.stat().st_size,
                        'modified': datetime.datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                    })
                elif file_path.suffix in ['.db', '.sqlite', '.sql']:
                    backend_files['database_files'].append({
                        'path': str(file_path.relative_to(self.project_root)),
                        'size': file_path.stat().st_size,
                        'modified': datetime.datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                    })
                elif file_path.suffix in ['.log', '.txt'] and 'log' in file_path.name.lower():
                    backend_files['log_files'].append({
                        'path': str(file_path.relative_to(self.project_root)),
                        'size': file_path.stat().st_size,
                        'modified': datetime.datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                    })
        
        self.logs['file_structure'] = backend_files
        logger.info(f"Scanned {len(backend_files['python_files'])} Python files")
    
    def check_environment_variables(self):
        """Check environment variables"""
        logger.info("Checking environment variables...")
        
        important_vars = [
            'DATABASE_URL', 'FLASK_ENV', 'FLASK_APP', 'PORT', 'HOST',
            'CORS_ORIGINS', 'SECRET_KEY', 'JWT_SECRET', 'API_KEY',
            'RENDER', 'RENDER_SERVICE_NAME', 'PYTHON_VERSION'
        ]
        
        env_vars = {}
        for var in important_vars:
            value = os.getenv(var)
            if value:
                # Mask sensitive values
                if any(sensitive in var.lower() for sensitive in ['secret', 'key', 'password', 'token']):
                    env_vars[var] = f"***{value[-4:]}" if len(value) > 4 else "***"
                else:
                    env_vars[var] = value
            else:
                env_vars[var] = None
        
        self.logs['environment_variables'] = env_vars
    
    def check_network_status(self):
        """Check network connectivity"""
        logger.info("Checking network status...")
        
        network_tests = [
            'google.com',
            'render.com',
            'github.com',
            'postgresql.org'
        ]
        
        network_status = {}
        for host in network_tests:
            try:
                response = requests.get(f'https://{host}', timeout=5)
                network_status[host] = {
                    'status': 'reachable',
                    'status_code': response.status_code,
                    'response_time': response.elapsed.total_seconds()
                }
            except Exception as e:
                network_status[host] = {
                    'status': 'unreachable',
                    'error': str(e)
                }
        
        self.logs['network_status'] = network_status
    
    def generate_logs(self):
        """Generate all backend logs"""
        logger.info("Starting backend log generation...")
        
        self.generate_system_info()
        self.check_database_connections()
        self.check_api_endpoints()
        self.check_running_processes()
        self.scan_backend_files()
        self.check_environment_variables()
        self.check_network_status()
        
        # Save logs to file
        log_file = self.project_root / 'backend_comprehensive_logs.json'
        with open(log_file, 'w') as f:
            json.dump(self.logs, f, indent=2, default=str)
        
        logger.info(f"Backend logs saved to {log_file}")
        return self.logs

if __name__ == "__main__":
    generator = BackendLogGenerator()
    logs = generator.generate_logs()
    
    print("\n" + "="*50)
    print("BACKEND LOG SUMMARY")
    print("="*50)
    print(f"Total Python files: {len(logs['file_structure']['python_files'])}")
    print(f"Database connections: {len(logs['database_status'])}")
    print(f"API endpoints checked: {len(logs['api_endpoints'])}")
    print(f"Running processes: {len(logs['process_status'])}")
    print(f"Errors encountered: {len(logs['errors'])}")
    print("="*50)

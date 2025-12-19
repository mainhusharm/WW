#!/usr/bin/env python3
"""
Frontend Log Generator for TraderEdgePro
Generates comprehensive logs for all frontend services, React components, and build status
"""

import os
import sys
import json
import logging
import datetime
import subprocess
import requests
from pathlib import Path
import re

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('frontend_logs.txt'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class FrontendLogGenerator:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.logs = {
            'timestamp': datetime.datetime.now().isoformat(),
            'build_info': {},
            'package_info': {},
            'component_analysis': {},
            'static_files': {},
            'development_servers': {},
            'dependencies': {},
            'build_status': {},
            'route_analysis': {},
            'environment_config': {},
            'errors': []
        }
    
    def analyze_package_json(self):
        """Analyze package.json files"""
        logger.info("Analyzing package.json files...")
        
        package_files = list(self.project_root.rglob('package.json'))
        
        for package_file in package_files:
            try:
                with open(package_file, 'r') as f:
                    package_data = json.load(f)
                
                relative_path = str(package_file.relative_to(self.project_root))
                self.logs['package_info'][relative_path] = {
                    'name': package_data.get('name', 'unknown'),
                    'version': package_data.get('version', 'unknown'),
                    'scripts': package_data.get('scripts', {}),
                    'dependencies': list(package_data.get('dependencies', {}).keys()),
                    'devDependencies': list(package_data.get('devDependencies', {}).keys()),
                    'dependency_count': len(package_data.get('dependencies', {})),
                    'dev_dependency_count': len(package_data.get('devDependencies', {}))
                }
                
            except Exception as e:
                self.logs['errors'].append(f"Package.json analysis error for {package_file}: {str(e)}")
                logger.error(f"Package.json analysis error: {e}")
    
    def analyze_react_components(self):
        """Analyze React components and TypeScript files"""
        logger.info("Analyzing React components...")
        
        component_analysis = {
            'tsx_files': [],
            'jsx_files': [],
            'css_files': [],
            'component_imports': {},
            'hook_usage': {},
            'api_calls': []
        }
        
        # Find all React files
        react_files = []
        react_files.extend(self.project_root.rglob('*.tsx'))
        react_files.extend(self.project_root.rglob('*.jsx'))
        react_files.extend(self.project_root.rglob('*.ts'))
        react_files.extend(self.project_root.rglob('*.js'))
        
        for file_path in react_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                relative_path = str(file_path.relative_to(self.project_root))
                
                # Analyze file type
                if file_path.suffix == '.tsx':
                    component_analysis['tsx_files'].append({
                        'path': relative_path,
                        'size': len(content),
                        'lines': len(content.split('\n')),
                        'has_export_default': 'export default' in content,
                        'has_usestate': 'useState' in content,
                        'has_useeffect': 'useEffect' in content,
                        'api_calls': len(re.findall(r'fetch\(|axios\.|api\.', content))
                    })
                elif file_path.suffix == '.jsx':
                    component_analysis['jsx_files'].append({
                        'path': relative_path,
                        'size': len(content),
                        'lines': len(content.split('\n'))
                    })
                
                # Find imports
                imports = re.findall(r'import.*from [\'"]([^\'"]+)[\'"]', content)
                for imp in imports:
                    if imp not in component_analysis['component_imports']:
                        component_analysis['component_imports'][imp] = 0
                    component_analysis['component_imports'][imp] += 1
                
                # Find hook usage
                hooks = re.findall(r'use[A-Z]\w*', content)
                for hook in hooks:
                    if hook not in component_analysis['hook_usage']:
                        component_analysis['hook_usage'][hook] = 0
                    component_analysis['hook_usage'][hook] += 1
                
                # Find API calls
                api_patterns = [
                    r'fetch\([\'"]([^\'"]+)[\'"]',
                    r'axios\.[get|post|put|delete]+\([\'"]([^\'"]+)[\'"]',
                    r'api\.\w+\([\'"]([^\'"]+)[\'"]'
                ]
                
                for pattern in api_patterns:
                    matches = re.findall(pattern, content)
                    for match in matches:
                        component_analysis['api_calls'].append({
                            'file': relative_path,
                            'endpoint': match
                        })
                
            except Exception as e:
                self.logs['errors'].append(f"Component analysis error for {file_path}: {str(e)}")
                logger.error(f"Component analysis error: {e}")
        
        # Find CSS files
        css_files = []
        css_files.extend(self.project_root.rglob('*.css'))
        css_files.extend(self.project_root.rglob('*.scss'))
        css_files.extend(self.project_root.rglob('*.sass'))
        
        for css_file in css_files:
            try:
                relative_path = str(css_file.relative_to(self.project_root))
                component_analysis['css_files'].append({
                    'path': relative_path,
                    'size': css_file.stat().st_size,
                    'modified': datetime.datetime.fromtimestamp(css_file.stat().st_mtime).isoformat()
                })
            except Exception as e:
                self.logs['errors'].append(f"CSS analysis error for {css_file}: {str(e)}")
        
        self.logs['component_analysis'] = component_analysis
        logger.info(f"Analyzed {len(component_analysis['tsx_files'])} TSX files")
    
    def check_build_status(self):
        """Check build and development server status"""
        logger.info("Checking build status...")
        
        build_info = {}
        
        # Check for build directories
        build_dirs = ['dist', 'build', '.next', 'out']
        for build_dir in build_dirs:
            build_path = self.project_root / build_dir
            if build_path.exists():
                build_info[build_dir] = {
                    'exists': True,
                    'size': sum(f.stat().st_size for f in build_path.rglob('*') if f.is_file()),
                    'file_count': len(list(build_path.rglob('*'))),
                    'modified': datetime.datetime.fromtimestamp(build_path.stat().st_mtime).isoformat()
                }
            else:
                build_info[build_dir] = {'exists': False}
        
        # Check for config files
        config_files = ['vite.config.ts', 'vite.config.js', 'webpack.config.js', 'next.config.js', 'tsconfig.json']
        for config_file in config_files:
            config_path = self.project_root / config_file
            if config_path.exists():
                build_info[f'config_{config_file}'] = {
                    'exists': True,
                    'size': config_path.stat().st_size,
                    'modified': datetime.datetime.fromtimestamp(config_path.stat().st_mtime).isoformat()
                }
            else:
                build_info[f'config_{config_file}'] = {'exists': False}
        
        self.logs['build_status'] = build_info
    
    def check_development_servers(self):
        """Check development server status"""
        logger.info("Checking development servers...")
        
        dev_servers = [
            {'url': 'http://localhost:3000', 'name': 'React Dev Server'},
            {'url': 'http://localhost:5173', 'name': 'Vite Dev Server'},
            {'url': 'http://localhost:5174', 'name': 'Vite Dev Server Alt'},
            {'url': 'http://localhost:5175', 'name': 'Vite Dev Server Alt 2'},
            {'url': 'http://localhost:8000', 'name': 'Static Server'},
            {'url': 'http://localhost:8080', 'name': 'Webpack Dev Server'}
        ]
        
        server_status = {}
        for server in dev_servers:
            try:
                response = requests.get(server['url'], timeout=3)
                server_status[server['url']] = {
                    'name': server['name'],
                    'status': 'running',
                    'status_code': response.status_code,
                    'response_time': response.elapsed.total_seconds(),
                    'content_length': len(response.content),
                    'headers': dict(response.headers)
                }
                logger.info(f"Server {server['url']}: Running")
            except Exception as e:
                server_status[server['url']] = {
                    'name': server['name'],
                    'status': 'not_running',
                    'error': str(e)
                }
                logger.info(f"Server {server['url']}: Not running")
        
        self.logs['development_servers'] = server_status
    
    def analyze_static_files(self):
        """Analyze static files and assets"""
        logger.info("Analyzing static files...")
        
        static_analysis = {
            'html_files': [],
            'image_files': [],
            'font_files': [],
            'json_files': [],
            'other_assets': []
        }
        
        # Find static files
        static_extensions = {
            'html': ['.html', '.htm'],
            'images': ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'],
            'fonts': ['.woff', '.woff2', '.ttf', '.otf', '.eot'],
            'json': ['.json'],
            'other': ['.pdf', '.txt', '.md', '.xml']
        }
        
        for file_path in self.project_root.rglob('*'):
            if file_path.is_file():
                relative_path = str(file_path.relative_to(self.project_root))
                file_info = {
                    'path': relative_path,
                    'size': file_path.stat().st_size,
                    'modified': datetime.datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                }
                
                if file_path.suffix.lower() in static_extensions['html']:
                    static_analysis['html_files'].append(file_info)
                elif file_path.suffix.lower() in static_extensions['images']:
                    static_analysis['image_files'].append(file_info)
                elif file_path.suffix.lower() in static_extensions['fonts']:
                    static_analysis['font_files'].append(file_info)
                elif file_path.suffix.lower() in static_extensions['json']:
                    static_analysis['json_files'].append(file_info)
                elif file_path.suffix.lower() in static_extensions['other']:
                    static_analysis['other_assets'].append(file_info)
        
        self.logs['static_files'] = static_analysis
        logger.info(f"Found {len(static_analysis['html_files'])} HTML files")
    
    def analyze_routes(self):
        """Analyze routing configuration"""
        logger.info("Analyzing routes...")
        
        route_analysis = {
            'react_router_routes': [],
            'html_pages': [],
            'api_routes_referenced': []
        }
        
        # Find React Router routes
        for file_path in self.project_root.rglob('*.tsx'):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Find Route components
                routes = re.findall(r'<Route[^>]*path=[\'"]([^\'"]+)[\'"]', content)
                for route in routes:
                    route_analysis['react_router_routes'].append({
                        'path': route,
                        'file': str(file_path.relative_to(self.project_root))
                    })
                
            except Exception as e:
                self.logs['errors'].append(f"Route analysis error for {file_path}: {str(e)}")
        
        # Find HTML pages
        for html_file in self.project_root.rglob('*.html'):
            relative_path = str(html_file.relative_to(self.project_root))
            route_analysis['html_pages'].append(relative_path)
        
        self.logs['route_analysis'] = route_analysis
    
    def check_environment_config(self):
        """Check environment configuration"""
        logger.info("Checking environment configuration...")
        
        env_config = {}
        
        # Check for environment files
        env_files = ['.env', '.env.local', '.env.development', '.env.production']
        for env_file in env_files:
            env_path = self.project_root / env_file
            if env_path.exists():
                env_config[env_file] = {
                    'exists': True,
                    'size': env_path.stat().st_size,
                    'modified': datetime.datetime.fromtimestamp(env_path.stat().st_mtime).isoformat()
                }
            else:
                env_config[env_file] = {'exists': False}
        
        # Check for deployment configs
        deploy_files = ['render.yaml', 'vercel.json', 'netlify.toml', 'Dockerfile']
        for deploy_file in deploy_files:
            deploy_path = self.project_root / deploy_file
            if deploy_path.exists():
                env_config[f'deploy_{deploy_file}'] = {
                    'exists': True,
                    'size': deploy_path.stat().st_size,
                    'modified': datetime.datetime.fromtimestamp(deploy_path.stat().st_mtime).isoformat()
                }
            else:
                env_config[f'deploy_{deploy_file}'] = {'exists': False}
        
        self.logs['environment_config'] = env_config
    
    def generate_logs(self):
        """Generate all frontend logs"""
        logger.info("Starting frontend log generation...")
        
        self.analyze_package_json()
        self.analyze_react_components()
        self.check_build_status()
        self.check_development_servers()
        self.analyze_static_files()
        self.analyze_routes()
        self.check_environment_config()
        
        # Save logs to file
        log_file = self.project_root / 'frontend_comprehensive_logs.json'
        with open(log_file, 'w') as f:
            json.dump(self.logs, f, indent=2, default=str)
        
        logger.info(f"Frontend logs saved to {log_file}")
        return self.logs

if __name__ == "__main__":
    generator = FrontendLogGenerator()
    logs = generator.generate_logs()
    
    print("\n" + "="*50)
    print("FRONTEND LOG SUMMARY")
    print("="*50)
    print(f"TSX files: {len(logs['component_analysis']['tsx_files'])}")
    print(f"Package.json files: {len(logs['package_info'])}")
    print(f"Development servers checked: {len(logs['development_servers'])}")
    print(f"HTML files: {len(logs['static_files']['html_files'])}")
    print(f"React Router routes: {len(logs['route_analysis']['react_router_routes'])}")
    print(f"Errors encountered: {len(logs['errors'])}")
    print("="*50)

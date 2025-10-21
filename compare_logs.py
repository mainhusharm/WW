#!/usr/bin/env python3
"""
Log Comparison Tool for TraderEdgePro
Compares backend and frontend logs to identify differences and issues
"""

import json
import logging
import datetime
from pathlib import Path
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('log_comparison.txt'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class LogComparator:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.backend_logs = None
        self.frontend_logs = None
        self.comparison_results = {
            'timestamp': datetime.datetime.now().isoformat(),
            'summary': {},
            'differences': {},
            'issues_found': [],
            'recommendations': [],
            'critical_problems': [],
            'performance_insights': {},
            'deployment_readiness': {}
        }
    
    def load_logs(self):
        """Load backend and frontend logs"""
        logger.info("Loading log files...")
        
        try:
            backend_log_file = self.project_root / 'backend_comprehensive_logs.json'
            if backend_log_file.exists():
                with open(backend_log_file, 'r') as f:
                    self.backend_logs = json.load(f)
                logger.info("Backend logs loaded successfully")
            else:
                logger.error("Backend logs not found")
                return False
            
            frontend_log_file = self.project_root / 'frontend_comprehensive_logs.json'
            if frontend_log_file.exists():
                with open(frontend_log_file, 'r') as f:
                    self.frontend_logs = json.load(f)
                logger.info("Frontend logs loaded successfully")
            else:
                logger.error("Frontend logs not found")
                return False
            
            return True
        except Exception as e:
            logger.error(f"Error loading logs: {e}")
            return False
    
    def compare_system_status(self):
        """Compare system status between backend and frontend"""
        logger.info("Comparing system status...")
        
        backend_errors = len(self.backend_logs.get('errors', []))
        frontend_errors = len(self.frontend_logs.get('errors', []))
        
        self.comparison_results['summary'] = {
            'backend_errors': backend_errors,
            'frontend_errors': frontend_errors,
            'total_errors': backend_errors + frontend_errors,
            'backend_timestamp': self.backend_logs.get('timestamp'),
            'frontend_timestamp': self.frontend_logs.get('timestamp')
        }
        
        # Check for critical system issues
        if backend_errors > 5:
            self.comparison_results['critical_problems'].append(
                f"High number of backend errors: {backend_errors}"
            )
        
        if frontend_errors > 5:
            self.comparison_results['critical_problems'].append(
                f"High number of frontend errors: {frontend_errors}"
            )
    
    def compare_database_connectivity(self):
        """Compare database connectivity"""
        logger.info("Comparing database connectivity...")
        
        backend_db = self.backend_logs.get('database_status', {})
        
        db_comparison = {
            'postgresql_status': backend_db.get('postgresql', {}).get('status', 'unknown'),
            'sqlite_status': backend_db.get('sqlite', {}).get('status', 'unknown'),
            'postgresql_tables': len(backend_db.get('postgresql', {}).get('tables', [])),
            'sqlite_tables': len(backend_db.get('sqlite', {}).get('tables', []))
        }
        
        self.comparison_results['differences']['database'] = db_comparison
        
        # Check for database issues
        if db_comparison['postgresql_status'] != 'connected':
            self.comparison_results['critical_problems'].append(
                "PostgreSQL database not connected"
            )
        
        if db_comparison['sqlite_status'] not in ['connected', 'file_not_found']:
            self.comparison_results['issues_found'].append(
                "SQLite database connection issues"
            )
    
    def compare_api_endpoints(self):
        """Compare API endpoint status"""
        logger.info("Comparing API endpoints...")
        
        backend_apis = self.backend_logs.get('api_endpoints', {})
        frontend_servers = self.frontend_logs.get('development_servers', {})
        
        api_comparison = {
            'backend_endpoints_checked': len(backend_apis),
            'backend_working_endpoints': len([
                ep for ep, status in backend_apis.items() 
                if status.get('status_code', 0) in [200, 201, 204]
            ]),
            'frontend_servers_checked': len(frontend_servers),
            'frontend_running_servers': len([
                server for server, status in frontend_servers.items()
                if status.get('status') == 'running'
            ])
        }
        
        self.comparison_results['differences']['api_endpoints'] = api_comparison
        
        # Check for API connectivity issues
        working_ratio = api_comparison['backend_working_endpoints'] / max(api_comparison['backend_endpoints_checked'], 1)
        if working_ratio < 0.5:
            self.comparison_results['critical_problems'].append(
                f"Low API endpoint success rate: {working_ratio:.2%}"
            )
        
        # Check frontend server status
        if api_comparison['frontend_running_servers'] == 0:
            self.comparison_results['critical_problems'].append(
                "No frontend development servers running"
            )
    
    def compare_file_structures(self):
        """Compare file structures"""
        logger.info("Comparing file structures...")
        
        backend_files = self.backend_logs.get('file_structure', {})
        frontend_components = self.frontend_logs.get('component_analysis', {})
        frontend_static = self.frontend_logs.get('static_files', {})
        
        structure_comparison = {
            'python_files': len(backend_files.get('python_files', [])),
            'tsx_files': len(frontend_components.get('tsx_files', [])),
            'jsx_files': len(frontend_components.get('jsx_files', [])),
            'css_files': len(frontend_components.get('css_files', [])),
            'html_files': len(frontend_static.get('html_files', [])),
            'config_files': len(backend_files.get('config_files', [])),
            'database_files': len(backend_files.get('database_files', []))
        }
        
        self.comparison_results['differences']['file_structure'] = structure_comparison
        
        # Check for missing critical files
        if structure_comparison['python_files'] == 0:
            self.comparison_results['critical_problems'].append(
                "No Python backend files found"
            )
        
        if structure_comparison['tsx_files'] == 0 and structure_comparison['jsx_files'] == 0:
            self.comparison_results['critical_problems'].append(
                "No React component files found"
            )
    
    def analyze_dependencies(self):
        """Analyze dependency mismatches"""
        logger.info("Analyzing dependencies...")
        
        frontend_packages = self.frontend_logs.get('package_info', {})
        
        dependency_analysis = {
            'package_json_files': len(frontend_packages),
            'total_dependencies': 0,
            'total_dev_dependencies': 0,
            'common_issues': []
        }
        
        for package_path, package_info in frontend_packages.items():
            dependency_analysis['total_dependencies'] += package_info.get('dependency_count', 0)
            dependency_analysis['total_dev_dependencies'] += package_info.get('dev_dependency_count', 0)
            
            # Check for common dependency issues
            deps = package_info.get('dependencies', [])
            if 'react' in deps and 'vue' in deps:
                dependency_analysis['common_issues'].append(
                    f"Conflicting frameworks in {package_path}"
                )
        
        self.comparison_results['differences']['dependencies'] = dependency_analysis
    
    def analyze_performance_metrics(self):
        """Analyze performance metrics"""
        logger.info("Analyzing performance metrics...")
        
        backend_apis = self.backend_logs.get('api_endpoints', {})
        frontend_servers = self.frontend_logs.get('development_servers', {})
        
        performance_metrics = {
            'api_response_times': [],
            'server_response_times': [],
            'slow_endpoints': [],
            'fast_endpoints': []
        }
        
        # Analyze API response times
        for endpoint, status in backend_apis.items():
            if 'response_time' in status:
                response_time = status['response_time']
                performance_metrics['api_response_times'].append({
                    'endpoint': endpoint,
                    'response_time': response_time
                })
                
                if response_time > 2.0:
                    performance_metrics['slow_endpoints'].append(endpoint)
                elif response_time < 0.1:
                    performance_metrics['fast_endpoints'].append(endpoint)
        
        # Analyze frontend server response times
        for server, status in frontend_servers.items():
            if 'response_time' in status:
                performance_metrics['server_response_times'].append({
                    'server': server,
                    'response_time': status['response_time']
                })
        
        self.comparison_results['performance_insights'] = performance_metrics
        
        # Add performance recommendations
        if len(performance_metrics['slow_endpoints']) > 0:
            self.comparison_results['recommendations'].append(
                f"Optimize slow API endpoints: {', '.join(performance_metrics['slow_endpoints'])}"
            )
    
    def check_deployment_readiness(self):
        """Check deployment readiness"""
        logger.info("Checking deployment readiness...")
        
        backend_env = self.backend_logs.get('environment_variables', {})
        frontend_env = self.frontend_logs.get('environment_config', {})
        
        deployment_check = {
            'backend_env_vars': len([v for v in backend_env.values() if v is not None]),
            'frontend_config_files': len([f for f, status in frontend_env.items() if status.get('exists', False)]),
            'build_directories': [],
            'missing_configs': []
        }
        
        # Check build status
        build_status = self.frontend_logs.get('build_status', {})
        for build_dir, status in build_status.items():
            if status.get('exists', False):
                deployment_check['build_directories'].append(build_dir)
        
        # Check for missing deployment configs
        if not frontend_env.get('deploy_render.yaml', {}).get('exists', False):
            deployment_check['missing_configs'].append('render.yaml')
        
        if not frontend_env.get('.env', {}).get('exists', False):
            deployment_check['missing_configs'].append('.env')
        
        self.comparison_results['deployment_readiness'] = deployment_check
        
        # Add deployment recommendations
        if len(deployment_check['missing_configs']) > 0:
            self.comparison_results['recommendations'].append(
                f"Missing deployment configs: {', '.join(deployment_check['missing_configs'])}"
            )
    
    def generate_recommendations(self):
        """Generate actionable recommendations"""
        logger.info("Generating recommendations...")
        
        # Database recommendations
        db_status = self.comparison_results['differences'].get('database', {})
        if db_status.get('postgresql_status') != 'connected':
            self.comparison_results['recommendations'].append(
                "Fix PostgreSQL connection - check credentials and network connectivity"
            )
        
        # API recommendations
        api_status = self.comparison_results['differences'].get('api_endpoints', {})
        if api_status.get('frontend_running_servers', 0) == 0:
            self.comparison_results['recommendations'].append(
                "Start frontend development server (npm run dev or yarn dev)"
            )
        
        # File structure recommendations
        structure = self.comparison_results['differences'].get('file_structure', {})
        if structure.get('tsx_files', 0) == 0:
            self.comparison_results['recommendations'].append(
                "Ensure React TypeScript components are properly configured"
            )
        
        # Performance recommendations
        performance = self.comparison_results.get('performance_insights', {})
        if len(performance.get('slow_endpoints', [])) > 2:
            self.comparison_results['recommendations'].append(
                "Investigate and optimize slow API endpoints for better performance"
            )
    
    def compare_logs(self):
        """Main comparison function"""
        logger.info("Starting log comparison...")
        
        if not self.load_logs():
            return None
        
        self.compare_system_status()
        self.compare_database_connectivity()
        self.compare_api_endpoints()
        self.compare_file_structures()
        self.analyze_dependencies()
        self.analyze_performance_metrics()
        self.check_deployment_readiness()
        self.generate_recommendations()
        
        # Save comparison results
        comparison_file = self.project_root / 'log_comparison_results.json'
        with open(comparison_file, 'w') as f:
            json.dump(self.comparison_results, f, indent=2, default=str)
        
        logger.info(f"Comparison results saved to {comparison_file}")
        return self.comparison_results
    
    def print_summary(self):
        """Print comparison summary"""
        results = self.comparison_results
        
        print("\n" + "="*60)
        print("LOG COMPARISON SUMMARY")
        print("="*60)
        
        print(f"\nSYSTEM STATUS:")
        print(f"  Backend Errors: {results['summary']['backend_errors']}")
        print(f"  Frontend Errors: {results['summary']['frontend_errors']}")
        print(f"  Total Errors: {results['summary']['total_errors']}")
        
        print(f"\nDATABASE STATUS:")
        db = results['differences'].get('database', {})
        print(f"  PostgreSQL: {db.get('postgresql_status', 'unknown')}")
        print(f"  SQLite: {db.get('sqlite_status', 'unknown')}")
        print(f"  PostgreSQL Tables: {db.get('postgresql_tables', 0)}")
        
        print(f"\nAPI ENDPOINTS:")
        api = results['differences'].get('api_endpoints', {})
        print(f"  Backend Endpoints Checked: {api.get('backend_endpoints_checked', 0)}")
        print(f"  Backend Working: {api.get('backend_working_endpoints', 0)}")
        print(f"  Frontend Servers Running: {api.get('frontend_running_servers', 0)}")
        
        print(f"\nFILE STRUCTURE:")
        files = results['differences'].get('file_structure', {})
        print(f"  Python Files: {files.get('python_files', 0)}")
        print(f"  TSX Files: {files.get('tsx_files', 0)}")
        print(f"  HTML Files: {files.get('html_files', 0)}")
        
        print(f"\nCRITICAL PROBLEMS:")
        for problem in results['critical_problems']:
            print(f"  ❌ {problem}")
        
        print(f"\nRECOMMENDations:")
        for rec in results['recommendations']:
            print(f"  💡 {rec}")
        
        print("="*60)

if __name__ == "__main__":
    comparator = LogComparator()
    results = comparator.compare_logs()
    
    if results:
        comparator.print_summary()
    else:
        print("Failed to compare logs. Please run backend and frontend log generators first.")

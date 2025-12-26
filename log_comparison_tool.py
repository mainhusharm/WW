#!/usr/bin/env python3
"""
Log Comparison Tool
Analyzes and compares frontend and backend logs to identify patterns and differences
"""

import os
import sys
import json
import re
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from typing import Dict, List, Any, Tuple
import argparse

class LogComparisonTool:
    """Tool for comparing and analyzing frontend and backend logs"""
    
    def __init__(self, logs_dir: str = "logs"):
        self.logs_dir = logs_dir
        self.backend_logs = {}
        self.frontend_logs = {}
        self.comparison_results = {}
        
    def load_logs(self):
        """Load all log files from the logs directory"""
        print("📂 Loading log files...")
        
        # Backend log files
        backend_files = [
            "backend_main.log",
            "backend_errors.log",
            "backend_performance.log", 
            "backend_api.log",
            "backend_database.log",
            "backend_business.log",
            "backend_structured.json"
        ]
        
        # Frontend log files
        frontend_files = [
            "frontend_main.log",
            "frontend_errors.log",
            "frontend_performance.log",
            "frontend_user_actions.log",
            "frontend_api.log", 
            "frontend_components.log",
            "frontend_navigation.log",
            "frontend_structured.json"
        ]
        
        # Load backend logs
        for file in backend_files:
            file_path = os.path.join(self.logs_dir, file)
            if os.path.exists(file_path):
                self.backend_logs[file] = self._parse_log_file(file_path)
                print(f"   ✅ Loaded {file} ({len(self.backend_logs[file])} entries)")
            else:
                print(f"   ❌ {file} not found")
        
        # Load frontend logs
        for file in frontend_files:
            file_path = os.path.join(self.logs_dir, file)
            if os.path.exists(file_path):
                self.frontend_logs[file] = self._parse_log_file(file_path)
                print(f"   ✅ Loaded {file} ({len(self.frontend_logs[file])} entries)")
            else:
                print(f"   ❌ {file} not found")
        
        print(f"📊 Total backend entries: {sum(len(logs) for logs in self.backend_logs.values())}")
        print(f"📊 Total frontend entries: {sum(len(logs) for logs in self.frontend_logs.values())}")
    
    def _parse_log_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Parse a log file and return structured data"""
        entries = []
        
        try:
            if file_path.endswith('.json'):
                # Parse JSON structured logs
                with open(file_path, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            try:
                                entry = json.loads(line)
                                entries.append(entry)
                            except json.JSONDecodeError:
                                continue
            else:
                # Parse text logs
                with open(file_path, 'r') as f:
                    for line in f:
                        entry = self._parse_log_line(line.strip())
                        if entry:
                            entries.append(entry)
        except Exception as e:
            print(f"   ⚠️  Error parsing {file_path}: {e}")
        
        return entries
    
    def _parse_log_line(self, line: str) -> Dict[str, Any]:
        """Parse a single log line"""
        if not line:
            return None
            
        # Try to parse structured log format
        # Format: timestamp | level | name | function | line | message
        pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \| (\w+)\s+\| (\w+)\s+\| (\w+)\s+\| (\d+)\s+\| (.+)'
        match = re.match(pattern, line)
        
        if match:
            timestamp, level, name, function, line_num, message = match.groups()
            return {
                "timestamp": timestamp,
                "level": level,
                "name": name,
                "function": function,
                "line": int(line_num),
                "message": message,
                "raw": line
            }
        
        # Fallback: return basic structure
        return {
            "timestamp": datetime.now().isoformat(),
            "level": "INFO",
            "message": line,
            "raw": line
        }
    
    def compare_log_patterns(self):
        """Compare patterns between frontend and backend logs"""
        print("\n🔍 Analyzing log patterns...")
        
        # Analyze error patterns
        backend_errors = self._extract_errors(self.backend_logs)
        frontend_errors = self._extract_errors(self.frontend_logs)
        
        # Analyze performance patterns
        backend_performance = self._extract_performance_metrics(self.backend_logs)
        frontend_performance = self._extract_performance_metrics(self.frontend_logs)
        
        # Analyze API call patterns
        backend_api = self._extract_api_calls(self.backend_logs)
        frontend_api = self._extract_api_calls(self.frontend_logs)
        
        # Analyze user activity patterns
        frontend_user_actions = self._extract_user_actions(self.frontend_logs)
        
        # Store comparison results
        self.comparison_results = {
            "errors": {
                "backend": backend_errors,
                "frontend": frontend_errors,
                "comparison": self._compare_error_patterns(backend_errors, frontend_errors)
            },
            "performance": {
                "backend": backend_performance,
                "frontend": frontend_performance,
                "comparison": self._compare_performance_patterns(backend_performance, frontend_performance)
            },
            "api_calls": {
                "backend": backend_api,
                "frontend": frontend_api,
                "comparison": self._compare_api_patterns(backend_api, frontend_api)
            },
            "user_activity": {
                "frontend": frontend_user_actions
            }
        }
        
        print("✅ Pattern analysis completed")
    
    def _extract_errors(self, logs: Dict[str, List[Dict]]) -> Dict[str, Any]:
        """Extract error information from logs"""
        errors = {
            "count": 0,
            "types": Counter(),
            "messages": [],
            "timestamps": []
        }
        
        for file_name, entries in logs.items():
            for entry in entries:
                if entry.get("level") == "ERROR" or "error" in entry.get("message", "").lower():
                    errors["count"] += 1
                    errors["messages"].append(entry.get("message", ""))
                    errors["timestamps"].append(entry.get("timestamp", ""))
                    
                    # Extract error type
                    message = entry.get("message", "")
                    if "ValueError" in message:
                        errors["types"]["ValueError"] += 1
                    elif "TypeError" in message:
                        errors["types"]["TypeError"] += 1
                    elif "ConnectionError" in message:
                        errors["types"]["ConnectionError"] += 1
                    elif "TimeoutError" in message:
                        errors["types"]["TimeoutError"] += 1
                    else:
                        errors["types"]["Other"] += 1
        
        return errors
    
    def _extract_performance_metrics(self, logs: Dict[str, List[Dict]]) -> Dict[str, Any]:
        """Extract performance metrics from logs"""
        metrics = {
            "response_times": [],
            "execution_times": [],
            "memory_usage": [],
            "api_response_times": []
        }
        
        for file_name, entries in logs.items():
            for entry in entries:
                message = entry.get("message", "")
                
                # Extract response times
                response_match = re.search(r'Time: ([\d.]+)s', message)
                if response_match:
                    metrics["response_times"].append(float(response_match.group(1)))
                
                # Extract execution times
                exec_match = re.search(r'execution_time_ms.*?(\d+\.?\d*)', message)
                if exec_match:
                    metrics["execution_times"].append(float(exec_match.group(1)))
                
                # Extract memory usage
                memory_match = re.search(r'memory.*?(\d+\.?\d*)\s*MB', message)
                if memory_match:
                    metrics["memory_usage"].append(float(memory_match.group(1)))
                
                # Extract API response times
                api_match = re.search(r'response_time_ms.*?(\d+\.?\d*)', message)
                if api_match:
                    metrics["api_response_times"].append(float(api_match.group(1)))
        
        return metrics
    
    def _extract_api_calls(self, logs: Dict[str, List[Dict]]) -> Dict[str, Any]:
        """Extract API call information from logs"""
        api_calls = {
            "count": 0,
            "methods": Counter(),
            "endpoints": Counter(),
            "status_codes": Counter(),
            "response_times": []
        }
        
        for file_name, entries in logs.items():
            for entry in entries:
                message = entry.get("message", "")
                
                if "API" in message or "REQUEST" in message or "RESPONSE" in message:
                    api_calls["count"] += 1
                    
                    # Extract HTTP method
                    method_match = re.search(r'(GET|POST|PUT|DELETE|PATCH)', message)
                    if method_match:
                        api_calls["methods"][method_match.group(1)] += 1
                    
                    # Extract endpoint
                    endpoint_match = re.search(r'/(api/[^\s|]+)', message)
                    if endpoint_match:
                        api_calls["endpoints"][endpoint_match.group(1)] += 1
                    
                    # Extract status code
                    status_match = re.search(r'Status: (\d+)', message)
                    if status_match:
                        api_calls["status_codes"][int(status_match.group(1))] += 1
                    
                    # Extract response time
                    time_match = re.search(r'Time: ([\d.]+)s', message)
                    if time_match:
                        api_calls["response_times"].append(float(time_match.group(1)))
        
        return api_calls
    
    def _extract_user_actions(self, logs: Dict[str, List[Dict]]) -> Dict[str, Any]:
        """Extract user action information from frontend logs"""
        user_actions = {
            "count": 0,
            "actions": Counter(),
            "components": Counter(),
            "users": Counter()
        }
        
        for file_name, entries in logs.items():
            for entry in entries:
                message = entry.get("message", "")
                
                if "USER ACTION" in message:
                    user_actions["count"] += 1
                    
                    # Extract action type
                    action_match = re.search(r'USER ACTION: (\w+)', message)
                    if action_match:
                        user_actions["actions"][action_match.group(1)] += 1
                    
                    # Extract component
                    component_match = re.search(r'in (\w+)', message)
                    if component_match:
                        user_actions["components"][component_match.group(1)] += 1
                    
                    # Extract user ID
                    user_match = re.search(r'User: (user_\d+)', message)
                    if user_match:
                        user_actions["users"][user_match.group(1)] += 1
        
        return user_actions
    
    def _compare_error_patterns(self, backend_errors: Dict, frontend_errors: Dict) -> Dict[str, Any]:
        """Compare error patterns between backend and frontend"""
        return {
            "backend_error_count": backend_errors["count"],
            "frontend_error_count": frontend_errors["count"],
            "total_errors": backend_errors["count"] + frontend_errors["count"],
            "backend_error_types": dict(backend_errors["types"]),
            "frontend_error_types": dict(frontend_errors["types"]),
            "error_ratio": backend_errors["count"] / max(frontend_errors["count"], 1)
        }
    
    def _compare_performance_patterns(self, backend_perf: Dict, frontend_perf: Dict) -> Dict[str, Any]:
        """Compare performance patterns between backend and frontend"""
        def avg(lst):
            return sum(lst) / len(lst) if lst else 0
        
        return {
            "backend_avg_response_time": avg(backend_perf["response_times"]),
            "frontend_avg_response_time": avg(frontend_perf["response_times"]),
            "backend_avg_execution_time": avg(backend_perf["execution_times"]),
            "frontend_avg_execution_time": avg(frontend_perf["execution_times"]),
            "backend_avg_memory_usage": avg(backend_perf["memory_usage"]),
            "frontend_avg_memory_usage": avg(frontend_perf["memory_usage"]),
            "performance_difference": avg(backend_perf["response_times"]) - avg(frontend_perf["response_times"])
        }
    
    def _compare_api_patterns(self, backend_api: Dict, frontend_api: Dict) -> Dict[str, Any]:
        """Compare API call patterns between backend and frontend"""
        return {
            "backend_api_count": backend_api["count"],
            "frontend_api_count": frontend_api["count"],
            "total_api_calls": backend_api["count"] + frontend_api["count"],
            "backend_methods": dict(backend_api["methods"]),
            "frontend_methods": dict(frontend_api["methods"]),
            "backend_endpoints": dict(backend_api["endpoints"]),
            "frontend_endpoints": dict(frontend_api["endpoints"]),
            "backend_status_codes": dict(backend_api["status_codes"]),
            "frontend_status_codes": dict(frontend_api["status_codes"])
        }
    
    def generate_comparison_report(self) -> str:
        """Generate a comprehensive comparison report"""
        if not self.comparison_results:
            self.compare_log_patterns()
        
        report = []
        report.append("# Frontend vs Backend Log Comparison Report")
        report.append(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("=" * 60)
        
        # Error Analysis
        errors = self.comparison_results["errors"]
        report.append("\n## 🚨 Error Analysis")
        report.append(f"- Backend Errors: {errors['comparison']['backend_error_count']}")
        report.append(f"- Frontend Errors: {errors['comparison']['frontend_error_count']}")
        report.append(f"- Total Errors: {errors['comparison']['total_errors']}")
        report.append(f"- Error Ratio (Backend/Frontend): {errors['comparison']['error_ratio']:.2f}")
        
        if errors['comparison']['backend_error_types']:
            report.append("\n### Backend Error Types:")
            for error_type, count in errors['comparison']['backend_error_types'].items():
                report.append(f"  - {error_type}: {count}")
        
        if errors['comparison']['frontend_error_types']:
            report.append("\n### Frontend Error Types:")
            for error_type, count in errors['comparison']['frontend_error_types'].items():
                report.append(f"  - {error_type}: {count}")
        
        # Performance Analysis
        perf = self.comparison_results["performance"]
        report.append("\n## ⚡ Performance Analysis")
        report.append(f"- Backend Avg Response Time: {perf['comparison']['backend_avg_response_time']:.3f}s")
        report.append(f"- Frontend Avg Response Time: {perf['comparison']['frontend_avg_response_time']:.3f}s")
        report.append(f"- Backend Avg Execution Time: {perf['comparison']['backend_avg_execution_time']:.2f}ms")
        report.append(f"- Frontend Avg Execution Time: {perf['comparison']['frontend_avg_execution_time']:.2f}ms")
        report.append(f"- Backend Avg Memory Usage: {perf['comparison']['backend_avg_memory_usage']:.2f}MB")
        report.append(f"- Frontend Avg Memory Usage: {perf['comparison']['frontend_avg_memory_usage']:.2f}MB")
        report.append(f"- Performance Difference: {perf['comparison']['performance_difference']:.3f}s")
        
        # API Analysis
        api = self.comparison_results["api_calls"]
        report.append("\n## 🌐 API Call Analysis")
        report.append(f"- Backend API Calls: {api['comparison']['backend_api_count']}")
        report.append(f"- Frontend API Calls: {api['comparison']['frontend_api_count']}")
        report.append(f"- Total API Calls: {api['comparison']['total_api_calls']}")
        
        if api['comparison']['backend_methods']:
            report.append("\n### Backend HTTP Methods:")
            for method, count in api['comparison']['backend_methods'].items():
                report.append(f"  - {method}: {count}")
        
        if api['comparison']['frontend_methods']:
            report.append("\n### Frontend HTTP Methods:")
            for method, count in api['comparison']['frontend_methods'].items():
                report.append(f"  - {method}: {count}")
        
        # User Activity Analysis
        user_activity = self.comparison_results["user_activity"]
        if user_activity["frontend"]:
            report.append("\n## 👤 User Activity Analysis")
            report.append(f"- Total User Actions: {user_activity['frontend']['count']}")
            
            if user_activity['frontend']['actions']:
                report.append("\n### Most Common Actions:")
                for action, count in user_activity['frontend']['actions'].most_common(5):
                    report.append(f"  - {action}: {count}")
            
            if user_activity['frontend']['components']:
                report.append("\n### Most Active Components:")
                for component, count in user_activity['frontend']['components'].most_common(5):
                    report.append(f"  - {component}: {count}")
        
        # Recommendations
        report.append("\n## 💡 Recommendations")
        
        if errors['comparison']['error_ratio'] > 2:
            report.append("- ⚠️  Backend has significantly more errors than frontend - investigate backend error handling")
        elif errors['comparison']['error_ratio'] < 0.5:
            report.append("- ⚠️  Frontend has significantly more errors than backend - investigate frontend error handling")
        else:
            report.append("- ✅ Error distribution between frontend and backend is balanced")
        
        if perf['comparison']['performance_difference'] > 1.0:
            report.append("- ⚠️  Backend response times are significantly slower than frontend - optimize backend performance")
        elif perf['comparison']['performance_difference'] < -1.0:
            report.append("- ⚠️  Frontend response times are significantly slower than backend - optimize frontend performance")
        else:
            report.append("- ✅ Performance difference between frontend and backend is acceptable")
        
        if api['comparison']['backend_api_count'] > api['comparison']['frontend_api_count'] * 2:
            report.append("- ⚠️  Backend is making significantly more API calls - consider caching or optimization")
        
        return "\n".join(report)
    
    def save_comparison_report(self, filename: str = "log_comparison_report.md"):
        """Save the comparison report to a file"""
        report = self.generate_comparison_report()
        
        with open(filename, 'w') as f:
            f.write(report)
        
        print(f"📄 Comparison report saved to: {filename}")
    
    def print_summary(self):
        """Print a summary of the comparison results"""
        if not self.comparison_results:
            self.compare_log_patterns()
        
        print("\n" + "=" * 60)
        print("📊 LOG COMPARISON SUMMARY")
        print("=" * 60)
        
        # Error summary
        errors = self.comparison_results["errors"]["comparison"]
        print(f"🚨 Errors: Backend={errors['backend_error_count']}, Frontend={errors['frontend_error_count']}")
        
        # Performance summary
        perf = self.comparison_results["performance"]["comparison"]
        print(f"⚡ Performance: Backend={perf['backend_avg_response_time']:.3f}s, Frontend={perf['frontend_avg_response_time']:.3f}s")
        
        # API summary
        api = self.comparison_results["api_calls"]["comparison"]
        print(f"🌐 API Calls: Backend={api['backend_api_count']}, Frontend={api['frontend_api_count']}")
        
        # User activity summary
        user_activity = self.comparison_results["user_activity"]["frontend"]
        if user_activity:
            print(f"👤 User Actions: {user_activity['count']}")

def main():
    """Main function with command line argument parsing"""
    parser = argparse.ArgumentParser(description="Compare and analyze frontend and backend logs")
    parser.add_argument("--logs-dir", default="logs", help="Directory containing log files (default: logs)")
    parser.add_argument("--report", action="store_true", help="Generate detailed comparison report")
    parser.add_argument("--output", default="log_comparison_report.md", help="Output file for report (default: log_comparison_report.md)")
    
    args = parser.parse_args()
    
    print("🔍 Frontend vs Backend Log Comparison Tool")
    print("=" * 50)
    
    # Initialize comparison tool
    tool = LogComparisonTool(args.logs_dir)
    
    # Load logs
    tool.load_logs()
    
    # Compare patterns
    tool.compare_log_patterns()
    
    # Print summary
    tool.print_summary()
    
    # Generate report if requested
    if args.report:
        tool.save_comparison_report(args.output)
    
    print("\n🎉 Log comparison completed successfully!")

if __name__ == "__main__":
    main()

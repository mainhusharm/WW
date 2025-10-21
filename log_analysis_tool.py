#!/usr/bin/env python3
"""
Log Analysis and Comparison Tool
Analyzes and compares backend and frontend logs to identify execution differences
"""

import os
import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import argparse
from collections import defaultdict, Counter
import numpy as np

class LogAnalyzer:
    """Comprehensive log analysis and comparison tool"""
    
    def __init__(self, logs_dir: str = "logs"):
        self.logs_dir = logs_dir
        self.backend_logs = []
        self.frontend_logs = []
        self.analysis_results = {}
        
    def load_logs(self):
        """Load all log files from the logs directory"""
        print("📊 Loading log files...")
        
        # Load backend logs
        backend_files = [
            "flask_backend_structured.json",
            "api_server_structured.json", 
            "database_structured.json",
            "external_apis_structured.json"
        ]
        
        for file in backend_files:
            file_path = os.path.join(self.logs_dir, file)
            if os.path.exists(file_path):
                self._load_json_logs(file_path, "backend")
                
        # Load frontend logs (if available)
        frontend_files = [
            "frontend_app_structured.json",
            "react_component_structured.json"
        ]
        
        for file in frontend_files:
            file_path = os.path.join(self.logs_dir, file)
            if os.path.exists(file_path):
                self._load_json_logs(file_path, "frontend")
        
        print(f"✅ Loaded {len(self.backend_logs)} backend logs and {len(self.frontend_logs)} frontend logs")
        
    def _load_json_logs(self, file_path: str, log_type: str):
        """Load JSON structured logs from file"""
        try:
            with open(file_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            log_entry = json.loads(line)
                            log_entry['log_type'] = log_type
                            if log_type == "backend":
                                self.backend_logs.append(log_entry)
                            else:
                                self.frontend_logs.append(log_entry)
                        except json.JSONDecodeError:
                            continue
        except Exception as e:
            print(f"⚠️ Error loading {file_path}: {e}")
            
    def analyze_performance_differences(self) -> Dict[str, Any]:
        """Analyze performance differences between backend and frontend"""
        print("🔍 Analyzing performance differences...")
        
        # Extract performance metrics
        backend_perf = [log for log in self.backend_logs if log.get('type') == 'performance']
        frontend_perf = [log for log in self.frontend_logs if log.get('type') == 'performance']
        
        analysis = {
            'backend_performance': self._analyze_performance_metrics(backend_perf),
            'frontend_performance': self._analyze_performance_metrics(frontend_perf),
            'comparison': {}
        }
        
        # Compare common metrics
        backend_metrics = {m['metric_name']: m['value'] for m in backend_perf if 'metric_name' in m}
        frontend_metrics = {m['name']: m['value'] for m in frontend_perf if 'name' in m}
        
        # Find common metrics
        common_metrics = set(backend_metrics.keys()) & set(frontend_metrics.keys())
        
        for metric in common_metrics:
            backend_val = backend_metrics[metric]
            frontend_val = frontend_metrics[metric]
            difference = abs(backend_val - frontend_val)
            percentage_diff = (difference / min(backend_val, frontend_val)) * 100 if min(backend_val, frontend_val) > 0 else 0
            
            analysis['comparison'][metric] = {
                'backend_value': backend_val,
                'frontend_value': frontend_val,
                'difference': difference,
                'percentage_difference': percentage_diff
            }
            
        return analysis
        
    def _analyze_performance_metrics(self, perf_logs: List[Dict]) -> Dict[str, Any]:
        """Analyze performance metrics for a specific log type"""
        if not perf_logs:
            return {}
            
        metrics = defaultdict(list)
        for log in perf_logs:
            metric_name = log.get('metric_name') or log.get('name', 'unknown')
            value = log.get('value', 0)
            metrics[metric_name].append(value)
            
        analysis = {}
        for metric_name, values in metrics.items():
            analysis[metric_name] = {
                'count': len(values),
                'mean': np.mean(values),
                'median': np.median(values),
                'std': np.std(values),
                'min': np.min(values),
                'max': np.max(values),
                'p95': np.percentile(values, 95),
                'p99': np.percentile(values, 99)
            }
            
        return analysis
        
    def analyze_request_response_patterns(self) -> Dict[str, Any]:
        """Analyze request/response patterns and timing"""
        print("🔄 Analyzing request/response patterns...")
        
        # Group requests and responses by request_id
        backend_requests = {}
        backend_responses = {}
        
        for log in self.backend_logs:
            if log.get('type') == 'request':
                request_id = log.get('request_id')
                if request_id:
                    backend_requests[request_id] = log
            elif log.get('type') == 'response':
                request_id = log.get('request_id')
                if request_id:
                    backend_responses[request_id] = log
                    
        # Match requests with responses
        matched_requests = []
        for request_id, request in backend_requests.items():
            if request_id in backend_responses:
                response = backend_responses[request_id]
                matched_requests.append({
                    'request_id': request_id,
                    'method': request.get('method'),
                    'path': request.get('path'),
                    'status_code': response.get('status_code'),
                    'execution_time': response.get('execution_time_ms'),
                    'timestamp': request.get('timestamp')
                })
                
        # Analyze patterns
        if matched_requests:
            df = pd.DataFrame(matched_requests)
            
            analysis = {
                'total_requests': len(matched_requests),
                'avg_execution_time': df['execution_time'].mean(),
                'median_execution_time': df['execution_time'].median(),
                'slowest_endpoints': df.nlargest(10, 'execution_time')[['path', 'execution_time']].to_dict('records'),
                'status_code_distribution': df['status_code'].value_counts().to_dict(),
                'method_distribution': df['method'].value_counts().to_dict(),
                'hourly_distribution': self._analyze_hourly_patterns(df)
            }
        else:
            analysis = {'total_requests': 0}
            
        return analysis
        
    def _analyze_hourly_patterns(self, df: pd.DataFrame) -> Dict[str, int]:
        """Analyze hourly request patterns"""
        df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
        return df['hour'].value_counts().sort_index().to_dict()
        
    def analyze_error_patterns(self) -> Dict[str, Any]:
        """Analyze error patterns and differences"""
        print("❌ Analyzing error patterns...")
        
        backend_errors = [log for log in self.backend_logs if log.get('type') == 'error']
        frontend_errors = [log for log in self.frontend_logs if log.get('type') == 'error']
        
        analysis = {
            'backend_errors': self._analyze_errors(backend_errors),
            'frontend_errors': self._analyze_errors(frontend_errors),
            'error_comparison': {}
        }
        
        # Compare error types
        backend_error_types = Counter([e.get('error_type', 'unknown') for e in backend_errors])
        frontend_error_types = Counter([e.get('error', {}).get('name', 'unknown') for e in frontend_errors])
        
        analysis['error_comparison'] = {
            'backend_error_types': dict(backend_error_types),
            'frontend_error_types': dict(frontend_error_types),
            'total_backend_errors': len(backend_errors),
            'total_frontend_errors': len(frontend_errors)
        }
        
        return analysis
        
    def _analyze_errors(self, errors: List[Dict]) -> Dict[str, Any]:
        """Analyze error patterns for a specific log type"""
        if not errors:
            return {}
            
        error_types = Counter([e.get('error_type', 'unknown') for e in errors])
        error_messages = Counter([e.get('error_message', 'unknown') for e in errors])
        
        return {
            'total_errors': len(errors),
            'error_types': dict(error_types),
            'common_error_messages': dict(error_messages.most_common(10)),
            'error_rate_per_hour': self._calculate_error_rate(errors)
        }
        
    def _calculate_error_rate(self, errors: List[Dict]) -> float:
        """Calculate error rate per hour"""
        if not errors:
            return 0.0
            
        # Get time range
        timestamps = [datetime.fromisoformat(e['timestamp'].replace('Z', '+00:00')) for e in errors]
        if not timestamps:
            return 0.0
            
        time_span = (max(timestamps) - min(timestamps)).total_seconds() / 3600  # hours
        return len(errors) / time_span if time_span > 0 else 0.0
        
    def analyze_user_behavior_patterns(self) -> Dict[str, Any]:
        """Analyze user behavior patterns from frontend logs"""
        print("👤 Analyzing user behavior patterns...")
        
        user_actions = [log for log in self.frontend_logs if log.get('type') == 'user_action']
        api_calls = [log for log in self.frontend_logs if log.get('type') == 'api_call']
        
        analysis = {
            'user_actions': self._analyze_user_actions(user_actions),
            'api_calls': self._analyze_api_calls(api_calls),
            'user_engagement': self._analyze_user_engagement(user_actions)
        }
        
        return analysis
        
    def _analyze_user_actions(self, actions: List[Dict]) -> Dict[str, Any]:
        """Analyze user action patterns"""
        if not actions:
            return {}
            
        action_types = Counter([a.get('action', 'unknown') for a in actions])
        components = Counter([a.get('component', 'unknown') for a in actions])
        
        return {
            'total_actions': len(actions),
            'action_types': dict(action_types),
            'most_active_components': dict(components.most_common(10)),
            'actions_per_hour': self._calculate_actions_per_hour(actions)
        }
        
    def _analyze_api_calls(self, api_calls: List[Dict]) -> Dict[str, Any]:
        """Analyze API call patterns"""
        if not api_calls:
            return {}
            
        endpoints = Counter([call.get('url', 'unknown') for call in api_calls])
        methods = Counter([call.get('method', 'unknown') for call in api_calls])
        status_codes = Counter([call.get('status', 0) for call in api_calls])
        
        response_times = [call.get('responseTime', 0) for call in api_calls if call.get('responseTime')]
        
        analysis = {
            'total_calls': len(api_calls),
            'endpoints': dict(endpoints.most_common(10)),
            'methods': dict(methods),
            'status_codes': dict(status_codes),
            'avg_response_time': np.mean(response_times) if response_times else 0,
            'median_response_time': np.median(response_times) if response_times else 0
        }
        
        return analysis
        
    def _analyze_user_engagement(self, actions: List[Dict]) -> Dict[str, Any]:
        """Analyze user engagement metrics"""
        if not actions:
            return {}
            
        # Group by session
        sessions = defaultdict(list)
        for action in actions:
            session_id = action.get('sessionId', 'unknown')
            sessions[session_id].append(action)
            
        session_durations = []
        for session_actions in sessions.values():
            if len(session_actions) > 1:
                timestamps = [datetime.fromisoformat(a['timestamp'].replace('Z', '+00:00')) for a in session_actions]
                duration = (max(timestamps) - min(timestamps)).total_seconds() / 60  # minutes
                session_durations.append(duration)
                
        return {
            'total_sessions': len(sessions),
            'avg_session_duration': np.mean(session_durations) if session_durations else 0,
            'median_session_duration': np.median(session_durations) if session_durations else 0,
            'actions_per_session': np.mean([len(actions) for actions in sessions.values()])
        }
        
    def _calculate_actions_per_hour(self, actions: List[Dict]) -> float:
        """Calculate actions per hour"""
        if not actions:
            return 0.0
            
        timestamps = [datetime.fromisoformat(a['timestamp'].replace('Z', '+00:00')) for a in actions]
        if not timestamps:
            return 0.0
            
        time_span = (max(timestamps) - min(timestamps)).total_seconds() / 3600  # hours
        return len(actions) / time_span if time_span > 0 else 0.0
        
    def generate_comparison_report(self) -> str:
        """Generate a comprehensive comparison report"""
        print("📋 Generating comparison report...")
        
        # Run all analyses
        performance_analysis = self.analyze_performance_differences()
        request_analysis = self.analyze_request_response_patterns()
        error_analysis = self.analyze_error_patterns()
        user_analysis = self.analyze_user_behavior_patterns()
        
        # Generate report
        report = f"""
# Backend vs Frontend Execution Analysis Report
Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Executive Summary
- Backend Logs: {len(self.backend_logs)} entries
- Frontend Logs: {len(self.frontend_logs)} entries
- Analysis Period: {self._get_analysis_period()}

## Performance Comparison
{self._format_performance_comparison(performance_analysis)}

## Request/Response Analysis
{self._format_request_analysis(request_analysis)}

## Error Analysis
{self._format_error_analysis(error_analysis)}

## User Behavior Analysis
{self._format_user_analysis(user_analysis)}

## Key Findings
{self._generate_key_findings(performance_analysis, request_analysis, error_analysis, user_analysis)}

## Recommendations
{self._generate_recommendations(performance_analysis, request_analysis, error_analysis, user_analysis)}
"""
        
        return report
        
    def _get_analysis_period(self) -> str:
        """Get the analysis period from logs"""
        all_timestamps = []
        for log in self.backend_logs + self.frontend_logs:
            if 'timestamp' in log:
                all_timestamps.append(datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00')))
                
        if all_timestamps:
            start = min(all_timestamps)
            end = max(all_timestamps)
            return f"{start.strftime('%Y-%m-%d %H:%M')} to {end.strftime('%Y-%m-%d %H:%M')}"
        return "Unknown"
        
    def _format_performance_comparison(self, analysis: Dict) -> str:
        """Format performance comparison section"""
        if not analysis.get('comparison'):
            return "No common performance metrics found for comparison."
            
        formatted = "### Performance Metrics Comparison\n\n"
        for metric, data in analysis['comparison'].items():
            formatted += f"**{metric}:**\n"
            formatted += f"- Backend: {data['backend_value']:.2f}\n"
            formatted += f"- Frontend: {data['frontend_value']:.2f}\n"
            formatted += f"- Difference: {data['percentage_difference']:.1f}%\n\n"
            
        return formatted
        
    def _format_request_analysis(self, analysis: Dict) -> str:
        """Format request analysis section"""
        if analysis.get('total_requests', 0) == 0:
            return "No request/response data available."
            
        formatted = f"### Request/Response Analysis\n\n"
        formatted += f"- Total Requests: {analysis['total_requests']}\n"
        formatted += f"- Average Execution Time: {analysis['avg_execution_time']:.2f}ms\n"
        formatted += f"- Median Execution Time: {analysis['median_execution_time']:.2f}ms\n\n"
        
        if analysis.get('slowest_endpoints'):
            formatted += "**Slowest Endpoints:**\n"
            for endpoint in analysis['slowest_endpoints'][:5]:
                formatted += f"- {endpoint['path']}: {endpoint['execution_time']:.2f}ms\n"
                
        return formatted
        
    def _format_error_analysis(self, analysis: Dict) -> str:
        """Format error analysis section"""
        backend_errors = analysis.get('error_comparison', {}).get('total_backend_errors', 0)
        frontend_errors = analysis.get('error_comparison', {}).get('total_frontend_errors', 0)
        
        formatted = f"### Error Analysis\n\n"
        formatted += f"- Backend Errors: {backend_errors}\n"
        formatted += f"- Frontend Errors: {frontend_errors}\n\n"
        
        if backend_errors > 0:
            formatted += "**Backend Error Types:**\n"
            for error_type, count in analysis['error_comparison'].get('backend_error_types', {}).items():
                formatted += f"- {error_type}: {count}\n"
                
        if frontend_errors > 0:
            formatted += "\n**Frontend Error Types:**\n"
            for error_type, count in analysis['error_comparison'].get('frontend_error_types', {}).items():
                formatted += f"- {error_type}: {count}\n"
                
        return formatted
        
    def _format_user_analysis(self, analysis: Dict) -> str:
        """Format user behavior analysis section"""
        if not analysis.get('user_actions', {}).get('total_actions', 0):
            return "No user behavior data available."
            
        formatted = f"### User Behavior Analysis\n\n"
        formatted += f"- Total User Actions: {analysis['user_actions']['total_actions']}\n"
        formatted += f"- Total Sessions: {analysis['user_engagement']['total_sessions']}\n"
        formatted += f"- Average Session Duration: {analysis['user_engagement']['avg_session_duration']:.1f} minutes\n"
        formatted += f"- Actions per Session: {analysis['user_engagement']['actions_per_session']:.1f}\n\n"
        
        if analysis['user_actions'].get('action_types'):
            formatted += "**Most Common Actions:**\n"
            for action, count in list(analysis['user_actions']['action_types'].items())[:5]:
                formatted += f"- {action}: {count}\n"
                
        return formatted
        
    def _generate_key_findings(self, *analyses) -> str:
        """Generate key findings from all analyses"""
        findings = []
        
        # Performance findings
        perf_analysis = analyses[0]
        if perf_analysis.get('comparison'):
            for metric, data in perf_analysis['comparison'].items():
                if data['percentage_difference'] > 50:
                    findings.append(f"Significant performance difference in {metric}: {data['percentage_difference']:.1f}%")
                    
        # Error findings
        error_analysis = analyses[2]
        backend_errors = error_analysis.get('error_comparison', {}).get('total_backend_errors', 0)
        frontend_errors = error_analysis.get('error_comparison', {}).get('total_frontend_errors', 0)
        
        if backend_errors > frontend_errors * 2:
            findings.append(f"Backend has significantly more errors than frontend ({backend_errors} vs {frontend_errors})")
        elif frontend_errors > backend_errors * 2:
            findings.append(f"Frontend has significantly more errors than backend ({frontend_errors} vs {backend_errors})")
            
        if not findings:
            findings.append("No significant differences found between backend and frontend execution patterns.")
            
        return "\n".join(f"- {finding}" for finding in findings)
        
    def _generate_recommendations(self, *analyses) -> str:
        """Generate recommendations based on analysis"""
        recommendations = []
        
        # Performance recommendations
        perf_analysis = analyses[0]
        if perf_analysis.get('comparison'):
            for metric, data in perf_analysis['comparison'].items():
                if data['percentage_difference'] > 100:
                    recommendations.append(f"Investigate performance bottleneck in {metric}")
                    
        # Error recommendations
        error_analysis = analyses[2]
        if error_analysis.get('error_comparison', {}).get('total_backend_errors', 0) > 10:
            recommendations.append("Implement better error handling and monitoring for backend services")
            
        if error_analysis.get('error_comparison', {}).get('total_frontend_errors', 0) > 10:
            recommendations.append("Add error boundaries and better error handling to frontend components")
            
        # User behavior recommendations
        user_analysis = analyses[3]
        if user_analysis.get('user_engagement', {}).get('avg_session_duration', 0) < 2:
            recommendations.append("Investigate low user engagement - consider improving user experience")
            
        if not recommendations:
            recommendations.append("Continue monitoring and maintain current performance levels")
            
        return "\n".join(f"- {rec}" for rec in recommendations)
        
    def create_visualizations(self, output_dir: str = "log_analysis_output"):
        """Create visualizations for log analysis"""
        print("📊 Creating visualizations...")
        
        os.makedirs(output_dir, exist_ok=True)
        
        # Create performance comparison chart
        self._create_performance_chart(output_dir)
        
        # Create error distribution chart
        self._create_error_chart(output_dir)
        
        # Create request timeline chart
        self._create_timeline_chart(output_dir)
        
        print(f"✅ Visualizations saved to {output_dir}/")
        
    def _create_performance_chart(self, output_dir: str):
        """Create performance comparison chart"""
        backend_perf = [log for log in self.backend_logs if log.get('type') == 'performance']
        frontend_perf = [log for log in self.frontend_logs if log.get('type') == 'performance']
        
        if not backend_perf and not frontend_perf:
            return
            
        plt.figure(figsize=(12, 8))
        
        # Extract common metrics
        backend_metrics = defaultdict(list)
        frontend_metrics = defaultdict(list)
        
        for log in backend_perf:
            metric_name = log.get('metric_name', 'unknown')
            value = log.get('value', 0)
            backend_metrics[metric_name].append(value)
            
        for log in frontend_perf:
            metric_name = log.get('name', 'unknown')
            value = log.get('value', 0)
            frontend_metrics[metric_name].append(value)
            
        # Find common metrics
        common_metrics = set(backend_metrics.keys()) & set(frontend_metrics.keys())
        
        if common_metrics:
            data = []
            labels = []
            
            for metric in list(common_metrics)[:10]:  # Limit to 10 metrics
                backend_avg = np.mean(backend_metrics[metric])
                frontend_avg = np.mean(frontend_metrics[metric])
                
                data.append([backend_avg, frontend_avg])
                labels.append(metric)
                
            x = np.arange(len(labels))
            width = 0.35
            
            plt.bar(x - width/2, [d[0] for d in data], width, label='Backend', alpha=0.8)
            plt.bar(x + width/2, [d[1] for d in data], width, label='Frontend', alpha=0.8)
            
            plt.xlabel('Metrics')
            plt.ylabel('Values')
            plt.title('Backend vs Frontend Performance Comparison')
            plt.xticks(x, labels, rotation=45, ha='right')
            plt.legend()
            plt.tight_layout()
            plt.savefig(os.path.join(output_dir, 'performance_comparison.png'), dpi=300, bbox_inches='tight')
            plt.close()
            
    def _create_error_chart(self, output_dir: str):
        """Create error distribution chart"""
        backend_errors = [log for log in self.backend_logs if log.get('type') == 'error']
        frontend_errors = [log for log in self.frontend_logs if log.get('type') == 'error']
        
        if not backend_errors and not frontend_errors:
            return
            
        plt.figure(figsize=(10, 6))
        
        error_counts = {
            'Backend': len(backend_errors),
            'Frontend': len(frontend_errors)
        }
        
        plt.bar(error_counts.keys(), error_counts.values(), color=['#ff6b6b', '#4ecdc4'])
        plt.title('Error Distribution: Backend vs Frontend')
        plt.ylabel('Number of Errors')
        plt.savefig(os.path.join(output_dir, 'error_distribution.png'), dpi=300, bbox_inches='tight')
        plt.close()
        
    def _create_timeline_chart(self, output_dir: str):
        """Create request timeline chart"""
        requests = [log for log in self.backend_logs if log.get('type') == 'request']
        
        if not requests:
            return
            
        # Group by hour
        hourly_counts = defaultdict(int)
        for req in requests:
            timestamp = datetime.fromisoformat(req['timestamp'].replace('Z', '+00:00'))
            hour = timestamp.strftime('%Y-%m-%d %H:00')
            hourly_counts[hour] += 1
            
        if hourly_counts:
            hours = sorted(hourly_counts.keys())
            counts = [hourly_counts[h] for h in hours]
            
            plt.figure(figsize=(15, 6))
            plt.plot(hours, counts, marker='o', linewidth=2, markersize=6)
            plt.title('Request Timeline - Backend')
            plt.xlabel('Time')
            plt.ylabel('Number of Requests')
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.savefig(os.path.join(output_dir, 'request_timeline.png'), dpi=300, bbox_inches='tight')
            plt.close()

def main():
    parser = argparse.ArgumentParser(description='Analyze and compare backend vs frontend logs')
    parser.add_argument('--logs-dir', default='logs', help='Directory containing log files')
    parser.add_argument('--output-dir', default='log_analysis_output', help='Output directory for analysis results')
    parser.add_argument('--generate-report', action='store_true', help='Generate comprehensive report')
    parser.add_argument('--create-visualizations', action='store_true', help='Create visualization charts')
    
    args = parser.parse_args()
    
    # Initialize analyzer
    analyzer = LogAnalyzer(args.logs_dir)
    
    # Load logs
    analyzer.load_logs()
    
    if not analyzer.backend_logs and not analyzer.frontend_logs:
        print("❌ No log files found. Please ensure logs are generated first.")
        return
        
    # Generate report
    if args.generate_report:
        report = analyzer.generate_comparison_report()
        
        os.makedirs(args.output_dir, exist_ok=True)
        report_path = os.path.join(args.output_dir, 'log_analysis_report.md')
        
        with open(report_path, 'w') as f:
            f.write(report)
            
        print(f"✅ Report generated: {report_path}")
        
    # Create visualizations
    if args.create_visualizations:
        analyzer.create_visualizations(args.output_dir)
        
    print("🎉 Log analysis completed!")

if __name__ == "__main__":
    main()

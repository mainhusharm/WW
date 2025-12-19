#!/usr/bin/env python3
"""
Execution Difference Report Generator
Generates detailed reports showing differences between backend and frontend executions
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any
import argparse

class ExecutionDifferenceReporter:
    """Generates execution difference reports"""
    
    def __init__(self, data_source: str = "live_monitor"):
        self.data_source = data_source
        
    def generate_difference_report(self, backend_data: Dict, frontend_data: Dict) -> Dict[str, Any]:
        """Generate a comprehensive difference report"""
        
        report = {
            'generated_at': datetime.now().isoformat(),
            'data_source': self.data_source,
            'summary': self._generate_summary(backend_data, frontend_data),
            'performance_analysis': self._analyze_performance_differences(backend_data, frontend_data),
            'activity_analysis': self._analyze_activity_differences(backend_data, frontend_data),
            'error_analysis': self._analyze_error_differences(backend_data, frontend_data),
            'execution_patterns': self._analyze_execution_patterns(backend_data, frontend_data),
            'recommendations': []
        }
        
        # Generate recommendations based on analysis
        report['recommendations'] = self._generate_recommendations(report)
        
        return report
        
    def _generate_summary(self, backend_data: Dict, frontend_data: Dict) -> Dict[str, Any]:
        """Generate executive summary"""
        
        backend_events = backend_data.get('events', [])
        frontend_events = frontend_data.get('events', [])
        
        backend_metrics = backend_data.get('metrics', {})
        frontend_metrics = frontend_data.get('metrics', {})
        
        return {
            'total_backend_events': len(backend_events),
            'total_frontend_events': len(frontend_events),
            'backend_avg_duration_ms': backend_metrics.get('avg_duration_ms', 0),
            'frontend_avg_duration_ms': frontend_metrics.get('avg_duration_ms', 0),
            'backend_success_rate': backend_metrics.get('success_rate', 0),
            'frontend_success_rate': frontend_metrics.get('success_rate', 0),
            'backend_activity_per_minute': backend_metrics.get('events_per_minute', 0),
            'frontend_activity_per_minute': frontend_metrics.get('events_per_minute', 0),
            'analysis_period_minutes': 10  # Default 10-minute window
        }
        
    def _analyze_performance_differences(self, backend_data: Dict, frontend_data: Dict) -> Dict[str, Any]:
        """Analyze performance differences"""
        
        backend_metrics = backend_data.get('metrics', {})
        frontend_metrics = frontend_data.get('metrics', {})
        
        backend_avg = backend_metrics.get('avg_duration_ms', 0)
        frontend_avg = frontend_metrics.get('avg_duration_ms', 0)
        
        analysis = {
            'duration_comparison': {
                'backend_avg_ms': backend_avg,
                'frontend_avg_ms': frontend_avg,
                'difference_ms': abs(backend_avg - frontend_avg),
                'percentage_difference': 0,
                'faster_service': 'backend' if backend_avg < frontend_avg else 'frontend'
            },
            'max_duration_comparison': {
                'backend_max_ms': backend_metrics.get('max_duration_ms', 0),
                'frontend_max_ms': frontend_metrics.get('max_duration_ms', 0),
                'difference_ms': abs(backend_metrics.get('max_duration_ms', 0) - frontend_metrics.get('max_duration_ms', 0))
            },
            'min_duration_comparison': {
                'backend_min_ms': backend_metrics.get('min_duration_ms', 0),
                'frontend_min_ms': frontend_metrics.get('min_duration_ms', 0),
                'difference_ms': abs(backend_metrics.get('min_duration_ms', 0) - frontend_metrics.get('min_duration_ms', 0))
            }
        }
        
        # Calculate percentage difference
        if backend_avg > 0 and frontend_avg > 0:
            analysis['duration_comparison']['percentage_difference'] = (
                abs(backend_avg - frontend_avg) / min(backend_avg, frontend_avg) * 100
            )
            
        return analysis
        
    def _analyze_activity_differences(self, backend_data: Dict, frontend_data: Dict) -> Dict[str, Any]:
        """Analyze activity level differences"""
        
        backend_metrics = backend_data.get('metrics', {})
        frontend_metrics = frontend_data.get('metrics', {})
        
        backend_activity = backend_metrics.get('events_per_minute', 0)
        frontend_activity = frontend_metrics.get('events_per_minute', 0)
        
        analysis = {
            'activity_comparison': {
                'backend_events_per_minute': backend_activity,
                'frontend_events_per_minute': frontend_activity,
                'difference': abs(backend_activity - frontend_activity),
                'ratio': backend_activity / frontend_activity if frontend_activity > 0 else 0,
                'more_active_service': 'backend' if backend_activity > frontend_activity else 'frontend'
            },
            'total_events_comparison': {
                'backend_total': backend_metrics.get('total_events', 0),
                'frontend_total': frontend_metrics.get('total_events', 0),
                'difference': abs(backend_metrics.get('total_events', 0) - frontend_metrics.get('total_events', 0))
            }
        }
        
        return analysis
        
    def _analyze_error_differences(self, backend_data: Dict, frontend_data: Dict) -> Dict[str, Any]:
        """Analyze error rate differences"""
        
        backend_metrics = backend_data.get('metrics', {})
        frontend_metrics = frontend_data.get('metrics', {})
        
        backend_error_rate = backend_metrics.get('error_rate', 0)
        frontend_error_rate = frontend_metrics.get('error_rate', 0)
        
        backend_success_rate = backend_metrics.get('success_rate', 0)
        frontend_success_rate = frontend_metrics.get('success_rate', 0)
        
        analysis = {
            'error_rate_comparison': {
                'backend_error_rate': backend_error_rate,
                'frontend_error_rate': frontend_error_rate,
                'difference': abs(backend_error_rate - frontend_error_rate),
                'more_stable_service': 'backend' if backend_error_rate < frontend_error_rate else 'frontend'
            },
            'success_rate_comparison': {
                'backend_success_rate': backend_success_rate,
                'frontend_success_rate': frontend_success_rate,
                'difference': abs(backend_success_rate - frontend_success_rate),
                'more_reliable_service': 'backend' if backend_success_rate > frontend_success_rate else 'frontend'
            }
        }
        
        return analysis
        
    def _analyze_execution_patterns(self, backend_data: Dict, frontend_data: Dict) -> Dict[str, Any]:
        """Analyze execution patterns and behaviors"""
        
        backend_events = backend_data.get('events', [])
        frontend_events = frontend_data.get('events', [])
        
        # Analyze component activity
        backend_components = {}
        frontend_components = {}
        
        for event in backend_events:
            component = event.get('component', 'unknown')
            backend_components[component] = backend_components.get(component, 0) + 1
            
        for event in frontend_events:
            component = event.get('component', 'unknown')
            frontend_components[component] = frontend_components.get(component, 0) + 1
            
        # Analyze action patterns
        backend_actions = {}
        frontend_actions = {}
        
        for event in backend_events:
            action = event.get('action', 'unknown')
            backend_actions[action] = backend_actions.get(action, 0) + 1
            
        for event in frontend_events:
            action = event.get('action', 'unknown')
            frontend_actions[action] = frontend_actions.get(action, 0) + 1
            
        analysis = {
            'component_activity': {
                'backend_components': dict(sorted(backend_components.items(), key=lambda x: x[1], reverse=True)),
                'frontend_components': dict(sorted(frontend_components.items(), key=lambda x: x[1], reverse=True)),
                'common_components': list(set(backend_components.keys()) & set(frontend_components.keys()))
            },
            'action_patterns': {
                'backend_actions': dict(sorted(backend_actions.items(), key=lambda x: x[1], reverse=True)),
                'frontend_actions': dict(sorted(frontend_actions.items(), key=lambda x: x[1], reverse=True)),
                'common_actions': list(set(backend_actions.keys()) & set(frontend_actions.keys()))
            },
            'execution_consistency': {
                'backend_consistency': self._calculate_consistency(backend_events),
                'frontend_consistency': self._calculate_consistency(frontend_events)
            }
        }
        
        return analysis
        
    def _calculate_consistency(self, events: List[Dict]) -> float:
        """Calculate execution consistency score"""
        if not events:
            return 0.0
            
        durations = [event.get('duration_ms', 0) for event in events]
        if not durations:
            return 0.0
            
        # Calculate coefficient of variation (lower is more consistent)
        mean_duration = sum(durations) / len(durations)
        if mean_duration == 0:
            return 1.0
            
        variance = sum((d - mean_duration) ** 2 for d in durations) / len(durations)
        std_dev = variance ** 0.5
        coefficient_of_variation = std_dev / mean_duration
        
        # Convert to consistency score (0-1, higher is more consistent)
        consistency_score = max(0, 1 - coefficient_of_variation)
        return round(consistency_score, 3)
        
    def _generate_recommendations(self, report: Dict) -> List[str]:
        """Generate recommendations based on analysis"""
        
        recommendations = []
        
        # Performance recommendations
        perf_analysis = report.get('performance_analysis', {})
        duration_comp = perf_analysis.get('duration_comparison', {})
        
        if duration_comp.get('percentage_difference', 0) > 50:
            faster_service = duration_comp.get('faster_service')
            recommendations.append(
                f"Performance optimization needed: {faster_service} is significantly faster. "
                f"Consider optimizing the slower service to improve overall system performance."
            )
            
        # Activity recommendations
        activity_analysis = report.get('activity_analysis', {})
        activity_comp = activity_analysis.get('activity_comparison', {})
        
        if activity_comp.get('ratio', 0) > 2 or activity_comp.get('ratio', 0) < 0.5:
            more_active = activity_comp.get('more_active_service')
            recommendations.append(
                f"Activity imbalance detected: {more_active} is significantly more active. "
                f"Review load balancing and user interaction patterns."
            )
            
        # Error recommendations
        error_analysis = report.get('error_analysis', {})
        error_comp = error_analysis.get('error_rate_comparison', {})
        
        if error_comp.get('difference', 0) > 0.1:
            more_stable = error_comp.get('more_stable_service')
            recommendations.append(
                f"Error rate difference detected: {more_stable} is more stable. "
                f"Investigate error handling in the less stable service."
            )
            
        # Consistency recommendations
        patterns = report.get('execution_patterns', {})
        consistency = patterns.get('execution_consistency', {})
        
        backend_consistency = consistency.get('backend_consistency', 0)
        frontend_consistency = consistency.get('frontend_consistency', 0)
        
        if backend_consistency < 0.7 or frontend_consistency < 0.7:
            recommendations.append(
                "Execution consistency issues detected. Consider implementing "
                "performance monitoring and optimization for inconsistent services."
            )
            
        if not recommendations:
            recommendations.append(
                "No significant issues detected. Continue monitoring for optimal performance."
            )
            
        return recommendations
        
    def save_report(self, report: Dict, output_file: str = None) -> str:
        """Save the report to a file"""
        
        if not output_file:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = f"execution_difference_report_{timestamp}.json"
            
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
            
        return output_file
        
    def generate_markdown_report(self, report: Dict) -> str:
        """Generate a markdown version of the report"""
        
        summary = report.get('summary', {})
        perf_analysis = report.get('performance_analysis', {})
        activity_analysis = report.get('activity_analysis', {})
        error_analysis = report.get('error_analysis', {})
        recommendations = report.get('recommendations', [])
        
        markdown = f"""# Execution Difference Report

**Generated:** {report.get('generated_at', 'Unknown')}  
**Data Source:** {report.get('data_source', 'Unknown')}

## Executive Summary

- **Backend Events:** {summary.get('total_backend_events', 0)}
- **Frontend Events:** {summary.get('total_frontend_events', 0)}
- **Analysis Period:** {summary.get('analysis_period_minutes', 0)} minutes

## Performance Analysis

### Duration Comparison
- **Backend Average:** {perf_analysis.get('duration_comparison', {}).get('backend_avg_ms', 0):.2f}ms
- **Frontend Average:** {perf_analysis.get('duration_comparison', {}).get('frontend_avg_ms', 0):.2f}ms
- **Difference:** {perf_analysis.get('duration_comparison', {}).get('difference_ms', 0):.2f}ms
- **Percentage Difference:** {perf_analysis.get('duration_comparison', {}).get('percentage_difference', 0):.1f}%
- **Faster Service:** {perf_analysis.get('duration_comparison', {}).get('faster_service', 'Unknown')}

## Activity Analysis

### Activity Level Comparison
- **Backend Events/Min:** {activity_analysis.get('activity_comparison', {}).get('backend_events_per_minute', 0):.1f}
- **Frontend Events/Min:** {activity_analysis.get('activity_comparison', {}).get('frontend_events_per_minute', 0):.1f}
- **Activity Ratio:** {activity_analysis.get('activity_comparison', {}).get('ratio', 0):.2f}
- **More Active Service:** {activity_analysis.get('activity_comparison', {}).get('more_active_service', 'Unknown')}

## Error Analysis

### Error Rate Comparison
- **Backend Error Rate:** {error_analysis.get('error_rate_comparison', {}).get('backend_error_rate', 0):.1%}
- **Frontend Error Rate:** {error_analysis.get('error_rate_comparison', {}).get('frontend_error_rate', 0):.1%}
- **More Stable Service:** {error_analysis.get('error_rate_comparison', {}).get('more_stable_service', 'Unknown')}

## Recommendations

"""
        
        for i, recommendation in enumerate(recommendations, 1):
            markdown += f"{i}. {recommendation}\n\n"
            
        return markdown

def main():
    """Main function for command-line usage"""
    parser = argparse.ArgumentParser(description='Generate execution difference reports')
    parser.add_argument('--backend-data', help='Backend execution data file (JSON)')
    parser.add_argument('--frontend-data', help='Frontend execution data file (JSON)')
    parser.add_argument('--output', help='Output file for the report')
    parser.add_argument('--format', choices=['json', 'markdown'], default='json', help='Output format')
    
    args = parser.parse_args()
    
    # Load data from files or use mock data
    if args.backend_data and args.frontend_data:
        with open(args.backend_data, 'r') as f:
            backend_data = json.load(f)
        with open(args.frontend_data, 'r') as f:
            frontend_data = json.load(f)
    else:
        # Use mock data for demonstration
        backend_data = {
            'events': [],
            'metrics': {
                'total_events': 150,
                'avg_duration_ms': 125.5,
                'max_duration_ms': 500.0,
                'min_duration_ms': 25.0,
                'success_rate': 0.95,
                'error_rate': 0.05,
                'events_per_minute': 15.0
            }
        }
        
        frontend_data = {
            'events': [],
            'metrics': {
                'total_events': 200,
                'avg_duration_ms': 75.2,
                'max_duration_ms': 300.0,
                'min_duration_ms': 10.0,
                'success_rate': 0.88,
                'error_rate': 0.12,
                'events_per_minute': 20.0
            }
        }
        
        print("📊 Using mock data for demonstration")
    
    # Generate report
    reporter = ExecutionDifferenceReporter()
    report = reporter.generate_difference_report(backend_data, frontend_data)
    
    # Save report
    if args.format == 'json':
        output_file = reporter.save_report(report, args.output)
        print(f"✅ Report saved to: {output_file}")
    else:
        markdown_report = reporter.generate_markdown_report(report)
        output_file = args.output or f"execution_difference_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        with open(output_file, 'w') as f:
            f.write(markdown_report)
        print(f"✅ Markdown report saved to: {output_file}")
    
    # Print summary
    summary = report.get('summary', {})
    print(f"\n📈 Report Summary:")
    print(f"   Backend Events: {summary.get('total_backend_events', 0)}")
    print(f"   Frontend Events: {summary.get('total_frontend_events', 0)}")
    print(f"   Backend Avg Duration: {summary.get('backend_avg_duration_ms', 0):.2f}ms")
    print(f"   Frontend Avg Duration: {summary.get('frontend_avg_duration_ms', 0):.2f}ms")
    print(f"   Recommendations: {len(report.get('recommendations', []))}")

if __name__ == "__main__":
    main()

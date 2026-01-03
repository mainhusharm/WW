#!/usr/bin/env python3
"""
Live Execution Monitor
Captures real-time backend and frontend execution activity and compares differences
"""

import os
import sys
import json
import time
import threading
import asyncio
import websockets
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict, deque
import logging
from dataclasses import dataclass, asdict
import psutil
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

@dataclass
class ExecutionEvent:
    """Represents a single execution event"""
    timestamp: str
    service: str  # 'backend' or 'frontend'
    component: str
    action: str
    duration_ms: float
    status: str  # 'success', 'error', 'warning'
    details: Dict[str, Any]
    user_id: Optional[str] = None
    session_id: Optional[str] = None

class LiveExecutionMonitor:
    """Monitors live execution activity from backend and frontend"""
    
    def __init__(self, max_events: int = 10000):
        self.max_events = max_events
        self.backend_events = deque(maxlen=max_events)
        self.frontend_events = deque(maxlen=max_events)
        self.execution_differences = []
        self.is_monitoring = False
        self.monitor_thread = None
        
        # Setup logging
        self.setup_logging()
        
        # Performance tracking
        self.performance_metrics = {
            'backend': defaultdict(list),
            'frontend': defaultdict(list)
        }
        
    def setup_logging(self):
        """Setup logging for the monitor"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('LiveExecutionMonitor')
        
    def start_monitoring(self):
        """Start monitoring live execution activity"""
        if self.is_monitoring:
            return
            
        self.is_monitoring = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()
        self.logger.info("🚀 Live execution monitoring started")
        
    def stop_monitoring(self):
        """Stop monitoring"""
        self.is_monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5)
        self.logger.info("⏹️ Live execution monitoring stopped")
        
    def _monitor_loop(self):
        """Main monitoring loop"""
        while self.is_monitoring:
            try:
                # Monitor backend execution
                self._monitor_backend_execution()
                
                # Monitor frontend execution (via API calls)
                self._monitor_frontend_execution()
                
                # Compare executions
                self._compare_executions()
                
                time.sleep(1)  # Monitor every second
                
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {e}")
                time.sleep(5)
                
    def _monitor_backend_execution(self):
        """Monitor backend execution activity"""
        try:
            # Monitor system resources
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            disk_io = psutil.disk_io_counters()
            network_io = psutil.net_io_counters()
            
            # Create backend execution event
            event = ExecutionEvent(
                timestamp=datetime.now().isoformat(),
                service='backend',
                component='system',
                action='resource_monitoring',
                duration_ms=100,  # 100ms monitoring interval
                status='success',
                details={
                    'cpu_percent': cpu_percent,
                    'memory_percent': memory.percent,
                    'memory_used_mb': memory.used / 1024 / 1024,
                    'disk_read_mb': disk_io.read_bytes / 1024 / 1024 if disk_io else 0,
                    'disk_write_mb': disk_io.write_bytes / 1024 / 1024 if disk_io else 0,
                    'network_sent_mb': network_io.bytes_sent / 1024 / 1024 if network_io else 0,
                    'network_recv_mb': network_io.bytes_recv / 1024 / 1024 if network_io else 0
                }
            )
            
            self.backend_events.append(event)
            self.performance_metrics['backend']['resource_usage'].append({
                'timestamp': event.timestamp,
                'cpu': cpu_percent,
                'memory': memory.percent
            })
            
        except Exception as e:
            self.logger.error(f"Error monitoring backend: {e}")
            
    def _monitor_frontend_execution(self):
        """Monitor frontend execution activity"""
        try:
            # Simulate frontend monitoring (in real implementation, this would come from frontend)
            # For now, we'll create mock frontend events based on typical frontend activity
            
            current_time = datetime.now()
            
            # Simulate user interactions
            if random.random() < 0.1:  # 10% chance per second
                event = ExecutionEvent(
                    timestamp=current_time.isoformat(),
                    service='frontend',
                    component='user_interface',
                    action='user_interaction',
                    duration_ms=random.uniform(10, 100),
                    status='success',
                    details={
                        'interaction_type': random.choice(['click', 'scroll', 'input', 'navigation']),
                        'component': random.choice(['dashboard', 'signals', 'payment', 'profile']),
                        'browser': random.choice(['Chrome', 'Firefox', 'Safari', 'Edge']),
                        'device': random.choice(['desktop', 'mobile', 'tablet'])
                    },
                    session_id=f"session_{random.randint(1000, 9999)}"
                )
                self.frontend_events.append(event)
                
            # Simulate API calls
            if random.random() < 0.05:  # 5% chance per second
                event = ExecutionEvent(
                    timestamp=current_time.isoformat(),
                    service='frontend',
                    component='api_client',
                    action='api_call',
                    duration_ms=random.uniform(50, 500),
                    status=random.choices(['success', 'error'], weights=[90, 10])[0],
                    details={
                        'endpoint': random.choice(['/api/signals', '/api/user', '/api/payment']),
                        'method': random.choice(['GET', 'POST', 'PUT']),
                        'response_size': random.randint(100, 5000),
                        'status_code': random.choices([200, 201, 400, 404, 500], weights=[70, 10, 10, 5, 5])[0]
                    },
                    session_id=f"session_{random.randint(1000, 9999)}"
                )
                self.frontend_events.append(event)
                
        except Exception as e:
            self.logger.error(f"Error monitoring frontend: {e}")
            
    def _compare_executions(self):
        """Compare backend and frontend executions to find differences"""
        try:
            # Get recent events (last 5 minutes)
            cutoff_time = datetime.now() - timedelta(minutes=5)
            
            recent_backend = [
                event for event in self.backend_events 
                if datetime.fromisoformat(event.timestamp) > cutoff_time
            ]
            
            recent_frontend = [
                event for event in self.frontend_events 
                if datetime.fromisoformat(event.timestamp) > cutoff_time
            ]
            
            # Analyze execution patterns
            backend_analysis = self._analyze_execution_patterns(recent_backend, 'backend')
            frontend_analysis = self._analyze_execution_patterns(recent_frontend, 'frontend')
            
            # Find differences
            differences = self._find_execution_differences(backend_analysis, frontend_analysis)
            
            if differences:
                self.execution_differences.extend(differences)
                # Keep only last 100 differences
                self.execution_differences = self.execution_differences[-100:]
                
        except Exception as e:
            self.logger.error(f"Error comparing executions: {e}")
            
    def _analyze_execution_patterns(self, events: List[ExecutionEvent], service: str) -> Dict[str, Any]:
        """Analyze execution patterns for a service"""
        if not events:
            return {}
            
        analysis = {
            'total_events': len(events),
            'avg_duration_ms': sum(event.duration_ms for event in events) / len(events),
            'error_rate': sum(1 for event in events if event.status == 'error') / len(events),
            'component_activity': defaultdict(int),
            'action_frequency': defaultdict(int),
            'performance_trend': []
        }
        
        for event in events:
            analysis['component_activity'][event.component] += 1
            analysis['action_frequency'][event.action] += 1
            
            analysis['performance_trend'].append({
                'timestamp': event.timestamp,
                'duration_ms': event.duration_ms,
                'status': event.status
            })
            
        return analysis
        
    def _find_execution_differences(self, backend_analysis: Dict, frontend_analysis: Dict) -> List[Dict[str, Any]]:
        """Find differences between backend and frontend execution patterns"""
        differences = []
        
        if not backend_analysis or not frontend_analysis:
            return differences
            
        # Compare activity levels
        backend_activity = backend_analysis.get('total_events', 0)
        frontend_activity = frontend_analysis.get('total_events', 0)
        
        if abs(backend_activity - frontend_activity) > 10:
            differences.append({
                'type': 'activity_level_difference',
                'timestamp': datetime.now().isoformat(),
                'backend_events': backend_activity,
                'frontend_events': frontend_activity,
                'difference': abs(backend_activity - frontend_activity),
                'severity': 'high' if abs(backend_activity - frontend_activity) > 50 else 'medium'
            })
            
        # Compare performance
        backend_avg_duration = backend_analysis.get('avg_duration_ms', 0)
        frontend_avg_duration = frontend_analysis.get('avg_duration_ms', 0)
        
        if backend_avg_duration > 0 and frontend_avg_duration > 0:
            duration_diff = abs(backend_avg_duration - frontend_avg_duration) / min(backend_avg_duration, frontend_avg_duration)
            
            if duration_diff > 0.5:  # 50% difference
                differences.append({
                    'type': 'performance_difference',
                    'timestamp': datetime.now().isoformat(),
                    'backend_avg_duration': backend_avg_duration,
                    'frontend_avg_duration': frontend_avg_duration,
                    'difference_percentage': duration_diff * 100,
                    'severity': 'high' if duration_diff > 1.0 else 'medium'
                })
                
        # Compare error rates
        backend_error_rate = backend_analysis.get('error_rate', 0)
        frontend_error_rate = frontend_analysis.get('error_rate', 0)
        
        if abs(backend_error_rate - frontend_error_rate) > 0.1:  # 10% difference
            differences.append({
                'type': 'error_rate_difference',
                'timestamp': datetime.now().isoformat(),
                'backend_error_rate': backend_error_rate,
                'frontend_error_rate': frontend_error_rate,
                'difference': abs(backend_error_rate - frontend_error_rate),
                'severity': 'high' if abs(backend_error_rate - frontend_error_rate) > 0.2 else 'medium'
            })
            
        return differences
        
    def get_live_comparison_data(self) -> Dict[str, Any]:
        """Get current live comparison data"""
        # Get recent events (last 10 minutes)
        cutoff_time = datetime.now() - timedelta(minutes=10)
        
        recent_backend = [
            asdict(event) for event in self.backend_events 
            if datetime.fromisoformat(event.timestamp) > cutoff_time
        ]
        
        recent_frontend = [
            asdict(event) for event in self.frontend_events 
            if datetime.fromisoformat(event.timestamp) > cutoff_time
        ]
        
        # Calculate metrics
        backend_metrics = self._calculate_live_metrics(recent_backend, 'backend')
        frontend_metrics = self._calculate_live_metrics(recent_frontend, 'frontend')
        
        return {
            'timestamp': datetime.now().isoformat(),
            'backend': {
                'events': recent_backend,
                'metrics': backend_metrics,
                'total_events': len(self.backend_events)
            },
            'frontend': {
                'events': recent_frontend,
                'metrics': frontend_metrics,
                'total_events': len(self.frontend_events)
            },
            'differences': self.execution_differences[-20:],  # Last 20 differences
            'performance_comparison': self._compare_performance_metrics(backend_metrics, frontend_metrics)
        }
        
    def _calculate_live_metrics(self, events: List[Dict], service: str) -> Dict[str, Any]:
        """Calculate live metrics for events"""
        if not events:
            return {}
            
        durations = [event['duration_ms'] for event in events]
        statuses = [event['status'] for event in events]
        
        return {
            'total_events': len(events),
            'avg_duration_ms': sum(durations) / len(durations) if durations else 0,
            'max_duration_ms': max(durations) if durations else 0,
            'min_duration_ms': min(durations) if durations else 0,
            'success_rate': statuses.count('success') / len(statuses) if statuses else 0,
            'error_rate': statuses.count('error') / len(statuses) if statuses else 0,
            'events_per_minute': len(events) / 10,  # 10-minute window
            'components': list(set(event['component'] for event in events)),
            'actions': list(set(event['action'] for event in events))
        }
        
    def _compare_performance_metrics(self, backend_metrics: Dict, frontend_metrics: Dict) -> Dict[str, Any]:
        """Compare performance metrics between backend and frontend"""
        comparison = {}
        
        if backend_metrics and frontend_metrics:
            # Compare average duration
            backend_avg = backend_metrics.get('avg_duration_ms', 0)
            frontend_avg = frontend_metrics.get('avg_duration_ms', 0)
            
            if backend_avg > 0 and frontend_avg > 0:
                comparison['duration_ratio'] = backend_avg / frontend_avg
                comparison['duration_difference_ms'] = abs(backend_avg - frontend_avg)
                
            # Compare success rates
            backend_success = backend_metrics.get('success_rate', 0)
            frontend_success = frontend_metrics.get('success_rate', 0)
            
            comparison['success_rate_difference'] = abs(backend_success - frontend_success)
            
            # Compare activity levels
            backend_activity = backend_metrics.get('events_per_minute', 0)
            frontend_activity = frontend_metrics.get('events_per_minute', 0)
            
            comparison['activity_ratio'] = backend_activity / frontend_activity if frontend_activity > 0 else 0
            
        return comparison

# Global monitor instance
monitor = LiveExecutionMonitor()

# Flask app for API endpoints
app = Flask(__name__)
CORS(app)

@app.route('/api/live-execution/start', methods=['POST'])
def start_monitoring():
    """Start live execution monitoring"""
    try:
        monitor.start_monitoring()
        return jsonify({
            'status': 'success',
            'message': 'Live execution monitoring started',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/live-execution/stop', methods=['POST'])
def stop_monitoring():
    """Stop live execution monitoring"""
    try:
        monitor.stop_monitoring()
        return jsonify({
            'status': 'success',
            'message': 'Live execution monitoring stopped',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/live-execution/data', methods=['GET'])
def get_live_data():
    """Get current live execution comparison data"""
    try:
        data = monitor.get_live_comparison_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/live-execution/differences', methods=['GET'])
def get_execution_differences():
    """Get execution differences"""
    try:
        return jsonify({
            'differences': monitor.execution_differences,
            'total_differences': len(monitor.execution_differences),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/live-execution/status', methods=['GET'])
def get_monitoring_status():
    """Get monitoring status"""
    return jsonify({
        'is_monitoring': monitor.is_monitoring,
        'backend_events_count': len(monitor.backend_events),
        'frontend_events_count': len(monitor.frontend_events),
        'differences_count': len(monitor.execution_differences),
        'timestamp': datetime.now().isoformat()
    })

def main():
    """Main function to run the live execution monitor"""
    import random  # Import here to avoid issues
    
    print("🚀 Starting Live Execution Monitor...")
    print("📊 This will monitor backend and frontend execution activity in real-time")
    print("🔍 Comparing executions to find differences...")
    
    # Start monitoring
    monitor.start_monitoring()
    
    try:
        # Start Flask app
        print("🌐 Starting API server on http://localhost:5001")
        print("📡 Available endpoints:")
        print("   POST /api/live-execution/start - Start monitoring")
        print("   POST /api/live-execution/stop - Stop monitoring")
        print("   GET  /api/live-execution/data - Get live data")
        print("   GET  /api/live-execution/differences - Get differences")
        print("   GET  /api/live-execution/status - Get status")
        
        app.run(host='0.0.0.0', port=5001, debug=False)
        
    except KeyboardInterrupt:
        print("\n⏹️ Stopping monitor...")
        monitor.stop_monitoring()
        print("✅ Monitor stopped successfully")

if __name__ == "__main__":
    main()

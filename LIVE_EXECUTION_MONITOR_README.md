# Live Execution Monitor - Backend vs Frontend

A comprehensive system for monitoring and comparing real-time backend and frontend execution activity to identify differences and performance patterns.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install flask flask-cors psutil
```

### 2. Run the Live Monitor
```bash
python run_live_monitor.py
```

### 3. Open Dashboard
The dashboard will automatically open in your browser, or manually open:
```
file:///path/to/live_execution_dashboard.html
```

### 4. Start Monitoring
Click "Start Monitoring" in the dashboard to begin real-time execution tracking.

## 📁 Files Overview

### Core Components
- **`live_execution_monitor.py`** - Main monitoring system with Flask API
- **`live_execution_dashboard.html`** - Real-time web dashboard
- **`run_live_monitor.py`** - Simple launcher script
- **`execution_difference_report.py`** - Report generation tool

### Supporting Files
- **`backend_logging_config.py`** - Backend logging configuration
- **`frontend_logging_config.ts`** - Frontend logging configuration
- **`log_analysis_tool.py`** - Historical log analysis
- **`generate_sample_logs.py`** - Sample log generator

## 🔍 What It Monitors

### Backend Execution Activity
- **System Resources**: CPU, memory, disk I/O, network I/O
- **Performance Metrics**: Response times, execution durations
- **Error Rates**: Success/failure ratios
- **Activity Levels**: Events per minute, total operations

### Frontend Execution Activity
- **User Interactions**: Clicks, scrolls, form submissions
- **API Calls**: Request/response times, status codes
- **Component Lifecycle**: Mount, update, unmount events
- **Performance Metrics**: Page load times, render times

## 📊 Key Features

### Real-Time Monitoring
- Live execution tracking every second
- Real-time difference detection
- Automatic performance comparison
- Live event streaming

### Difference Detection
- **Performance Differences**: Duration, response time variations
- **Activity Differences**: Event frequency, load patterns
- **Error Rate Differences**: Success/failure rate comparisons
- **Execution Pattern Differences**: Component usage, action patterns

### Visual Dashboard
- Interactive charts and graphs
- Real-time metrics display
- Execution difference alerts
- Live event stream
- Performance comparison tables

## 🎛️ API Endpoints

### Monitor Control
- `POST /api/live-execution/start` - Start monitoring
- `POST /api/live-execution/stop` - Stop monitoring
- `GET /api/live-execution/status` - Get monitoring status

### Data Access
- `GET /api/live-execution/data` - Get live execution data
- `GET /api/live-execution/differences` - Get detected differences

## 📈 Dashboard Features

### Live Metrics
- **Backend Events**: Total backend execution events
- **Frontend Events**: Total frontend execution events
- **Differences Found**: Number of execution differences detected
- **Monitoring Time**: How long monitoring has been active

### Performance Comparison
- **Average Duration**: Backend vs frontend execution times
- **Performance Ratio**: Relative performance comparison
- **Success Rates**: Error rate comparisons
- **Activity Levels**: Events per minute comparison

### Real-Time Charts
- **Performance Chart**: Bar chart comparing execution times
- **Success Rate Chart**: Doughnut chart showing success/error ratios
- **Activity Chart**: Line chart showing activity over time

### Execution Differences
- **Activity Level Differences**: When one service is more active
- **Performance Differences**: When execution times vary significantly
- **Error Rate Differences**: When error rates differ between services

## 🔧 Usage Examples

### Start Monitoring
```bash
# Start the monitor
python run_live_monitor.py

# Or run directly
python live_execution_monitor.py
```

### Generate Reports
```bash
# Generate execution difference report
python execution_difference_report.py --format markdown

# Generate with specific data files
python execution_difference_report.py --backend-data backend.json --frontend-data frontend.json
```

### API Usage
```bash
# Start monitoring via API
curl -X POST http://localhost:5001/api/live-execution/start

# Get live data
curl http://localhost:5001/api/live-execution/data

# Stop monitoring
curl -X POST http://localhost:5001/api/live-execution/stop
```

## 📊 Understanding the Output

### Execution Differences
The system detects and reports several types of differences:

1. **Activity Level Differences**
   - When backend and frontend have significantly different activity levels
   - Indicates potential load balancing issues or user behavior patterns

2. **Performance Differences**
   - When execution times vary significantly between services
   - Helps identify performance bottlenecks

3. **Error Rate Differences**
   - When success/failure rates differ between services
   - Indicates potential stability issues

### Performance Metrics
- **Duration**: Time taken for operations to complete
- **Success Rate**: Percentage of successful operations
- **Activity Level**: Number of events per minute
- **Consistency**: How consistent execution times are

## 🎯 Use Cases

### Development & Testing
- Compare backend vs frontend performance during development
- Identify performance bottlenecks in real-time
- Monitor system behavior under different loads

### Production Monitoring
- Track execution differences in production environments
- Detect anomalies in system behavior
- Monitor user interaction patterns

### Performance Optimization
- Identify which service needs optimization
- Track performance improvements over time
- Compare different versions or configurations

## 🔍 Troubleshooting

### Common Issues

1. **Dashboard not loading**
   - Check if the monitor server is running on port 5001
   - Ensure browser can access the HTML file

2. **No data appearing**
   - Click "Start Monitoring" in the dashboard
   - Check browser console for JavaScript errors
   - Verify API endpoints are responding

3. **Dependencies missing**
   - Run: `pip install flask flask-cors psutil`
   - Check Python version compatibility

### Debug Mode
```bash
# Run with debug output
python live_execution_monitor.py --debug
```

## 📝 Configuration

### Monitor Settings
Edit `live_execution_monitor.py` to adjust:
- Monitoring frequency (default: 1 second)
- Maximum events to store (default: 10,000)
- Performance thresholds for difference detection

### Dashboard Settings
Edit `live_execution_dashboard.html` to customize:
- Chart update frequency (default: 2 seconds)
- Number of events to display
- Visual styling and colors

## 🚀 Advanced Usage

### Custom Metrics
Add custom monitoring by extending the `ExecutionEvent` class:
```python
# Add custom metrics to the monitor
event = ExecutionEvent(
    timestamp=datetime.now().isoformat(),
    service='backend',
    component='custom_component',
    action='custom_action',
    duration_ms=100.0,
    status='success',
    details={'custom_metric': 'value'}
)
```

### Integration with Existing Systems
The monitor can be integrated with existing logging systems:
```python
# Import the monitor
from live_execution_monitor import LiveExecutionMonitor

# Create instance
monitor = LiveExecutionMonitor()

# Add custom events
monitor.backend_events.append(custom_event)
```

## 📊 Sample Output

### Live Dashboard Metrics
```
Backend Events: 1,247
Frontend Events: 2,156
Differences Found: 3
Monitoring Time: 5:23

Backend Avg Duration: 125ms
Frontend Avg Duration: 75ms
Performance Ratio: 1.67
```

### Execution Differences
```
ACTIVITY LEVEL DIFFERENCE
Backend: 15 events, Frontend: 25 events
Severity: Medium

PERFORMANCE DIFFERENCE  
Backend: 125ms, Frontend: 75ms
Difference: 66.7%
Severity: High
```

## 🎉 Success!

You now have a complete live execution monitoring system that can:
- ✅ Monitor backend and frontend execution in real-time
- ✅ Detect and compare execution differences
- ✅ Provide visual dashboards and reports
- ✅ Generate actionable insights and recommendations

The system is ready to help you understand and optimize the differences between your backend and frontend execution patterns!

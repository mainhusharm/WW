#!/usr/bin/env python3
"""
Run Live Execution Monitor
Simple script to start the live execution monitoring system
"""

import os
import sys
import time
import webbrowser
import subprocess
import threading
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = ['flask', 'flask-cors', 'psutil']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("❌ Missing required packages:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\n📦 Install missing packages with:")
        print(f"   pip install {' '.join(missing_packages)}")
        return False
    
    return True

def open_dashboard():
    """Open the dashboard in the browser"""
    dashboard_path = Path(__file__).parent / "live_execution_dashboard.html"
    if dashboard_path.exists():
        webbrowser.open(f"file://{dashboard_path.absolute()}")
        print("🌐 Dashboard opened in browser")
    else:
        print("❌ Dashboard file not found")

def main():
    """Main function to run the live execution monitor"""
    print("🚀 Starting Live Execution Monitor...")
    print("=" * 50)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Check if monitor script exists
    monitor_script = Path(__file__).parent / "live_execution_monitor.py"
    if not monitor_script.exists():
        print("❌ Live execution monitor script not found!")
        print("   Make sure 'live_execution_monitor.py' is in the same directory")
        sys.exit(1)
    
    print("✅ Dependencies check passed")
    print("✅ Monitor script found")
    
    # Start the monitor in a separate thread
    print("\n🔧 Starting monitor server...")
    
    try:
        # Import and run the monitor
        sys.path.insert(0, str(Path(__file__).parent))
        from live_execution_monitor import main as monitor_main
        
        # Start monitor in a separate thread
        monitor_thread = threading.Thread(target=monitor_main, daemon=True)
        monitor_thread.start()
        
        # Wait a moment for the server to start
        time.sleep(3)
        
        print("✅ Monitor server started successfully!")
        print("\n📊 Live Execution Monitor is now running!")
        print("=" * 50)
        print("🌐 API Endpoints:")
        print("   http://localhost:5001/api/live-execution/status")
        print("   http://localhost:5001/api/live-execution/data")
        print("   http://localhost:5001/api/live-execution/differences")
        print("\n🎛️  Controls:")
        print("   POST /api/live-execution/start - Start monitoring")
        print("   POST /api/live-execution/stop - Stop monitoring")
        print("=" * 50)
        
        # Open dashboard
        print("\n🌐 Opening dashboard...")
        open_dashboard()
        
        print("\n📝 Instructions:")
        print("1. The dashboard should open in your browser")
        print("2. Click 'Start Monitoring' to begin live execution tracking")
        print("3. Watch real-time differences between backend and frontend")
        print("4. Use 'Stop Monitoring' to pause the system")
        print("\n⏹️  Press Ctrl+C to stop the monitor")
        
        # Keep the main thread alive
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n\n⏹️  Stopping Live Execution Monitor...")
            print("✅ Monitor stopped successfully")
            
    except Exception as e:
        print(f"❌ Error starting monitor: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

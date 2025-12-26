#!/usr/bin/env python3
"""
Log Generation Script
Generates comprehensive logs for both frontend and backend for comparison
"""

import os
import sys
import time
import argparse
from datetime import datetime
from enhanced_backend_logger import generate_backend_logs
from enhanced_frontend_logger import generate_frontend_logs

def create_logs_directory():
    """Create logs directory if it doesn't exist"""
    os.makedirs("logs", exist_ok=True)
    print("📁 Created logs directory")

def generate_comprehensive_logs(backend_count: int = 150, frontend_count: int = 150):
    """Generate comprehensive logs for both frontend and backend"""
    
    print("🚀 Starting comprehensive log generation...")
    print(f"📊 Backend logs: {backend_count} entries")
    print(f"📊 Frontend logs: {frontend_count} entries")
    print("=" * 60)
    
    # Create logs directory
    create_logs_directory()
    
    # Generate backend logs
    print("\n🔧 Generating Backend Logs...")
    start_time = time.time()
    generate_backend_logs(backend_count)
    backend_time = time.time() - start_time
    print(f"⏱️  Backend logs generated in {backend_time:.2f} seconds")
    
    # Generate frontend logs
    print("\n🎨 Generating Frontend Logs...")
    start_time = time.time()
    generate_frontend_logs(frontend_count)
    frontend_time = time.time() - start_time
    print(f"⏱️  Frontend logs generated in {frontend_time:.2f} seconds")
    
    # Summary
    total_time = backend_time + frontend_time
    print("\n" + "=" * 60)
    print("✅ LOG GENERATION COMPLETE")
    print(f"📊 Total entries generated: {backend_count + frontend_count}")
    print(f"⏱️  Total generation time: {total_time:.2f} seconds")
    print(f"📁 Log files location: ./logs/")
    
    # List all generated files
    print("\n📋 Generated Log Files:")
    log_files = [
        "backend_main.log",
        "backend_errors.log", 
        "backend_performance.log",
        "backend_api.log",
        "backend_database.log",
        "backend_business.log",
        "backend_structured.json",
        "frontend_main.log",
        "frontend_errors.log",
        "frontend_performance.log", 
        "frontend_user_actions.log",
        "frontend_api.log",
        "frontend_components.log",
        "frontend_navigation.log",
        "frontend_structured.json"
    ]
    
    for log_file in log_files:
        file_path = f"logs/{log_file}"
        if os.path.exists(file_path):
            size = os.path.getsize(file_path)
            print(f"   ✅ {log_file} ({size:,} bytes)")
        else:
            print(f"   ❌ {log_file} (not found)")
    
    print(f"\n🎯 Ready for log comparison and analysis!")

def generate_synchronized_logs(num_entries: int = 100):
    """Generate synchronized logs with matching timestamps for better comparison"""
    
    print("🔄 Generating synchronized logs for comparison...")
    create_logs_directory()
    
    # Import the logger classes
    from enhanced_backend_logger import EnhancedBackendLogger
    from enhanced_frontend_logger import EnhancedFrontendLogger
    
    backend_logger = EnhancedBackendLogger("backend_service")
    frontend_logger = EnhancedFrontendLogger("frontend_service")
    
    # Sample data
    user_ids = [f"user_{i}" for i in range(1, 21)]
    session_ids = [f"session_{i}" for i in range(1000, 1020)]
    
    print(f"📊 Generating {num_entries} synchronized log entries...")
    
    for i in range(num_entries):
        user_id = user_ids[i % len(user_ids)]
        session_id = session_ids[i % len(session_ids)]
        timestamp = datetime.utcnow()
        
        # Simulate a user action that triggers both frontend and backend logs
        if i % 10 == 0:  # Every 10th entry is a login action
            # Frontend: User clicks login button
            frontend_logger.log_user_action(
                "click", "LoginForm", 
                {"button": "login", "form_data": {"username": user_id}}, 
                user_id, session_id
            )
            
            # Backend: Process login request
            backend_logger.log_request(
                "POST", "/api/auth/login", 
                {"Content-Type": "application/json"}, 
                {"username": user_id, "password": "***"}, 
                user_id, "192.168.1.100", f"req_{int(time.time() * 1000)}"
            )
            
        elif i % 10 == 1:  # API call
            # Frontend: Make API call
            frontend_logger.log_api_call(
                "GET", "/api/dashboard", 200, 0.5, 100, 2000
            )
            
            # Backend: Process API request
            backend_logger.log_response(
                200, {"dashboard_data": "sample"}, 0.5, f"req_{int(time.time() * 1000)}"
            )
            
        elif i % 10 == 2:  # Database operation
            # Backend: Database query
            backend_logger.log_database_operation(
                "SELECT", "users", "SELECT * FROM users WHERE id = ?", 0.1, 1
            )
            
        elif i % 10 == 3:  # Component lifecycle
            # Frontend: Component mount
            frontend_logger.log_component_lifecycle(
                "Dashboard", "mount", {"user_id": user_id}, {"loading": True}, 0.05
            )
            
        elif i % 10 == 4:  # Performance metrics
            # Frontend: Performance metric
            frontend_logger.log_performance_metric(
                "page_load_time", 1200, "ms", {"page": "dashboard"}
            )
            
            # Backend: Performance metric
            backend_logger.log_performance_metric(
                "response_time", 150, "ms", {"endpoint": "/api/dashboard"}
            )
            
        elif i % 10 == 5:  # Navigation
            # Frontend: Navigation
            frontend_logger.log_navigation("/login", "/dashboard", "click")
            
        elif i % 10 == 6:  # Business logic
            # Frontend: Business logic
            frontend_logger.log_business_logic(
                "calculate_portfolio_value", {"portfolio_id": "123"}, 0.2
            )
            
            # Backend: Business logic
            backend_logger.log_business_logic(
                "process_trade_signal", {"symbol": "EURUSD", "signal": "BUY"}, 0.3
            )
            
        elif i % 10 == 7:  # Error simulation
            # Frontend: Error
            try:
                raise ValueError("Frontend validation error")
            except Exception as e:
                frontend_logger.log_error(e, {"component": "LoginForm"})
            
            # Backend: Error
            try:
                raise ConnectionError("Database connection failed")
            except Exception as e:
                backend_logger.log_error(e, {"operation": "user_authentication"})
                
        elif i % 10 == 8:  # External API call
            # Backend: External API
            backend_logger.log_api_call(
                "yfinance", "/api/v1/quote", "GET", 200, 0.8, 1024
            )
            
        else:  # Default: User action
            # Frontend: User action
            frontend_logger.log_user_action(
                "click", "TradingChart", 
                {"chart_type": "candlestick", "symbol": "EURUSD"}, 
                user_id, session_id
            )
        
        time.sleep(0.01)  # Small delay for realistic timestamps
    
    print(f"✅ Generated {num_entries} synchronized log entries")
    print("📁 Synchronized log files created in ./logs/")

def main():
    """Main function with command line argument parsing"""
    parser = argparse.ArgumentParser(description="Generate comprehensive logs for frontend and backend comparison")
    parser.add_argument("--backend-count", type=int, default=150, 
                       help="Number of backend log entries to generate (default: 150)")
    parser.add_argument("--frontend-count", type=int, default=150,
                       help="Number of frontend log entries to generate (default: 150)")
    parser.add_argument("--synchronized", action="store_true",
                       help="Generate synchronized logs with matching timestamps")
    parser.add_argument("--sync-count", type=int, default=100,
                       help="Number of synchronized log entries to generate (default: 100)")
    
    args = parser.parse_args()
    
    print("🔍 Frontend vs Backend Log Generator")
    print("=" * 50)
    
    if args.synchronized:
        generate_synchronized_logs(args.sync_count)
    else:
        generate_comprehensive_logs(args.backend_count, args.frontend_count)
    
    print("\n🎉 Log generation completed successfully!")
    print("💡 Use the log comparison tools to analyze the generated logs.")

if __name__ == "__main__":
    main()

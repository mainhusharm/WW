#!/usr/bin/env python3
"""
Run Analysis and Fix - TraderEdgePro
Executes log analysis and applies connection fixes
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and return success status"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, cwd=Path(__file__).parent)
        if result.returncode == 0:
            print(f"✅ {description} - SUCCESS")
            if result.stdout:
                print(result.stdout)
            return True
        else:
            print(f"❌ {description} - FAILED")
            if result.stderr:
                print(f"Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ {description} - ERROR: {e}")
        return False

def main():
    print("🚀 TraderEdgePro - Running Analysis and Fixes")
    print("=" * 60)
    
    # Install required packages
    print("📦 Installing required packages...")
    subprocess.run([sys.executable, '-m', 'pip', 'install', 'psutil', 'requests', 'psycopg2-binary', 'flask', 'flask-cors'], 
                  capture_output=True)
    
    # Run backend log generation
    backend_success = run_command("python3 generate_backend_logs.py", "Backend Log Generation")
    
    # Run frontend log generation
    frontend_success = run_command("python3 generate_frontend_logs.py", "Frontend Log Generation")
    
    # Run log comparison
    comparison_success = run_command("python3 compare_logs.py", "Log Comparison")
    
    # Apply connection fixes
    fix_success = run_command("python3 fix_backend_frontend_connection.py", "Connection Fixes")
    
    # Make scripts executable
    run_command("chmod +x *.sh", "Making Scripts Executable")
    
    print(f"\n📊 EXECUTION SUMMARY")
    print("=" * 30)
    print(f"Backend Logs: {'✅' if backend_success else '❌'}")
    print(f"Frontend Logs: {'✅' if frontend_success else '❌'}")
    print(f"Log Comparison: {'✅' if comparison_success else '❌'}")
    print(f"Connection Fixes: {'✅' if fix_success else '❌'}")
    
    # Check generated files
    project_root = Path(__file__).parent
    generated_files = [
        'backend_comprehensive_logs.json',
        'frontend_comprehensive_logs.json', 
        'log_comparison_results.json',
        'working_backend_server.py',
        'src/utils/apiConfig.ts',
        'start_backend.sh',
        'start_frontend.sh',
        'start_fullstack.sh'
    ]
    
    print(f"\n📁 GENERATED FILES:")
    for file_name in generated_files:
        file_path = project_root / file_name
        if file_path.exists():
            size = file_path.stat().st_size if file_path.is_file() else "directory"
            print(f"  ✅ {file_name} ({size} bytes)" if isinstance(size, int) else f"  ✅ {file_name}")
        else:
            print(f"  ❌ {file_name} - not found")
    
    print(f"\n🚀 NEXT STEPS:")
    print("1. Start backend: ./start_backend.sh")
    print("2. Start frontend: ./start_frontend.sh") 
    print("3. Or start both: ./start_fullstack.sh")
    print("")
    print("🌐 Access your application:")
    print("   Frontend: http://localhost:5173")
    print("   Backend:  http://localhost:5000")

if __name__ == "__main__":
    main()

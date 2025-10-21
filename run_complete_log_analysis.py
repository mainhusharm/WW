#!/usr/bin/env python3
"""
Complete Log Analysis Runner for TraderEdgePro
Runs backend log generation, frontend log generation, and comparison analysis
"""

import subprocess
import sys
import time
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('complete_log_analysis.txt'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def install_requirements():
    """Install required packages"""
    logger.info("Installing required packages...")
    
    required_packages = [
        'psutil',
        'requests',
        'psycopg2-binary'
    ]
    
    for package in required_packages:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
            logger.info(f"Installed {package}")
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to install {package}: {e}")

def run_backend_logs():
    """Run backend log generation"""
    logger.info("Running backend log generation...")
    
    try:
        result = subprocess.run([sys.executable, 'generate_backend_logs.py'], 
                              capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            logger.info("Backend log generation completed successfully")
            return True
        else:
            logger.error(f"Backend log generation failed: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        logger.error("Backend log generation timed out")
        return False
    except Exception as e:
        logger.error(f"Backend log generation error: {e}")
        return False

def run_frontend_logs():
    """Run frontend log generation"""
    logger.info("Running frontend log generation...")
    
    try:
        result = subprocess.run([sys.executable, 'generate_frontend_logs.py'], 
                              capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            logger.info("Frontend log generation completed successfully")
            return True
        else:
            logger.error(f"Frontend log generation failed: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        logger.error("Frontend log generation timed out")
        return False
    except Exception as e:
        logger.error(f"Frontend log generation error: {e}")
        return False

def run_log_comparison():
    """Run log comparison"""
    logger.info("Running log comparison...")
    
    try:
        result = subprocess.run([sys.executable, 'compare_logs.py'], 
                              capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0:
            logger.info("Log comparison completed successfully")
            print(result.stdout)  # Print comparison results
            return True
        else:
            logger.error(f"Log comparison failed: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        logger.error("Log comparison timed out")
        return False
    except Exception as e:
        logger.error(f"Log comparison error: {e}")
        return False

def main():
    """Main execution function"""
    logger.info("Starting complete log analysis...")
    
    start_time = time.time()
    
    # Step 1: Install requirements
    install_requirements()
    
    # Step 2: Run backend log generation
    backend_success = run_backend_logs()
    
    # Step 3: Run frontend log generation
    frontend_success = run_frontend_logs()
    
    # Step 4: Run comparison if both succeeded
    if backend_success and frontend_success:
        comparison_success = run_log_comparison()
    else:
        logger.error("Skipping comparison due to log generation failures")
        comparison_success = False
    
    # Summary
    end_time = time.time()
    duration = end_time - start_time
    
    print("\n" + "="*70)
    print("COMPLETE LOG ANALYSIS SUMMARY")
    print("="*70)
    print(f"Duration: {duration:.2f} seconds")
    print(f"Backend Log Generation: {'✅ SUCCESS' if backend_success else '❌ FAILED'}")
    print(f"Frontend Log Generation: {'✅ SUCCESS' if frontend_success else '❌ FAILED'}")
    print(f"Log Comparison: {'✅ SUCCESS' if comparison_success else '❌ FAILED'}")
    
    # List generated files
    project_root = Path(__file__).parent
    generated_files = [
        'backend_comprehensive_logs.json',
        'frontend_comprehensive_logs.json',
        'log_comparison_results.json',
        'backend_logs.txt',
        'frontend_logs.txt',
        'log_comparison.txt',
        'complete_log_analysis.txt'
    ]
    
    print(f"\nGENERATED FILES:")
    for file_name in generated_files:
        file_path = project_root / file_name
        if file_path.exists():
            size = file_path.stat().st_size
            print(f"  ✅ {file_name} ({size:,} bytes)")
        else:
            print(f"  ❌ {file_name} (not found)")
    
    print("="*70)
    
    if backend_success and frontend_success and comparison_success:
        logger.info("Complete log analysis finished successfully")
        return 0
    else:
        logger.error("Complete log analysis finished with errors")
        return 1

if __name__ == "__main__":
    sys.exit(main())

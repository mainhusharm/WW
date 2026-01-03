#!/usr/bin/env python3
"""
Comprehensive Test Runner
Runs all tests to verify the enhanced database system
"""

import subprocess
import sys
import os
import time
from datetime import datetime

def run_command(command, description, timeout=30):
    """Run a command and return success status"""
    print(f"\n🔍 {description}")
    print(f"   Command: {command}")
    print("-" * 50)
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        if result.returncode == 0:
            print("✅ SUCCESS")
            if result.stdout:
                print(result.stdout)
            return True
        else:
            print("❌ FAILED")
            if result.stderr:
                print("STDERR:", result.stderr)
            if result.stdout:
                print("STDOUT:", result.stdout)
            return False
            
    except subprocess.TimeoutExpired:
        print(f"❌ TIMEOUT (>{timeout}s)")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def check_dependencies():
    """Check if required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    required_packages = [
        'psycopg2',
        'flask',
        'flask_jwt_extended',
        'flask_cors',
        'bcrypt',
        'requests'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - MISSING")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n⚠️  Missing packages: {missing_packages}")
        print("Install with: pip install " + " ".join(missing_packages))
        return False
    
    print("✅ All dependencies available")
    return True

def test_database_migration():
    """Test if database migration is needed"""
    print("\n🔍 Checking if database migration is needed...")
    
    try:
        import psycopg2
        import psycopg2.extras
        
        DATABASE_URL = (
            os.getenv('DATABASE_URL') or 
            os.getenv('POSTGRES_URL') or 
            'postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2'
        )
        
        conn = psycopg2.connect(
            DATABASE_URL,
            sslmode='require',
            cursor_factory=psycopg2.extras.RealDictCursor
        )
        cur = conn.cursor()
        
        # Check if enhanced tables exist
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'payment_details', 'questionnaire_details', 'user_dashboard_data')
        """)
        
        existing_tables = [row['table_name'] for row in cur.fetchall()]
        required_tables = ['users', 'payment_details', 'questionnaire_details', 'user_dashboard_data']
        
        cur.close()
        conn.close()
        
        missing_tables = [table for table in required_tables if table not in existing_tables]
        
        if missing_tables:
            print(f"⚠️  Missing tables: {missing_tables}")
            print("   Database migration required!")
            return False
        else:
            print("✅ All required tables exist")
            return True
            
    except Exception as e:
        print(f"❌ Database check failed: {e}")
        return False

def start_flask_app():
    """Start Flask app in background"""
    print("\n🔍 Starting Flask app...")
    
    # Check if app is already running
    try:
        import requests
        response = requests.get("http://localhost:5000/api/enhanced/health", timeout=5)
        if response.status_code == 200:
            print("✅ Flask app already running")
            return True
    except:
        pass
    
    # Try to start the enhanced app
    try:
        flask_process = subprocess.Popen(
            [sys.executable, "journal/enhanced_app.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait a bit for the app to start
        time.sleep(3)
        
        # Check if it's running
        try:
            import requests
            response = requests.get("http://localhost:5000/api/enhanced/health", timeout=5)
            if response.status_code == 200:
                print("✅ Flask app started successfully")
                return True
        except:
            pass
        
        print("⚠️  Flask app may not have started properly")
        return False
        
    except Exception as e:
        print(f"❌ Failed to start Flask app: {e}")
        return False

def main():
    """Run all tests in sequence"""
    print("🧪 COMPREHENSIVE ENHANCED DATABASE TEST SUITE")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests_passed = 0
    total_tests = 6
    
    # Test 1: Check dependencies
    print(f"\n{'='*60}")
    print("TEST 1: DEPENDENCY CHECK")
    print("="*60)
    if check_dependencies():
        tests_passed += 1
    
    # Test 2: Database connection
    print(f"\n{'='*60}")
    print("TEST 2: DATABASE CONNECTION")
    print("="*60)
    if run_command("python test_database_connection.py", "Testing database connection and schema"):
        tests_passed += 1
    
    # Test 3: Database migration check
    print(f"\n{'='*60}")
    print("TEST 3: DATABASE MIGRATION CHECK")
    print("="*60)
    if test_database_migration():
        tests_passed += 1
    else:
        print("\n💡 To run database migration:")
        print("   psql -h dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com \\")
        print("        -U pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user \\")
        print("        -d pghero_dpg_d2v9i7er433s73f0878g_a_cdm2 \\")
        print("        -f database_migration_complete.sql")
    
    # Test 4: Enhanced database service
    print(f"\n{'='*60}")
    print("TEST 4: ENHANCED DATABASE SERVICE")
    print("="*60)
    if os.path.exists("src/scripts/testEnhancedDatabase.js"):
        if run_command("node src/scripts/testEnhancedDatabase.js", "Testing enhanced database service"):
            tests_passed += 1
    else:
        print("⚠️  Enhanced database test script not found")
    
    # Test 5: Flask app startup
    print(f"\n{'='*60}")
    print("TEST 5: FLASK APP STARTUP")
    print("="*60)
    if start_flask_app():
        tests_passed += 1
    
    # Test 6: Flask routes
    print(f"\n{'='*60}")
    print("TEST 6: FLASK ROUTES")
    print("="*60)
    if run_command("python test_flask_routes.py", "Testing enhanced Flask routes", timeout=60):
        tests_passed += 1
    
    # Final results
    print(f"\n{'='*60}")
    print("FINAL TEST RESULTS")
    print("="*60)
    print(f"Tests passed: {tests_passed}/{total_tests}")
    print(f"Success rate: {(tests_passed/total_tests)*100:.1f}%")
    
    if tests_passed == total_tests:
        print("\n🎉 ALL TESTS PASSED!")
        print("✅ Your enhanced database system is fully operational!")
        print("\n📋 Next steps:")
        print("1. Update your frontend forms to use /api/enhanced/* endpoints")
        print("2. Deploy the enhanced routes to your production server")
        print("3. Test with real form submissions on your live site")
        return True
    else:
        print(f"\n⚠️  {total_tests - tests_passed} tests failed")
        print("Please review the issues above and fix them before deployment.")
        
        if tests_passed >= 3:
            print("\n💡 Partial success - database connection is working!")
            print("   You may be able to proceed with manual testing.")
        
        return False

if __name__ == "__main__":
    success = main()
    print(f"\nTest suite completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    exit(0 if success else 1)

#!/usr/bin/env python3
"""
Comprehensive Working Database Test Runner
Tests the exact working method extracted from database done copy
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

def check_working_dependencies():
    """Check if required dependencies are installed for working method"""
    print("🔍 Checking working method dependencies...")
    
    required_packages = [
        'flask',
        'flask_cors',
        'requests'
    ]
    
    # Check for database packages
    db_packages = []
    try:
        import sqlite3
        print("✅ sqlite3 (built-in)")
        db_packages.append('sqlite3')
    except ImportError:
        print("❌ sqlite3 - MISSING")
    
    try:
        import psycopg2
        print("✅ psycopg2")
        db_packages.append('psycopg2')
    except ImportError:
        print("⚠️  psycopg2 - MISSING (will use SQLite fallback)")
    
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
    
    if not db_packages:
        print("❌ No database packages available")
        return False
    
    print("✅ All working method dependencies available")
    return True

def test_working_database_connection():
    """Test working database connection"""
    print("\n🔍 Testing working database connection...")
    
    try:
        from working_database_routes import get_db_connection, DATABASE_URL, init_database_tables
        
        print(f"   Database URL: {DATABASE_URL[:50]}...")
        
        # Test connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if DATABASE_URL.startswith('sqlite'):
            cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table'")
            table_count = cursor.fetchone()[0]
            print(f"   SQLite tables: {table_count}")
        else:
            cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
            result = cursor.fetchone()
            table_count = result[0] if result else 0
            print(f"   PostgreSQL tables: {table_count}")
        
        conn.close()
        
        # Initialize tables if needed
        if table_count < 3:  # We expect at least 3 tables
            print("   Initializing database tables...")
            if init_database_tables():
                print("✅ Database tables initialized")
            else:
                print("❌ Database table initialization failed")
                return False
        
        print("✅ Working database connection successful")
        return True
        
    except Exception as e:
        print(f"❌ Working database connection failed: {e}")
        return False

def start_working_flask_app():
    """Start working Flask app in background"""
    print("\n🔍 Starting working Flask app...")
    
    # Check if app is already running
    try:
        import requests
        response = requests.get("http://localhost:5000/api/working/health", timeout=5)
        if response.status_code == 200:
            print("✅ Working Flask app already running")
            return True
    except:
        pass
    
    # Try to start the working app
    try:
        flask_process = subprocess.Popen(
            [sys.executable, "working_flask_app.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait a bit for the app to start
        time.sleep(5)
        
        # Check if it's running
        try:
            import requests
            response = requests.get("http://localhost:5000/api/working/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                print("✅ Working Flask app started successfully")
                print(f"   Status: {data.get('status')}")
                print(f"   Database: {data.get('database')}")
                return True
        except Exception as e:
            print(f"⚠️  Flask app health check failed: {e}")
        
        print("⚠️  Working Flask app may not have started properly")
        return False
        
    except Exception as e:
        print(f"❌ Failed to start working Flask app: {e}")
        return False

def main():
    """Run all working database tests in sequence"""
    print("🧪 COMPREHENSIVE WORKING DATABASE TEST SUITE")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("Method: Extracted from database done copy folder")
    
    tests_passed = 0
    total_tests = 5
    
    # Test 1: Check dependencies
    print(f"\n{'='*60}")
    print("TEST 1: WORKING METHOD DEPENDENCIES")
    print("="*60)
    if check_working_dependencies():
        tests_passed += 1
    
    # Test 2: Database connection
    print(f"\n{'='*60}")
    print("TEST 2: WORKING DATABASE CONNECTION")
    print("="*60)
    if test_working_database_connection():
        tests_passed += 1
    
    # Test 3: Flask app startup
    print(f"\n{'='*60}")
    print("TEST 3: WORKING FLASK APP STARTUP")
    print("="*60)
    if start_working_flask_app():
        tests_passed += 1
    
    # Test 4: Working database routes
    print(f"\n{'='*60}")
    print("TEST 4: WORKING DATABASE ROUTES")
    print("="*60)
    if run_command("python test_working_database.py", "Testing working database routes", timeout=60):
        tests_passed += 1
    
    # Test 5: Data persistence verification
    print(f"\n{'='*60}")
    print("TEST 5: DATA PERSISTENCE VERIFICATION")
    print("="*60)
    try:
        from working_database_routes import get_db_connection, DATABASE_URL
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if DATABASE_URL.startswith('sqlite'):
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM customer_data")
            customer_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM payment_transactions")
            payment_count = cursor.fetchone()[0]
        else:
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM customer_data")
            customer_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM payment_transactions")
            payment_count = cursor.fetchone()[0]
        
        conn.close()
        
        print(f"✅ Data persistence verified!")
        print(f"   Users: {user_count}")
        print(f"   Customer data: {customer_count}")
        print(f"   Payment transactions: {payment_count}")
        
        if user_count > 0:
            tests_passed += 1
        else:
            print("⚠️  No users found - may need to run registration test")
            
    except Exception as e:
        print(f"❌ Data persistence check failed: {e}")
    
    # Final results
    print(f"\n{'='*60}")
    print("FINAL WORKING DATABASE TEST RESULTS")
    print("="*60)
    print(f"Tests passed: {tests_passed}/{total_tests}")
    print(f"Success rate: {(tests_passed/total_tests)*100:.1f}%")
    
    if tests_passed == total_tests:
        print("\n🎉 ALL WORKING DATABASE TESTS PASSED!")
        print("✅ The working database method is fully operational!")
        print("\n📋 Confirmed working:")
        print("1. ✅ Dependencies installed")
        print("2. ✅ Database connection works")
        print("3. ✅ Flask app starts successfully")
        print("4. ✅ All API endpoints work")
        print("5. ✅ Data persists in database")
        
        print("\n🚀 READY FOR DEPLOYMENT!")
        print("Your working database routes can now be integrated into your live site.")
        print("\n📝 Next steps:")
        print("1. Update your frontend to use /api/working/* endpoints")
        print("2. Deploy working_flask_app.py to your production server")
        print("3. Test with real form submissions")
        
        return True
    else:
        print(f"\n⚠️  {total_tests - tests_passed} tests failed")
        print("Please review the issues above and fix them.")
        
        if tests_passed >= 3:
            print("\n💡 Partial success - core functionality is working!")
            print("   You may be able to proceed with manual testing.")
        
        return False

if __name__ == "__main__":
    success = main()
    print(f"\nWorking database test suite completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    exit(0 if success else 1)

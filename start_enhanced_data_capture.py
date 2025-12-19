#!/usr/bin/env python3
"""
Enhanced Data Capture Startup Script
Starts the enhanced data capture system alongside the existing signup-enhanced system
"""

import subprocess
import sys
import time
import os
import signal
import sqlite3
from pathlib import Path

class EnhancedDataCaptureManager:
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.database_path = self.base_dir / "trading_bots.db"
        self.processes = []
        self.running = False

    def check_database(self):
        """Check if the database exists and has the required tables"""
        print("🔍 Checking database setup...")
        
        if not self.database_path.exists():
            print("❌ Database not found. Creating new database...")
            self.create_database()
        
        # Check if users table exists (from signup-enhanced)
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            print("❌ Users table not found. Please run signup-enhanced first.")
            conn.close()
            return False
        
        # Check if enhanced tables exist
        required_tables = ['payment_data', 'questionnaire_data', 'dashboard_data', 'data_capture_audit']
        missing_tables = []
        
        for table in required_tables:
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
            if not cursor.fetchone():
                missing_tables.append(table)
        
        conn.close()
        
        if missing_tables:
            print(f"⚠️ Missing enhanced tables: {missing_tables}")
            print("🔄 Tables will be created when the enhanced data capture system starts")
        else:
            print("✅ All required tables exist")
        
        return True

    def create_database(self):
        """Create the database if it doesn't exist"""
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()
        
        # Create basic users table (if signup-enhanced hasn't run yet)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                plan_type TEXT DEFAULT 'premium',
                normalized_email TEXT NOT NULL,
                created_at TEXT NOT NULL,
                unique_id TEXT,
                consent_accepted BOOLEAN DEFAULT 1,
                consent_timestamp TEXT
            )
        """)
        
        conn.commit()
        conn.close()
        print("✅ Database created")

    def start_signup_enhanced(self):
        """Start the signup-enhanced service if not already running"""
        try:
            # Check if signup-enhanced is already running on port 5001
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('localhost', 5001))
            sock.close()
            
            if result == 0:
                print("✅ Signup-enhanced already running on port 5001")
                return True
            
            print("🚀 Starting signup-enhanced service...")
            signup_script = self.base_dir / "enhanced_signup_handler.py"
            
            if not signup_script.exists():
                print("❌ Signup-enhanced script not found")
                return False
            
            process = subprocess.Popen([
                sys.executable, str(signup_script)
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            self.processes.append(('signup-enhanced', process))
            time.sleep(2)  # Give it time to start
            
            # Check if it started successfully
            if process.poll() is None:
                print("✅ Signup-enhanced started successfully")
                return True
            else:
                stdout, stderr = process.communicate()
                print(f"❌ Signup-enhanced failed to start: {stderr.decode()}")
                return False
                
        except Exception as e:
            print(f"❌ Error starting signup-enhanced: {str(e)}")
            return False

    def start_enhanced_data_capture(self):
        """Start the enhanced data capture service"""
        try:
            print("🚀 Starting enhanced data capture service...")
            capture_script = self.base_dir / "enhanced_data_capture_system.py"
            
            if not capture_script.exists():
                print("❌ Enhanced data capture script not found")
                return False
            
            process = subprocess.Popen([
                sys.executable, str(capture_script)
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            self.processes.append(('enhanced-data-capture', process))
            time.sleep(2)  # Give it time to start
            
            # Check if it started successfully
            if process.poll() is None:
                print("✅ Enhanced data capture started successfully")
                return True
            else:
                stdout, stderr = process.communicate()
                print(f"❌ Enhanced data capture failed to start: {stderr.decode()}")
                return False
                
        except Exception as e:
            print(f"❌ Error starting enhanced data capture: {str(e)}")
            return False

    def install_frontend_integration(self):
        """Install the frontend integration script"""
        try:
            print("🔧 Installing frontend integration...")
            
            integration_script = self.base_dir / "frontend_data_capture_integration.js"
            if not integration_script.exists():
                print("❌ Frontend integration script not found")
                return False
            
            # Check if there's a public/js directory to copy the integration to
            public_dirs = [
                self.base_dir / "public" / "js",
                self.base_dir / "src" / "utils",
                self.base_dir / "static" / "js"
            ]
            
            target_dir = None
            for dir_path in public_dirs:
                if dir_path.exists():
                    target_dir = dir_path
                    break
            
            if target_dir:
                import shutil
                target_file = target_dir / "enhanced_data_capture.js"
                shutil.copy2(integration_script, target_file)
                print(f"✅ Frontend integration installed to {target_file}")
            else:
                print("⚠️ No suitable directory found for frontend integration")
                print("📋 Manual installation required:")
                print(f"   Copy {integration_script} to your frontend's JavaScript directory")
            
            return True
            
        except Exception as e:
            print(f"❌ Error installing frontend integration: {str(e)}")
            return False

    def check_services_health(self):
        """Check if all services are running properly"""
        print("\n🔍 Checking service health...")
        
        services = [
            ('Signup Enhanced', 'http://localhost:5001/api/health'),
            ('Enhanced Data Capture', 'http://localhost:5003/api/data-capture/health')
        ]
        
        all_healthy = True
        
        for service_name, health_url in services:
            try:
                import urllib.request
                with urllib.request.urlopen(health_url, timeout=5) as response:
                    if response.getcode() == 200:
                        print(f"✅ {service_name}: Healthy")
                    else:
                        print(f"⚠️ {service_name}: Responding but not healthy")
                        all_healthy = False
            except Exception as e:
                print(f"❌ {service_name}: Not responding ({str(e)})")
                all_healthy = False
        
        return all_healthy

    def show_service_info(self):
        """Show information about running services"""
        print("\n" + "="*60)
        print("🚀 ENHANCED DATA CAPTURE SYSTEM RUNNING")
        print("="*60)
        print("📊 Services:")
        print("   • Signup Enhanced:       http://localhost:5001")
        print("   • Enhanced Data Capture: http://localhost:5003")
        print("\n📋 API Endpoints:")
        print("   • Signup:                POST /api/auth/register")
        print("   • Payment Capture:       POST /api/data-capture/payment")
        print("   • Questionnaire Capture: POST /api/data-capture/questionnaire")
        print("   • Dashboard Capture:     POST /api/data-capture/dashboard")
        print("   • User Stats:            GET  /api/data-capture/stats/<email>")
        print("\n🗄️ Database:")
        print(f"   • Location: {self.database_path}")
        print("   • Tables: users, payment_data, questionnaire_data, dashboard_data")
        print("\n⚡ Frontend Integration:")
        print("   • Auto-captures data from existing endpoints")
        print("   • No changes required to existing code")
        print("   • Data automatically saved to database")
        print("\n📝 Usage:")
        print("   1. Users sign up normally (signup-enhanced)")
        print("   2. Payment, questionnaire, dashboard data automatically captured")
        print("   3. All data stored in same database")
        print("   4. Access via /api/data-capture/stats/<email>")
        print("="*60)

    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        print("\n🛑 Shutting down services...")
        self.stop_all_services()
        sys.exit(0)

    def stop_all_services(self):
        """Stop all running services"""
        for service_name, process in self.processes:
            try:
                if process.poll() is None:  # Process is still running
                    print(f"🛑 Stopping {service_name}...")
                    process.terminate()
                    process.wait(timeout=5)
                    print(f"✅ {service_name} stopped")
            except Exception as e:
                print(f"❌ Error stopping {service_name}: {str(e)}")
                try:
                    process.kill()
                except:
                    pass

    def run(self):
        """Main run function"""
        print("🚀 Enhanced Data Capture System Manager")
        print("=" * 50)
        
        # Set up signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        # Check database
        if not self.check_database():
            return False
        
        # Start services
        if not self.start_signup_enhanced():
            print("❌ Failed to start signup-enhanced service")
            return False
        
        if not self.start_enhanced_data_capture():
            print("❌ Failed to start enhanced data capture service")
            self.stop_all_services()
            return False
        
        # Install frontend integration
        self.install_frontend_integration()
        
        # Check health
        time.sleep(3)  # Give services time to fully start
        if not self.check_services_health():
            print("⚠️ Some services may not be responding properly")
        
        # Show service info
        self.show_service_info()
        
        # Keep running
        self.running = True
        try:
            while self.running:
                time.sleep(10)
                # Periodic health check
                for service_name, process in self.processes:
                    if process.poll() is not None:
                        print(f"⚠️ {service_name} process has stopped")
                        self.running = False
                        break
        except KeyboardInterrupt:
            pass
        finally:
            self.stop_all_services()
        
        return True

def main():
    """Main entry point"""
    manager = EnhancedDataCaptureManager()
    success = manager.run()
    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())

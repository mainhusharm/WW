#!/usr/bin/env python3
"""
Quick Backend Analysis for TraderEdgePro
Identifies immediate connection issues between backend and frontend
"""

import os
import sys
import json
import requests
import psycopg2
from pathlib import Path

def check_database_connection():
    """Check PostgreSQL database connection"""
    print("🔍 Checking PostgreSQL Database Connection...")
    
    try:
        postgres_url = "postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2"
        conn = psycopg2.connect(postgres_url)
        cursor = conn.cursor()
        
        # Check if tables exist
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name IN 
            ('enhanced_users', 'payment_transactions', 'questionnaire_responses', 'user_dashboard_data')
        """)
        tables = [row[0] for row in cursor.fetchall()]
        
        print(f"✅ Database connected successfully")
        print(f"📊 Found tables: {tables}")
        
        # Check user count
        if 'enhanced_users' in tables:
            cursor.execute("SELECT COUNT(*) FROM enhanced_users;")
            user_count = cursor.fetchone()[0]
            print(f"👥 Users in database: {user_count}")
        
        conn.close()
        return True, tables
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False, []

def check_api_endpoints():
    """Check critical API endpoints"""
    print("\n🔍 Checking API Endpoints...")
    
    endpoints = [
        'http://localhost:3000/api/health',
        'http://localhost:5000/api/health',
        'https://backend-topb.onrender.com/api/health',
        'https://trading-cors-proxy-gbhz.onrender.com/api/health',
        'http://localhost:3000/api/auth/register',
        'http://localhost:3000/api/enhanced/signup',
    ]
    
    working_endpoints = []
    failed_endpoints = []
    
    for endpoint in endpoints:
        try:
            response = requests.get(endpoint, timeout=5)
            if response.status_code in [200, 201, 404]:  # 404 is OK for health check
                working_endpoints.append(endpoint)
                print(f"✅ {endpoint} - Status: {response.status_code}")
            else:
                failed_endpoints.append(endpoint)
                print(f"⚠️  {endpoint} - Status: {response.status_code}")
        except Exception as e:
            failed_endpoints.append(endpoint)
            print(f"❌ {endpoint} - Error: {str(e)[:50]}...")
    
    return working_endpoints, failed_endpoints

def check_frontend_servers():
    """Check frontend development servers"""
    print("\n🔍 Checking Frontend Servers...")
    
    servers = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174', 
        'http://localhost:5175',
        'http://localhost:8000'
    ]
    
    running_servers = []
    
    for server in servers:
        try:
            response = requests.get(server, timeout=3)
            running_servers.append(server)
            print(f"✅ {server} - Running (Status: {response.status_code})")
        except Exception as e:
            print(f"❌ {server} - Not running")
    
    return running_servers

def check_critical_files():
    """Check for critical backend and frontend files"""
    print("\n🔍 Checking Critical Files...")
    
    project_root = Path(__file__).parent
    
    critical_files = {
        'backend': [
            'app.py',
            'enhanced_postgresql_api_routes.py',
            'working_database_routes.py',
            'deploy_working_api.py'
        ],
        'frontend': [
            'package.json',
            'vite.config.ts',
            'src/components',
            'src/utils/environmentUtils.ts'
        ]
    }
    
    file_status = {'backend': [], 'frontend': []}
    
    for category, files in critical_files.items():
        for file_name in files:
            file_path = project_root / file_name
            if file_path.exists():
                file_status[category].append(f"✅ {file_name}")
                print(f"✅ {file_name}")
            else:
                file_status[category].append(f"❌ {file_name}")
                print(f"❌ {file_name} - Missing")
    
    return file_status

def identify_connection_issues():
    """Identify specific connection issues"""
    print("\n🔧 IDENTIFYING CONNECTION ISSUES")
    print("=" * 50)
    
    issues = []
    fixes = []
    
    # Check database
    db_connected, tables = check_database_connection()
    if not db_connected:
        issues.append("Database connection failed")
        fixes.append("Fix PostgreSQL connection credentials")
    
    # Check APIs
    working_apis, failed_apis = check_api_endpoints()
    if len(failed_apis) > len(working_apis):
        issues.append("Most API endpoints are failing")
        fixes.append("Start backend server or fix API routes")
    
    # Check frontend
    running_servers = check_frontend_servers()
    if len(running_servers) == 0:
        issues.append("No frontend servers running")
        fixes.append("Start frontend development server")
    
    # Check files
    file_status = check_critical_files()
    
    return {
        'issues': issues,
        'fixes': fixes,
        'database_connected': db_connected,
        'database_tables': tables,
        'working_apis': working_apis,
        'failed_apis': failed_apis,
        'running_servers': running_servers,
        'file_status': file_status
    }

if __name__ == "__main__":
    print("🚀 TraderEdgePro Backend-Frontend Connection Analysis")
    print("=" * 60)
    
    analysis = identify_connection_issues()
    
    print(f"\n📊 ANALYSIS SUMMARY")
    print("=" * 30)
    print(f"Database Connected: {'✅' if analysis['database_connected'] else '❌'}")
    print(f"Working APIs: {len(analysis['working_apis'])}")
    print(f"Failed APIs: {len(analysis['failed_apis'])}")
    print(f"Running Servers: {len(analysis['running_servers'])}")
    
    if analysis['issues']:
        print(f"\n🚨 CRITICAL ISSUES FOUND:")
        for i, issue in enumerate(analysis['issues'], 1):
            print(f"  {i}. {issue}")
        
        print(f"\n💡 RECOMMENDED FIXES:")
        for i, fix in enumerate(analysis['fixes'], 1):
            print(f"  {i}. {fix}")
    else:
        print(f"\n✅ No critical connection issues found!")
    
    # Save analysis
    with open('connection_analysis.json', 'w') as f:
        json.dump(analysis, f, indent=2, default=str)
    
    print(f"\n📁 Analysis saved to: connection_analysis.json")

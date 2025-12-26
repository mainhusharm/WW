#!/usr/bin/env python3
"""
Debug Signup Data Flow - TraderEdgePro
Checks connection between signup-enhanced page and PostgreSQL database
"""

import psycopg2
import json
import requests
import time
from datetime import datetime
from pathlib import Path

# PostgreSQL connection
DATABASE_URL = "postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2"

def log_message(message, level="INFO"):
    """Log message with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")

def check_database_connection():
    """Check PostgreSQL database connection and existing tables"""
    log_message("🔍 Checking PostgreSQL Database Connection...")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Check existing tables
        cursor.execute("""
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name IN ('enhanced_users', 'users', 'signup_data')
            ORDER BY table_name, ordinal_position
        """)
        
        tables_info = {}
        for row in cursor.fetchall():
            table_name, column_name, data_type, is_nullable = row
            if table_name not in tables_info:
                tables_info[table_name] = []
            tables_info[table_name].append({
                'column': column_name,
                'type': data_type,
                'nullable': is_nullable
            })
        
        log_message(f"✅ Database connected successfully")
        log_message(f"📊 Found tables: {list(tables_info.keys())}")
        
        for table_name, columns in tables_info.items():
            log_message(f"📋 Table '{table_name}' structure:")
            for col in columns:
                log_message(f"   - {col['column']} ({col['type']}) {'NULL' if col['nullable'] == 'YES' else 'NOT NULL'}")
        
        # Check user count in each table
        for table_name in tables_info.keys():
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
                count = cursor.fetchone()[0]
                log_message(f"👥 Users in {table_name}: {count}")
            except Exception as e:
                log_message(f"❌ Error counting users in {table_name}: {e}")
        
        conn.close()
        return True, tables_info
        
    except Exception as e:
        log_message(f"❌ Database connection failed: {e}", "ERROR")
        return False, {}

def create_signup_table():
    """Create a new table specifically for signup-enhanced data"""
    log_message("🔧 Creating signup_enhanced_users table...")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Create new table for signup data
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS signup_enhanced_users (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                company VARCHAR(255),
                country VARCHAR(100),
                password_hash VARCHAR(255),
                plan_type VARCHAR(50),
                terms_accepted BOOLEAN DEFAULT FALSE,
                newsletter_subscribed BOOLEAN DEFAULT FALSE,
                unique_id VARCHAR(100) UNIQUE,
                access_token VARCHAR(255),
                source_page VARCHAR(50) DEFAULT 'signup-enhanced',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create index for faster lookups
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_signup_enhanced_email 
            ON signup_enhanced_users(email);
        """)
        
        # Create trigger for updated_at
        cursor.execute("""
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        """)
        
        cursor.execute("""
            DROP TRIGGER IF EXISTS update_signup_enhanced_users_updated_at 
            ON signup_enhanced_users;
        """)
        
        cursor.execute("""
            CREATE TRIGGER update_signup_enhanced_users_updated_at 
            BEFORE UPDATE ON signup_enhanced_users 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """)
        
        conn.commit()
        conn.close()
        
        log_message("✅ signup_enhanced_users table created successfully")
        return True
        
    except Exception as e:
        log_message(f"❌ Failed to create signup table: {e}", "ERROR")
        return False

def test_backend_endpoints():
    """Test backend API endpoints"""
    log_message("🔍 Testing Backend API Endpoints...")
    
    endpoints = [
        'http://localhost:5000/api/health',
        'http://localhost:5001/api/health',
        'http://localhost:5000/api/auth/register',
        'http://localhost:5001/api/auth/register',
    ]
    
    working_endpoints = []
    
    for endpoint in endpoints:
        try:
            response = requests.get(endpoint, timeout=3)
            if response.status_code in [200, 404, 405]:  # 405 for POST-only endpoints
                working_endpoints.append(endpoint)
                log_message(f"✅ {endpoint} - Status: {response.status_code}")
            else:
                log_message(f"⚠️  {endpoint} - Status: {response.status_code}")
        except Exception as e:
            log_message(f"❌ {endpoint} - Error: {str(e)[:50]}...")
    
    return working_endpoints

def test_signup_data_insertion():
    """Test inserting signup data directly into database"""
    log_message("🧪 Testing Direct Database Insertion...")
    
    test_data = {
        'firstName': 'Test',
        'lastName': 'User',
        'email': f'test_{int(time.time())}@example.com',
        'phone': '+1234567890',
        'company': 'Test Company',
        'country': 'United States',
        'password': 'testpassword123',
        'terms': True,
        'newsletter': False
    }
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Insert test data
        cursor.execute("""
            INSERT INTO signup_enhanced_users 
            (first_name, last_name, email, phone, company, country, password_hash, 
             terms_accepted, newsletter_subscribed, unique_id, access_token)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, email, created_at
        """, (
            test_data['firstName'], test_data['lastName'], test_data['email'],
            test_data['phone'], test_data['company'], test_data['country'],
            f"hash_{test_data['password']}", test_data['terms'], test_data['newsletter'],
            f"uid_{int(time.time())}", f"token_{int(time.time())}"
        ))
        
        result = cursor.fetchone()
        conn.commit()
        conn.close()
        
        log_message(f"✅ Test data inserted successfully: ID={result[0]}, Email={result[1]}")
        return True, result
        
    except Exception as e:
        log_message(f"❌ Failed to insert test data: {e}", "ERROR")
        return False, None

def test_api_signup():
    """Test API signup endpoint"""
    log_message("🧪 Testing API Signup Endpoint...")
    
    working_endpoints = test_backend_endpoints()
    signup_endpoints = [ep for ep in working_endpoints if 'register' in ep]
    
    if not signup_endpoints:
        log_message("❌ No working signup endpoints found", "ERROR")
        return False
    
    test_data = {
        'firstName': 'API',
        'lastName': 'Test',
        'email': f'api_test_{int(time.time())}@example.com',
        'phone': '+1234567890',
        'company': 'API Test Company',
        'country': 'United States',
        'password': 'apitest123',
        'terms': True,
        'newsletter': False
    }
    
    for endpoint in signup_endpoints:
        try:
            response = requests.post(endpoint, 
                                   json=test_data,
                                   headers={'Content-Type': 'application/json'},
                                   timeout=10)
            
            log_message(f"📤 POST {endpoint}")
            log_message(f"📥 Response: {response.status_code} - {response.text[:200]}")
            
            if response.status_code in [200, 201]:
                log_message("✅ API signup test successful")
                return True
            else:
                log_message(f"⚠️  API signup returned: {response.status_code}")
                
        except Exception as e:
            log_message(f"❌ API signup failed: {e}", "ERROR")
    
    return False

def check_frontend_signup_page():
    """Check if frontend signup page is accessible"""
    log_message("🔍 Checking Frontend Signup Page...")
    
    frontend_urls = [
        'http://localhost:5173/signup-enhanced',
        'http://localhost:5174/signup-enhanced',
        'http://localhost:5175/signup-enhanced',
        'http://localhost:3000/signup-enhanced.html'
    ]
    
    for url in frontend_urls:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                log_message(f"✅ Frontend accessible at: {url}")
                return url
            else:
                log_message(f"⚠️  {url} - Status: {response.status_code}")
        except Exception as e:
            log_message(f"❌ {url} - Not accessible")
    
    log_message("❌ No accessible frontend signup page found", "ERROR")
    return None

def generate_comprehensive_logs():
    """Generate comprehensive logs for debugging"""
    log_message("🚀 Starting Comprehensive Signup Data Flow Debug")
    log_message("=" * 60)
    
    # Check database connection
    db_connected, tables_info = check_database_connection()
    
    # Create signup table if needed
    if db_connected:
        create_signup_table()
    
    # Test backend endpoints
    working_endpoints = test_backend_endpoints()
    
    # Test direct database insertion
    db_insert_success, insert_result = test_signup_data_insertion()
    
    # Test API signup
    api_signup_success = test_api_signup()
    
    # Check frontend page
    frontend_url = check_frontend_signup_page()
    
    # Generate summary
    log_message("📊 DEBUGGING SUMMARY")
    log_message("=" * 30)
    log_message(f"Database Connected: {'✅' if db_connected else '❌'}")
    log_message(f"Tables Found: {len(tables_info)}")
    log_message(f"Working API Endpoints: {len(working_endpoints)}")
    log_message(f"Direct DB Insert: {'✅' if db_insert_success else '❌'}")
    log_message(f"API Signup Test: {'✅' if api_signup_success else '❌'}")
    log_message(f"Frontend Page: {'✅' if frontend_url else '❌'}")
    
    # Save detailed logs
    debug_data = {
        'timestamp': datetime.now().isoformat(),
        'database_connected': db_connected,
        'tables_info': tables_info,
        'working_endpoints': working_endpoints,
        'db_insert_success': db_insert_success,
        'api_signup_success': api_signup_success,
        'frontend_url': frontend_url,
        'insert_result': str(insert_result) if insert_result else None
    }
    
    with open('signup_debug_logs.json', 'w') as f:
        json.dump(debug_data, f, indent=2, default=str)
    
    log_message("📁 Detailed logs saved to: signup_debug_logs.json")
    
    # Recommendations
    log_message("\n💡 RECOMMENDATIONS:")
    if not db_connected:
        log_message("1. Fix PostgreSQL database connection")
    if not working_endpoints:
        log_message("2. Start backend server on port 5000 or 5001")
    if not api_signup_success:
        log_message("3. Fix API signup endpoint implementation")
    if not frontend_url:
        log_message("4. Start frontend development server")
    
    log_message("\n🔧 NEXT STEPS:")
    log_message("1. Use 'signup_enhanced_users' table for new signups")
    log_message("2. Update frontend to use working API endpoint")
    log_message("3. Test signup flow end-to-end")

if __name__ == "__main__":
    generate_comprehensive_logs()

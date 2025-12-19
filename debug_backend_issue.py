#!/usr/bin/env python3
"""
Debug script to check what's wrong with the backend data saving
Tests both database connectivity and backend endpoints
"""

import requests
import psycopg2
import json
from datetime import datetime

# Database connection
DATABASE_URL = "postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2"

# Backend URL
BACKEND_URL = "https://backend-topb.onrender.com"

def test_database_connection():
    """Test direct database connection"""
    print("🔍 Testing Database Connection...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Check if tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('enhanced_users', 'payment_transactions', 'questionnaire_responses')
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        
        if tables:
            print("✅ Database connected successfully!")
            print("📋 Tables found:")
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
                count = cursor.fetchone()[0]
                print(f"  - {table[0]}: {count} records")
        else:
            print("❌ Required tables not found!")
            print("💡 Run: python3 apply_database_schema.py")
            return False
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_backend_endpoints():
    """Test backend endpoints"""
    print("\n🔍 Testing Backend Endpoints...")
    
    endpoints_to_test = [
        "/health",
        "/api/health", 
        "/",
        "/api/auth/register",
        "/api/working/register",
        "/api/payments",
        "/api/questionnaire"
    ]
    
    for endpoint in endpoints_to_test:
        try:
            url = f"{BACKEND_URL}{endpoint}"
            
            if endpoint in ["/health", "/api/health", "/"]:
                # GET request for health checks
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    print(f"✅ {endpoint} - Status: {response.status_code}")
                    if endpoint == "/":
                        data = response.json()
                        print(f"   Version: {data.get('version', 'unknown')}")
                        print(f"   Available endpoints: {len(data.get('endpoints', {}).get('legacy', []))}")
                else:
                    print(f"❌ {endpoint} - Status: {response.status_code}")
            else:
                # POST request for API endpoints
                test_data = {
                    "first_name": "Test",
                    "last_name": "User",
                    "email": f"test_{int(datetime.now().timestamp())}@example.com",
                    "password": "test123"
                }
                
                response = requests.post(
                    url, 
                    json=test_data,
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code in [200, 201]:
                    print(f"✅ {endpoint} - Status: {response.status_code}")
                    try:
                        data = response.json()
                        if data.get('success'):
                            print(f"   Success: {data.get('message', 'OK')}")
                        else:
                            print(f"   Response: {data}")
                    except:
                        print(f"   Response: {response.text[:100]}...")
                else:
                    print(f"❌ {endpoint} - Status: {response.status_code}")
                    try:
                        error_data = response.json()
                        print(f"   Error: {error_data.get('error', 'Unknown error')}")
                    except:
                        print(f"   Error: {response.text[:100]}...")
                        
        except requests.exceptions.Timeout:
            print(f"⏰ {endpoint} - Timeout (backend might be sleeping)")
        except requests.exceptions.ConnectionError:
            print(f"🔌 {endpoint} - Connection error")
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")

def test_frontend_data_flow():
    """Test the exact data flow from frontend"""
    print("\n🔍 Testing Frontend Data Flow...")
    
    # Test the exact endpoints and data format your frontend uses
    test_cases = [
        {
            "name": "Signup Form",
            "endpoint": "/api/auth/register",
            "data": {
                "id": "test-user-id",
                "first_name": "John",
                "last_name": "Doe", 
                "email": f"john.doe.{int(datetime.now().timestamp())}@example.com",
                "phone": "+1234567890",
                "company": "Test Company",
                "country": "US",
                "password_hash": "hashed_password_placeholder",
                "plan_type": "Standard Plan",
                "created_at": datetime.now().isoformat()
            }
        },
        {
            "name": "Payment Form", 
            "endpoint": "/api/payments",
            "data": {
                "id": "test-payment-id",
                "user_id": "test-user-id",
                "user_email": f"payment.test.{int(datetime.now().timestamp())}@example.com",
                "user_name": "John Doe",
                "plan_name_payment": "Elite Plan",
                "original_price": 1299.00,
                "discount_amount": 0,
                "final_price": 1299.00,
                "coupon_code": None,
                "payment_method": "paypal",
                "transaction_id": f"TXN-{int(datetime.now().timestamp())}",
                "payment_status": "completed",
                "payment_provider": "PayPal",
                "crypto_transaction_hash": f"NON-CRYPTO-{int(datetime.now().timestamp())}",
                "crypto_from_address": "N/A",
                "crypto_amount": "0"
            }
        }
    ]
    
    for test_case in test_cases:
        try:
            print(f"\n📝 Testing {test_case['name']}...")
            url = f"{BACKEND_URL}{test_case['endpoint']}"
            
            response = requests.post(
                url,
                json=test_case['data'],
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code in [200, 201]:
                try:
                    data = response.json()
                    print(f"   ✅ Success: {data.get('message', 'Data saved')}")
                    if 'user_id' in data:
                        print(f"   User ID: {data['user_id']}")
                except:
                    print(f"   ✅ Success: {response.text[:100]}...")
            else:
                try:
                    error_data = response.json()
                    print(f"   ❌ Error: {error_data.get('error', 'Unknown')}")
                    if 'details' in error_data:
                        print(f"   Details: {error_data['details']}")
                except:
                    print(f"   ❌ Error: {response.text[:200]}...")
                    
        except Exception as e:
            print(f"   ❌ Exception: {e}")

def check_current_backend_code():
    """Check what's currently deployed on the backend"""
    print("\n🔍 Checking Current Backend...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend is responding")
            print(f"   Message: {data.get('message', 'Unknown')}")
            print(f"   Version: {data.get('version', 'Unknown')}")
            
            if 'endpoints' in data:
                legacy_endpoints = data['endpoints'].get('legacy', [])
                enhanced_endpoints = data['endpoints'].get('enhanced', [])
                
                print(f"   Legacy endpoints: {len(legacy_endpoints)}")
                for endpoint in legacy_endpoints:
                    print(f"     - {endpoint}")
                    
                print(f"   Enhanced endpoints: {len(enhanced_endpoints)}")
                for endpoint in enhanced_endpoints:
                    print(f"     - {endpoint}")
            else:
                print("   ⚠️ No endpoint information available")
                print("   This suggests the old backend is still deployed")
        else:
            print(f"❌ Backend returned status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Could not check backend: {e}")

if __name__ == "__main__":
    print("🚀 TRADEREDGEPRO BACKEND DEBUG TOOL")
    print("=" * 50)
    
    # Step 1: Test database
    db_ok = test_database_connection()
    
    # Step 2: Check current backend
    check_current_backend_code()
    
    # Step 3: Test backend endpoints
    test_backend_endpoints()
    
    # Step 4: Test frontend data flow
    if db_ok:
        test_frontend_data_flow()
    
    print("\n" + "=" * 50)
    print("🎯 DIAGNOSIS COMPLETE")
    print("\n💡 Next Steps:")
    print("1. If database tables are missing → Run: python3 apply_database_schema.py")
    print("2. If backend endpoints are missing → Deploy backend_routes_for_render.py to Render")
    print("3. If endpoints exist but fail → Check Render logs for detailed errors")
    print("4. If everything looks good → Check frontend console for CORS or network errors")

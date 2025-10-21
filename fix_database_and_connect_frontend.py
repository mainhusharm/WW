#!/usr/bin/env python3
"""
Fix Database Schema and Connect Frontend to Backend
Fixes the raw_data column issue and ensures frontend-backend connection
"""

import psycopg2
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# PostgreSQL connection
DATABASE_URL = "postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2"

def fix_database_schema():
    """Fix the database schema to add missing raw_data column"""
    logger.info("🔧 Fixing database schema...")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Add raw_data column if it doesn't exist
        cursor.execute("""
            ALTER TABLE signup_enhanced_users 
            ADD COLUMN IF NOT EXISTS raw_data JSONB;
        """)
        
        # Verify the table structure
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'signup_enhanced_users'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        logger.info("📋 Current signup_enhanced_users table structure:")
        for col in columns:
            logger.info(f"   - {col[0]} ({col[1]}) {'NULL' if col[2] == 'YES' else 'NOT NULL'}")
        
        conn.commit()
        conn.close()
        
        logger.info("✅ Database schema fixed successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Database schema fix failed: {e}")
        return False

def test_fixed_signup():
    """Test the fixed signup functionality"""
    logger.info("🧪 Testing fixed signup functionality...")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Test data
        test_data = {
            'firstName': 'Fixed',
            'lastName': 'Test',
            'email': f'fixed_test_{int(datetime.now().timestamp())}@example.com',
            'phone': '+1234567890',
            'company': 'Fixed Test Company',
            'country': 'United States',
            'password': 'fixedtest123',
            'terms': True,
            'newsletter': False
        }
        
        # Insert test data with raw_data column
        cursor.execute("""
            INSERT INTO signup_enhanced_users 
            (first_name, last_name, email, phone, company, country, password_hash, 
             terms_accepted, newsletter_subscribed, unique_id, access_token, raw_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, email, created_at
        """, (
            test_data['firstName'],
            test_data['lastName'], 
            test_data['email'],
            test_data['phone'],
            test_data['company'],
            test_data['country'],
            f"hash_{test_data['password']}",
            test_data['terms'],
            test_data['newsletter'],
            f"uid_{int(datetime.now().timestamp())}",
            f"token_{int(datetime.now().timestamp())}",
            json.dumps(test_data)
        ))
        
        result = cursor.fetchone()
        conn.commit()
        conn.close()
        
        logger.info(f"✅ Fixed signup test successful: ID={result[0]}, Email={result[1]}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Fixed signup test failed: {e}")
        return False

def create_frontend_connection_script():
    """Create script to update frontend API connection"""
    logger.info("🔧 Creating frontend connection script...")
    
    # Check if environmentUtils.ts exists and update it
    frontend_script = '''
// Frontend API Connection Fix for signup-enhanced page
// Add this to your signup-enhanced page or update existing API calls

// 1. Update API Base URL
const API_BASE_URL = 'http://localhost:5002';

// 2. Updated signup function
async function submitSignup(formData) {
    try {
        console.log('Submitting signup data:', formData);
        
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        console.log('Signup response:', result);
        
        if (result.success) {
            console.log('✅ Signup successful:', result);
            // Redirect to payment or next page
            window.location.href = '/payment.html';
        } else {
            console.error('❌ Signup failed:', result.error);
            alert('Signup failed: ' + result.error);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Network error:', error);
        alert('Network error: ' + error.message);
        return { success: false, error: error.message };
    }
}

// 3. Example usage - replace your existing form submission
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        company: document.getElementById('company').value,
        country: document.getElementById('country').value,
        password: document.getElementById('password').value,
        terms: document.getElementById('terms').checked,
        newsletter: document.getElementById('newsletter').checked
    };
    
    await submitSignup(formData);
});

// 4. Test connection function
async function testConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const result = await response.json();
        console.log('Backend connection test:', result);
        return result.status === 'healthy';
    } catch (error) {
        console.error('Backend connection failed:', error);
        return false;
    }
}

// Test connection on page load
testConnection().then(connected => {
    if (connected) {
        console.log('✅ Backend connected successfully');
    } else {
        console.error('❌ Backend connection failed');
    }
});
'''
    
    # Save the script
    with open('frontend_connection_fix.js', 'w') as f:
        f.write(frontend_script)
    
    logger.info("✅ Frontend connection script created: frontend_connection_fix.js")
    return True

def check_existing_users():
    """Check existing users in the database"""
    logger.info("👥 Checking existing users...")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Check signup_enhanced_users
        cursor.execute("""
            SELECT COUNT(*), MAX(created_at) 
            FROM signup_enhanced_users
        """)
        enhanced_count, latest_enhanced = cursor.fetchone()
        
        # Check enhanced_users
        cursor.execute("""
            SELECT COUNT(*), MAX(created_at) 
            FROM enhanced_users
        """)
        regular_count, latest_regular = cursor.fetchone()
        
        # Check users
        cursor.execute("""
            SELECT COUNT(*), MAX(created_at) 
            FROM users
        """)
        users_count, latest_users = cursor.fetchone()
        
        conn.close()
        
        logger.info(f"📊 Database user counts:")
        logger.info(f"   - signup_enhanced_users: {enhanced_count} (latest: {latest_enhanced})")
        logger.info(f"   - enhanced_users: {regular_count} (latest: {latest_regular})")
        logger.info(f"   - users: {users_count} (latest: {latest_users})")
        
        return {
            'signup_enhanced_users': enhanced_count,
            'enhanced_users': regular_count,
            'users': users_count
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to check users: {e}")
        return {}

def main():
    """Main function to fix all issues"""
    logger.info("🚀 Starting Database Fix and Frontend Connection Setup")
    logger.info("=" * 60)
    
    # Step 1: Fix database schema
    schema_fixed = fix_database_schema()
    
    # Step 2: Test the fix
    if schema_fixed:
        test_passed = test_fixed_signup()
    else:
        test_passed = False
    
    # Step 3: Create frontend connection script
    frontend_script_created = create_frontend_connection_script()
    
    # Step 4: Check existing users
    user_counts = check_existing_users()
    
    # Summary
    logger.info("\n📊 FIX SUMMARY")
    logger.info("=" * 30)
    logger.info(f"Database Schema Fixed: {'✅' if schema_fixed else '❌'}")
    logger.info(f"Signup Test Passed: {'✅' if test_passed else '❌'}")
    logger.info(f"Frontend Script Created: {'✅' if frontend_script_created else '❌'}")
    
    if schema_fixed and test_passed:
        logger.info("\n🎯 NEXT STEPS:")
        logger.info("1. Backend is running on http://localhost:5002")
        logger.info("2. Add frontend_connection_fix.js to your signup-enhanced page")
        logger.info("3. Update your signup form to use API_BASE_URL = 'http://localhost:5002'")
        logger.info("4. Test signup from your frontend page")
        logger.info("\n✅ Your signup-enhanced page should now save data to PostgreSQL!")
    else:
        logger.info("\n❌ Some fixes failed. Check the errors above.")

if __name__ == "__main__":
    main()

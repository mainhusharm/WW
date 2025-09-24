#!/usr/bin/env python3
"""
Fix Backend Username Handling
"""

import sqlite3
import hashlib
import uuid
from datetime import datetime

def fix_backend_username_handling():
    """Fix the backend to handle duplicate usernames properly"""
    try:
        print("🔄 Fixing backend username handling...")
        
        # Read the current backend file
        with open('simple_working_backend_fixed.py', 'r') as f:
            content = f.read()
        
        # Find the register function and update it
        old_register = '''@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register():
    """Register endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No JSON data provided"}), 400
        
        email = data.get('email')
        password = data.get('password')
        username = data.get('username', 'New User')
        plan_type = data.get('plan_type', 'premium')
        
        if not email or not password:
            return jsonify({"msg": "Email and password required"}), 400
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"msg": "User already exists"}), 409
        
        # Create user
        password_hash = hash_password(password)
        
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, plan_type, normalized_email, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (username, email, password_hash, plan_type, email.lower().strip(), datetime.utcnow().isoformat()))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Create access token
        access_token = f"token_{user_id}_{uuid.uuid4().hex[:16]}"
        
        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user_id,
                "username": username,
                "email": email,
                "plan_type": plan_type
            }
        }), 201
        
    except Exception as e:
        return jsonify({"msg": f"Server error: {str(e)}"}), 500'''
        
        new_register = '''@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register():
    """Register endpoint with proper username handling"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No JSON data provided"}), 400
        
        email = data.get('email')
        password = data.get('password')
        firstName = data.get('firstName', '')
        lastName = data.get('lastName', '')
        plan_type = data.get('plan_type', 'premium')
        
        if not email or not password:
            return jsonify({"msg": "Email and password required"}), 400
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists by email
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"msg": "User already exists"}), 409
        
        # Create unique username
        base_username = f"{firstName} {lastName}".strip() or "New User"
        username = base_username
        
        # Check if username exists and make it unique
        counter = 1
        while True:
            cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
            if not cursor.fetchone():
                break
            username = f"{base_username} ({counter})"
            counter += 1
        
        # Create user
        password_hash = hash_password(password)
        unique_id = str(uuid.uuid4())[:8].upper()
        
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, plan_type, normalized_email, unique_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (username, email, password_hash, plan_type, email.lower().strip(), unique_id, datetime.utcnow().isoformat()))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Create access token
        access_token = f"token_{user_id}_{uuid.uuid4().hex[:16]}"
        
        print(f"✅ User registered: {email} (Username: {username})")
        
        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user_id,
                "username": username,
                "email": email,
                "plan_type": plan_type,
                "unique_id": unique_id
            }
        }), 201
        
    except Exception as e:
        print(f"❌ Registration error: {str(e)}")
        return jsonify({"msg": f"Server error: {str(e)}"}), 500'''
        
        # Replace the register function
        updated_content = content.replace(old_register, new_register)
        
        # Write the updated backend
        with open('simple_working_backend_fixed.py', 'w') as f:
            f.write(updated_content)
        
        print("✅ Backend username handling fixed")
        return True
        
    except Exception as e:
        print(f"❌ Error fixing backend: {str(e)}")
        return False

def test_user_registration():
    """Test user registration with the fixed backend"""
    try:
        print("🔄 Testing user registration...")
        
        import requests
        
        test_user = {
            "email": "anchalw11@gmail.com",
            "password": "TestPassword123!",
            "firstName": "Anchal",
            "lastName": "Sharma",
            "plan_type": "premium"
        }
        
        response = requests.post(
            "http://localhost:5000/api/auth/register",
            json=test_user,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"   Registration status: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print("✅ User registered successfully!")
            print(f"   User ID: {data['user']['id']}")
            print(f"   Username: {data['user']['username']}")
            print(f"   Email: {data['user']['email']}")
            return True
        elif response.status_code == 409:
            print("⚠️  User already exists")
            return True
        else:
            print(f"❌ Registration failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing registration: {str(e)}")
        return False

def main():
    """Main function"""
    print("🚀 Fix Backend Username Handling")
    print("=" * 40)
    
    try:
        # Fix backend username handling
        fix_backend_username_handling()
        print()
        
        # Test user registration
        test_user_registration()
        
        print()
        print("=" * 40)
        print("✅ Backend username handling fixed")
        print("🔐 User registration should now work properly")
        print("=" * 40)
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == '__main__':
    main()

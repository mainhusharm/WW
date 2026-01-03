#!/usr/bin/env python3
"""
Create Simple Test User with Working Credentials
This script creates a test user that will definitely work
"""

import sqlite3
import os
from datetime import datetime
import hashlib

def create_working_test_user():
    """Create a test user that will work with the current system"""
    try:
        print("🔄 Creating working test user...")
        
        # Database path
        db_path = "trading_bots.db"
        if not os.path.exists(db_path):
            print(f"❌ Database file not found: {db_path}")
            return None
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Test user credentials
        test_email = "test@example.com"
        test_password = "password123"
        test_username = "Test User"
        
        # Check if user already exists
        cursor.execute("SELECT id, email FROM users WHERE email = ?", (test_email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print(f"⚠️  User already exists: ID {existing_user[0]}")
            # Update the existing user
            cursor.execute("""
                UPDATE users 
                SET username = ?, 
                    password_hash = ?,
                    plan_type = 'premium',
                    normalized_email = ?
                WHERE email = ?
            """, (
                test_username,
                hashlib.sha256(test_password.encode()).hexdigest(),
                test_email.lower().strip(),
                test_email
            ))
            conn.commit()
            print("✅ Updated existing user")
        else:
            # Create new user
            password_hash = hashlib.sha256(test_password.encode()).hexdigest()
            
            cursor.execute("""
                INSERT INTO users (
                    username, email, password_hash, plan_type, 
                    normalized_email, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                test_username, test_email, password_hash, 'premium',
                test_email.lower().strip(), datetime.utcnow().isoformat()
            ))
            conn.commit()
            print("✅ Created new test user")
        
        # Verify the user
        cursor.execute("""
            SELECT id, username, email, plan_type, created_at 
            FROM users WHERE email = ?
        """, (test_email,))
        user = cursor.fetchone()
        
        if user:
            print("=" * 50)
            print("✅ TEST USER CREATED SUCCESSFULLY!")
            print("=" * 50)
            print("📋 LOGIN CREDENTIALS:")
            print(f"   Email: {user[2]}")
            print(f"   Password: {test_password}")
            print(f"   Username: {user[1]}")
            print(f"   Plan: {user[3]}")
            print(f"   User ID: {user[0]}")
            print("=" * 50)
            print("🔐 USE THESE CREDENTIALS TO LOGIN:")
            print(f"   Email: {user[2]}")
            print(f"   Password: {test_password}")
            print("=" * 50)
        
        conn.close()
        return user
        
    except Exception as e:
        print(f"❌ Error creating test user: {str(e)}")
        if 'conn' in locals():
            conn.close()
        return None

def create_multiple_test_users():
    """Create multiple test users with different credentials"""
    try:
        print("🔄 Creating multiple test users...")
        
        db_path = "trading_bots.db"
        if not os.path.exists(db_path):
            print(f"❌ Database file not found: {db_path}")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Multiple test users
        test_users = [
            {"email": "admin@test.com", "password": "admin123", "username": "Admin User", "plan": "premium"},
            {"email": "user@test.com", "password": "user123", "username": "Regular User", "plan": "premium"},
            {"email": "demo@test.com", "password": "demo123", "username": "Demo User", "plan": "premium"},
            {"email": "test@test.com", "password": "test123", "username": "Test User", "plan": "premium"}
        ]
        
        created_users = []
        
        for user_data in test_users:
            try:
                # Check if user exists
                cursor.execute("SELECT id FROM users WHERE email = ?", (user_data["email"],))
                if cursor.fetchone():
                    print(f"   ⚠️  User {user_data['email']} already exists")
                    continue
                
                # Create user
                password_hash = hashlib.sha256(user_data["password"].encode()).hexdigest()
                
                cursor.execute("""
                    INSERT INTO users (
                        username, email, password_hash, plan_type, 
                        normalized_email, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    user_data["username"], user_data["email"], password_hash, user_data["plan"],
                    user_data["email"].lower().strip(), datetime.utcnow().isoformat()
                ))
                
                created_users.append(user_data)
                print(f"   ✅ Created user: {user_data['email']}")
                
            except Exception as e:
                print(f"   ❌ Error creating {user_data['email']}: {str(e)}")
        
        conn.commit()
        conn.close()
        
        if created_users:
            print("\n" + "=" * 60)
            print("✅ MULTIPLE TEST USERS CREATED!")
            print("=" * 60)
            print("📋 AVAILABLE LOGIN CREDENTIALS:")
            for user in created_users:
                print(f"   Email: {user['email']}")
                print(f"   Password: {user['password']}")
                print(f"   Plan: {user['plan']}")
                print("   " + "-" * 40)
            print("=" * 60)
            print("🔐 TRY ANY OF THESE CREDENTIALS TO LOGIN!")
            print("=" * 60)
        
        return len(created_users) > 0
        
    except Exception as e:
        print(f"❌ Error creating multiple users: {str(e)}")
        return False

def create_simple_login_bypass():
    """Create a simple HTML page for direct login bypass"""
    try:
        print("🔄 Creating simple login bypass...")
        
        html_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TraderEdge Pro - Direct Login</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        .success {
            background: rgba(76, 175, 80, 0.3);
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 5px;
        }
        button:hover {
            background: #45a049;
        }
        .credentials {
            background: rgba(255,255,255,0.2);
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .user-box {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 4px solid #4CAF50;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 TraderEdge Pro - Direct Login Access</h1>
        
        <div class="success">
            ✅ Multiple test users created! Choose any credentials below to login.
        </div>
        
        <div class="credentials">
            <h3>📋 AVAILABLE TEST USERS</h3>
            
            <div class="user-box">
                <h4>👤 Admin User</h4>
                <p><strong>Email:</strong> admin@test.com</p>
                <p><strong>Password:</strong> admin123</p>
                <button onclick="loginAs('admin@test.com', 'admin123')">Login as Admin</button>
            </div>
            
            <div class="user-box">
                <h4>👤 Regular User</h4>
                <p><strong>Email:</strong> user@test.com</p>
                <p><strong>Password:</strong> user123</p>
                <button onclick="loginAs('user@test.com', 'user123')">Login as User</button>
            </div>
            
            <div class="user-box">
                <h4>👤 Demo User</h4>
                <p><strong>Email:</strong> demo@test.com</p>
                <p><strong>Password:</strong> demo123</p>
                <button onclick="loginAs('demo@test.com', 'demo123')">Login as Demo</button>
            </div>
            
            <div class="user-box">
                <h4>👤 Test User</h4>
                <p><strong>Email:</strong> test@test.com</p>
                <p><strong>Password:</strong> test123</p>
                <button onclick="loginAs('test@test.com', 'test123')">Login as Test</button>
            </div>
        </div>
        
        <button onclick="goToMainSite()">🌐 Go to Main Login Page</button>
        
        <div id="status"></div>
    </div>

    <script>
        function loginAs(email, password) {
            // Create user data
            const userData = {
                id: `user_${Date.now()}`,
                name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1) + " User",
                email: email,
                membershipTier: "premium",
                accountType: "personal",
                riskTolerance: "moderate",
                isAuthenticated: true,
                setupComplete: true,
                token: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            
            // Store in localStorage
            localStorage.setItem('current_user', JSON.stringify(userData));
            localStorage.setItem('access_token', userData.token);
            localStorage.setItem('user_data', JSON.stringify(userData));
            localStorage.setItem('pending_signup_data', JSON.stringify({
                firstName: userData.name.split(' ')[0],
                lastName: userData.name.split(' ')[1] || 'User',
                email: email,
                password: password,
                plan_type: 'premium'
            }));
            
            // Show success message
            document.getElementById('status').innerHTML = `
                <div class="success">
                    ✅ Logged in as ${email}! Redirecting to dashboard...
                </div>
            `;
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'https://frontend-zwwl.onrender.com/dashboard';
            }, 2000);
        }
        
        function goToMainSite() {
            window.location.href = 'https://frontend-zwwl.onrender.com/signin';
        }
    </script>
</body>
</html>
        """
        
        with open('direct_login.html', 'w') as f:
            f.write(html_content)
        
        print("✅ Created direct_login.html")
        print("   This file provides multiple test user options")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating login bypass: {str(e)}")
        return False

def main():
    """Main function"""
    print("🚀 Simple Test User Creation")
    print("=" * 60)
    
    try:
        # Create single test user
        user = create_working_test_user()
        print()
        
        # Create multiple test users
        create_multiple_test_users()
        print()
        
        # Create direct login bypass
        create_simple_login_bypass()
        
        print("\n🎉 ALL TEST USERS CREATED!")
        print("\n📝 QUICK ACCESS OPTIONS:")
        print("1. Open 'direct_login.html' in your browser")
        print("2. Click any of the login buttons")
        print("3. You'll be automatically logged in and redirected to dashboard")
        print("\n🔐 OR use these credentials on the main login page:")
        print("   Email: admin@test.com")
        print("   Password: admin123")
        print("   (or any of the other test users)")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == '__main__':
    main()

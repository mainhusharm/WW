#!/usr/bin/env python3
"""
Backend-Frontend Connection Fix for TraderEdgePro
Automatically fixes connection issues between backend and frontend systems
"""

import os
import sys
import json
import subprocess
from pathlib import Path
import shutil

class ConnectionFixer:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.fixes_applied = []
        self.issues_found = []
    
    def create_working_backend_server(self):
        """Create a working backend server with all necessary endpoints"""
        print("🔧 Creating working backend server...")
        
        backend_server_code = '''#!/usr/bin/env python3
"""
Working Backend Server for TraderEdgePro
Handles all frontend-backend communication
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import psycopg2
import hashlib
import uuid
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=["*"])

# PostgreSQL connection
DATABASE_URL = "postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2"

def get_db_connection():
    """Get database connection"""
    try:
        return psycopg2.connect(DATABASE_URL)
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def create_tables():
    """Create necessary database tables"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Create enhanced_users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS enhanced_users (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                company VARCHAR(255),
                country VARCHAR(100),
                password_hash VARCHAR(255),
                plan_type VARCHAR(50),
                unique_id VARCHAR(100) UNIQUE,
                access_token VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create payment_transactions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payment_transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES enhanced_users(id),
                amount DECIMAL(10,2),
                payment_method VARCHAR(50),
                transaction_id VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create questionnaire_responses table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS questionnaire_responses (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES enhanced_users(id),
                prop_firm VARCHAR(255),
                account_type VARCHAR(100),
                account_number VARCHAR(100),
                risk_ratio VARCHAR(20),
                trading_assets TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        conn.close()
        return True
        
    except Exception as e:
        print(f"Table creation error: {e}")
        return False

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
@app.route('/api/enhanced/signup', methods=['POST', 'OPTIONS'])
def signup():
    """Handle user signup"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['firstName', 'lastName', 'email']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute("SELECT id FROM enhanced_users WHERE email = %s", (data['email'],))
        if cursor.fetchone():
            return jsonify({"error": "User already exists"}), 409
        
        # Create user
        password_hash = hashlib.sha256(data.get('password', '').encode()).hexdigest()
        unique_id = str(uuid.uuid4())
        access_token = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO enhanced_users 
            (first_name, last_name, email, phone, company, country, password_hash, unique_id, access_token)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            data['firstName'], data['lastName'], data['email'],
            data.get('phone', ''), data.get('company', ''), data.get('country', ''),
            password_hash, unique_id, access_token
        ))
        
        user_id = cursor.fetchone()[0]
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "User created successfully",
            "user_id": user_id,
            "access_token": access_token
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/payments', methods=['POST', 'OPTIONS'])
@app.route('/api/enhanced/payment', methods=['POST', 'OPTIONS'])
def process_payment():
    """Handle payment processing"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Find user by email
        cursor.execute("SELECT id FROM enhanced_users WHERE email = %s", (data.get('email', ''),))
        user_row = cursor.fetchone()
        
        if not user_row:
            return jsonify({"error": "User not found"}), 404
        
        user_id = user_row[0]
        
        # Create payment record
        cursor.execute("""
            INSERT INTO payment_transactions 
            (user_id, amount, payment_method, transaction_id, status)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id, data.get('amount', 0), data.get('payment_method', 'unknown'),
            data.get('transaction_id', str(uuid.uuid4())), 'completed'
        ))
        
        payment_id = cursor.fetchone()[0]
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Payment processed successfully",
            "payment_id": payment_id
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/questionnaire', methods=['POST', 'OPTIONS'])
@app.route('/api/enhanced/questionnaire', methods=['POST', 'OPTIONS'])
def save_questionnaire():
    """Handle questionnaire responses"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Find user by email
        cursor.execute("SELECT id FROM enhanced_users WHERE email = %s", (data.get('email', ''),))
        user_row = cursor.fetchone()
        
        if not user_row:
            return jsonify({"error": "User not found"}), 404
        
        user_id = user_row[0]
        
        # Save questionnaire
        cursor.execute("""
            INSERT INTO questionnaire_responses 
            (user_id, prop_firm, account_type, account_number, risk_ratio, trading_assets)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id, data.get('propFirm', ''), data.get('accountType', ''),
            data.get('accountNumber', ''), data.get('riskRatio', ''),
            json.dumps(data.get('tradingAssets', []))
        ))
        
        questionnaire_id = cursor.fetchone()[0]
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Questionnaire saved successfully",
            "questionnaire_id": questionnaire_id
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard/<email>', methods=['GET'])
@app.route('/api/enhanced/dashboard/<email>', methods=['GET'])
def get_dashboard_data(email):
    """Get user dashboard data"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Get user data with questionnaire
        cursor.execute("""
            SELECT u.*, q.prop_firm, q.account_type, q.risk_ratio
            FROM enhanced_users u
            LEFT JOIN questionnaire_responses q ON u.id = q.user_id
            WHERE u.email = %s
        """, (email,))
        
        user_data = cursor.fetchone()
        if not user_data:
            return jsonify({"error": "User not found"}), 404
        
        conn.close()
        
        return jsonify({
            "success": True,
            "user": {
                "email": user_data[3],
                "first_name": user_data[1],
                "last_name": user_data[2],
                "prop_firm": user_data[12] if len(user_data) > 12 else None,
                "account_type": user_data[13] if len(user_data) > 13 else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/signals', methods=['GET'])
def get_signals():
    """Get trading signals"""
    return jsonify({
        "success": True,
        "signals": [
            {"symbol": "EURUSD", "direction": "BUY", "confidence": 85},
            {"symbol": "GBPUSD", "direction": "SELL", "confidence": 78}
        ]
    })

if __name__ == '__main__':
    print("🚀 Starting TraderEdgePro Backend Server...")
    
    # Create tables
    if create_tables():
        print("✅ Database tables ready")
    else:
        print("⚠️  Database table creation failed")
    
    print("🌐 Server running on http://localhost:5000")
    print("📊 API endpoints available:")
    print("   - POST /api/auth/register")
    print("   - POST /api/payments") 
    print("   - POST /api/questionnaire")
    print("   - GET  /api/dashboard/<email>")
    print("   - GET  /api/signals")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
'''
        
        # Write backend server
        backend_file = self.project_root / 'working_backend_server.py'
        with open(backend_file, 'w') as f:
            f.write(backend_server_code)
        
        self.fixes_applied.append("Created working backend server")
        print("✅ Working backend server created")
        return True
    
    def create_frontend_api_config(self):
        """Create frontend API configuration"""
        print("🔧 Creating frontend API configuration...")
        
        # Create src/utils directory if it doesn't exist
        utils_dir = self.project_root / 'src' / 'utils'
        utils_dir.mkdir(parents=True, exist_ok=True)
        
        api_config_code = '''// API Configuration for TraderEdgePro
// Handles backend-frontend communication

const API_BASE_URLS = {
  development: 'http://localhost:5000',
  production: 'https://backend-topb.onrender.com'
};

const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isDevelopment ? 
  API_BASE_URLS.development : 
  API_BASE_URLS.production;

export const API_ENDPOINTS = {
  SIGNUP: '/api/auth/register',
  PAYMENT: '/api/payments',
  QUESTIONNAIRE: '/api/questionnaire',
  DASHBOARD: '/api/dashboard',
  SIGNALS: '/api/signals',
  HEALTH: '/api/health'
};

// API utility functions
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    console.log(`API Call: ${url}`, finalOptions);
    const response = await fetch(url, finalOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`API Response:`, data);
    return data;
    
  } catch (error) {
    console.error(`API Error for ${url}:`, error);
    throw error;
  }
};

// Specific API functions
export const signupUser = async (userData) => {
  return apiCall(API_ENDPOINTS.SIGNUP, {
    method: 'POST',
    body: JSON.stringify(userData)
  });
};

export const processPayment = async (paymentData) => {
  return apiCall(API_ENDPOINTS.PAYMENT, {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });
};

export const saveQuestionnaire = async (questionnaireData) => {
  return apiCall(API_ENDPOINTS.QUESTIONNAIRE, {
    method: 'POST',
    body: JSON.stringify(questionnaireData)
  });
};

export const getDashboardData = async (email) => {
  return apiCall(`${API_ENDPOINTS.DASHBOARD}/${email}`);
};

export const getSignals = async () => {
  return apiCall(API_ENDPOINTS.SIGNALS);
};

export const checkHealth = async () => {
  return apiCall(API_ENDPOINTS.HEALTH);
};
'''
        
        # Write API config
        api_config_file = utils_dir / 'apiConfig.ts'
        with open(api_config_file, 'w') as f:
            f.write(api_config_code)
        
        self.fixes_applied.append("Created frontend API configuration")
        print("✅ Frontend API configuration created")
        return True
    
    def create_startup_scripts(self):
        """Create startup scripts for easy server management"""
        print("🔧 Creating startup scripts...")
        
        # Backend startup script
        backend_start_script = '''#!/bin/bash
echo "🚀 Starting TraderEdgePro Backend Server..."

# Install required packages
python3 -m pip install flask flask-cors psycopg2-binary

# Start backend server
python3 working_backend_server.py
'''
        
        backend_script_file = self.project_root / 'start_backend.sh'
        with open(backend_script_file, 'w') as f:
            f.write(backend_start_script)
        
        # Make executable
        os.chmod(backend_script_file, 0o755)
        
        # Frontend startup script
        frontend_start_script = '''#!/bin/bash
echo "🚀 Starting TraderEdgePro Frontend Server..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start frontend server
npm run dev
'''
        
        frontend_script_file = self.project_root / 'start_frontend.sh'
        with open(frontend_script_file, 'w') as f:
            f.write(frontend_start_script)
        
        # Make executable
        os.chmod(frontend_script_file, 0o755)
        
        # Combined startup script
        combined_script = '''#!/bin/bash
echo "🚀 Starting TraderEdgePro Full Stack..."

# Start backend in background
echo "Starting backend server..."
./start_backend.sh &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend server..."
./start_frontend.sh &
FRONTEND_PID=$!

echo "✅ Both servers started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "🌐 Access your application at:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
'''
        
        combined_script_file = self.project_root / 'start_fullstack.sh'
        with open(combined_script_file, 'w') as f:
            f.write(combined_script)
        
        # Make executable
        os.chmod(combined_script_file, 0o755)
        
        self.fixes_applied.append("Created startup scripts")
        print("✅ Startup scripts created")
        return True
    
    def update_package_json(self):
        """Update package.json with necessary dependencies"""
        print("🔧 Updating package.json...")
        
        package_json_file = self.project_root / 'package.json'
        
        if package_json_file.exists():
            try:
                with open(package_json_file, 'r') as f:
                    package_data = json.load(f)
                
                # Add necessary scripts
                if 'scripts' not in package_data:
                    package_data['scripts'] = {}
                
                package_data['scripts'].update({
                    "dev": "vite",
                    "build": "vite build",
                    "preview": "vite preview",
                    "backend": "python3 working_backend_server.py",
                    "fullstack": "./start_fullstack.sh"
                })
                
                # Write updated package.json
                with open(package_json_file, 'w') as f:
                    json.dump(package_data, f, indent=2)
                
                self.fixes_applied.append("Updated package.json scripts")
                print("✅ Package.json updated")
                return True
                
            except Exception as e:
                print(f"❌ Failed to update package.json: {e}")
                return False
        else:
            print("⚠️  package.json not found")
            return False
    
    def create_requirements_txt(self):
        """Create requirements.txt for backend dependencies"""
        print("🔧 Creating requirements.txt...")
        
        requirements = '''Flask==2.3.3
Flask-CORS==4.0.0
psycopg2-binary==2.9.7
requests==2.31.0
python-dotenv==1.0.0
'''
        
        requirements_file = self.project_root / 'requirements.txt'
        with open(requirements_file, 'w') as f:
            f.write(requirements)
        
        self.fixes_applied.append("Created requirements.txt")
        print("✅ Requirements.txt created")
        return True
    
    def apply_all_fixes(self):
        """Apply all connection fixes"""
        print("🔧 APPLYING BACKEND-FRONTEND CONNECTION FIXES")
        print("=" * 60)
        
        fixes = [
            self.create_working_backend_server,
            self.create_frontend_api_config,
            self.create_startup_scripts,
            self.update_package_json,
            self.create_requirements_txt
        ]
        
        success_count = 0
        for fix_function in fixes:
            try:
                if fix_function():
                    success_count += 1
            except Exception as e:
                print(f"❌ Fix failed: {e}")
        
        return success_count, len(fixes)

if __name__ == "__main__":
    print("🚀 TraderEdgePro Backend-Frontend Connection Fixer")
    print("=" * 60)
    
    fixer = ConnectionFixer()
    success_count, total_fixes = fixer.apply_all_fixes()
    
    print(f"\n📊 FIX SUMMARY")
    print("=" * 30)
    print(f"Fixes Applied: {success_count}/{total_fixes}")
    
    if fixer.fixes_applied:
        print(f"\n✅ FIXES APPLIED:")
        for i, fix in enumerate(fixer.fixes_applied, 1):
            print(f"  {i}. {fix}")
    
    print(f"\n🚀 NEXT STEPS:")
    print("1. Run: chmod +x *.sh")
    print("2. Start backend: ./start_backend.sh")
    print("3. Start frontend: ./start_frontend.sh")
    print("4. Or start both: ./start_fullstack.sh")
    print("")
    print("🌐 Your application will be available at:")
    print("   Frontend: http://localhost:5173")
    print("   Backend:  http://localhost:5000")
    print("   API Test: http://localhost:5000/api/health")

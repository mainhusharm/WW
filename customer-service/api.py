from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import json
import os
import logging
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
DATABASE_PATH = 'customer_service.db'

def init_database():
    """Initialize the customer service database"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Create customers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unique_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            membership_tier TEXT DEFAULT 'free',
            join_date TEXT NOT NULL,
            last_active TEXT,
            phone TEXT,
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create customer_activities table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customer_activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            activity_type TEXT NOT NULL,
            activity_details TEXT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')
    
    # Create customer_screenshots table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customer_screenshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            screenshot_url TEXT NOT NULL,
            screenshot_type TEXT DEFAULT 'general',
            upload_date TEXT DEFAULT CURRENT_TIMESTAMP,
            description TEXT,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')
    
    # Create questionnaire_responses table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS questionnaire_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            response_date TEXT DEFAULT CURRENT_TIMESTAMP,
            questionnaire_type TEXT DEFAULT 'risk_assessment',
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')
    
    # Create risk_management_plans table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS risk_management_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            plan_data TEXT NOT NULL,
            created_date TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_date TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')
    
    # Create dashboard_data table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dashboard_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            data_type TEXT NOT NULL,
            data_content TEXT NOT NULL,
            last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

# Initialize database on startup
init_database()

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'customer-service-api',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/customers', methods=['GET'])
def get_customers():
    """Get all customers with pagination and search"""
    try:
        search = request.args.get('search', '')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        offset = (page - 1) * per_page
        
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if search:
            cursor.execute('''
                SELECT * FROM customers 
                WHERE unique_id LIKE ? OR name LIKE ? OR email LIKE ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (f'%{search}%', f'%{search}%', f'%{search}%', per_page, offset))
        else:
            cursor.execute('''
                SELECT * FROM customers 
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (per_page, offset))
        
        customers = [dict(row) for row in cursor.fetchall()]
        
        # Get total count
        if search:
            cursor.execute('''
                SELECT COUNT(*) FROM customers 
                WHERE unique_id LIKE ? OR name LIKE ? OR email LIKE ?
            ''', (f'%{search}%', f'%{search}%', f'%{search}%'))
        else:
            cursor.execute('SELECT COUNT(*) FROM customers')
        
        total_count = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'customers': customers,
            'total': total_count,
            'page': page,
            'per_page': per_page,
            'total_pages': (total_count + per_page - 1) // per_page
        })
        
    except Exception as e:
        logger.error(f"Error fetching customers: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers/<customer_id>', methods=['GET'])
def get_customer_details(customer_id):
    """Get detailed customer information"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get customer basic info
        cursor.execute('SELECT * FROM customers WHERE unique_id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        customer_dict = dict(customer)
        
        # Get activities
        cursor.execute('''
            SELECT * FROM customer_activities 
            WHERE customer_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 50
        ''', (customer['id'],))
        activities = [dict(row) for row in cursor.fetchall()]
        
        # Get screenshots
        cursor.execute('''
            SELECT * FROM customer_screenshots 
            WHERE customer_id = ? 
            ORDER BY upload_date DESC
        ''', (customer['id'],))
        screenshots = [dict(row) for row in cursor.fetchall()]
        
        # Get questionnaire responses
        cursor.execute('''
            SELECT * FROM questionnaire_responses 
            WHERE customer_id = ? 
            ORDER BY response_date DESC
        ''', (customer['id'],))
        questionnaire_responses = [dict(row) for row in cursor.fetchall()]
        
        # Get risk management plan
        cursor.execute('''
            SELECT * FROM risk_management_plans 
            WHERE customer_id = ? 
            ORDER BY updated_date DESC 
            LIMIT 1
        ''', (customer['id'],))
        risk_plan = cursor.fetchone()
        risk_plan_dict = dict(risk_plan) if risk_plan else None
        
        # Get dashboard data
        cursor.execute('''
            SELECT * FROM dashboard_data 
            WHERE customer_id = ? 
            ORDER BY last_updated DESC
        ''', (customer['id'],))
        dashboard_data = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'customer': customer_dict,
            'activities': activities,
            'screenshots': screenshots,
            'questionnaire_responses': questionnaire_responses,
            'risk_management_plan': risk_plan_dict,
            'dashboard_data': dashboard_data
        })
        
    except Exception as e:
        logger.error(f"Error fetching customer details: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers/<customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    """Delete a customer and all associated data"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get customer ID
        cursor.execute('SELECT id FROM customers WHERE unique_id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        customer_db_id = customer[0]
        
        # Delete all associated data
        cursor.execute('DELETE FROM customer_activities WHERE customer_id = ?', (customer_db_id,))
        cursor.execute('DELETE FROM customer_screenshots WHERE customer_id = ?', (customer_db_id,))
        cursor.execute('DELETE FROM questionnaire_responses WHERE customer_id = ?', (customer_db_id,))
        cursor.execute('DELETE FROM risk_management_plans WHERE customer_id = ?', (customer_db_id,))
        cursor.execute('DELETE FROM dashboard_data WHERE customer_id = ?', (customer_db_id,))
        cursor.execute('DELETE FROM customers WHERE id = ?', (customer_db_id,))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Customer {customer_id} and all associated data deleted")
        return jsonify({'message': 'Customer deleted successfully'})
        
    except Exception as e:
        logger.error(f"Error deleting customer: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers', methods=['POST'])
def create_customer():
    """Create a new customer record"""
    try:
        data = request.get_json()
        
        if not data or not data.get('name') or not data.get('email'):
            return jsonify({'error': 'Name and email are required'}), 400
        
        # Generate unique ID
        unique_id = str(uuid.uuid4())[:8].upper()
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO customers (unique_id, name, email, membership_tier, join_date, last_active, phone, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            unique_id,
            data['name'],
            data['email'],
            data.get('membership_tier', 'free'),
            data.get('join_date', datetime.now().isoformat()),
            data.get('last_active', datetime.now().isoformat()),
            data.get('phone', ''),
            data.get('status', 'active')
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Customer {unique_id} created successfully")
        return jsonify({'message': 'Customer created successfully', 'unique_id': unique_id}), 201
        
    except Exception as e:
        logger.error(f"Error creating customer: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers/<customer_id>/activities', methods=['POST'])
def add_customer_activity(customer_id):
    """Add an activity record for a customer"""
    try:
        data = request.get_json()
        
        if not data or not data.get('activity_type'):
            return jsonify({'error': 'Activity type is required'}), 400
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get customer ID
        cursor.execute('SELECT id FROM customers WHERE unique_id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        cursor.execute('''
            INSERT INTO customer_activities (customer_id, activity_type, activity_details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            customer[0],
            data['activity_type'],
            data.get('activity_details', ''),
            data.get('ip_address', ''),
            data.get('user_agent', '')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Activity added successfully'}), 201
        
    except Exception as e:
        logger.error(f"Error adding customer activity: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers/<customer_id>/screenshots', methods=['POST'])
def add_customer_screenshot(customer_id):
    """Add a screenshot record for a customer"""
    try:
        data = request.get_json()
        
        if not data or not data.get('screenshot_url'):
            return jsonify({'error': 'Screenshot URL is required'}), 400
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get customer ID
        cursor.execute('SELECT id FROM customers WHERE unique_id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        cursor.execute('''
            INSERT INTO customer_screenshots (customer_id, screenshot_url, screenshot_type, description)
            VALUES (?, ?, ?, ?)
        ''', (
            customer[0],
            data['screenshot_url'],
            data.get('screenshot_type', 'general'),
            data.get('description', '')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Screenshot added successfully'}), 201
        
    except Exception as e:
        logger.error(f"Error adding customer screenshot: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers/<customer_id>/questionnaire', methods=['POST'])
def add_questionnaire_response(customer_id):
    """Add questionnaire responses for a customer"""
    try:
        data = request.get_json()
        
        if not data or not data.get('responses'):
            return jsonify({'error': 'Questionnaire responses are required'}), 400
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get customer ID
        cursor.execute('SELECT id FROM customers WHERE unique_id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Add each response
        for response in data['responses']:
            cursor.execute('''
                INSERT INTO questionnaire_responses (customer_id, question, answer, questionnaire_type)
                VALUES (?, ?, ?, ?)
            ''', (
                customer[0],
                response['question'],
                response['answer'],
                data.get('questionnaire_type', 'risk_assessment')
            ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Questionnaire responses added successfully'}), 201
        
    except Exception as e:
        logger.error(f"Error adding questionnaire responses: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers/<customer_id>/risk-plan', methods=['POST'])
def add_risk_management_plan(customer_id):
    """Add or update risk management plan for a customer"""
    try:
        data = request.get_json()
        
        if not data or not data.get('plan_data'):
            return jsonify({'error': 'Risk plan data is required'}), 400
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get customer ID
        cursor.execute('SELECT id FROM customers WHERE unique_id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Check if plan exists
        cursor.execute('SELECT id FROM risk_management_plans WHERE customer_id = ?', (customer[0],))
        existing_plan = cursor.fetchone()
        
        if existing_plan:
            # Update existing plan
            cursor.execute('''
                UPDATE risk_management_plans 
                SET plan_data = ?, updated_date = CURRENT_TIMESTAMP
                WHERE customer_id = ?
            ''', (json.dumps(data['plan_data']), customer[0]))
        else:
            # Create new plan
            cursor.execute('''
                INSERT INTO risk_management_plans (customer_id, plan_data)
                VALUES (?, ?)
            ''', (customer[0], json.dumps(data['plan_data'])))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Risk management plan saved successfully'}), 201
        
    except Exception as e:
        logger.error(f"Error saving risk management plan: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers/<customer_id>/dashboard-data', methods=['POST'])
def add_dashboard_data(customer_id):
    """Add dashboard data for a customer"""
    try:
        data = request.get_json()
        
        if not data or not data.get('data_type') or not data.get('data_content'):
            return jsonify({'error': 'Data type and content are required'}), 400
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get customer ID
        cursor.execute('SELECT id FROM customers WHERE unique_id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Check if data type exists for this customer
        cursor.execute('SELECT id FROM dashboard_data WHERE customer_id = ? AND data_type = ?', 
                      (customer[0], data['data_type']))
        existing_data = cursor.fetchone()
        
        if existing_data:
            # Update existing data
            cursor.execute('''
                UPDATE dashboard_data 
                SET data_content = ?, last_updated = CURRENT_TIMESTAMP
                WHERE customer_id = ? AND data_type = ?
            ''', (json.dumps(data['data_content']), customer[0], data['data_type']))
        else:
            # Create new data entry
            cursor.execute('''
                INSERT INTO dashboard_data (customer_id, data_type, data_content)
                VALUES (?, ?, ?)
            ''', (customer[0], data['data_type'], json.dumps(data['data_content'])))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Dashboard data saved successfully'}), 201
        
    except Exception as e:
        logger.error(f"Error saving dashboard data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/')
def serve_dashboard():
    """Serve the customer service dashboard"""
    return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3005))
    app.run(host='0.0.0.0', port=port, debug=False)

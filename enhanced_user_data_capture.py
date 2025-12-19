"""
Enhanced User Data Capture System
Captures comprehensive user data after signup and payment completion
Stores data securely in PostgreSQL with admin-only modification access
"""

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from cryptography.fernet import Fernet
import os
import uuid
import json
from datetime import datetime
from sqlalchemy_utils import UUIDType

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://trading_user:LO9gh4RP1imqjzFH4TCxu1CdqZOcJn5g@dpg-d2rgcod6ubrc73elq3a0-a.oregon-postgres.render.com/trading_platform_iv50')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'e7f807cd0b84dd27dcee7c07eff4f5b0ba75949c9132a5e81f887df02a5ce0a3')

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# Encryption setup
FERNET_KEY = os.getenv('ENCRYPTION_KEY', 'VT0jOj7lNgWGj5JSNQ0-06ADjnCGYwWdGpKvS5ps3e4=')
if FERNET_KEY:
    cipher_suite = Fernet(FERNET_KEY.encode())
else:
    print("WARNING: ENCRYPTION_KEY not set. Data encryption will not be active.")
    cipher_suite = None

def encrypt_data(data):
    """Encrypt sensitive data"""
    if cipher_suite and data:
        return cipher_suite.encrypt(data.encode()).decode()
    return data

def decrypt_data(encrypted_data):
    """Decrypt sensitive data"""
    if cipher_suite and encrypted_data:
        try:
            return cipher_suite.decrypt(encrypted_data.encode()).decode()
        except Exception as e:
            print(f"Decryption error: {e}")
            return encrypted_data
    return encrypted_data

# Database Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    username = db.Column(db.String(255), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), default=db.func.now(), onupdate=db.func.now())
    is_admin = db.Column(db.Boolean, default=False)
    is_verified = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': str(self.id),
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_admin': self.is_admin,
            'is_verified': self.is_verified
        }

class CustomerData(db.Model):
    __tablename__ = 'customer_data'
    id = db.Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUIDType(binary=False), db.ForeignKey('users.id'), nullable=False)
    unique_id = db.Column(db.String(255), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    
    # Encrypted personal data
    encrypted_name = db.Column(db.Text)
    encrypted_phone = db.Column(db.Text)
    
    # Membership and payment data
    membership_tier = db.Column(db.String(50))
    payment_status = db.Column(db.String(50))
    payment_method = db.Column(db.String(50))
    payment_amount = db.Column(db.Numeric(10, 2))
    payment_date = db.Column(db.DateTime(timezone=True))
    payment_transaction_id = db.Column(db.String(255))
    
    # Account information
    join_date = db.Column(db.DateTime(timezone=True), nullable=False)
    last_active = db.Column(db.DateTime(timezone=True))
    status = db.Column(db.String(50), default='active')
    
    # Encrypted questionnaire and trading data
    encrypted_questionnaire_data = db.Column(db.Text)
    encrypted_account_type = db.Column(db.Text)
    encrypted_prop_firm = db.Column(db.Text)
    encrypted_account_size = db.Column(db.Text)
    encrypted_trading_experience = db.Column(db.Text)
    encrypted_risk_tolerance = db.Column(db.Text)
    encrypted_trading_goals = db.Column(db.Text)
    
    # Technical data
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    signup_source = db.Column(db.String(255))
    referral_code = db.Column(db.String(255))
    
    # Data integrity flags
    data_capture_complete = db.Column(db.Boolean, default=False)
    payment_verified = db.Column(db.Boolean, default=False)
    admin_verified = db.Column(db.Boolean, default=False)
    admin_notes = db.Column(db.Text)
    
    # Audit trail
    created_at = db.Column(db.DateTime(timezone=True), default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), default=db.func.now(), onupdate=db.func.now())
    last_modified_by = db.Column(UUIDType(binary=False), db.ForeignKey('users.id'))

    user = db.relationship('User', backref=db.backref('customer_data', uselist=False), foreign_keys=[user_id])
    modifier = db.relationship('User', backref=db.backref('modified_customer_data'), foreign_keys=[last_modified_by])

    def to_dict(self, include_encrypted=False, admin_access=False):
        """Convert to dictionary with optional encrypted data access"""
        data = {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'unique_id': self.unique_id,
            'email': self.email,
            'membership_tier': self.membership_tier,
            'payment_status': self.payment_status,
            'payment_method': self.payment_method,
            'payment_amount': float(self.payment_amount) if self.payment_amount else 0,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'payment_transaction_id': self.payment_transaction_id,
            'join_date': self.join_date.isoformat(),
            'last_active': self.last_active.isoformat() if self.last_active else None,
            'status': self.status,
            'ip_address': self.ip_address,
            'signup_source': self.signup_source,
            'referral_code': self.referral_code,
            'data_capture_complete': self.data_capture_complete,
            'payment_verified': self.payment_verified,
            'admin_verified': self.admin_verified,
            'admin_notes': self.admin_notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        # Only include encrypted data for admin access
        if include_encrypted and admin_access:
            data['name'] = decrypt_data(self.encrypted_name)
            data['phone'] = decrypt_data(self.encrypted_phone)
            data['questionnaire_data'] = json.loads(decrypt_data(self.encrypted_questionnaire_data)) if self.encrypted_questionnaire_data else {}
            data['account_type'] = decrypt_data(self.encrypted_account_type)
            data['prop_firm'] = decrypt_data(self.encrypted_prop_firm)
            data['account_size'] = decrypt_data(self.encrypted_account_size)
            data['trading_experience'] = decrypt_data(self.encrypted_trading_experience)
            data['risk_tolerance'] = decrypt_data(self.encrypted_risk_tolerance)
            data['trading_goals'] = decrypt_data(self.encrypted_trading_goals)
            data['user_agent'] = self.user_agent
            data['last_modified_by'] = str(self.last_modified_by) if self.last_modified_by else None
            
        return data

class AdminAccessLog(db.Model):
    __tablename__ = 'admin_access_logs'
    id = db.Column(UUIDType(binary=False), primary_key=True, default=uuid.uuid4)
    admin_id = db.Column(UUIDType(binary=False), db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)  # 'view', 'export', 'modify'
    target_type = db.Column(db.String(50), nullable=False)  # 'customer_data', 'user'
    target_id = db.Column(UUIDType(binary=False), nullable=False)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    details = db.Column(db.Text)  # JSON string with additional details
    created_at = db.Column(db.DateTime(timezone=True), default=db.func.now())

    admin = db.relationship('User', backref=db.backref('admin_access_logs'))

# Authentication decorator
def require_admin_auth(f):
    """Decorator to require admin authentication"""
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Authorization header required'}), 401
        
        try:
            # Extract token from "Bearer <token>"
            token = auth_header.split(' ')[1]
            # Here you would validate the JWT token and check if user is admin
            # For now, we'll use a simple admin check
            admin_mpin = request.headers.get('X-Admin-MPIN')
            if admin_mpin != '180623':  # Your admin MPIN
                return jsonify({'error': 'Admin access required'}), 403
        except Exception as e:
            return jsonify({'error': 'Invalid authorization'}), 401
        
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

# API Routes

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Enhanced User Data Capture System is running',
        'database': 'PostgreSQL',
        'encryption': 'active' if cipher_suite else 'inactive',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/api/users/register', methods=['POST'])
def register_user():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'User with this email already exists'}), 409
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already taken'}), 409
        
        # Create new user
        password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=password_hash,
            is_admin=data.get('is_admin', False)
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Create initial customer data record
        customer_data = CustomerData(
            user_id=user.id,
            unique_id=f"CUS-{user.id.hex[:8].upper()}",
            email=user.email,
            join_date=datetime.now(),
            last_active=datetime.now(),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            signup_source=data.get('signup_source', 'website')
        )
        
        db.session.add(customer_data)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user_id': str(user.id),
            'customer_id': str(customer_data.id)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@app.route('/api/users/login', methods=['POST'])
def login_user():
    """User login"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        if not user or not bcrypt.check_password_hash(user.password_hash, data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Update last active
        customer_data = CustomerData.query.filter_by(user_id=user.id).first()
        if customer_data:
            customer_data.last_active = datetime.now()
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@app.route('/api/customer-data/capture-signup', methods=['POST'])
def capture_signup_data():
    """Capture additional data after user signup"""
    try:
        data = request.get_json()
        
        if not data.get('user_id'):
            return jsonify({'error': 'user_id is required'}), 400
        
        user = User.query.get(data['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        customer_data = CustomerData.query.filter_by(user_id=user.id).first()
        if not customer_data:
            return jsonify({'error': 'Customer data not found'}), 404
        
        # Update customer data with signup information
        if data.get('name'):
            customer_data.encrypted_name = encrypt_data(data['name'])
        if data.get('phone'):
            customer_data.encrypted_phone = encrypt_data(data['phone'])
        if data.get('questionnaire_data'):
            customer_data.encrypted_questionnaire_data = encrypt_data(json.dumps(data['questionnaire_data']))
        if data.get('account_type'):
            customer_data.encrypted_account_type = encrypt_data(data['account_type'])
        if data.get('prop_firm'):
            customer_data.encrypted_prop_firm = encrypt_data(data['prop_firm'])
        if data.get('account_size'):
            customer_data.encrypted_account_size = encrypt_data(data['account_size'])
        if data.get('trading_experience'):
            customer_data.encrypted_trading_experience = encrypt_data(data['trading_experience'])
        if data.get('risk_tolerance'):
            customer_data.encrypted_risk_tolerance = encrypt_data(data['risk_tolerance'])
        if data.get('trading_goals'):
            customer_data.encrypted_trading_goals = encrypt_data(data['trading_goals'])
        
        customer_data.data_capture_complete = True
        customer_data.updated_at = datetime.now()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Signup data captured successfully',
            'customer_id': str(customer_data.id)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to capture signup data: {str(e)}'}), 500

@app.route('/api/customer-data/capture-payment', methods=['POST'])
def capture_payment_data():
    """Capture payment data after successful payment"""
    try:
        data = request.get_json()
        
        if not data.get('user_id'):
            return jsonify({'error': 'user_id is required'}), 400
        
        user = User.query.get(data['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        customer_data = CustomerData.query.filter_by(user_id=user.id).first()
        if not customer_data:
            return jsonify({'error': 'Customer data not found'}), 404
        
        # Update payment information
        customer_data.payment_status = data.get('payment_status', 'completed')
        customer_data.payment_method = data.get('payment_method')
        customer_data.payment_amount = data.get('payment_amount', 0)
        customer_data.payment_date = datetime.now()
        customer_data.payment_transaction_id = data.get('transaction_id')
        customer_data.membership_tier = data.get('membership_tier', 'premium')
        customer_data.payment_verified = True
        customer_data.updated_at = datetime.now()
        
        # Mark user as verified
        user.is_verified = True
        user.updated_at = datetime.now()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Payment data captured successfully',
            'customer_id': str(customer_data.id),
            'payment_verified': True
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to capture payment data: {str(e)}'}), 500

@app.route('/api/customers', methods=['GET'])
@require_admin_auth
def get_all_customers():
    """Get all customer data (Admin only)"""
    try:
        customers = CustomerData.query.all()
        
        # Log admin access
        admin_log = AdminAccessLog(
            admin_id=uuid.uuid4(),  # In real implementation, get from JWT token
            action='view',
            target_type='customer_data',
            target_id=uuid.uuid4(),  # All customers
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            details=json.dumps({'count': len(customers)})
        )
        db.session.add(admin_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'count': len(customers),
            'customers': [customer.to_dict(include_encrypted=True, admin_access=True) for customer in customers]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch customers: {str(e)}'}), 500

@app.route('/api/customers/<customer_id>', methods=['GET'])
@require_admin_auth
def get_customer_by_id(customer_id):
    """Get specific customer data (Admin only)"""
    try:
        customer = CustomerData.query.get(customer_id)
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Log admin access
        admin_log = AdminAccessLog(
            admin_id=uuid.uuid4(),  # In real implementation, get from JWT token
            action='view',
            target_type='customer_data',
            target_id=customer_id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(admin_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'customer': customer.to_dict(include_encrypted=True, admin_access=True)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch customer: {str(e)}'}), 500

@app.route('/api/customers/<customer_id>/admin-notes', methods=['PUT'])
@require_admin_auth
def update_admin_notes(customer_id):
    """Update admin notes (Admin only)"""
    try:
        data = request.get_json()
        
        customer = CustomerData.query.get(customer_id)
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Update admin notes
        customer.admin_notes = data.get('admin_notes', '')
        customer.admin_verified = data.get('admin_verified', customer.admin_verified)
        customer.updated_at = datetime.now()
        customer.last_modified_by = uuid.uuid4()  # In real implementation, get from JWT token
        
        # Log admin modification
        admin_log = AdminAccessLog(
            admin_id=uuid.uuid4(),  # In real implementation, get from JWT token
            action='modify',
            target_type='customer_data',
            target_id=customer_id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            details=json.dumps({'field': 'admin_notes', 'new_value': data.get('admin_notes', '')})
        )
        db.session.add(admin_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Admin notes updated successfully',
            'customer': customer.to_dict(include_encrypted=True, admin_access=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update admin notes: {str(e)}'}), 500

@app.route('/api/customers/export', methods=['POST'])
@require_admin_auth
def export_customer_data():
    """Export customer data (Admin only)"""
    try:
        data = request.get_json()
        export_format = data.get('format', 'json')
        
        customers = CustomerData.query.all()
        
        # Log admin export
        admin_log = AdminAccessLog(
            admin_id=uuid.uuid4(),  # In real implementation, get from JWT token
            action='export',
            target_type='customer_data',
            target_id=uuid.uuid4(),  # All customers
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            details=json.dumps({'format': export_format, 'count': len(customers)})
        )
        db.session.add(admin_log)
        db.session.commit()
        
        if export_format == 'json':
            return jsonify({
                'success': True,
                'export_data': [customer.to_dict(include_encrypted=True, admin_access=True) for customer in customers],
                'exported_at': datetime.now().isoformat(),
                'count': len(customers)
            }), 200
        else:
            return jsonify({'error': 'Unsupported export format'}), 400
        
    except Exception as e:
        return jsonify({'error': f'Failed to export data: {str(e)}'}), 500

@app.route('/api/stats', methods=['GET'])
@require_admin_auth
def get_system_stats():
    """Get system statistics (Admin only)"""
    try:
        total_users = User.query.count()
        total_customers = CustomerData.query.count()
        verified_customers = CustomerData.query.filter_by(payment_verified=True).count()
        admin_verified = CustomerData.query.filter_by(admin_verified=True).count()
        
        # Recent activity
        recent_signups = CustomerData.query.filter(
            CustomerData.created_at >= datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        ).count()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_users': total_users,
                'total_customers': total_customers,
                'verified_customers': verified_customers,
                'admin_verified': admin_verified,
                'recent_signups_today': recent_signups,
                'verification_rate': (verified_customers / total_customers * 100) if total_customers > 0 else 0
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get stats: {str(e)}'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("✅ Database tables created/verified successfully")
        print("🔐 Admin MPIN: 180623")
        print("🚀 Enhanced User Data Capture System ready!")
    
    port = int(os.environ.get('PORT', 5005))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)

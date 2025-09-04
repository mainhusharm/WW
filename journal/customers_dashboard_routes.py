from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import uuid

customers_dashboard_bp = Blueprint('customers_dashboard', __name__)

@customers_dashboard_bp.route('/customers/dashboard', methods=['GET', 'OPTIONS'])
def get_customers_dashboard():
    """Get customers for dashboard"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # For now, return mock customer data
        # In production, this would connect to the actual database
        customers = generate_mock_customers()
        
        return jsonify({ 
            'success': True,
            'customers': customers,
            'total': len(customers),
            'lastUpdated': datetime.utcnow().isoformat()
        })
        
    except Exception as error:
        print(f'Error fetching customers dashboard: {error}')
        return jsonify({ 
            'success': False,
            'error': str(error) 
        }), 500

@customers_dashboard_bp.route('/customers/dashboard', methods=['POST', 'OPTIONS'])
def create_customer():
    """Create or update customer"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        email = data.get('email')
        account_type = data.get('accountType', 'Standard')
        payment_status = data.get('paymentStatus', 'pending')
        
        if not email:
            return jsonify({ 
                'success': False,
                'error': 'Email is required' 
            }), 400
        
        # In production, this would save to database
        # For now, just return success
        customer_id = str(uuid.uuid4())
        
        return jsonify({ 
            'success': True,
            'message': 'Customer data updated successfully',
            'customerId': customer_id
        })
        
    except Exception as error:
        print(f'Error creating customer: {error}')
        return jsonify({ 
            'success': False,
            'error': str(error) 
        }), 500

def generate_mock_customers():
    """Generate mock customer data"""
    return [
        {
            'id': 'customer-1',
            'email': 'john.doe@example.com',
            'accountType': 'QuantTekel Instant',
            'paymentStatus': 'completed',
            'status': 'active',
            'subscriptionId': 'sub_123456789',
            'createdAt': (datetime.utcnow() - timedelta(days=5)).isoformat(),
            'lastPayment': (datetime.utcnow() - timedelta(days=5)).isoformat(),
            'questionnaire': {
                'accountType': 'QuantTekel Instant',
                'tradingRules': ['Risk Management', 'Position Sizing'],
                'responses': {
                    'experience': 'intermediate',
                    'tradingGoals': 'Consistent monthly returns',
                    'riskTolerance': 'moderate'
                }
            },
            'user': {
                'id': 'user-1',
                'username': 'John Doe',
                'planType': 'premium'
            }
        },
        {
            'id': 'customer-2',
            'email': 'jane.smith@example.com',
            'accountType': 'QuantTekel 2-Step',
            'paymentStatus': 'completed',
            'status': 'active',
            'subscriptionId': 'sub_987654321',
            'createdAt': (datetime.utcnow() - timedelta(days=3)).isoformat(),
            'lastPayment': (datetime.utcnow() - timedelta(days=3)).isoformat(),
            'questionnaire': {
                'accountType': 'QuantTekel 2-Step',
                'tradingRules': ['Stop Loss', 'Take Profit'],
                'responses': {
                    'experience': 'advanced',
                    'tradingGoals': 'Professional trading career',
                    'riskTolerance': 'aggressive'
                }
            },
            'user': {
                'id': 'user-2',
                'username': 'Jane Smith',
                'planType': 'premium'
            }
        },
        {
            'id': 'customer-3',
            'email': 'mike.wilson@example.com',
            'accountType': 'QuantTekel Pro',
            'paymentStatus': 'pending',
            'status': 'inactive',
            'subscriptionId': None,
            'createdAt': (datetime.utcnow() - timedelta(days=1)).isoformat(),
            'lastPayment': None,
            'questionnaire': {
                'accountType': 'QuantTekel Pro',
                'tradingRules': ['News Trading', 'Weekend Holding'],
                'responses': {
                    'experience': 'beginner',
                    'tradingGoals': 'Learn trading basics',
                    'riskTolerance': 'conservative'
                }
            },
            'user': {
                'id': 'user-3',
                'username': 'Mike Wilson',
                'planType': 'standard'
            }
        }
    ]

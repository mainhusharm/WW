from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import uuid

payment_customers_bp = Blueprint('payment_customers', __name__)

# In-memory storage for payment-verified customers (in production, use database)
payment_customers = []

@payment_customers_bp.route('/customers/payment-verified', methods=['GET', 'POST', 'OPTIONS'])
def payment_verified_customers():
    if request.method == 'OPTIONS':
        return '', 200
    
    if request.method == 'POST':
        # Create new customer after payment verification
        try:
            data = request.get_json()
            
            new_customer = {
                'id': str(uuid.uuid4()),
                'email': data.get('email'),
                'accountType': data.get('accountType', 'QuantTekel Instant'),
                'paymentStatus': 'completed',
                'status': 'active',
                'subscriptionId': data.get('subscriptionId', f'sub_{uuid.uuid4().hex[:8]}'),
                'createdAt': datetime.utcnow().isoformat(),
                'lastPayment': datetime.utcnow().isoformat(),
                'paymentAmount': float(data.get('paymentAmount', 99.00)),
                'paymentMethod': data.get('paymentMethod', 'Credit Card'),
                'questionnaire': {
                    'accountType': data.get('accountType', 'QuantTekel Instant'),
                    'tradingRules': data.get('tradingRules', ['Risk Management', 'Position Sizing']),
                    'responses': {
                        'experience': data.get('experience', 'intermediate'),
                        'tradingGoals': data.get('tradingGoals', 'consistent profit'),
                        'riskTolerance': data.get('riskTolerance', 'medium')
                    }
                }
            }
            
            payment_customers.append(new_customer)
            
            return jsonify({
                'success': True,
                'message': 'Customer created after payment verification',
                'customer': new_customer
            }), 201
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400
    
    else:  # GET request
        # Return all payment-verified customers
        return jsonify({
            'success': True,
            'customers': payment_customers,
            'total': len(payment_customers),
            'lastUpdated': datetime.utcnow().isoformat()
        })

@payment_customers_bp.route('/customers/payment-verified/<customer_id>', methods=['PUT', 'DELETE', 'OPTIONS'])
def manage_payment_customer(customer_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    # Find customer by ID
    customer = next((c for c in payment_customers if c['id'] == customer_id), None)
    
    if not customer:
        return jsonify({
            'success': False,
            'error': 'Customer not found'
        }), 404
    
    if request.method == 'PUT':
        # Update customer status
        try:
            data = request.get_json()
            customer['status'] = data.get('status', customer['status'])
            customer['updatedAt'] = datetime.utcnow().isoformat()
            
            return jsonify({
                'success': True,
                'message': 'Customer updated successfully',
                'customer': customer
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400
    
    elif request.method == 'DELETE':
        # Remove customer (admin only)
        payment_customers.remove(customer)
        
        return jsonify({
            'success': True,
            'message': 'Customer deleted successfully'
        })

@payment_customers_bp.route('/customers/payment-verified/clear', methods=['POST', 'OPTIONS'])
def clear_all_payment_customers():
    if request.method == 'OPTIONS':
        return '', 200
    
    # Clear all customers (admin only)
    payment_customers.clear()
    
    return jsonify({
        'success': True,
        'message': 'All payment-verified customers cleared successfully'
    })

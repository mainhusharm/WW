from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid
import json

payment_webhook_bp = Blueprint('payment_webhook', __name__)

# In-memory storage for payment-verified customers (in production, use database)
payment_customers = []

@payment_webhook_bp.route('/payment/webhook', methods=['POST', 'OPTIONS'])
def stripe_webhook():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get the webhook payload
        payload = request.get_json()
        
        # Log the webhook for debugging
        print(f"Payment webhook received: {json.dumps(payload, indent=2)}")
        
        # Handle different event types
        event_type = payload.get('type', '')
        
        if event_type == 'checkout.session.completed':
            # Payment completed successfully
            session = payload.get('data', {}).get('object', {})
            
            # Extract customer information
            customer_email = session.get('customer_details', {}).get('email', '')
            customer_name = session.get('customer_details', {}).get('name', '')
            amount_total = session.get('amount_total', 0) / 100  # Convert from cents
            currency = session.get('currency', 'usd')
            payment_status = session.get('payment_status', '')
            
            # Create customer record
            new_customer = {
                'id': str(uuid.uuid4()),
                'email': customer_email,
                'name': customer_name,
                'accountType': 'QuantTekel Instant',  # Default account type
                'paymentStatus': 'completed',
                'status': 'active',
                'subscriptionId': session.get('subscription', f'sub_{uuid.uuid4().hex[:8]}'),
                'createdAt': datetime.utcnow().isoformat(),
                'lastPayment': datetime.utcnow().isoformat(),
                'paymentAmount': amount_total,
                'paymentMethod': 'Stripe',
                'currency': currency,
                'stripeSessionId': session.get('id', ''),
                'questionnaire': {
                    'accountType': 'QuantTekel Instant',
                    'tradingRules': ['Risk Management', 'Position Sizing'],
                    'responses': {
                        'experience': 'intermediate',
                        'tradingGoals': 'consistent profit',
                        'riskTolerance': 'medium'
                    }
                }
            }
            
            # Add to customers list
            payment_customers.append(new_customer)
            
            print(f"Customer created after payment: {new_customer['email']}")
            
            return jsonify({
                'success': True,
                'message': 'Payment webhook processed successfully',
                'customer': new_customer
            }), 200
            
        elif event_type == 'payment_intent.succeeded':
            # Payment intent succeeded
            payment_intent = payload.get('data', {}).get('object', {})
            
            print(f"Payment intent succeeded: {payment_intent.get('id', '')}")
            
            return jsonify({
                'success': True,
                'message': 'Payment intent processed successfully'
            }), 200
            
        else:
            # Other event types
            print(f"Unhandled webhook event type: {event_type}")
            
            return jsonify({
                'success': True,
                'message': f'Webhook event {event_type} received but not processed'
            }), 200
            
    except Exception as e:
        print(f"Error processing payment webhook: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@payment_webhook_bp.route('/payment/test-webhook', methods=['POST', 'OPTIONS'])
def test_payment_webhook():
    if request.method == 'OPTIONS':
        return '', 200
    
    # Allow test webhook without authentication for testing
    try:
        # Simulate a successful payment
        test_customer = {
            'id': str(uuid.uuid4()),
            'email': 'test@example.com',
            'name': 'Test Customer',
            'accountType': 'QuantTekel Instant',
            'paymentStatus': 'completed',
            'status': 'active',
            'subscriptionId': f'sub_{uuid.uuid4().hex[:8]}',
            'createdAt': datetime.utcnow().isoformat(),
            'lastPayment': datetime.utcnow().isoformat(),
            'paymentAmount': 99.00,
            'paymentMethod': 'Test Payment',
            'currency': 'usd',
            'stripeSessionId': f'test_session_{uuid.uuid4().hex[:8]}',
            'questionnaire': {
                'accountType': 'QuantTekel Instant',
                'tradingRules': ['Risk Management', 'Position Sizing'],
                'responses': {
                    'experience': 'intermediate',
                    'tradingGoals': 'consistent profit',
                    'riskTolerance': 'medium'
                }
            }
        }
        
        # Add to customers list
        payment_customers.append(test_customer)
        
        print(f"Test customer created: {test_customer['email']}")
        
        return jsonify({
            'success': True,
            'message': 'Test payment webhook processed successfully',
            'customer': test_customer
        }), 200
        
    except Exception as e:
        print(f"Error processing test payment webhook: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@payment_webhook_bp.route('/payment/customers', methods=['GET', 'OPTIONS'])
def get_payment_customers():
    if request.method == 'OPTIONS':
        return '', 200
    
    # Allow access without authentication for testing
    return jsonify({
        'success': True,
        'customers': payment_customers,
        'total': len(payment_customers),
        'lastUpdated': datetime.utcnow().isoformat()
    })

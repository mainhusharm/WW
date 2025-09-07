import requests
from flask import Blueprint, request, jsonify
from .extensions import db
from .models import User
from .config import config

paypal_payment_bp = Blueprint('paypal_payment', __name__)

# PayPal configuration
PAYPAL_CLIENT_ID = config.PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET = config.PAYPAL_CLIENT_SECRET
PAYPAL_BASE_URL = 'https://api-m.sandbox.paypal.com' if config.PAYPAL_ENVIRONMENT == 'sandbox' else 'https://api-m.paypal.com'

def get_paypal_access_token():
    """Get PayPal access token"""
    try:
        auth = (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        data = {'grant_type': 'client_credentials'}
        
        response = requests.post(
            f'{PAYPAL_BASE_URL}/v1/oauth2/token',
            auth=auth,
            headers=headers,
            data=data
        )
        
        if response.status_code == 200:
            return response.json().get('access_token')
        else:
            print(f'PayPal token error: {response.status_code} - {response.text}')
            return None
            
    except Exception as e:
        print(f'Error getting PayPal token: {str(e)}')
        return None

@paypal_payment_bp.route('/payment/paypal/create-order', methods=['POST'])
def create_paypal_order():
    """Create a PayPal order"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        amount = data.get('amount')
        plan_name = data.get('plan_name', 'Trading Plan')
        coupon_code = data.get('coupon_code', '')

        if not amount:
            return jsonify({'error': 'Amount is required'}), 400

        access_token = get_paypal_access_token()
        if not access_token:
            return jsonify({'error': 'Failed to get PayPal access token'}), 500

        # Create PayPal order
        order_data = {
            'intent': 'CAPTURE',
            'purchase_units': [{
                'description': f'{plan_name}{f" (Coupon: {coupon_code})" if coupon_code else ""}',
                'amount': {
                    'currency_code': 'USD',
                    'value': str(amount)
                }
            }],
            'application_context': {
                'return_url': 'https://www.traderedgepro.com/payment-success',
                'cancel_url': 'https://www.traderedgepro.com/payment-cancelled'
            }
        }

        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        response = requests.post(
            f'{PAYPAL_BASE_URL}/v2/checkout/orders',
            headers=headers,
            json=order_data
        )

        if response.status_code == 201:
            order = response.json()
            return jsonify({
                'order_id': order['id'],
                'status': order['status'],
                'links': order['links']
            }), 201
        else:
            print(f'PayPal order creation error: {response.status_code} - {response.text}')
            return jsonify({'error': 'Failed to create PayPal order'}), 500

    except Exception as e:
        return jsonify({'error': f'Order creation failed: {str(e)}'}), 500

@paypal_payment_bp.route('/payment/paypal/capture-order', methods=['POST'])
def capture_paypal_order():
    """Capture a PayPal order and update user membership"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        order_id = data.get('order_id')
        user_id = data.get('user_id')
        plan = data.get('plan')

        if not all([order_id, user_id, plan]):
            return jsonify({'error': 'Missing required fields'}), 400

        access_token = get_paypal_access_token()
        if not access_token:
            return jsonify({'error': 'Failed to get PayPal access token'}), 500

        # Capture the order
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        response = requests.post(
            f'{PAYPAL_BASE_URL}/v2/checkout/orders/{order_id}/capture',
            headers=headers
        )

        if response.status_code == 201:
            capture_data = response.json()
            
            # Check if capture was successful
            if capture_data['status'] == 'COMPLETED':
                # Find the user and update membership
                user = User.query.get(user_id)
                if not user:
                    return jsonify({'error': 'User not found'}), 404

                # Update user membership
                user.plan_type = plan
                user.membership_tier = plan
                db.session.commit()

                # Get payment details
                purchase_unit = capture_data['purchase_units'][0]
                amount = purchase_unit['payments']['captures'][0]['amount']['value']

                return jsonify({
                    'success': True,
                    'message': 'Payment captured and membership updated',
                    'plan': plan,
                    'amount_paid': float(amount),
                    'order_id': order_id,
                    'capture_id': capture_data['purchase_units'][0]['payments']['captures'][0]['id']
                }), 200
            else:
                return jsonify({'error': 'Payment capture not completed'}), 400
        else:
            print(f'PayPal capture error: {response.status_code} - {response.text}')
            return jsonify({'error': 'Failed to capture PayPal order'}), 500

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Payment capture failed: {str(e)}'}), 500

@paypal_payment_bp.route('/payment/paypal/order-details/<order_id>', methods=['GET'])
def get_paypal_order_details(order_id):
    """Get PayPal order details"""
    try:
        access_token = get_paypal_access_token()
        if not access_token:
            return jsonify({'error': 'Failed to get PayPal access token'}), 500

        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        response = requests.get(
            f'{PAYPAL_BASE_URL}/v2/checkout/orders/{order_id}',
            headers=headers
        )

        if response.status_code == 200:
            return jsonify(response.json()), 200
        else:
            return jsonify({'error': 'Failed to get order details'}), 500

    except Exception as e:
        return jsonify({'error': f'Failed to get order details: {str(e)}'}), 500

@paypal_payment_bp.route('/payment/paypal/refund', methods=['POST'])
def refund_paypal_payment():
    """Refund a PayPal payment"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        capture_id = data.get('capture_id')
        amount = data.get('amount')
        reason = data.get('reason', 'Refund requested')

        if not capture_id:
            return jsonify({'error': 'Capture ID is required'}), 400

        access_token = get_paypal_access_token()
        if not access_token:
            return jsonify({'error': 'Failed to get PayPal access token'}), 500

        # Create refund
        refund_data = {
            'amount': {
                'currency_code': 'USD',
                'value': str(amount) if amount else '0.00'
            },
            'note_to_payer': reason
        }

        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        response = requests.post(
            f'{PAYPAL_BASE_URL}/v2/payments/captures/{capture_id}/refund',
            headers=headers,
            json=refund_data
        )

        if response.status_code == 201:
            refund_data = response.json()
            return jsonify({
                'success': True,
                'message': 'Refund processed successfully',
                'refund_id': refund_data['id'],
                'status': refund_data['status']
            }), 200
        else:
            print(f'PayPal refund error: {response.status_code} - {response.text}')
            return jsonify({'error': 'Failed to process refund'}), 500

    except Exception as e:
        return jsonify({'error': f'Refund failed: {str(e)}'}), 500

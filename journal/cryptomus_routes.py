"""
Cryptomus Payment Routes for Backend
This file contains the backend routes for handling Cryptomus payments
"""

import os
import json
import hashlib
import base64
import requests
from flask import Flask, request, jsonify
from datetime import datetime, timedelta

# Cryptomus configuration
CRYPTOMUS_BASE_URL = "https://api.cryptomus.com/v1"
CRYPTOMUS_MERCHANT_ID = os.environ.get('CRYPTOMUS_MERCHANT_ID', '')
CRYPTOMUS_PAYMENT_API_KEY = os.environ.get('CRYPTOMUS_PAYMENT_API_KEY', '')
CRYPTOMUS_PAYOUT_API_KEY = os.environ.get('CRYPTOMUS_PAYOUT_API_KEY', '')

def generate_signature(data, api_key):
    """Generate signature for Cryptomus API requests"""
    json_string = json.dumps(data, separators=(',', ':'))
    base64_data = base64.b64encode(json_string.encode()).decode()
    signature = hashlib.md5((base64_data + api_key).encode()).hexdigest()
    return signature

def verify_webhook_signature(data, signature):
    """Verify webhook signature"""
    expected_signature = generate_signature(data, CRYPTOMUS_PAYMENT_API_KEY)
    return signature == expected_signature

# Routes for Flask app integration
def create_cryptomus_routes(app):
    
    @app.route('/api/cryptomus/create-invoice', methods=['POST'])
    def create_cryptomus_invoice():
        """Create a Cryptomus payment invoice"""
        try:
            data = request.get_json()
            
            # Prepare request data
            request_data = {
                'merchant': CRYPTOMUS_MERCHANT_ID,
                'amount': str(data.get('amount')),
                'currency': data.get('currency', 'USD'),
                'order_id': data.get('order_id'),
                'currency_to': data.get('currency_to', 'USDT'),
                'network': data.get('network', 'tron'),
                'url_callback': data.get('url_callback'),
                'url_success': data.get('url_success'),
                'url_return': data.get('url_return'),
                'email': data.get('email'),
                'is_payment_multiple': data.get('is_payment_multiple', False),
                'lifetime': data.get('lifetime', 3600),
            }
            
            # Generate signature
            signature = generate_signature(request_data, CRYPTOMUS_PAYMENT_API_KEY)
            
            # Make request to Cryptomus API
            headers = {
                'Content-Type': 'application/json',
                'merchant': CRYPTOMUS_MERCHANT_ID,
                'sign': signature,
            }
            
            response = requests.post(
                f"{CRYPTOMUS_BASE_URL}/payment",
                json=request_data,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                return jsonify(result)
            else:
                return jsonify({
                    'state': 1,
                    'message': f'API request failed with status {response.status_code}'
                }), 400
                
        except Exception as e:
            return jsonify({
                'state': 1,
                'message': f'Error creating invoice: {str(e)}'
            }), 500
    
    @app.route('/api/cryptomus/payment-info/<payment_uuid>', methods=['POST'])
    def get_payment_info(payment_uuid):
        """Get payment information"""
        try:
            request_data = {
                'merchant': CRYPTOMUS_MERCHANT_ID,
                'uuid': payment_uuid,
            }
            
            # Generate signature
            signature = generate_signature(request_data, CRYPTOMUS_PAYMENT_API_KEY)
            
            # Make request to Cryptomus API
            headers = {
                'Content-Type': 'application/json',
                'merchant': CRYPTOMUS_MERCHANT_ID,
                'sign': signature,
            }
            
            response = requests.post(
                f"{CRYPTOMUS_BASE_URL}/payment/info",
                json=request_data,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                return jsonify(result)
            else:
                return jsonify({
                    'state': 1,
                    'message': f'API request failed with status {response.status_code}'
                }), 400
                
        except Exception as e:
            return jsonify({
                'state': 1,
                'message': f'Error getting payment info: {str(e)}'
            }), 500
    
    @app.route('/api/cryptomus/services', methods=['GET'])
    def get_cryptomus_services():
        """Get available payment services"""
        try:
            request_data = {
                'merchant': CRYPTOMUS_MERCHANT_ID,
            }
            
            # Generate signature
            signature = generate_signature(request_data, CRYPTOMUS_PAYMENT_API_KEY)
            
            # Make request to Cryptomus API
            headers = {
                'Content-Type': 'application/json',
                'merchant': CRYPTOMUS_MERCHANT_ID,
                'sign': signature,
            }
            
            response = requests.post(
                f"{CRYPTOMUS_BASE_URL}/payment/services",
                json=request_data,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                return jsonify(result)
            else:
                return jsonify({
                    'state': 1,
                    'message': f'API request failed with status {response.status_code}'
                }), 400
                
        except Exception as e:
            return jsonify({
                'state': 1,
                'message': f'Error getting services: {str(e)}'
            }), 500
    
    @app.route('/api/cryptomus/webhook', methods=['POST'])
    def handle_cryptomus_webhook():
        """Handle Cryptomus payment webhooks"""
        try:
            # Get the signature from headers
            signature = request.headers.get('sign')
            if not signature:
                return jsonify({'error': 'No signature provided'}), 400
            
            # Get webhook data
            webhook_data = request.get_json()
            
            # Verify signature
            if not verify_webhook_signature(webhook_data, signature):
                return jsonify({'error': 'Invalid signature'}), 401
            
            # Process the webhook
            payment_status = webhook_data.get('status')
            order_id = webhook_data.get('order_id')
            payment_uuid = webhook_data.get('uuid')
            amount = webhook_data.get('amount')
            currency = webhook_data.get('currency')
            
            print(f"Cryptomus webhook received:")
            print(f"Order ID: {order_id}")
            print(f"Payment UUID: {payment_uuid}")
            print(f"Status: {payment_status}")
            print(f"Amount: {amount} {currency}")
            
            # Here you would typically:
            # 1. Update your database with the payment status
            # 2. Send email notifications
            # 3. Activate user accounts/services
            # 4. Handle any business logic
            
            # For now, we'll just log the webhook
            webhook_log = {
                'timestamp': datetime.utcnow().isoformat(),
                'order_id': order_id,
                'payment_uuid': payment_uuid,
                'status': payment_status,
                'amount': amount,
                'currency': currency,
                'webhook_data': webhook_data
            }
            
            # You should save this to your database
            print(f"Webhook processed: {webhook_log}")
            
            # Respond with success
            return jsonify({'status': 'success'}), 200
            
        except Exception as e:
            print(f"Error processing webhook: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

# Example usage for integrating with your existing Flask app:
"""
from your_app import app
from cryptomus_routes import create_cryptomus_routes

# Add Cryptomus routes to your Flask app
create_cryptomus_routes(app)
"""

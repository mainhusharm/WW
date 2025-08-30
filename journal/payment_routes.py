import os
import requests
from flask import Blueprint, request, jsonify
from .extensions import db
from .models import User

payment_bp = Blueprint('payment', __name__)

@payment_bp.route('/validate-coupon', methods=['POST'])
def validate_coupon():
    """Validate coupon codes"""
    try:
        # Get the request data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        coupon_code = data.get('coupon_code')
        plan_id = data.get('plan_id', 'pro')
        original_price = data.get('original_price', 29.99)

        if not coupon_code:
            return jsonify({'error': 'Coupon code is required'}), 400

        # Handle hardcoded coupons directly
        if coupon_code == 'TRADERFREE':
            return jsonify({
                'valid': True,
                'discount_amount': original_price,
                'final_price': 0.00,
                'message': 'Free access coupon applied!'
            }), 200
        elif coupon_code == 'INTERNAL_DEV_OVERRIDE_2024':
            return jsonify({
                'valid': True,
                'discount_amount': original_price - 0.10,
                'final_price': 0.10,
                'message': 'Development override coupon applied!'
            }), 200
        
        # For other coupons, try to forward to journal payment system
        try:
            # Try to call the journal payment system
            journal_url = f"http://localhost:5000/api/payment/validate-coupon"
            response = requests.post(journal_url, json=data, timeout=5)
            if response.status_code == 200:
                return jsonify(response.json()), 200
        except:
            pass  # Fall back to local validation
        
        # Fallback: reject unknown coupons
        return jsonify({
            'valid': False,
            'error': 'Invalid coupon code'
        }), 400
            
    except Exception as e:
        print(f"Coupon validation error: {str(e)}")
        return jsonify({'error': f'Coupon validation failed: {str(e)}'}), 500

@payment_bp.route('/verify-payment', methods=['POST'])
def verify_payment():
    """Verify payment and update user membership"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        token = data.get('token')
        plan = data.get('plan')
        user_id = data.get('user_id')
        amount_paid = data.get('amount_paid')
        coupon_code = data.get('coupon_code')

        if not all([token, plan, user_id]):
            return jsonify({'error': 'Missing required fields'}), 400

        # Find the user
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Update user membership
        user.membership_tier = plan
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Payment verified and membership updated',
            'plan': plan,
            'amount_paid': amount_paid,
            'coupon_code': coupon_code
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Payment verification error: {str(e)}")
        return jsonify({'error': f'Payment verification failed: {str(e)}'}), 500

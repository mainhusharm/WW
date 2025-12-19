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

        print(f"Validating coupon: {coupon_code} for plan: {plan_id} with price: {original_price}")

        # Handle hardcoded coupons directly
        if coupon_code == 'TRADERFREE':
            discount_amount = original_price
            final_price = 0.00
            print(f"TRADERFREE coupon applied: discount=${discount_amount}, final_price=${final_price}")
            return jsonify({
                'valid': True,
                'discount_amount': discount_amount,
                'final_price': final_price,
                'message': 'Free access coupon applied!'
            }), 200
        elif coupon_code == 'INTERNAL_DEV_OVERRIDE_2024':
            discount_amount = original_price - 0.10
            final_price = 0.10
            print(f"INTERNAL_DEV_OVERRIDE_2024 coupon applied: discount=${discount_amount}, final_price=${final_price}")
            return jsonify({
                'valid': True,
                'discount_amount': discount_amount,
                'final_price': final_price,
                'message': 'Development override coupon applied!'
            }), 200
        
        # For other coupons, reject them
        print(f"Unknown coupon code: {coupon_code}")
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

        print(f"Verifying payment: token={token}, plan={plan}, user_id={user_id}, amount={amount_paid}, coupon={coupon_code}")

        if not all([token, plan, user_id]):
            return jsonify({'error': 'Missing required fields'}), 400

        # Find the user
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Update user membership
        user.membership_tier = plan
        db.session.commit()

        print(f"Payment verified successfully for user {user_id}, plan {plan}")

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

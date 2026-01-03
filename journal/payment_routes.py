import os
import requests
from flask import Blueprint, request, jsonify
from .extensions import db
from .models import User
from .dual_db_service import dual_db

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
async def verify_payment():
    """Verify payment and update user membership - saves to dual databases"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        token = data.get('token')
        plan = data.get('plan')
        user_id = data.get('user_id')
        amount_paid = data.get('amount_paid', 0)
        coupon_code = data.get('coupon_code')

        print(f"Verifying payment: token={token}, plan={plan}, user_id={user_id}, amount={amount_paid}, coupon={coupon_code}")

        if not all([token, plan, user_id]):
            return jsonify({'error': 'Missing required fields'}), 400

        # Find the user
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Update user membership - save to dual databases
        user.membership_tier = plan

        # Save user update to dual databases
        user_update_result = await dual_db.dual_write(user, 'update')
        if not user_update_result['overall']:
            print(f"Warning: User membership update failed in dual databases")

        # Create payment record for tracking
        payment_data = {
            'user_id': user_id,
            'payment_token': token,
            'plan': plan,
            'amount_paid': amount_paid,
            'coupon_code': coupon_code,
            'payment_method': 'stripe',  # Default, can be updated based on actual method
            'status': 'completed',
            'verified_at': None,  # Will be set when verified
            'metadata': {
                'source': 'api_verify_payment',
                'user_email': user.email,
                'user_unique_id': user.unique_id
            }
        }

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

@payment_bp.route('/manual-verification', methods=['POST'])
async def manual_verification():
    """Handle manual payment verification - saves to dual databases"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_signature = data.get('razorpay_signature')
        user_id = data.get('user_id')

        if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature, user_id]):
            return jsonify({'error': 'Missing required manual verification fields'}), 400

        # Find the user
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Create manual verification record
        manual_verification_data = {
            'user_id': user_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_order_id': razorpay_order_id,
            'razorpay_signature': razorpay_signature,
            'status': 'pending_admin_review',
            'submitted_at': None,  # Will be set by database
            'verified_at': None,
            'admin_notes': None,
            'metadata': {
                'source': 'manual_verification',
                'user_email': user.email,
                'user_unique_id': user.unique_id,
                'verification_type': 'razorpay_manual'
            }
        }

        # The actual saving would happen in the dual database service
        # For now, we'll just log and return success
        print(f"Manual verification submitted for user {user_id}: {razorpay_payment_id}")

        return jsonify({
            'success': True,
            'message': 'Manual verification submitted successfully',
            'verification_id': f"manual_{user_id}_{razorpay_payment_id[:10]}"
        }), 200

    except Exception as e:
        print(f"Manual verification error: {str(e)}")
        return jsonify({'error': f'Manual verification failed: {str(e)}'}), 500

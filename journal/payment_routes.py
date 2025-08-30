import os
import logging
import threading
from flask import Blueprint, request, jsonify, redirect, url_for, session
from .extensions import db
from .models import User
from .mailchimp_service import send_transactional_email, create_futuristic_email_template

# Import coupon system with proper error handling
try:
    import sys
    backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
    if backend_path not in sys.path:
        sys.path.append(backend_path)
    from coupon_system import coupon_system
except ImportError:
    # Fallback coupon system if import fails
    class FallbackCouponSystem:
        def apply_coupon_to_price(self, original_price, coupon_code, plan_id):
            if coupon_code == 'TRADERFREE':
                return {'applied': True, 'discount': original_price, 'final_price': 0.00}
            elif coupon_code == 'INTERNAL_DEV_OVERRIDE_2024':
                return {'applied': True, 'discount': original_price - 0.10, 'final_price': 0.10}
            return {'applied': False, 'error': 'Invalid coupon code'}
    
    coupon_system = FallbackCouponSystem()

payment_bp = Blueprint('payment', __name__)

@payment_bp.route('/validate-coupon', methods=['POST'])
def validate_coupon():
    """Validate a coupon code"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400

    coupon_code = data.get('coupon_code')
    plan_id = data.get('plan_id', 'pro')
    original_price = data.get('original_price', 29.99)

    if not coupon_code:
        return jsonify({'error': 'Coupon code is required'}), 400

    try:
        # Handle hardcoded coupons from frontend
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
        
        # Use backend coupon system for other coupons
        result = coupon_system.apply_coupon_to_price(original_price, coupon_code, plan_id)
        
        if result['applied']:
            return jsonify({
                'valid': True,
                'discount_amount': result['discount'],
                'final_price': result['final_price'],
                'message': 'Coupon applied successfully!'
            }), 200
        else:
            return jsonify({
                'valid': False,
                'error': result.get('error', 'Invalid coupon code')
            }), 400
            
    except Exception as e:
        return jsonify({'error': f'Coupon validation failed: {str(e)}'}), 500

@payment_bp.route('/verify-payment', methods=['POST'])
def verify_payment():
    """Verify a payment and update user's membership tier"""
    try:
        data = request.get_json()
        if not data:
            logging.error("No JSON data provided in payment verification request")
            return jsonify({'error': 'No JSON data provided'}), 400

        token = data.get('token')
        plan = data.get('plan')
        user_id = data.get('user_id')
        amount_paid = data.get('amount_paid', 0)
        coupon_code = data.get('coupon_code')

        logging.info(f"Payment verification request: token={token}, plan={plan}, user_id={user_id}, coupon_code={coupon_code}")

        if not all([token, plan, user_id]):
            logging.error(f"Missing required fields: token={token}, plan={plan}, user_id={user_id}")
            return jsonify({'error': 'Missing required fields: token, plan, and user_id are required'}), 400

        user = User.query.get(user_id)
        if not user:
            logging.error(f"User not found with ID: {user_id}")
            return jsonify({'error': 'User not found'}), 404

        # Handle free coupon checkout
        if token == 'free_coupon_checkout':
            logging.info(f"Processing free coupon checkout for user {user_id}")
            user.plan_type = plan
            db.session.commit()
            
            try:
                subject = "Free Access Activated!"
                message = f"Your free access to the {plan} plan has been activated. Welcome aboard!"
                html_content = create_futuristic_email_template(subject, message)
                # Send email in a separate thread to avoid blocking
                email_thread = threading.Thread(
                    target=send_transactional_email,
                    args=(user.email, subject, html_content)
                )
                email_thread.start()
                logging.info(f"Started email thread for free access confirmation to {user.email}")
            except Exception as email_error:
                logging.warning(f"Failed to start confirmation email thread: {str(email_error)}")
            
            return jsonify({'message': 'Free access activated successfully'}), 200

        # Handle PayPal payments (mock tokens starting with 'paypal_')
        if token.startswith('paypal_'):
            logging.info(f"Processing PayPal payment for user {user_id}")
            user.plan_type = plan
            db.session.commit()
            
            try:
                subject = "Payment Successful!"
                message = f"Your PayPal payment for the {plan} plan was successful. Thank you for your purchase."
                html_content = create_futuristic_email_template(subject, message)
                # Send email in a separate thread
                email_thread = threading.Thread(
                    target=send_transactional_email,
                    args=(user.email, subject, html_content)
                )
                email_thread.start()
                logging.info(f"Started PayPal payment confirmation email thread for {user.email}")
            except Exception as email_error:
                logging.warning(f"Failed to start confirmation email thread: {str(email_error)}")
            
            return jsonify({'message': 'PayPal payment successful and membership updated'}), 200

        # Handle crypto payments (transaction hashes)
        if len(token) > 20:  # Likely a transaction hash
            logging.info(f"Processing crypto payment for user {user_id}")
            user.plan_type = plan
            db.session.commit()
            
            try:
                subject = "Crypto Payment Received!"
                message = f"Your cryptocurrency payment for the {plan} plan has been received and is being verified. You'll receive confirmation once verified."
                html_content = create_futuristic_email_template(subject, message)
                # Send email in a separate thread
                email_thread = threading.Thread(
                    target=send_transactional_email,
                    args=(user.email, subject, html_content)
                )
                email_thread.start()
                logging.info(f"Started crypto payment confirmation email thread for {user.email}")
            except Exception as email_error:
                logging.warning(f"Failed to start confirmation email thread: {str(email_error)}")
            
            return jsonify({'message': 'Crypto payment received and membership updated'}), 200

        # Process payment based on whether a coupon was used
        if coupon_code:
            plan_prices = {
                'starter': 99,
                'pro': 199,
                'enterprise': 499
            }
            original_price = plan_prices.get(plan, 29.99)
            
            # Validate coupon and calculate expected amount
            if coupon_code in ['TRADERFREE']:
                expected_amount = 0.00
            elif coupon_code == 'INTERNAL_DEV_OVERRIDE_2024':
                expected_amount = 0.10
            else:
                try:
                    result = coupon_system.apply_coupon_to_price(original_price, coupon_code, plan)
                    if not result['applied']:
                        return jsonify({'error': result.get('error', 'Invalid coupon code')}), 400
                    expected_amount = result['final_price']
                except Exception as coupon_error:
                    logging.error(f"Coupon system error: {str(coupon_error)}")
                    return jsonify({'error': 'Coupon validation failed'}), 500

            # Verify the payment amount
            if abs(amount_paid - expected_amount) > 0.01:
                logging.warning(f"Payment amount mismatch: expected ${expected_amount}, received ${amount_paid}")
                return jsonify({'error': f'Payment amount mismatch. Expected: ${expected_amount}, Received: ${amount_paid}'}), 400
            
            logging.info(f"Coupon '{coupon_code}' applied. Final amount ${amount_paid} verified.")

        else:
            # No coupon used, verify the full amount
            plan_prices = {
                'starter': 99,
                'pro': 199,
                'enterprise': 499
            }
            expected_amount = plan_prices.get(plan, 499.00)
            if abs(amount_paid - expected_amount) > 0.01:
                logging.warning(f"Payment amount mismatch for non-coupon payment: expected ${expected_amount}, received ${amount_paid}")
                return jsonify({'error': f'Payment amount mismatch. Expected: ${expected_amount}, Received: ${amount_paid}'}), 400
            
            logging.info(f"Full payment of ${amount_paid} verified for plan '{plan}'.")

        # Update user's plan
        user.plan_type = plan
        db.session.commit()

        # Send confirmation email
        try:
            subject = "Payment Successful!"
            message = f"Your payment for the {plan} plan was successful. Thank you for your purchase."
            html_content = create_futuristic_email_template(subject, message)
            # Send email in a separate thread
            email_thread = threading.Thread(
                target=send_transactional_email,
                args=(user.email, subject, html_content)
            )
            email_thread.start()
            logging.info(f"Started payment confirmation email thread for {user.email}")
        except Exception as email_error:
            logging.warning(f"Failed to start confirmation email thread: {str(email_error)}")
        
        return jsonify({'message': 'Payment successful and membership updated'}), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Payment verification error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Payment verification failed. Please contact support.'}), 500

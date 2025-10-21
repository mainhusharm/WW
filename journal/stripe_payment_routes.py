import stripe
from flask import Blueprint, request, jsonify
from .extensions import db
from .models import User
from .config import config

stripe_payment_bp = Blueprint('stripe_payment', __name__)

# Initialize Stripe with configuration
stripe.api_key = config.STRIPE_SECRET_KEY

@stripe_payment_bp.route('/payment/stripe/create-payment-intent', methods=['POST'])
def create_payment_intent():
    """Create a Stripe PaymentIntent"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        amount = data.get('amount')
        metadata = data.get('metadata', {})

        if not amount:
            return jsonify({'error': 'Amount is required'}), 400

        # Create PaymentIntent
        payment_intent = stripe.PaymentIntent.create(
            amount=int(amount),  # Amount in cents
            currency='usd',
            metadata=metadata,
            automatic_payment_methods={
                'enabled': True,
            },
        )

        return jsonify({
            'clientSecret': payment_intent.client_secret,
            'paymentIntentId': payment_intent.id
        }), 200

    except stripe.error.StripeError as e:
        return jsonify({'error': f'Stripe error: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'Payment intent creation failed: {str(e)}'}), 500

@stripe_payment_bp.route('/payment/stripe/confirm-payment', methods=['POST'])
def confirm_payment():
    """Confirm a Stripe payment and update user membership"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        payment_intent_id = data.get('payment_intent_id')
        user_id = data.get('user_id')
        plan = data.get('plan')

        if not all([payment_intent_id, user_id, plan]):
            return jsonify({'error': 'Missing required fields'}), 400

        # Retrieve the PaymentIntent to verify it was successful
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if payment_intent.status != 'succeeded':
            return jsonify({'error': 'Payment not successful'}), 400

        # Find the user and update membership
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Update user membership
        user.plan_type = plan
        user.membership_tier = plan
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Payment confirmed and membership updated',
            'plan': plan,
            'amount_paid': payment_intent.amount / 100,  # Convert from cents
            'payment_intent_id': payment_intent_id
        }), 200

    except stripe.error.StripeError as e:
        return jsonify({'error': f'Stripe error: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Payment confirmation failed: {str(e)}'}), 500

@stripe_payment_bp.route('/payment/stripe/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhooks for payment events"""
    try:
        payload = request.get_data(as_text=True)
        sig_header = request.headers.get('Stripe-Signature')

        # Verify webhook signature (you should set this in production)
        webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET', 'whsec_test_secret')
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError as e:
            return jsonify({'error': 'Invalid payload'}), 400
        except stripe.error.SignatureVerificationError as e:
            return jsonify({'error': 'Invalid signature'}), 400

        # Handle the event
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            print(f'Payment succeeded: {payment_intent.id}')
            
            # Here you can add logic to update user membership
            # based on the successful payment
            
        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            print(f'Payment failed: {payment_intent.id}')
            
        # Add more event handlers as needed

        return jsonify({'status': 'success'}), 200

    except Exception as e:
        return jsonify({'error': f'Webhook handling failed: {str(e)}'}), 500

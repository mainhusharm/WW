# Import the application from wsgi.py
from wsgi import application
import os
import requests
from flask import request, jsonify

# This file exists for compatibility with Render
# The actual application is defined in wsgi.py

# Export both 'app' and 'application' for maximum compatibility
app = application

# Debug: Print environment variables and app configuration
print(f"App.py: Environment variables:")
print(f"  FLASK_ENV: {os.environ.get('FLASK_ENV', 'Not set')}")
print(f"  PYTHON_VERSION: {os.environ.get('PYTHON_VERSION', 'Not set')}")
print(f"  PORT: {os.environ.get('PORT', 'Not set')}")
print(f"  PYTHONPATH: {os.environ.get('PYTHONPATH', 'Not set')}")

# Debug: Print the app type and available attributes
print(f"App.py: WSGI Application imported successfully: {type(application)}")
print(f"App.py: Application name: {application.name}")
print(f"App.py: Application config: {application.config.get('ENV', 'Not set')}")
print(f"App.py: Application debug mode: {application.debug}")

# Ensure the application is callable
if callable(application):
    print("App.py: Application is callable and ready for Gunicorn")
else:
    print("App.py: ERROR - Application is not callable!")

# Add a simple test route to verify the app is working
@application.route('/app-test')
def app_test():
    return {'message': 'App.py is working correctly!', 'status': 'success'}

# Also add the test route to the 'app' variable
@app.route('/app-test-2')
def app_test_2():
    return {'message': 'App.py app variable is working correctly!', 'status': 'success'}

# Add coupon validation endpoint to fix the frontend coupon error
@application.route('/api/validate-coupon', methods=['POST'])
def validate_coupon():
    """Validate coupon codes - forwards to journal payment system"""
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

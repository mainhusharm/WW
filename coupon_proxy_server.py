#!/usr/bin/env python3
"""
Simple Coupon Proxy Server
This server provides coupon validation endpoints and can be deployed quickly
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app, origins=["*"])

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "Coupon proxy server is running",
        "timestamp": "2025-01-03T10:30:00Z"
    }), 200

@app.route('/api/validate-coupon', methods=['POST'])
def validate_coupon():
    """Validate coupon code for payment"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        coupon_code = data.get('coupon_code')
        plan_id = data.get('plan_id', 'pro')
        original_price = data.get('original_price', 29.99)

        if not coupon_code:
            return jsonify({'error': 'Coupon code is required'}), 400

        print(f"Validating coupon: {coupon_code} for plan: {plan_id} with price: {original_price}")

        # Handle hardcoded coupons
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
        else:
            print(f"Unknown coupon code: {coupon_code}")
            return jsonify({
                'valid': False,
                'error': 'Invalid coupon code'
            }), 400
            
    except Exception as e:
        print(f"Coupon validation error: {str(e)}")
        return jsonify({'error': f'Coupon validation failed: {str(e)}'}), 500

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register():
    """Register new user endpoint"""
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,X-Requested-With,Accept,Origin")
        response.headers.add('Access-Control-Allow-Methods', "POST,OPTIONS")
        return response, 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No JSON data provided"}), 400
        
        email = data.get('email')
        password = data.get('password')
        username = data.get('username', 'New User')
        plan_type = data.get('plan_type', 'premium')
        
        if not email or not password:
            return jsonify({"msg": "Email and password required"}), 400
        
        # For now, just return success (in a real app, you'd save to database)
        import uuid
        user_id = str(uuid.uuid4())
        access_token = f"token_{user_id}_{uuid.uuid4().hex[:16]}"
        
        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user_id,
                "username": username,
                "email": email,
                "plan_type": plan_type
            },
            "msg": "User registered successfully"
        }), 201
        
    except Exception as e:
        return jsonify({"msg": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print("🚀 Starting Coupon Proxy Server...")
    print("📊 Available endpoints:")
    print("   GET  /health - Health check")
    print("   POST /api/validate-coupon - Validate coupon codes")
    print("   POST /api/auth/register - User registration")
    print("============================================================")
    
    app.run(host='0.0.0.0', port=port, debug=False)

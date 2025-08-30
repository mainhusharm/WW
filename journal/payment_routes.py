from flask import Blueprint, request, jsonify
from backend.coupon_system import validate_coupon_api

payment_bp = Blueprint('payment_bp', __name__)

@payment_bp.route('/api/journal/validate-coupon', methods=['POST'])
def validate_coupon():
    data = request.get_json()
    if not data or 'coupon_code' not in data:
        return jsonify({"error": "Coupon code is required"}), 400
    
    coupon_code = data['coupon_code']
    is_valid, coupon, error = validate_coupon_api(coupon_code)
    
    if not is_valid:
        return jsonify({"error": error}), 400
        
    return jsonify({
        "message": "Coupon applied successfully",
        "coupon": {
            "code": coupon_code,
            "description": coupon.get("description"),
            "type": coupon.get("type"),
            "value": coupon.get("value")
        }
    }), 200

from flask import Blueprint, request, jsonify
from .models import db, User
from flask_jwt_extended import jwt_required, get_jwt_identity

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/user/plan', methods=['PUT'])
@jwt_required()
def update_plan():
    user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON in request"}), 400
    plan = data.get('plan')

    if not plan:
        return jsonify({"msg": "Missing plan"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    user.plan_type = plan
    db.session.commit()

    return jsonify({"msg": "Plan updated successfully"}), 200

@user_bp.route('/user/progress', methods=['POST'])
@jwt_required()
def save_progress():
    user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON in request"}), 400
    progress = data.get('progress')

    if not progress:
        return jsonify({"msg": "Missing progress data"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    # Here you would typically update the user model with the progress data.
    # For now, we'll just return a success message.
    # Example: user.progress = progress
    db.session.commit()

    return jsonify({"msg": "Progress saved successfully"}), 200

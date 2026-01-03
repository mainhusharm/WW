
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import logging

from .models import db, User

auth_bp = Blueprint('auth_bp', __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@auth_bp.route('/version', methods=['GET'])
def version():
    return jsonify({"version": "2.0", "message": "New error handling is live!"}), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    # ... (keeping register function as is)
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON in request"}), 400

    required_fields = ['email', 'password', 'first_name', 'last_name']
    if not all(field in data for field in required_fields):
        return jsonify({"msg": "Missing required fields"}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Email already registered"}), 409

    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')

    new_user = User(
        first_name=data['first_name'],
        last_name=data['last_name'],
        email=data['email'],
        phone=data.get('phone'),
        password_hash=hashed_password,
        trades_per_day=data.get('trades_per_day'),
        trading_session=data.get('trading_session'),
        crypto_assets=data.get('crypto_assets', []),
        forex_assets=data.get('forex_assets', []),
        prop_firm=data.get('prop_firm'),
        account_type=data.get('account_type'),
        account_size=data.get('account_size'),
        risk_percentage=data.get('risk_percentage'),
        risk_reward_ratio=data.get('risk_reward_ratio'),
    )

    db.session.add(new_user)
    db.session.commit()

    access_token = create_access_token(identity=str(new_user.id))
    return jsonify(access_token=access_token), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "Missing JSON in request"}), 400

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"msg": "Missing email or password"}), 400

        logger.info(f"Attempting login for email: {email}")
        
        # Use the application context to perform the query
        with current_app.app_context():
            user = User.query.filter_by(email=email).first()

        if not user:
            logger.warning(f"Login failed: User with email {email} not found.")
            return jsonify({"msg": "Bad email or password"}), 401
            
        if not user.password_hash:
            logger.error(f"CRITICAL: User {email} has no password hash in the database.")
            return jsonify({"msg": "Authentication error. Please contact support."}), 500

        if not check_password_hash(user.password_hash, password):
            logger.warning(f"Login failed: Incorrect password for email {email}.")
            return jsonify({"msg": "Bad email or password"}), 401

        access_token = create_access_token(identity=str(user.id))
        logger.info(f"Login successful for email: {email}")
        
        # Return completion status along with the token
        return jsonify({
            "access_token": access_token, 
            "completionStatus": {
                "questionnaireCompleted": user.questionnaire_completed
            }
        }), 200

    except Exception as e:
        logger.error(f"!!!!!! An unexpected error occurred during login: {e}", exc_info=True)
        # exc_info=True will log the full stack trace
        return jsonify({"msg": "An internal server error occurred. Please try again later."}), 500


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    # ... (keeping profile function as is)
    current_user__id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "subscription_status": user.subscription_status
    }), 200

from flask import Blueprint, request, jsonify
from .models import db, User, RiskPlan
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
import requests
import os

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

@user_bp.route('/user/progress', methods=['GET'])
@jwt_required()
def get_progress():
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"msg": "Invalid token"}), 401
            
        user = User.query.get(user_id)
        if not user:
            return jsonify({"msg": "User not found"}), 404

        # This is a placeholder. Replace with actual progress data from your model.
        progress_data = {
            "completed_lessons": 10,
            "total_lessons": 50,
            "current_module": "Advanced Strategies"
        }
        return jsonify(progress_data), 200
    except Exception as e:
        print(f"Error in get_progress: {str(e)}")
        return jsonify({"msg": "Failed to fetch progress data"}), 500

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

@user_bp.route('/user/questionnaire', methods=['POST'])
@jwt_required()
def save_questionnaire():
    user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON in request"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    # Create or update risk plan with questionnaire data
    risk_plan = RiskPlan.query.filter_by(user_id=user_id).first()
    if not risk_plan:
        risk_plan = RiskPlan(user_id=user_id)

    # Map questionnaire data to risk plan fields
    risk_plan.prop_firm = data.get('propFirm', '')
    risk_plan.account_type = data.get('accountType', '')
    risk_plan.account_size = float(data.get('accountSize', 0)) if data.get('accountSize') else 0
    risk_plan.risk_percentage = float(data.get('riskPercentage', 1))
    risk_plan.trades_per_day = data.get('tradesPerDay', '')
    risk_plan.trading_session = data.get('tradingSession', '')
    risk_plan.crypto_assets = json.dumps(data.get('cryptoAssets', []))
    risk_plan.forex_assets = json.dumps(data.get('forexAssets', []))
    risk_plan.has_account = data.get('hasAccount', 'no')
    risk_plan.account_equity = float(data.get('accountEquity', 0)) if data.get('accountEquity') else 0
    risk_plan.min_risk_reward = data.get('riskRewardRatio', '2')

    # Calculate risk parameters
    account_size = float(data.get('accountSize', 100000))
    risk_pct = float(data.get('riskPercentage', 1))
    risk_plan.base_trade_risk = account_size * (risk_pct / 100)
    risk_plan.base_trade_risk_pct = f"{risk_pct}%"
    risk_plan.max_daily_risk = risk_plan.base_trade_risk * 3  # Max 3 trades per day risk
    risk_plan.max_daily_risk_pct = f"{risk_pct * 3}%"

    db.session.add(risk_plan)
    db.session.commit()

    # Send user data to customer service dashboard with retry mechanism
    try:
        # Try multiple customer service URLs for reliability
        customer_service_urls = [
            os.getenv('CUSTOMER_SERVICE_URL', 'http://localhost:3005'),
            'http://localhost:3005',
            'https://customer-service.render.com'  # Add production URL if available
        ]
        
        user_data = {
            'user_id': user.id,
            'unique_id': user.unique_id,
            'username': user.username,
            'email': user.email,
            'plan_type': user.plan_type,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'questionnaire_data': {
                'prop_firm': data.get('propFirm', ''),
                'account_type': data.get('accountType', ''),
                'account_size': data.get('accountSize', 0),
                'risk_percentage': data.get('riskPercentage', 1),
                'has_account': data.get('hasAccount', 'no'),
                'account_equity': data.get('accountEquity', 0),
                'trading_session': data.get('tradingSession', ''),
                'crypto_assets': data.get('cryptoAssets', []),
                'forex_assets': data.get('forexAssets', [])
            }
        }
        
        sync_successful = False
        for url in customer_service_urls:
            try:
                response = requests.post(
                    f"{url}/api/customers",
                    json=user_data,
                    timeout=10,
                    headers={'Content-Type': 'application/json'}
                )
                if response.status_code in [200, 201, 409]:  # 409 = already exists
                    print(f"Customer service sync successful: {response.status_code} from {url}")
                    sync_successful = True
                    break
                else:
                    print(f"Customer service sync failed: {response.status_code} from {url}")
            except Exception as url_error:
                print(f"Failed to sync with {url}: {url_error}")
                continue
        
        if not sync_successful:
            print("All customer service sync attempts failed, but continuing with main request")
            
    except Exception as e:
        print(f"Customer service sync error: {e}")
        # Don't fail the main request if customer service is down

    return jsonify({"msg": "Questionnaire saved successfully"}), 200

@user_bp.route('/user/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"msg": "User not found"}), 404

        risk_plan = RiskPlan.query.filter_by(user_id=user_id).first()
        
        profile_data = {
            'id': user.id,
            'unique_id': user.unique_id,
            'username': user.username,
            'email': user.email,
            'plan_type': user.plan_type,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'tradingData': None
        }

        if risk_plan:
            try:
                crypto_assets = json.loads(risk_plan.crypto_assets) if risk_plan.crypto_assets else []
                forex_assets = json.loads(risk_plan.forex_assets) if risk_plan.forex_assets else []
            except (json.JSONDecodeError, TypeError):
                crypto_assets = []
                forex_assets = []

            profile_data['tradingData'] = {
                'propFirm': risk_plan.prop_firm,
                'accountType': risk_plan.account_type,
                'accountSize': str(risk_plan.account_size) if risk_plan.account_size else '100000',
                'riskPerTrade': str(risk_plan.risk_percentage) if risk_plan.risk_percentage else '1',
                'tradesPerDay': risk_plan.trades_per_day,
                'tradingSession': risk_plan.trading_session,
                'cryptoAssets': crypto_assets,
                'forexAssets': forex_assets,
                'hasAccount': risk_plan.has_account,
                'accountEquity': str(risk_plan.account_equity) if risk_plan.account_equity else '0',
                'riskRewardRatio': risk_plan.min_risk_reward
            }

        return jsonify(profile_data), 200
    except Exception as e:
        return jsonify({"msg": f"An error occurred: {str(e)}"}), 500

@user_bp.route('/dashboard-data', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"msg": "Invalid token"}), 401
            
        user = User.query.get(user_id)
        if not user:
            return jsonify({"msg": "User not found"}), 404

        # This is a placeholder. Replace with actual dashboard data from your models.
        dashboard_data = {
            "account_balance": 100000,
            "total_pnl": 5230.50,
            "win_rate": 68.5,
            "recent_trades": [
                {"symbol": "EURUSD", "pnl": 150.25, "outcome": "win"},
                {"symbol": "GBPUSD", "pnl": -75.50, "outcome": "loss"}
            ]
        }
        return jsonify(dashboard_data), 200
    except Exception as e:
        print(f"Error in get_dashboard_data: {str(e)}")
        return jsonify({"msg": "Failed to fetch dashboard data"}), 500

@user_bp.route('/customers', methods=['GET'])
def get_all_customers():
    """Get all customers for customer service dashboard"""
    try:
        users = User.query.all()
        customers_data = []
        
        for user in users:
            risk_plan = RiskPlan.query.filter_by(user_id=user.id).first()
            customer_data = {
                'id': user.id,
                'unique_id': user.unique_id,
                'username': user.username,
                'email': user.email,
                'plan_type': user.plan_type,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'questionnaire_data': {}
            }
            
            if risk_plan:
                customer_data['questionnaire_data'] = {
                    'prop_firm': risk_plan.prop_firm,
                    'account_type': risk_plan.account_type,
                    'account_size': risk_plan.account_size,
                    'risk_percentage': risk_plan.risk_percentage,
                    'has_account': risk_plan.has_account,
                    'account_equity': risk_plan.account_equity,
                    'trading_session': risk_plan.trading_session,
                    'crypto_assets': json.loads(risk_plan.crypto_assets) if risk_plan.crypto_assets else [],
                    'forex_assets': json.loads(risk_plan.forex_assets) if risk_plan.forex_assets else []
                }
            
            customers_data.append(customer_data)
        
        return jsonify(customers_data), 200
    except Exception as e:
        print(f"Error fetching customers: {e}")
        return jsonify({"error": "Failed to fetch customers"}), 500

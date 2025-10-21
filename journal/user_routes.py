from flask import Blueprint, request, jsonify
from .models import db, User, RiskPlan, UserProgress
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
import requests
import os

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/register', methods=['POST'])
def register():
    print("🔍 Starting user registration process...")
    try:
        data = request.get_json()
        if not data:
            print("❌ No JSON data in request")
            return jsonify({"msg": "Missing JSON in request"}), 400
    except Exception as e:
        print(f"🚨 Error getting JSON data: {e}")
        print(f"Raw request data: {request.data}")
        return jsonify({"msg": "Invalid JSON data"}), 400

    print(f"📝 Received registration data: {data}")
    
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('firstName') # Corrected from first_name
    last_name = data.get('lastName') # Corrected from last_name

    if not email or not password or not first_name or not last_name:
        print(f"❌ Missing required fields - email: {email}, password: {bool(password)}, first_name: {first_name}, last_name: {last_name}")
        return jsonify({"msg": "Missing required fields"}), 400

    print(f"🔍 Checking if email {email} already exists...")
    try:
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            print(f"❌ Email {email} already registered")
            return jsonify({"msg": "Email already registered"}), 409
        print(f"✅ Email {email} is available")
    except Exception as e:
        print(f"❌ Error checking existing user: {str(e)}")
        return jsonify({"msg": "Database error checking existing user"}), 500

    # In a real app, you would hash the password
    # from werkzeug.security import generate_password_hash
    # password_hash = generate_password_hash(password)
    password_hash = password # Storing plain text for now, but this is NOT secure

    print(f"👤 Creating new user object for {email}...")
    new_user = User(
        username=email,
        email=email,
        password_hash=password_hash,
        first_name=first_name,
        last_name=last_name,
        phone=data.get('phone'),
        company=data.get('company'),
        country=data.get('country'),
        agree_to_marketing=data.get('agree_to_marketing', False)
    )
    
    print(f"📊 User object created: {new_user}")
    
    try:
        print("💾 Adding user to database session...")
        db.session.add(new_user)
        print("✅ User added to session successfully")
        
        print("🔄 Committing transaction to database...")
        db.session.commit()
        print(f"✅ Successfully committed new user {email} to the database with ID: {new_user.id}")
        
        # Verify the user was actually saved
        print("🔍 Verifying user was saved...")
        saved_user = User.query.filter_by(email=email).first()
        if saved_user:
            print(f"✅ Verification successful - user found in database with ID: {saved_user.id}")
        else:
            print("❌ Verification failed - user not found in database after commit")
            
        return jsonify({"msg": "User registered successfully", "user_id": new_user.id}), 201
    except Exception as e:
        print(f"❌ Database commit failed for user {email}: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        print("🔄 Database session rolled back")
        return jsonify({"msg": "Database error, registration failed."}), 500

@user_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to test database connection"""
    try:
        # Test database connection
        user_count = User.query.count()
        return jsonify({
            'status': 'ok',
            'message': 'Backend is running',
            'database': 'connected',
            'user_count': user_count,
            'timestamp': '2025-01-02T21:30:00Z'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Database connection failed: {str(e)}',
            'database': 'disconnected'
        }), 500

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

    # Create or update user progress with questionnaire data
    user_progress = UserProgress.query.filter_by(user_id=user_id).first()
    if not user_progress:
        user_progress = UserProgress(user_id=user_id)

    # Store questionnaire answers and trading data as JSON
    user_progress.questionnaire_answers = json.dumps(data)
    user_progress.trading_data = json.dumps({
        "equity": data.get('accountEquity', 0),
        "prop_firm": data.get('propFirm', ''),
        "account_type": data.get('accountType', ''),
        "signals": [] # Initialize with empty signals
    })

    db.session.add(user_progress)
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

        user_progress = UserProgress.query.filter_by(user_id=user_id).first()
        if not user_progress or not user_progress.trading_data:
            return jsonify({"msg": "No trading data found for user"}), 404

        try:
            trading_data = json.loads(user_progress.trading_data)
        except (json.JSONDecodeError, TypeError):
            return jsonify({"msg": "Invalid trading data format"}), 500

        # You can add more complex logic here to calculate PnL, win rate, etc.
        dashboard_data = {
            "account_balance": trading_data.get("equity", 0),
            "total_pnl": trading_data.get("total_pnl", 0), # Assuming this is in your data
            "win_rate": trading_data.get("win_rate", 0), # Assuming this is in your data
            "recent_trades": trading_data.get("signals", [])
        }
        return jsonify(dashboard_data), 200
    except Exception as e:
        print(f"Error in get_dashboard_data: {str(e)}")
        return jsonify({"msg": "Failed to fetch dashboard data"}), 500

@user_bp.route('/customers', methods=['GET'])
def get_all_customers():
    """Get all customers for customer service dashboard"""
    try:
        print("🔍 Starting to fetch customers...")
        
        # Test database connection first
        try:
            user_count = User.query.count()
            print(f"📊 Found {user_count} users in database")
        except Exception as db_error:
            print(f"❌ Database error: {db_error}")
            return jsonify({"error": f"Database connection error: {str(db_error)}"}), 500
        
        users = User.query.all()
        print(f"📋 Retrieved {len(users)} users from database")
        
        customers_data = []
        
        for user in users:
            try:
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
                print(f"✅ Processed user: {user.username} (ID: {user.id})")
                
            except Exception as user_error:
                print(f"⚠️ Error processing user {user.id}: {user_error}")
                # Continue with other users
                continue
        
        print(f"🎉 Successfully processed {len(customers_data)} customers")
        return jsonify(customers_data), 200
        
    except Exception as e:
        print(f"❌ Error fetching customers: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to fetch customers: {str(e)}"}), 500

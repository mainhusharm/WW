from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
import psycopg2
import psycopg2.extras
import bcrypt
import json
import os
from datetime import datetime
import uuid

enhanced_user_bp = Blueprint('enhanced_user_bp', __name__)

# Database configuration - Use environment variables first, then fallback
DATABASE_URL = (
    os.getenv('DATABASE_URL') or 
    os.getenv('POSTGRES_URL') or 
    os.getenv('POSTGRESQL_URL') or
    'postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2'
)

def get_db_connection():
    """Get database connection with SSL configuration"""
    try:
        # Handle different database URL formats
        if DATABASE_URL.startswith('postgres://'):
            # Convert postgres:// to postgresql:// for psycopg2
            db_url = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
        else:
            db_url = DATABASE_URL
            
        conn = psycopg2.connect(
            db_url,
            sslmode='require',
            cursor_factory=psycopg2.extras.RealDictCursor
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        print(f"Database URL format: {DATABASE_URL[:50]}...")
        raise

@enhanced_user_bp.route('/enhanced/register', methods=['POST'])
def enhanced_register():
    """Enhanced user registration with comprehensive data capture"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "Missing JSON in request"}), 400

        # Required fields
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name')
        last_name = data.get('last_name')

        if not all([email, password, first_name, last_name]):
            return jsonify({"msg": "Missing required fields: email, password, first_name, last_name"}), 400

        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Get client info
        user_agent = request.headers.get('User-Agent', '')
        registration_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', ''))

        conn = get_db_connection()
        cur = conn.cursor()

        # Check if user already exists
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"msg": "Email already registered"}), 409

        # Insert enhanced user data
        insert_query = """
            INSERT INTO users (
                email, password_hash, first_name, last_name, full_name, phone, company, country,
                agree_to_terms, agree_to_marketing, privacy_policy_accepted, 
                registration_method, registration_ip, user_agent, referral_source
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, uuid, email, first_name, last_name, full_name, created_at
        """
        
        values = (
            email,
            password_hash,
            first_name,
            last_name,
            f"{first_name} {last_name}".strip(),
            data.get('phone'),
            data.get('company'),
            data.get('country'),
            data.get('agree_to_terms', False),
            data.get('agree_to_marketing', False),
            data.get('privacy_policy_accepted', False),
            'web',
            registration_ip,
            user_agent,
            data.get('referral_source')
        )

        cur.execute(insert_query, values)
        user = cur.fetchone()
        
        conn.commit()
        cur.close()
        conn.close()

        # Create JWT token
        access_token = create_access_token(identity=user['id'])

        return jsonify({
            "msg": "User registered successfully",
            "user": {
                "id": user['id'],
                "uuid": str(user['uuid']),
                "email": user['email'],
                "first_name": user['first_name'],
                "last_name": user['last_name'],
                "full_name": user['full_name']
            },
            "access_token": access_token
        }), 201

    except Exception as e:
        print(f"Enhanced registration error: {e}")
        return jsonify({"msg": f"Registration failed: {str(e)}"}), 500

@enhanced_user_bp.route('/enhanced/payment', methods=['POST'])
def enhanced_payment():
    """Enhanced payment processing with comprehensive tracking"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "Missing JSON in request"}), 400

        # Required fields
        user_id = data.get('user_id')
        plan_type = data.get('plan_type')
        plan_name = data.get('plan_name')
        payment_method = data.get('payment_method')
        original_price = data.get('original_price')
        final_price = data.get('final_price')

        if not all([user_id, plan_type, plan_name, payment_method, original_price is not None, final_price is not None]):
            return jsonify({"msg": "Missing required payment fields"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # Get user info
        cur.execute("SELECT uuid, email, full_name FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        if not user:
            cur.close()
            conn.close()
            return jsonify({"msg": "User not found"}), 404

        # Insert payment details
        payment_query = """
            INSERT INTO payment_details (
                user_id, user_uuid, user_email, user_name, plan_type, plan_name,
                original_price, discount_percentage, discount_amount, final_price, currency,
                coupon_code, coupon_applied, coupon_message, payment_method, payment_provider,
                payment_status, transaction_id, transaction_hash, crypto_currency, crypto_address,
                crypto_verification_status, billing_country, billing_city, payment_data
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, transaction_id, payment_status
        """

        discount_amount = original_price - final_price
        discount_percentage = (discount_amount / original_price * 100) if original_price > 0 else 0

        payment_values = (
            user_id,
            user['uuid'],
            user['email'],
            user['full_name'],
            plan_type,
            plan_name,
            original_price,
            discount_percentage,
            discount_amount,
            final_price,
            data.get('currency', 'USD'),
            data.get('coupon_code'),
            data.get('coupon_applied', False),
            data.get('coupon_message'),
            payment_method,
            data.get('payment_provider'),
            data.get('payment_status', 'pending'),
            data.get('transaction_id'),
            data.get('transaction_hash'),
            data.get('crypto_currency'),
            data.get('crypto_address'),
            data.get('crypto_verification_status', 'pending'),
            data.get('billing_country'),
            data.get('billing_city'),
            json.dumps(data.get('payment_data', {}))
        )

        cur.execute(payment_query, payment_values)
        payment = cur.fetchone()

        # Update user plan type
        cur.execute("UPDATE users SET plan_type = %s, membership_tier = %s WHERE id = %s", 
                   (plan_type, plan_type, user_id))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "msg": "Payment processed successfully",
            "payment_id": str(payment['id']),
            "transaction_id": payment['transaction_id'],
            "status": payment['payment_status']
        }), 201

    except Exception as e:
        print(f"Enhanced payment error: {e}")
        return jsonify({"msg": f"Payment processing failed: {str(e)}"}), 500

@enhanced_user_bp.route('/enhanced/questionnaire', methods=['POST'])
@jwt_required()
def enhanced_questionnaire():
    """Enhanced questionnaire with comprehensive data capture"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        if not data:
            return jsonify({"msg": "Missing JSON in request"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # Get user info
        cur.execute("SELECT uuid, email, full_name FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        if not user:
            cur.close()
            conn.close()
            return jsonify({"msg": "User not found"}), 404

        # Insert/Update questionnaire details
        questionnaire_query = """
            INSERT INTO questionnaire_details (
                user_id, user_uuid, user_email, user_name, trades_per_day, trading_session,
                preferred_trading_hours, crypto_assets, forex_assets, custom_forex_pairs,
                has_account, account_equity, prop_firm, account_type, account_size, account_number,
                account_currency, broker_name, broker_platform, risk_percentage, risk_reward_ratio,
                custom_risk_reward_ratio, max_daily_loss_percentage, max_weekly_loss_percentage,
                max_monthly_loss_percentage, trading_experience, trading_goals, trading_style,
                preferred_markets, risk_tolerance, volatility_tolerance, drawdown_tolerance,
                emotional_control, discipline_level, stress_management, additional_notes,
                marketing_consent, terms_accepted, privacy_policy_accepted, completion_percentage, is_completed
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                trades_per_day = EXCLUDED.trades_per_day,
                trading_session = EXCLUDED.trading_session,
                preferred_trading_hours = EXCLUDED.preferred_trading_hours,
                crypto_assets = EXCLUDED.crypto_assets,
                forex_assets = EXCLUDED.forex_assets,
                custom_forex_pairs = EXCLUDED.custom_forex_pairs,
                has_account = EXCLUDED.has_account,
                account_equity = EXCLUDED.account_equity,
                prop_firm = EXCLUDED.prop_firm,
                account_type = EXCLUDED.account_type,
                account_size = EXCLUDED.account_size,
                account_number = EXCLUDED.account_number,
                account_currency = EXCLUDED.account_currency,
                broker_name = EXCLUDED.broker_name,
                broker_platform = EXCLUDED.broker_platform,
                risk_percentage = EXCLUDED.risk_percentage,
                risk_reward_ratio = EXCLUDED.risk_reward_ratio,
                custom_risk_reward_ratio = EXCLUDED.custom_risk_reward_ratio,
                max_daily_loss_percentage = EXCLUDED.max_daily_loss_percentage,
                max_weekly_loss_percentage = EXCLUDED.max_weekly_loss_percentage,
                max_monthly_loss_percentage = EXCLUDED.max_monthly_loss_percentage,
                trading_experience = EXCLUDED.trading_experience,
                trading_goals = EXCLUDED.trading_goals,
                trading_style = EXCLUDED.trading_style,
                preferred_markets = EXCLUDED.preferred_markets,
                risk_tolerance = EXCLUDED.risk_tolerance,
                volatility_tolerance = EXCLUDED.volatility_tolerance,
                drawdown_tolerance = EXCLUDED.drawdown_tolerance,
                emotional_control = EXCLUDED.emotional_control,
                discipline_level = EXCLUDED.discipline_level,
                stress_management = EXCLUDED.stress_management,
                additional_notes = EXCLUDED.additional_notes,
                marketing_consent = EXCLUDED.marketing_consent,
                terms_accepted = EXCLUDED.terms_accepted,
                privacy_policy_accepted = EXCLUDED.privacy_policy_accepted,
                completion_percentage = EXCLUDED.completion_percentage,
                is_completed = EXCLUDED.is_completed,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id, prop_firm, account_type, account_equity, is_completed
        """

        questionnaire_values = (
            user_id,
            user['uuid'],
            user['email'],
            user['full_name'],
            data.get('trades_per_day', '1-2'),
            data.get('trading_session', 'any'),
            data.get('preferred_trading_hours'),
            data.get('crypto_assets', []),
            data.get('forex_assets', []),
            data.get('custom_forex_pairs', []),
            data.get('has_account', 'no'),
            data.get('account_equity'),
            data.get('prop_firm'),
            data.get('account_type'),
            data.get('account_size'),
            data.get('account_number'),
            data.get('account_currency', 'USD'),
            data.get('broker_name'),
            data.get('broker_platform'),
            data.get('risk_percentage', 1.0),
            data.get('risk_reward_ratio', '2'),
            data.get('custom_risk_reward_ratio'),
            data.get('max_daily_loss_percentage'),
            data.get('max_weekly_loss_percentage'),
            data.get('max_monthly_loss_percentage'),
            data.get('trading_experience'),
            data.get('trading_goals'),
            data.get('trading_style'),
            data.get('preferred_markets', []),
            data.get('risk_tolerance'),
            data.get('volatility_tolerance'),
            data.get('drawdown_tolerance'),
            data.get('emotional_control'),
            data.get('discipline_level'),
            data.get('stress_management'),
            data.get('additional_notes'),
            data.get('marketing_consent', False),
            data.get('terms_accepted', False),
            data.get('privacy_policy_accepted', False),
            data.get('completion_percentage', 100.0),
            data.get('is_completed', True)
        )

        cur.execute(questionnaire_query, questionnaire_values)
        questionnaire = cur.fetchone()

        # Create/Update dashboard data based on questionnaire
        dashboard_query = """
            INSERT INTO user_dashboard_data (
                user_id, user_uuid, questionnaire_id, prop_firm, account_type, account_size,
                account_currency, risk_per_trade, trading_experience, trading_style,
                account_balance, initial_equity, current_equity, milestone_access_level
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                questionnaire_id = EXCLUDED.questionnaire_id,
                prop_firm = EXCLUDED.prop_firm,
                account_type = EXCLUDED.account_type,
                account_size = EXCLUDED.account_size,
                account_currency = EXCLUDED.account_currency,
                risk_per_trade = EXCLUDED.risk_per_trade,
                trading_experience = EXCLUDED.trading_experience,
                trading_style = EXCLUDED.trading_style,
                account_balance = EXCLUDED.account_balance,
                initial_equity = EXCLUDED.initial_equity,
                current_equity = EXCLUDED.current_equity,
                milestone_access_level = EXCLUDED.milestone_access_level,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
        """

        # Determine milestone access level based on account type
        account_type = data.get('account_type', '').lower()
        if account_type in ['demo', 'beginner']:
            milestone_access = 1
        elif account_type in ['standard']:
            milestone_access = 2
        elif account_type in ['pro', 'experienced']:
            milestone_access = 3
        elif account_type in ['funded', 'evaluation']:
            milestone_access = 4
        else:
            milestone_access = 1

        dashboard_values = (
            user_id,
            user['uuid'],
            questionnaire['id'],
            data.get('prop_firm'),
            data.get('account_type'),
            data.get('account_size'),
            data.get('account_currency', 'USD'),
            data.get('risk_percentage', 1.0),
            data.get('trading_experience'),
            data.get('trading_style'),
            data.get('account_equity', 0),
            data.get('account_equity', 0),
            data.get('account_equity', 0),
            milestone_access
        )

        cur.execute(dashboard_query, dashboard_values)

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "msg": "Questionnaire saved successfully",
            "questionnaire_id": str(questionnaire['id']),
            "milestone_access_level": milestone_access
        }), 200

    except Exception as e:
        print(f"Enhanced questionnaire error: {e}")
        return jsonify({"msg": f"Questionnaire processing failed: {str(e)}"}), 500

@enhanced_user_bp.route('/enhanced/dashboard-data', methods=['GET'])
@jwt_required()
def enhanced_dashboard_data():
    """Get comprehensive dashboard data"""
    try:
        user_id = get_jwt_identity()
        
        conn = get_db_connection()
        cur = conn.cursor()

        # Get complete user profile using the view
        cur.execute("SELECT * FROM user_complete_profile WHERE id = %s", (user_id,))
        profile = cur.fetchone()
        
        if not profile:
            cur.close()
            conn.close()
            return jsonify({"msg": "User profile not found"}), 404

        # Get dashboard overview
        cur.execute("SELECT * FROM dashboard_overview WHERE user_id = %s", (user_id,))
        dashboard = cur.fetchone()

        cur.close()
        conn.close()

        # Format response
        response_data = {
            "user_profile": dict(profile) if profile else {},
            "dashboard_data": dict(dashboard) if dashboard else {},
            "account_balance": dashboard.get('current_equity', 0) if dashboard else 0,
            "total_pnl": dashboard.get('total_pnl', 0) if dashboard else 0,
            "win_rate": dashboard.get('win_rate', 0) if dashboard else 0,
            "signals_taken": dashboard.get('signals_taken', 0) if dashboard else 0,
            "signals_won": dashboard.get('signals_won', 0) if dashboard else 0,
            "signals_lost": dashboard.get('signals_lost', 0) if dashboard else 0,
            "milestone_access_level": dashboard.get('milestone_access_level', 1) if dashboard else 1
        }

        return jsonify(response_data), 200

    except Exception as e:
        print(f"Enhanced dashboard data error: {e}")
        return jsonify({"msg": f"Failed to fetch dashboard data: {str(e)}"}), 500

@enhanced_user_bp.route('/enhanced/health', methods=['GET'])
def enhanced_health():
    """Enhanced health check with database connection test"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Test database connection and get counts
        cur.execute("SELECT COUNT(*) as user_count FROM users")
        user_count = cur.fetchone()['user_count']
        
        cur.execute("SELECT COUNT(*) as payment_count FROM payment_details")
        payment_count = cur.fetchone()['payment_count']
        
        cur.execute("SELECT COUNT(*) as questionnaire_count FROM questionnaire_details")
        questionnaire_count = cur.fetchone()['questionnaire_count']
        
        # Test views
        try:
            cur.execute("SELECT COUNT(*) as view_count FROM user_complete_profile")
            view_count = cur.fetchone()['view_count']
            views_working = True
        except Exception as view_error:
            print(f"Views not working: {view_error}")
            views_working = False
            view_count = 0
        
        cur.close()
        conn.close()

        return jsonify({
            'status': 'ok',
            'message': 'Enhanced backend is running',
            'database': 'connected',
            'schema': 'enhanced',
            'database_url_prefix': DATABASE_URL[:30] + '...',
            'views_working': views_working,
            'counts': {
                'users': user_count,
                'payments': payment_count,
                'questionnaires': questionnaire_count,
                'profile_views': view_count
            },
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Enhanced database connection failed: {str(e)}',
            'database': 'disconnected',
            'database_url_prefix': DATABASE_URL[:30] + '...' if DATABASE_URL else 'Not set'
        }), 500

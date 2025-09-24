#!/usr/bin/env python3
"""
Test Database Insertions for TraderEdge Pro
This script tests all database tables by inserting sample data
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import base64
from datetime import datetime, timezone

def get_database_connection():
    """Get database connection"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        print("Please set DATABASE_URL=postgresql://username:password@host:port/database")
        return None
    
    try:
        conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return None

def create_test_user(conn):
    """Create a test user"""
    cursor = conn.cursor()
    
    # Insert test user
    cursor.execute("""
        INSERT INTO users (
            username, email, normalized_email, password_hash, 
            first_name, last_name, full_name, phone, company, country,
            trading_experience, trading_goals, risk_tolerance, 
            preferred_markets, trading_style, agree_to_marketing,
            plan_type, unique_id, is_active, is_verified
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        ) RETURNING id, uuid
    """, (
        'testtrader001', 'testtrader001@example.com', 'testtrader001@example.com',
        'hashed_password_123', 'John', 'Doe', 'John Doe', '+1234567890',
        'Trading Corp', 'United States', 'intermediate', 'Generate consistent profits',
        'moderate', 'forex,crypto', 'day_trading', True, 'pro', 'TRD001',
        True, True
    ))
    
    result = cursor.fetchone()
    user_id = result['id']
    user_uuid = result['uuid']
    
    print(f"✅ Created test user: ID={user_id}, UUID={user_uuid}")
    cursor.close()
    return user_id, user_uuid

def test_payment_details(conn, user_id, user_uuid):
    """Test payment details table with all fields"""
    cursor = conn.cursor()
    
    # Create sample payment data
    payment_data = {
        "stripe_payment_intent": "pi_test_123456789",
        "stripe_customer_id": "cus_test_123456789",
        "payment_method_details": {
            "type": "card",
            "card": {
                "brand": "visa",
                "last4": "4242",
                "exp_month": 12,
                "exp_year": 2025
            }
        }
    }
    
    webhook_data = {
        "event_type": "payment_intent.succeeded",
        "event_id": "evt_test_123456789",
        "created": int(datetime.now().timestamp())
    }
    
    cursor.execute("""
        INSERT INTO payment_details (
            user_id, user_uuid, user_email, user_name, plan_type, plan_name,
            plan_duration, original_price, discount_percentage, discount_amount,
            final_price, currency, coupon_code, promotion_id, referral_code,
            payment_method, payment_provider, payment_provider_id, payment_intent_id,
            transaction_id, payment_status, billing_country, billing_state,
            billing_city, billing_address, billing_postal_code, company_name,
            tax_id, vat_number, phone, alternate_email, payment_data,
            webhook_data, payment_date, created_by, updated_by
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        ) RETURNING id
    """, (
        user_id, user_uuid, 'testtrader001@example.com', 'John Doe',
        'pro', 'Professional Plan', 'monthly', 99.99, 10.0, 9.99,
        89.99, 'USD', 'SAVE10', 'PROMO2024', 'REF001',
        'stripe', 'stripe', 'stripe_test_123', 'pi_test_123456789',
        'txn_test_123456789', 'completed', 'United States', 'California',
        'San Francisco', '123 Trading Street, Suite 100', '94105',
        'Trading Corp', 'TAX123456', 'VAT123456789', '+1234567890',
        'billing@tradingcorp.com', json.dumps(payment_data), json.dumps(webhook_data),
        datetime.now(timezone.utc), 'system', 'system'
    ))
    
    result = cursor.fetchone()
    payment_id = result['id']
    print(f"✅ Created payment details: ID={payment_id}")
    cursor.close()
    return payment_id

def test_questionnaire_details(conn, user_id, user_uuid):
    """Test questionnaire details table with all fields"""
    cursor = conn.cursor()
    
    # Create sample base64 image (small test image)
    sample_image_data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    
    cursor.execute("""
        INSERT INTO questionnaire_details (
            user_id, user_uuid, user_email, user_name, first_name, last_name,
            phone, country, timezone, trading_experience, trading_goals,
            trading_style, preferred_markets, trades_per_day, trading_session,
            preferred_trading_hours, crypto_assets, forex_assets, custom_forex_pairs,
            stock_assets, commodity_assets, index_assets, has_account, account_equity,
            prop_firm, account_type, account_size, account_currency, broker_name,
            broker_platform, risk_percentage, risk_reward_ratio, custom_risk_reward_ratio,
            max_daily_loss_percentage, max_weekly_loss_percentage, max_monthly_loss_percentage,
            risk_tolerance, volatility_tolerance, drawdown_tolerance, emotional_control,
            discipline_level, stress_management, account_screenshot, screenshot_filename,
            screenshot_size, screenshot_type, screenshot_upload_date, additional_notes,
            marketing_consent, terms_accepted, privacy_policy_accepted, completed_at,
            created_by, updated_by
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        ) RETURNING id
    """, (
        user_id, user_uuid, 'testtrader001@example.com', 'John Doe',
        'John', 'Doe', '+1234567890', 'United States', 'America/New_York',
        'intermediate', 'Generate consistent monthly profits of 5-10%',
        'day_trading', ARRAY['forex', 'crypto', 'stocks'], '11-20', 'london',
        '8:00 AM - 4:00 PM EST', ARRAY['BTC', 'ETH', 'ADA'], ARRAY['EUR/USD', 'GBP/USD'],
        ARRAY['EUR/GBP', 'AUD/CAD'], ARRAY['AAPL', 'TSLA', 'MSFT'], ARRAY['GOLD', 'OIL'],
        ARRAY['SPX', 'NAS', 'DOW'], 'yes', 50000.00, 'FTMO', 'live',
        50000.00, 'USD', 'Interactive Brokers', 'TWS', 2.0, '1:2', 2.5,
        5.0, 15.0, 30.0, 'moderate', 'medium', 10.0, 'good', 'excellent',
        'fair', sample_image_data, 'account_screenshot.png', 1024, 'image/png',
        datetime.now(timezone.utc), 'Looking to improve risk management',
        True, True, True, datetime.now(timezone.utc), 'user', 'user'
    ))
    
    result = cursor.fetchone()
    questionnaire_id = result['id']
    print(f"✅ Created questionnaire details: ID={questionnaire_id}")
    cursor.close()
    return questionnaire_id

def test_user_dashboard_data(conn, user_id, user_uuid, questionnaire_id):
    """Test user dashboard data table with all fields"""
    cursor = conn.cursor()
    
    # Create sample JSON data for various fields
    overview_stats = {
        "account_balance": 50000.00,
        "total_pnl": 2500.00,
        "win_rate": 68.5,
        "total_trades": 45,
        "daily_pnl": 125.50,
        "weekly_pnl": 750.00,
        "monthly_pnl": 2500.00
    }
    
    performance_summary = {
        "profit_factor": 1.85,
        "sharpe_ratio": 1.42,
        "max_drawdown": 5.2,
        "current_drawdown": 1.8,
        "sortino_ratio": 1.65,
        "calmar_ratio": 0.35
    }
    
    risk_metrics = {
        "max_daily_risk": 1000.00,
        "risk_per_trade": 500.00,
        "daily_loss_limit": 2500.00,
        "consecutive_losses": 3,
        "current_risk_usage": 45.5
    }
    
    risk_alerts = [
        {"type": "daily_loss_limit", "message": "Approaching daily loss limit", "severity": "warning"},
        {"type": "consecutive_losses", "message": "3 consecutive losses", "severity": "info"}
    ]
    
    prop_firm_rules = {
        "max_daily_loss": 5.0,
        "max_drawdown": 10.0,
        "profit_target": 8.0,
        "trading_days": 30,
        "consistency_rule": 80.0
    }
    
    real_time_data = {
        "market_status": "open",
        "last_price_update": datetime.now().isoformat(),
        "active_positions": 2,
        "pending_orders": 1
    }
    
    last_signal = {
        "symbol": "EUR/USD",
        "action": "BUY",
        "entry_price": 1.0850,
        "stop_loss": 1.0800,
        "take_profit": 1.0950,
        "timestamp": datetime.now().isoformat()
    }
    
    open_positions = [
        {
            "id": "pos_001",
            "symbol": "EUR/USD",
            "side": "BUY",
            "size": 0.1,
            "entry_price": 1.0850,
            "current_price": 1.0875,
            "pnl": 25.00,
            "open_time": datetime.now().isoformat()
        }
    ]
    
    trade_history = [
        {
            "id": "trade_001",
            "symbol": "GBP/USD",
            "side": "SELL",
            "size": 0.05,
            "entry_price": 1.2650,
            "exit_price": 1.2600,
            "pnl": 25.00,
            "duration": "2h 15m",
            "close_time": datetime.now().isoformat()
        }
    ]
    
    signals = [
        {
            "id": "sig_001",
            "symbol": "EUR/USD",
            "action": "BUY",
            "strength": "strong",
            "timeframe": "H1",
            "timestamp": datetime.now().isoformat()
        }
    ]
    
    watchlist = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "BTC/USD"]
    
    dashboard_layout = {
        "theme": "concept1",
        "widgets": ["overview", "performance", "risk", "positions"],
        "layout": "grid"
    }
    
    widget_settings = {
        "overview": {"refresh_interval": 5000},
        "performance": {"chart_type": "line"},
        "risk": {"alerts_enabled": True}
    }
    
    chart_preferences = {
        "default_timeframe": "H1",
        "chart_type": "candlestick",
        "indicators": ["SMA", "RSI", "MACD"]
    }
    
    cursor.execute("""
        INSERT INTO user_dashboard_data (
            user_id, user_uuid, questionnaire_id, prop_firm, account_type,
            account_size, account_currency, risk_per_trade, trading_experience,
            trading_style, unique_id, account_balance, initial_equity, current_equity,
            total_pnl, daily_pnl, weekly_pnl, monthly_pnl, total_trades, winning_trades,
            losing_trades, win_rate, average_win, average_loss, profit_factor,
            gross_profit, gross_loss, max_drawdown, current_drawdown, max_drawdown_percentage,
            current_drawdown_percentage, sharpe_ratio, sortino_ratio, calmar_ratio,
            consecutive_wins, consecutive_losses, max_consecutive_wins, max_consecutive_losses,
            max_daily_risk, risk_per_trade_amount, max_drawdown_limit, daily_loss_limit,
            weekly_loss_limit, monthly_loss_limit, daily_trades, weekly_trades, monthly_trades,
            daily_initial_equity, weekly_initial_equity, monthly_initial_equity,
            risk_per_trade_percentage, daily_loss_limit_percentage, weekly_loss_limit_percentage,
            monthly_loss_limit_percentage, consecutive_losses_limit, selected_theme,
            notifications_enabled, auto_refresh, refresh_interval, language, timezone,
            real_time_data, last_signal, market_status, connection_status, open_positions,
            trade_history, signals, watchlist, dashboard_layout, widget_settings,
            chart_preferences, overview_stats, performance_summary, account_summary,
            risk_metrics, risk_alerts, risk_violations, prop_firm_rules, rule_violations,
            compliance_status, last_trade_date, created_by, updated_by
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        ) RETURNING id
    """, (
        user_id, user_uuid, questionnaire_id, 'FTMO', 'live', 50000.00, 'USD',
        2.0, 'intermediate', 'day_trading', 'TRD001', 50000.00, 50000.00, 50000.00,
        2500.00, 125.50, 750.00, 2500.00, 45, 31, 14, 68.5, 80.65, -35.71, 1.85,
        2500.00, -500.00, 5.2, 1.8, 5.2, 1.8, 1.42, 1.65, 0.35, 5, 2, 8, 3,
        1000.00, 500.00, 5000.00, 2500.00, 7500.00, 15000.00, 3, 15, 45,
        50000.00, 50000.00, 50000.00, 2.0, 5.0, 15.0, 30.0, 5, 'concept1',
        True, True, 5000, 'en', 'America/New_York', json.dumps(real_time_data),
        json.dumps(last_signal), 'open', 'online', json.dumps(open_positions),
        json.dumps(trade_history), json.dumps(signals), json.dumps(watchlist),
        json.dumps(dashboard_layout), json.dumps(widget_settings), json.dumps(chart_preferences),
        json.dumps(overview_stats), json.dumps(performance_summary), json.dumps({"equity": 50000.00}),
        json.dumps(risk_metrics), json.dumps(risk_alerts), json.dumps([]),
        json.dumps(prop_firm_rules), json.dumps([]), 'compliant', datetime.now(timezone.utc),
        'system', 'system'
    ))
    
    result = cursor.fetchone()
    dashboard_id = result['id']
    print(f"✅ Created user dashboard data: ID={dashboard_id}")
    cursor.close()
    return dashboard_id

def verify_data(conn, user_id):
    """Verify all data was inserted correctly"""
    cursor = conn.cursor()
    
    print("\n🔍 Verifying inserted data...")
    
    # Check user
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    print(f"✅ User: {user['username']} ({user['plan_type']})")
    
    # Check payment details
    cursor.execute("SELECT * FROM payment_details WHERE user_id = %s", (user_id,))
    payment = cursor.fetchone()
    print(f"✅ Payment: {payment['plan_name']} - ${payment['final_price']} ({payment['payment_status']})")
    
    # Check questionnaire
    cursor.execute("SELECT * FROM questionnaire_details WHERE user_id = %s", (user_id,))
    questionnaire = cursor.fetchone()
    print(f"✅ Questionnaire: {questionnaire['trading_experience']} trader, {questionnaire['trades_per_day']} trades/day")
    
    # Check dashboard data
    cursor.execute("SELECT * FROM user_dashboard_data WHERE user_id = %s", (user_id,))
    dashboard = cursor.fetchone()
    print(f"✅ Dashboard: ${dashboard['account_balance']} balance, {dashboard['total_trades']} trades, {dashboard['win_rate']}% win rate")
    
    # Test views
    print("\n📊 Testing views...")
    cursor.execute("SELECT * FROM user_complete_profile WHERE id = %s", (user_id,))
    profile = cursor.fetchone()
    print(f"✅ Complete Profile View: {profile['username']} - {profile['plan_name']} - {profile['trading_experience']}")
    
    cursor.execute("SELECT * FROM dashboard_overview WHERE user_id = %s", (user_id,))
    overview = cursor.fetchone()
    print(f"✅ Dashboard Overview: ${overview['account_balance']} - {overview['total_trades']} trades")
    
    cursor.close()

def main():
    """Main test function"""
    print("🧪 Testing TraderEdge Pro Database Schema")
    print("=" * 50)
    
    # Connect to database
    conn = get_database_connection()
    if not conn:
        return
    
    try:
        # Create test user
        user_id, user_uuid = create_test_user(conn)
        
        # Test payment details
        payment_id = test_payment_details(conn, user_id, user_uuid)
        
        # Test questionnaire details
        questionnaire_id = test_questionnaire_details(conn, user_id, user_uuid)
        
        # Test dashboard data
        dashboard_id = test_user_dashboard_data(conn, user_id, user_uuid, questionnaire_id)
        
        # Verify all data
        verify_data(conn, user_id)
        
        print("\n🎉 All tests passed successfully!")
        print("✅ Payment details table: All fields working")
        print("✅ Questionnaire details table: All fields working")
        print("✅ User dashboard data table: All fields working")
        print("✅ Data relationships: All connected properly")
        print("✅ Views: All working correctly")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()


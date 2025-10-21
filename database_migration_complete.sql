-- =====================================================
-- COMPLETE DATABASE MIGRATION SCRIPT
-- =====================================================
-- This script migrates the existing database to the new comprehensive schema
-- Run this script to add all missing tables and columns for enhanced data tracking

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- STEP 1: BACKUP EXISTING DATA (OPTIONAL - UNCOMMENT IF NEEDED)
-- =====================================================

-- CREATE TABLE users_backup AS SELECT * FROM users;
-- CREATE TABLE user_subscriptions_backup AS SELECT * FROM user_subscriptions;
-- CREATE TABLE user_questionnaire_backup AS SELECT * FROM user_questionnaire;
-- CREATE TABLE user_dashboard_settings_backup AS SELECT * FROM user_dashboard_settings;

-- =====================================================
-- STEP 2: DROP EXISTING TABLES TO RECREATE WITH NEW SCHEMA
-- =====================================================

DROP TABLE IF EXISTS signal_tracking CASCADE;
DROP TABLE IF EXISTS user_dashboard_data CASCADE;
DROP TABLE IF EXISTS questionnaire_details CASCADE;
DROP TABLE IF EXISTS payment_details CASCADE;
DROP TABLE IF EXISTS user_dashboard_settings CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- STEP 3: CREATE ENHANCED USERS TABLE
-- =====================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE DEFAULT uuid_generate_v4(),
    
    -- Basic Information (from enhanced signup)
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(200),
    phone VARCHAR(20),
    company VARCHAR(200),
    country VARCHAR(100),
    
    -- Agreement and Consent (from enhanced signup)
    agree_to_terms BOOLEAN DEFAULT false,
    agree_to_marketing BOOLEAN DEFAULT false,
    privacy_policy_accepted BOOLEAN DEFAULT false,
    
    -- Account Status
    is_verified BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    membership_tier VARCHAR(20) DEFAULT 'free' CHECK (membership_tier IN ('free', 'kickstarter', 'starter', 'pro', 'enterprise')),
    plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'kickstarter', 'starter', 'pro', 'enterprise')),
    
    -- Registration Details
    registration_method VARCHAR(20) DEFAULT 'web' CHECK (registration_method IN ('web', 'api', 'fallback')),
    registration_ip VARCHAR(45),
    user_agent TEXT,
    referral_source VARCHAR(100),
    
    -- Authentication
    email_verification_token VARCHAR(255),
    email_verified_at TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit Fields
    created_by VARCHAR(100) DEFAULT 'system',
    updated_by VARCHAR(100) DEFAULT 'system'
);

-- =====================================================
-- STEP 4: CREATE PAYMENT DETAILS TABLE
-- =====================================================

CREATE TABLE payment_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_uuid UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(200) NOT NULL,
    
    -- Plan Information (from payment form)
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('kickstarter', 'starter', 'pro', 'enterprise')),
    plan_name VARCHAR(100) NOT NULL,
    plan_duration VARCHAR(50) DEFAULT 'monthly',
    plan_description TEXT,
    
    -- Pricing Information
    original_price DECIMAL(10,2) NOT NULL CHECK (original_price >= 0),
    discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    final_price DECIMAL(10,2) NOT NULL CHECK (final_price >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Coupon and Promotions
    coupon_code VARCHAR(50),
    coupon_applied BOOLEAN DEFAULT false,
    coupon_message TEXT,
    promotion_id VARCHAR(50),
    referral_code VARCHAR(50),
    
    -- Payment Method Details
    payment_method VARCHAR(50) NOT NULL, -- stripe, paypal, crypto_eth, crypto_sol, bank_transfer
    payment_provider VARCHAR(50),
    payment_provider_id VARCHAR(255),
    payment_intent_id VARCHAR(255),
    
    -- Transaction Information
    transaction_id VARCHAR(255) UNIQUE,
    transaction_hash VARCHAR(255), -- For crypto payments
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    
    -- Crypto Payment Details
    crypto_currency VARCHAR(10), -- ETH, SOL, BTC, etc.
    crypto_address VARCHAR(255), -- Receiving address
    crypto_amount DECIMAL(18,8), -- Amount in crypto
    crypto_network VARCHAR(50), -- Ethereum, Solana, etc.
    crypto_explorer_url TEXT,
    crypto_from_address VARCHAR(255), -- Sender's address
    crypto_verification_screenshot TEXT, -- Base64 or file path
    crypto_verification_status VARCHAR(20) DEFAULT 'pending' CHECK (crypto_verification_status IN ('pending', 'verified', 'rejected')),
    
    -- Billing Information
    billing_country VARCHAR(50),
    billing_state VARCHAR(50),
    billing_city VARCHAR(100),
    billing_address TEXT,
    billing_postal_code VARCHAR(20),
    company_name VARCHAR(200),
    tax_id VARCHAR(50),
    vat_number VARCHAR(50),
    
    -- Contact Information
    phone VARCHAR(20),
    alternate_email VARCHAR(255),
    
    -- Payment Processing Data
    payment_data JSONB, -- Store provider-specific data
    webhook_data JSONB, -- Store webhook responses
    refund_data JSONB, -- Store refund information
    verification_data JSONB, -- Store verification details
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_date TIMESTAMP WITH TIME ZONE,
    verification_date TIMESTAMP WITH TIME ZONE,
    refund_date TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    created_by VARCHAR(100) DEFAULT 'system',
    updated_by VARCHAR(100) DEFAULT 'system'
);

-- =====================================================
-- STEP 5: CREATE QUESTIONNAIRE DETAILS TABLE
-- =====================================================

CREATE TABLE questionnaire_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    user_uuid UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(200) NOT NULL,
    
    -- Trading Frequency and Session (from questionnaire)
    trades_per_day VARCHAR(20) NOT NULL CHECK (trades_per_day IN ('1-2', '3-5', '6-10', '10+')),
    trading_session VARCHAR(50) NOT NULL CHECK (trading_session IN ('asian', 'european', 'us', 'any')),
    preferred_trading_hours VARCHAR(100),
    
    -- Asset Preferences (from questionnaire)
    crypto_assets TEXT[] DEFAULT '{}', -- Array of selected crypto assets
    forex_assets TEXT[] DEFAULT '{}', -- Array of selected forex pairs
    custom_forex_pairs TEXT[] DEFAULT '{}', -- Custom forex pairs added by user
    stock_assets TEXT[] DEFAULT '{}',
    commodity_assets TEXT[] DEFAULT '{}',
    index_assets TEXT[] DEFAULT '{}',
    
    -- Account Information (from questionnaire)
    has_account VARCHAR(10) NOT NULL CHECK (has_account IN ('yes', 'no')),
    account_equity DECIMAL(12,2) CHECK (account_equity >= 0),
    prop_firm VARCHAR(100),
    account_type VARCHAR(50) CHECK (account_type IN ('demo', 'live', 'prop_firm', 'personal', 'Demo', 'Beginner', 'Standard', 'Pro', 'Experienced', 'Funded', 'Evaluation')),
    account_size DECIMAL(12,2) CHECK (account_size >= 0),
    account_number VARCHAR(100),
    account_currency VARCHAR(3) DEFAULT 'USD',
    broker_name VARCHAR(100),
    broker_platform VARCHAR(100),
    
    -- Risk Management (from questionnaire)
    risk_percentage DECIMAL(5,2) NOT NULL CHECK (risk_percentage >= 0 AND risk_percentage <= 100),
    risk_reward_ratio VARCHAR(20) NOT NULL CHECK (risk_reward_ratio IN ('1', '2', '3', '4', '5', 'custom')),
    custom_risk_reward_ratio DECIMAL(5,2),
    max_daily_loss_percentage DECIMAL(5,2) CHECK (max_daily_loss_percentage >= 0 AND max_daily_loss_percentage <= 100),
    max_weekly_loss_percentage DECIMAL(5,2) CHECK (max_weekly_loss_percentage >= 0 AND max_weekly_loss_percentage <= 100),
    max_monthly_loss_percentage DECIMAL(5,2) CHECK (max_monthly_loss_percentage >= 0 AND max_monthly_loss_percentage <= 100),
    
    -- Trading Experience and Goals
    trading_experience VARCHAR(50) CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'expert')),
    trading_goals TEXT,
    trading_style VARCHAR(50) CHECK (trading_style IN ('scalping', 'day_trading', 'swing_trading', 'position_trading')),
    preferred_markets TEXT[],
    
    -- Risk Tolerance Assessment
    risk_tolerance VARCHAR(20) CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive', 'very_aggressive')),
    volatility_tolerance VARCHAR(20) CHECK (volatility_tolerance IN ('low', 'medium', 'high')),
    drawdown_tolerance DECIMAL(5,2) CHECK (drawdown_tolerance >= 0 AND drawdown_tolerance <= 100),
    
    -- Trading Psychology
    emotional_control VARCHAR(20) CHECK (emotional_control IN ('excellent', 'good', 'fair', 'needs_improvement')),
    discipline_level VARCHAR(20) CHECK (discipline_level IN ('excellent', 'good', 'fair', 'needs_improvement')),
    stress_management VARCHAR(20) CHECK (stress_management IN ('excellent', 'good', 'fair', 'needs_improvement')),
    
    -- Screenshot Upload
    account_screenshot TEXT, -- Base64 encoded image or file path
    screenshot_filename VARCHAR(255),
    screenshot_size INTEGER CHECK (screenshot_size >= 0),
    screenshot_type VARCHAR(50),
    screenshot_upload_date TIMESTAMP WITH TIME ZONE,
    
    -- Additional Information
    additional_notes TEXT,
    marketing_consent BOOLEAN DEFAULT false,
    terms_accepted BOOLEAN DEFAULT false,
    privacy_policy_accepted BOOLEAN DEFAULT false,
    
    -- Questionnaire Completion
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    created_by VARCHAR(100) DEFAULT 'user',
    updated_by VARCHAR(100) DEFAULT 'user'
);

-- =====================================================
-- STEP 6: CREATE USER DASHBOARD DATA TABLE
-- =====================================================

CREATE TABLE user_dashboard_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    user_uuid UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    questionnaire_id UUID REFERENCES questionnaire_details(id) ON DELETE SET NULL,
    
    -- User Profile Data (from questionnaire)
    prop_firm VARCHAR(100),
    account_type VARCHAR(50),
    account_size DECIMAL(12,2),
    account_currency VARCHAR(3) DEFAULT 'USD',
    risk_per_trade DECIMAL(5,2),
    trading_experience VARCHAR(50),
    trading_style VARCHAR(50),
    unique_id VARCHAR(50),
    
    -- Current Account Status (EQUITY TRACKING - YOUR REQUEST)
    account_balance DECIMAL(12,2) DEFAULT 0,
    initial_equity DECIMAL(12,2) DEFAULT 0,
    current_equity DECIMAL(12,2) DEFAULT 0,
    available_balance DECIMAL(12,2) DEFAULT 0,
    margin_used DECIMAL(12,2) DEFAULT 0,
    margin_available DECIMAL(12,2) DEFAULT 0,
    
    -- Performance Metrics
    total_pnl DECIMAL(12,2) DEFAULT 0,
    daily_pnl DECIMAL(12,2) DEFAULT 0,
    weekly_pnl DECIMAL(12,2) DEFAULT 0,
    monthly_pnl DECIMAL(12,2) DEFAULT 0,
    yearly_pnl DECIMAL(12,2) DEFAULT 0,
    
    -- Trading Statistics (WINS AND LOSSES - YOUR REQUEST)
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    break_even_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    loss_rate DECIMAL(5,2) DEFAULT 0,
    average_win DECIMAL(12,2) DEFAULT 0,
    average_loss DECIMAL(12,2) DEFAULT 0,
    largest_win DECIMAL(12,2) DEFAULT 0,
    largest_loss DECIMAL(12,2) DEFAULT 0,
    profit_factor DECIMAL(8,2) DEFAULT 0,
    gross_profit DECIMAL(12,2) DEFAULT 0,
    gross_loss DECIMAL(12,2) DEFAULT 0,
    
    -- Signal Tracking (SIGNALS TAKEN, WINS, LOSSES - YOUR REQUEST)
    signals_taken JSONB DEFAULT '[]', -- Array of signal details with full information
    signals_won INTEGER DEFAULT 0,
    signals_lost INTEGER DEFAULT 0,
    signals_pending INTEGER DEFAULT 0,
    signals_win_rate DECIMAL(5,2) DEFAULT 0,
    signals_total_pnl DECIMAL(12,2) DEFAULT 0,
    signals_best_trade DECIMAL(12,2) DEFAULT 0,
    signals_worst_trade DECIMAL(12,2) DEFAULT 0,
    last_signal_taken JSONB,
    last_signal_date TIMESTAMP WITH TIME ZONE,
    
    -- Milestone Signal Performance (DETAILED BREAKDOWN)
    m1_signals_taken INTEGER DEFAULT 0,
    m1_signals_won INTEGER DEFAULT 0,
    m1_signals_lost INTEGER DEFAULT 0,
    m1_win_rate DECIMAL(5,2) DEFAULT 0,
    m1_total_pnl DECIMAL(12,2) DEFAULT 0,
    
    m2_signals_taken INTEGER DEFAULT 0,
    m2_signals_won INTEGER DEFAULT 0,
    m2_signals_lost INTEGER DEFAULT 0,
    m2_win_rate DECIMAL(5,2) DEFAULT 0,
    m2_total_pnl DECIMAL(12,2) DEFAULT 0,
    
    m3_signals_taken INTEGER DEFAULT 0,
    m3_signals_won INTEGER DEFAULT 0,
    m3_signals_lost INTEGER DEFAULT 0,
    m3_win_rate DECIMAL(5,2) DEFAULT 0,
    m3_total_pnl DECIMAL(12,2) DEFAULT 0,
    
    m4_signals_taken INTEGER DEFAULT 0,
    m4_signals_won INTEGER DEFAULT 0,
    m4_signals_lost INTEGER DEFAULT 0,
    m4_win_rate DECIMAL(5,2) DEFAULT 0,
    m4_total_pnl DECIMAL(12,2) DEFAULT 0,
    
    -- Dashboard Settings
    selected_theme VARCHAR(50) DEFAULT 'concept1',
    notifications_enabled BOOLEAN DEFAULT true,
    auto_refresh BOOLEAN DEFAULT true,
    refresh_interval INTEGER DEFAULT 5000,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferred_view_mode VARCHAR(20) DEFAULT 'milestone',
    milestone_access_level INTEGER DEFAULT 1 CHECK (milestone_access_level >= 1 AND milestone_access_level <= 4),
    
    -- Real-time Data
    real_time_data JSONB DEFAULT '{}',
    last_signal JSONB,
    market_status VARCHAR(20) DEFAULT 'closed',
    connection_status VARCHAR(20) DEFAULT 'online',
    
    -- Trading Data
    open_positions JSONB DEFAULT '[]',
    trade_history JSONB DEFAULT '[]',
    signals JSONB DEFAULT '[]',
    watchlist JSONB DEFAULT '[]',
    
    -- User Preferences
    dashboard_layout JSONB DEFAULT '{}',
    widget_settings JSONB DEFAULT '{}',
    chart_preferences JSONB DEFAULT '{}',
    
    -- Tab-specific Data
    overview_stats JSONB DEFAULT '{}',
    performance_summary JSONB DEFAULT '{}',
    account_summary JSONB DEFAULT '{}',
    risk_metrics JSONB DEFAULT '{}',
    risk_alerts JSONB DEFAULT '[]',
    risk_violations JSONB DEFAULT '[]',
    prop_firm_rules JSONB DEFAULT '{}',
    rule_violations JSONB DEFAULT '[]',
    compliance_status VARCHAR(20) DEFAULT 'compliant',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_trade_date TIMESTAMP WITH TIME ZONE,
    last_equity_update TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    created_by VARCHAR(100) DEFAULT 'system',
    updated_by VARCHAR(100) DEFAULT 'system'
);

-- =====================================================
-- STEP 7: CREATE SIGNAL TRACKING TABLE
-- =====================================================

CREATE TABLE signal_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_uuid UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    
    -- Signal Information
    signal_id VARCHAR(100) NOT NULL,
    signal_type VARCHAR(20) NOT NULL, -- M1, M2, M3, M4
    signal_source VARCHAR(50) DEFAULT 'traderedgepro',
    
    -- Trade Details
    symbol VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('BUY', 'SELL', 'LONG', 'SHORT')),
    entry_price DECIMAL(12,6),
    stop_loss DECIMAL(12,6),
    take_profit DECIMAL(12,6),
    lot_size DECIMAL(8,4),
    
    -- Execution Details
    signal_time TIMESTAMP WITH TIME ZONE NOT NULL,
    taken_time TIMESTAMP WITH TIME ZONE,
    exit_time TIMESTAMP WITH TIME ZONE,
    exit_price DECIMAL(12,6),
    
    -- Performance
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'won', 'lost', 'break_even', 'cancelled')),
    pnl DECIMAL(12,2) DEFAULT 0,
    pnl_percentage DECIMAL(5,2) DEFAULT 0,
    risk_amount DECIMAL(12,2),
    reward_amount DECIMAL(12,2),
    actual_risk_reward DECIMAL(5,2),
    
    -- Additional Data
    confidence_score DECIMAL(5,2),
    secondary_confirmations JSONB DEFAULT '{}',
    market_conditions JSONB DEFAULT '{}',
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- STEP 8: CREATE USER SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payment_details(id) ON DELETE SET NULL,
    
    -- Subscription Details
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('kickstarter', 'starter', 'pro', 'enterprise')),
    plan_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'quarterly', 'lifetime')),
    
    -- Payment Information
    payment_method VARCHAR(50),
    payment_id_external VARCHAR(255), -- External payment system ID
    
    -- Subscription Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired', 'pending')),
    
    -- Dates
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- STEP 9: CREATE USER DASHBOARD SETTINGS TABLE
-- =====================================================

CREATE TABLE user_dashboard_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Display Settings
    current_equity DECIMAL(12,2) DEFAULT 0,
    display_currency VARCHAR(3) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    theme VARCHAR(20) DEFAULT 'concept1',
    language VARCHAR(10) DEFAULT 'en',
    
    -- Access and Permissions
    milestone_access_level INTEGER DEFAULT 1 CHECK (milestone_access_level >= 1 AND milestone_access_level <= 4),
    preferred_view_mode VARCHAR(20) DEFAULT 'milestone',
    
    -- Notification Settings
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    signal_notifications BOOLEAN DEFAULT true,
    trade_notifications BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- STEP 10: CREATE ALL INDEXES
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_plan_type ON users(plan_type);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Payment details indexes
CREATE INDEX idx_payment_details_user_id ON payment_details(user_id);
CREATE INDEX idx_payment_details_user_email ON payment_details(user_email);
CREATE INDEX idx_payment_details_transaction_id ON payment_details(transaction_id);
CREATE INDEX idx_payment_details_payment_status ON payment_details(payment_status);
CREATE INDEX idx_payment_details_payment_method ON payment_details(payment_method);
CREATE INDEX idx_payment_details_created_at ON payment_details(created_at);

-- Questionnaire details indexes
CREATE INDEX idx_questionnaire_details_user_id ON questionnaire_details(user_id);
CREATE INDEX idx_questionnaire_details_user_email ON questionnaire_details(user_email);
CREATE INDEX idx_questionnaire_details_has_account ON questionnaire_details(has_account);
CREATE INDEX idx_questionnaire_details_prop_firm ON questionnaire_details(prop_firm);
CREATE INDEX idx_questionnaire_details_account_type ON questionnaire_details(account_type);
CREATE INDEX idx_questionnaire_details_created_at ON questionnaire_details(created_at);

-- User dashboard data indexes
CREATE INDEX idx_user_dashboard_data_user_id ON user_dashboard_data(user_id);
CREATE INDEX idx_user_dashboard_data_questionnaire_id ON user_dashboard_data(questionnaire_id);
CREATE INDEX idx_user_dashboard_data_prop_firm ON user_dashboard_data(prop_firm);
CREATE INDEX idx_user_dashboard_data_account_type ON user_dashboard_data(account_type);
CREATE INDEX idx_user_dashboard_data_created_at ON user_dashboard_data(created_at);

-- Signal tracking indexes
CREATE INDEX idx_signal_tracking_user_id ON signal_tracking(user_id);
CREATE INDEX idx_signal_tracking_signal_type ON signal_tracking(signal_type);
CREATE INDEX idx_signal_tracking_status ON signal_tracking(status);
CREATE INDEX idx_signal_tracking_symbol ON signal_tracking(symbol);
CREATE INDEX idx_signal_tracking_signal_time ON signal_tracking(signal_time);

-- User subscriptions indexes
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_plan_type ON user_subscriptions(plan_type);

-- User dashboard settings indexes
CREATE INDEX idx_user_dashboard_settings_user_id ON user_dashboard_settings(user_id);

-- =====================================================
-- STEP 11: CREATE TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    IF TG_TABLE_NAME = 'user_dashboard_data' THEN
        NEW.last_updated = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_details_updated_at 
    BEFORE UPDATE ON payment_details 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questionnaire_details_updated_at 
    BEFORE UPDATE ON questionnaire_details 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_dashboard_data_updated_at 
    BEFORE UPDATE ON user_dashboard_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_signal_tracking_updated_at 
    BEFORE UPDATE ON signal_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_dashboard_settings_updated_at 
    BEFORE UPDATE ON user_dashboard_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 12: CREATE VIEWS
-- =====================================================

-- View for complete user profile with all related data
CREATE OR REPLACE VIEW user_complete_profile AS
SELECT 
    u.id,
    u.uuid,
    u.email,
    u.first_name,
    u.last_name,
    u.full_name,
    u.phone,
    u.company,
    u.country,
    u.plan_type,
    u.membership_tier,
    u.status,
    u.created_at as user_created_at,
    
    -- Payment Information
    pd.plan_name,
    pd.payment_status,
    pd.final_price,
    pd.payment_method,
    
    -- Questionnaire Information
    qd.trading_experience,
    qd.trading_style,
    qd.prop_firm,
    qd.account_size,
    qd.risk_percentage,
    qd.account_type,
    
    -- Dashboard Data
    udd.account_balance,
    udd.current_equity,
    udd.total_pnl,
    udd.win_rate,
    udd.total_trades,
    udd.signals_taken,
    udd.signals_won,
    udd.signals_lost,
    udd.signals_win_rate,
    
    -- Subscription Information
    us.status as subscription_status,
    us.expires_at as subscription_expires
    
FROM users u
LEFT JOIN payment_details pd ON u.id = pd.user_id
LEFT JOIN questionnaire_details qd ON u.id = qd.user_id
LEFT JOIN user_dashboard_data udd ON u.id = udd.user_id
LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active';

-- View for dashboard overview data
CREATE OR REPLACE VIEW dashboard_overview AS
SELECT 
    udd.user_id,
    u.email,
    u.full_name,
    udd.prop_firm,
    udd.account_type,
    udd.account_balance,
    udd.current_equity,
    udd.total_pnl,
    udd.win_rate,
    udd.total_trades,
    udd.signals_taken,
    udd.signals_won,
    udd.signals_lost,
    udd.signals_win_rate,
    udd.max_drawdown,
    udd.current_drawdown,
    udd.consecutive_wins,
    udd.consecutive_losses,
    udd.milestone_access_level
FROM user_dashboard_data udd
JOIN users u ON udd.user_id = u.id;

-- =====================================================
-- STEP 13: SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 DATABASE MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '✅ All tables created with comprehensive data tracking';
    RAISE NOTICE '📊 Enhanced signup data: first_name, last_name, email, phone, company, country, agreements';
    RAISE NOTICE '💳 Payment tracking: all payment methods, crypto verification, billing details, coupons';
    RAISE NOTICE '📋 Questionnaire data: trading preferences, risk settings, prop firm, account details, assets';
    RAISE NOTICE '📈 Dashboard tracking: equity changes, signals taken, wins/losses, milestone performance';
    RAISE NOTICE '🎯 Signal performance: detailed tracking by milestone type with full statistics';
    RAISE NOTICE '🔗 All relationships, indexes, triggers, and views created';
    RAISE NOTICE '🚀 Database is ready for enhanced data collection!';
END $$;

-- =============================================
-- COMPREHENSIVE POSTGRESQL DATABASE SCHEMA
-- TraderEdge Pro Trading Platform
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USER MANAGEMENT TABLES
-- =============================================

-- Enhanced Users Table
CREATE TABLE IF NOT EXISTS enhanced_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(255),
    country VARCHAR(100),
    password_hash TEXT NOT NULL,
    selected_plan_name VARCHAR(100),
    selected_plan_price DECIMAL(10,2),
    selected_plan_period VARCHAR(50),
    selected_plan_description TEXT,
    agree_to_terms BOOLEAN DEFAULT FALSE,
    agree_to_marketing BOOLEAN DEFAULT FALSE,
    unique_id VARCHAR(50) UNIQUE,
    access_token TEXT,
    registration_method VARCHAR(50) DEFAULT 'api',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES enhanced_users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    bio TEXT,
    experience_level VARCHAR(50),
    trading_goals TEXT,
    risk_tolerance VARCHAR(20),
    preferred_markets TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PAYMENT AND SUBSCRIPTION TABLES
-- =============================================

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES enhanced_users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    plan_name_payment VARCHAR(100),
    original_price DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_price DECIMAL(10,2) NOT NULL,
    coupon_code VARCHAR(50),
    coupon_applied BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50),
    payment_provider VARCHAR(50),
    transaction_id VARCHAR(255) UNIQUE,
    payment_status VARCHAR(50) DEFAULT 'completed',
    crypto_currency VARCHAR(10),
    crypto_network VARCHAR(50),
    crypto_transaction_hash VARCHAR(255),
    crypto_from_address VARCHAR(255),
    crypto_to_address VARCHAR(255),
    crypto_amount DECIMAL(20,8),
    crypto_verification_status VARCHAR(50) DEFAULT 'pending',
    stripe_payment_intent_id VARCHAR(255),
    paypal_order_id VARCHAR(255),
    cryptomus_order_id VARCHAR(255),
    payment_completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    period VARCHAR(20) NOT NULL, -- 'monthly', 'yearly', etc.
    features JSONB,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES enhanced_users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    stripe_subscription_id VARCHAR(255),
    paypal_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- QUESTIONNAIRE AND ONBOARDING TABLES
-- =============================================

-- Questionnaire Responses Table
CREATE TABLE IF NOT EXISTS questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES enhanced_users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    trades_per_day VARCHAR(20) NOT NULL DEFAULT '1-2',
    trading_session VARCHAR(50) NOT NULL DEFAULT 'any',
    crypto_assets TEXT[],
    forex_assets TEXT[],
    custom_forex_pairs TEXT[],
    has_account BOOLEAN DEFAULT FALSE,
    account_equity DECIMAL(15,2),
    prop_firm VARCHAR(100),
    account_type VARCHAR(50),
    account_size DECIMAL(15,2),
    account_number VARCHAR(100),
    risk_percentage DECIMAL(5,2) DEFAULT 1.0,
    risk_reward_ratio VARCHAR(10) DEFAULT '2',
    challenge_step VARCHAR(50),
    trading_experience VARCHAR(50),
    milestone_access_level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- DASHBOARD AND ANALYTICS TABLES
-- =============================================

-- User Dashboard Data Table
CREATE TABLE IF NOT EXISTS user_dashboard_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES enhanced_users(id) ON DELETE CASCADE,
    questionnaire_id UUID REFERENCES questionnaire_responses(id),
    prop_firm VARCHAR(100),
    account_type VARCHAR(50),
    account_size DECIMAL(15,2),
    current_equity DECIMAL(15,2),
    initial_balance DECIMAL(15,2),
    total_pnl DECIMAL(15,2) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    max_drawdown DECIMAL(15,2) DEFAULT 0,
    current_drawdown DECIMAL(15,2) DEFAULT 0,
    daily_pnl DECIMAL(15,2) DEFAULT 0,
    signals_won INTEGER DEFAULT 0,
    signals_lost INTEGER DEFAULT 0,
    milestone_access_level INTEGER DEFAULT 1,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trading Journal Table
CREATE TABLE IF NOT EXISTS trading_journal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES enhanced_users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL, -- 'buy', 'sell'
    entry_price DECIMAL(15,5),
    exit_price DECIMAL(15,5),
    quantity DECIMAL(15,5),
    pnl DECIMAL(15,2),
    pnl_percentage DECIMAL(8,2),
    commission DECIMAL(10,2),
    notes TEXT,
    tags TEXT[],
    strategy VARCHAR(100),
    timeframe VARCHAR(20),
    screenshot_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SIGNAL SYSTEM TABLES
-- =============================================

-- Trading Signals Table
CREATE TABLE IF NOT EXISTS trading_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    signal_type VARCHAR(20) NOT NULL, -- 'buy', 'sell'
    entry_price DECIMAL(15,5),
    stop_loss DECIMAL(15,5),
    take_profit DECIMAL(15,5),
    confidence_score DECIMAL(3,2),
    timeframe VARCHAR(20),
    strategy VARCHAR(100),
    technical_indicators JSONB,
    market_condition VARCHAR(50),
    risk_reward_ratio DECIMAL(4,2),
    milestone_level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    signal_strength VARCHAR(20), -- 'weak', 'moderate', 'strong'
    created_by VARCHAR(100), -- 'system', 'admin', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE
);

-- Signal Tracking Table
CREATE TABLE IF NOT EXISTS signal_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES enhanced_users(id) ON DELETE CASCADE,
    dashboard_data_id UUID REFERENCES user_dashboard_data(id),
    signal_id UUID REFERENCES trading_signals(id),
    signal_symbol VARCHAR(20),
    signal_type VARCHAR(20),
    signal_price DECIMAL(15,5),
    signal_milestone INTEGER,
    confidence_score DECIMAL(3,2),
    taken_by_user BOOLEAN DEFAULT TRUE,
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    outcome VARCHAR(20), -- 'win', 'loss', 'breakeven', 'pending'
    pnl DECIMAL(15,2),
    risk_amount DECIMAL(10,2),
    notes TEXT
);

-- =============================================
-- PROP FIRM AND TRADING TABLES
-- =============================================

-- Prop Firms Table
CREATE TABLE IF NOT EXISTS prop_firms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150),
    website VARCHAR(255),
    description TEXT,
    minimum_deposit DECIMAL(10,2),
    max_leverage VARCHAR(20),
    trading_platforms TEXT[],
    supported_assets TEXT[],
    challenge_types TEXT[],
    payout_percentage DECIMAL(5,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prop Firm Rules Table
CREATE TABLE IF NOT EXISTS prop_firm_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prop_firm_id UUID REFERENCES prop_firms(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL, -- 'challenge', 'evaluation', 'funded'
    phase VARCHAR(50), -- 'phase1', 'phase2', 'funded'
    max_daily_loss DECIMAL(8,2),
    max_total_loss DECIMAL(8,2),
    min_trading_days INTEGER,
    profit_target DECIMAL(8,2),
    minimum_trading_time TIME,
    allowed_trading_hours JSONB,
    restricted_dates DATE[],
    news_trading_allowed BOOLEAN DEFAULT FALSE,
    weekend_trading_allowed BOOLEAN DEFAULT FALSE,
    crypto_trading_allowed BOOLEAN DEFAULT TRUE,
    commodities_trading_allowed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CUSTOMER SERVICE TABLES
-- =============================================

-- Customer Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES enhanced_users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(30) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    category VARCHAR(50),
    assigned_to VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Ticket Messages
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- 'user', 'agent'
    sender_id VARCHAR(100),
    sender_name VARCHAR(150),
    message TEXT NOT NULL,
    attachments JSONB,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Activity Log
CREATE TABLE IF NOT EXISTS customer_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES enhanced_users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ANALYTICS AND REPORTING TABLES
-- =============================================

-- User Analytics Table
CREATE TABLE IF NOT EXISTS user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES enhanced_users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    login_count INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    signals_viewed INTEGER DEFAULT 0,
    signals_taken INTEGER DEFAULT 0,
    trades_executed INTEGER DEFAULT 0,
    total_pnl DECIMAL(15,2) DEFAULT 0,
    session_duration INTERVAL,
    last_activity TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System Analytics Table
CREATE TABLE IF NOT EXISTS system_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    new_registrations INTEGER DEFAULT 0,
    total_signals INTEGER DEFAULT 0,
    signals_taken INTEGER DEFAULT 0,
    total_payments DECIMAL(15,2) DEFAULT 0,
    successful_payments INTEGER DEFAULT 0,
    failed_payments INTEGER DEFAULT 0,
    support_tickets INTEGER DEFAULT 0,
    resolved_tickets INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_users_email ON enhanced_users(email);
CREATE INDEX IF NOT EXISTS idx_enhanced_users_status ON enhanced_users(status);
CREATE INDEX IF NOT EXISTS idx_enhanced_users_created_at ON enhanced_users(created_at);

-- Payment-related indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);

-- Signal-related indexes
CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol ON trading_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_signals_active ON trading_signals(is_active);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created_at ON trading_signals(created_at);

-- Dashboard-related indexes
CREATE INDEX IF NOT EXISTS idx_user_dashboard_data_user_id ON user_dashboard_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_data_milestone ON user_dashboard_data(milestone_access_level);

-- =============================================
-- VIEWS FOR EASY DATA ACCESS
-- =============================================

-- User Complete Profile View
CREATE OR REPLACE VIEW user_complete_profile AS
SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.company,
    u.country,
    u.selected_plan_name,
    u.selected_plan_price,
    u.selected_plan_period,
    u.status,
    u.created_at as signup_date,
    p.avatar_url,
    p.bio,
    p.experience_level,
    p.trading_goals,
    p.risk_tolerance,
    p.preferred_markets,
    q.prop_firm,
    q.account_type,
    q.account_size,
    q.milestone_access_level,
    d.current_equity,
    d.total_pnl,
    d.win_rate,
    d.total_trades,
    d.signals_won,
    d.signals_lost
FROM enhanced_users u
LEFT JOIN user_profiles p ON u.id = p.user_id
LEFT JOIN questionnaire_responses q ON u.id = q.user_id
LEFT JOIN user_dashboard_data d ON u.id = d.user_id;

-- Dashboard Overview View
CREATE OR REPLACE VIEW dashboard_overview AS
SELECT
    d.user_id,
    d.prop_firm,
    d.account_type,
    d.account_size,
    d.current_equity,
    d.initial_balance,
    d.total_pnl,
    d.total_trades,
    d.winning_trades,
    d.losing_trades,
    CASE
        WHEN d.total_trades > 0 THEN ROUND((d.winning_trades::DECIMAL / d.total_trades::DECIMAL) * 100, 2)
        ELSE 0
    END as win_rate,
    d.max_drawdown,
    d.daily_pnl,
    d.milestone_access_level,
    d.last_active
FROM user_dashboard_data d;

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
DROP TRIGGER IF EXISTS update_enhanced_users_updated_at ON enhanced_users;
CREATE TRIGGER update_enhanced_users_updated_at
    BEFORE UPDATE ON enhanced_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_dashboard_data_updated_at ON user_dashboard_data;
CREATE TRIGGER update_user_dashboard_data_updated_at
    BEFORE UPDATE ON user_dashboard_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INITIAL DATA SEEDING
-- =============================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, display_name, description, price, period, features, is_popular) VALUES
('starter', 'Starter Plan', 'Perfect for beginners', 49.99, 'monthly',
 '["Basic signals", "Limited journal entries", "Basic analytics"]'::jsonb, FALSE),
('pro', 'Pro Plan', 'For serious traders', 99.99, 'monthly',
 '["All signals", "Unlimited journal", "Advanced analytics", "Risk management"]'::jsonb, TRUE),
('enterprise', 'Enterprise Plan', 'For trading firms', 199.99, 'monthly',
 '["Everything in Pro", "Custom signals", "API access", "White-label solution"]'::jsonb, FALSE)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- GRANT PERMISSIONS (if needed)
-- =============================================

-- Grant permissions for the application user
-- GRANT USAGE ON SCHEMA public TO pghero_dpg_d37pd8nfte5s73bfl1ug_a_y6fl_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pghero_dpg_d37pd8nfte5s73bfl1ug_a_y6fl_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pghero_dpg_d37pd8nfte5s73bfl1ug_a_y6fl_user;

-- =============================================
-- FINAL NOTES
-- =============================================
-- This schema provides a complete PostgreSQL database structure
-- for the TraderEdge Pro trading platform with comprehensive
-- user management, payment processing, signal systems, and analytics.

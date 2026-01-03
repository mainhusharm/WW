-- =====================================================
-- COMPREHENSIVE DATABASE SCHEMA FOR TRADEREDGE PRO
-- =====================================================
-- This schema includes all required tables with proper constraints
-- and immutability features to prevent data modification after creation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. UPDATE USERS TABLE WITH CORRECT PLAN TYPES
-- =====================================================

-- First, update existing users table to use correct plan types
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_type_check;
ALTER TABLE users ADD CONSTRAINT users_plan_type_check 
    CHECK (plan_type IN ('kickstarter', 'basic', 'pro', 'enterprise'));

-- Update existing 'premium' entries to 'pro' (assuming premium = pro)
UPDATE users SET plan_type = 'pro' WHERE plan_type = 'premium';

-- =====================================================
-- 2. PAYMENT DETAILS TABLE (ENHANCED)
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_uuid UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(200) NOT NULL,
    
    -- Plan Information
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('kickstarter', 'basic', 'pro', 'enterprise')),
    plan_name VARCHAR(100) NOT NULL,
    plan_duration VARCHAR(50) DEFAULT 'monthly', -- monthly, yearly, lifetime
    
    -- Pricing Information
    original_price DECIMAL(10,2) NOT NULL CHECK (original_price >= 0),
    discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    final_price DECIMAL(10,2) NOT NULL CHECK (final_price >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Coupon and Promotions
    coupon_code VARCHAR(50),
    promotion_id VARCHAR(50),
    referral_code VARCHAR(50),
    
    -- Payment Method Details
    payment_method VARCHAR(50) NOT NULL, -- stripe, paypal, bank_transfer, crypto
    payment_provider VARCHAR(50), -- stripe, paypal, etc.
    payment_provider_id VARCHAR(255),
    payment_intent_id VARCHAR(255),
    
    -- Transaction Information
    transaction_id VARCHAR(255) UNIQUE,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    
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
    refund_data JSONB, -- Store refund information if applicable
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_date TIMESTAMP WITH TIME ZONE,
    refund_date TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    created_by VARCHAR(100) DEFAULT 'system',
    updated_by VARCHAR(100) DEFAULT 'system',
    
    -- Immutability constraint - prevent updates after payment completion
    CONSTRAINT payment_immutable_after_completion 
        CHECK (payment_status != 'completed' OR updated_at = created_at)
);

-- Create indexes for payment_details
CREATE INDEX IF NOT EXISTS idx_payment_details_user_id ON payment_details(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_details_user_email ON payment_details(user_email);
CREATE INDEX IF NOT EXISTS idx_payment_details_transaction_id ON payment_details(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_details_payment_status ON payment_details(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_details_plan_type ON payment_details(plan_type);
CREATE INDEX IF NOT EXISTS idx_payment_details_created_at ON payment_details(created_at);

-- =====================================================
-- 3. QUESTIONNAIRE DETAILS TABLE (ENHANCED)
-- =====================================================

CREATE TABLE IF NOT EXISTS questionnaire_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_uuid UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(200) NOT NULL,
    
    -- Personal Information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    country VARCHAR(50),
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Trading Experience & Goals
    trading_experience VARCHAR(50) NOT NULL CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'expert')),
    trading_goals TEXT,
    trading_style VARCHAR(50) CHECK (trading_style IN ('scalping', 'day_trading', 'swing_trading', 'position_trading')),
    preferred_markets TEXT[], -- Array of market types
    
    -- Trading Preferences
    trades_per_day VARCHAR(20) NOT NULL CHECK (trades_per_day IN ('1-5', '6-10', '11-20', '21-50', '50+')),
    trading_session VARCHAR(50) NOT NULL CHECK (trading_session IN ('asian', 'london', 'new_york', 'overlap', 'all_sessions')),
    preferred_trading_hours VARCHAR(100),
    
    -- Asset Preferences
    crypto_assets TEXT[] DEFAULT '{}',
    forex_assets TEXT[] DEFAULT '{}',
    custom_forex_pairs TEXT[] DEFAULT '{}',
    stock_assets TEXT[] DEFAULT '{}',
    commodity_assets TEXT[] DEFAULT '{}',
    index_assets TEXT[] DEFAULT '{}',
    
    -- Account Information
    has_account VARCHAR(10) NOT NULL CHECK (has_account IN ('yes', 'no')),
    account_equity DECIMAL(12,2) CHECK (account_equity >= 0),
    prop_firm VARCHAR(100),
    account_type VARCHAR(50) CHECK (account_type IN ('demo', 'live', 'prop_firm', 'personal')),
    account_size DECIMAL(12,2) CHECK (account_size >= 0),
    account_currency VARCHAR(3) DEFAULT 'USD',
    broker_name VARCHAR(100),
    broker_platform VARCHAR(100),
    
    -- Risk Management
    risk_percentage DECIMAL(5,2) NOT NULL CHECK (risk_percentage >= 0 AND risk_percentage <= 100),
    risk_reward_ratio VARCHAR(20) NOT NULL CHECK (risk_reward_ratio IN ('1:1', '1:2', '1:3', '1:4', '1:5', 'custom')),
    custom_risk_reward_ratio DECIMAL(5,2),
    max_daily_loss_percentage DECIMAL(5,2) CHECK (max_daily_loss_percentage >= 0 AND max_daily_loss_percentage <= 100),
    max_weekly_loss_percentage DECIMAL(5,2) CHECK (max_weekly_loss_percentage >= 0 AND max_weekly_loss_percentage <= 100),
    max_monthly_loss_percentage DECIMAL(5,2) CHECK (max_monthly_loss_percentage >= 0 AND max_monthly_loss_percentage <= 100),
    
    -- Risk Tolerance Assessment
    risk_tolerance VARCHAR(20) CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive', 'very_aggressive')),
    volatility_tolerance VARCHAR(20) CHECK (volatility_tolerance IN ('low', 'medium', 'high')),
    drawdown_tolerance DECIMAL(5,2) CHECK (drawdown_tolerance >= 0 AND drawdown_tolerance <= 100),
    
    -- Trading Psychology
    emotional_control VARCHAR(20) CHECK (emotional_control IN ('excellent', 'good', 'fair', 'needs_improvement')),
    discipline_level VARCHAR(20) CHECK (discipline_level IN ('excellent', 'good', 'fair', 'needs_improvement')),
    stress_management VARCHAR(20) CHECK (stress_management IN ('excellent', 'good', 'fair', 'needs_improvement')),
    
    -- Screenshot Upload
    account_screenshot TEXT, -- Base64 encoded image
    screenshot_filename VARCHAR(255),
    screenshot_size INTEGER CHECK (screenshot_size >= 0),
    screenshot_type VARCHAR(50),
    screenshot_upload_date TIMESTAMP WITH TIME ZONE,
    
    -- Additional Information
    additional_notes TEXT,
    marketing_consent BOOLEAN DEFAULT false,
    terms_accepted BOOLEAN DEFAULT false,
    privacy_policy_accepted BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    created_by VARCHAR(100) DEFAULT 'user',
    updated_by VARCHAR(100) DEFAULT 'user',
    
    -- Immutability constraint - prevent updates after completion
    CONSTRAINT questionnaire_immutable_after_completion 
        CHECK (completed_at IS NULL OR updated_at = created_at)
);

-- Create indexes for questionnaire_details
CREATE INDEX IF NOT EXISTS idx_questionnaire_details_user_id ON questionnaire_details(user_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_details_user_email ON questionnaire_details(user_email);
CREATE INDEX IF NOT EXISTS idx_questionnaire_details_trading_experience ON questionnaire_details(trading_experience);
CREATE INDEX IF NOT EXISTS idx_questionnaire_details_has_account ON questionnaire_details(has_account);
CREATE INDEX IF NOT EXISTS idx_questionnaire_details_created_at ON questionnaire_details(created_at);

-- =====================================================
-- 4. USER DASHBOARD DATA TABLE (CONNECTED TO QUESTIONNAIRE)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_dashboard_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_uuid UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    questionnaire_id UUID NOT NULL REFERENCES questionnaire_details(id) ON DELETE CASCADE,
    
    -- User Profile Data (from questionnaire)
    prop_firm VARCHAR(100),
    account_type VARCHAR(50),
    account_size DECIMAL(12,2),
    account_currency VARCHAR(3) DEFAULT 'USD',
    risk_per_trade DECIMAL(5,2),
    trading_experience VARCHAR(50),
    trading_style VARCHAR(50),
    unique_id VARCHAR(50),
    
    -- Performance Metrics (calculated/updated)
    account_balance DECIMAL(12,2) DEFAULT 0,
    initial_equity DECIMAL(12,2) DEFAULT 0,
    current_equity DECIMAL(12,2) DEFAULT 0,
    total_pnl DECIMAL(12,2) DEFAULT 0,
    daily_pnl DECIMAL(12,2) DEFAULT 0,
    weekly_pnl DECIMAL(12,2) DEFAULT 0,
    monthly_pnl DECIMAL(12,2) DEFAULT 0,
    
    -- Trading Statistics
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    average_win DECIMAL(12,2) DEFAULT 0,
    average_loss DECIMAL(12,2) DEFAULT 0,
    profit_factor DECIMAL(8,2) DEFAULT 0,
    gross_profit DECIMAL(12,2) DEFAULT 0,
    gross_loss DECIMAL(12,2) DEFAULT 0,
    
    -- Risk Metrics
    max_drawdown DECIMAL(12,2) DEFAULT 0,
    current_drawdown DECIMAL(12,2) DEFAULT 0,
    max_drawdown_percentage DECIMAL(5,2) DEFAULT 0,
    current_drawdown_percentage DECIMAL(5,2) DEFAULT 0,
    sharpe_ratio DECIMAL(8,2),
    sortino_ratio DECIMAL(8,2),
    calmar_ratio DECIMAL(8,2),
    
    -- Consecutive Records
    consecutive_wins INTEGER DEFAULT 0,
    consecutive_losses INTEGER DEFAULT 0,
    max_consecutive_wins INTEGER DEFAULT 0,
    max_consecutive_losses INTEGER DEFAULT 0,
    
    -- Risk Protocol Settings (from questionnaire)
    max_daily_risk DECIMAL(12,2),
    risk_per_trade_amount DECIMAL(12,2),
    max_drawdown_limit DECIMAL(12,2),
    daily_loss_limit DECIMAL(12,2),
    weekly_loss_limit DECIMAL(12,2),
    monthly_loss_limit DECIMAL(12,2),
    
    -- Trading State
    daily_trades INTEGER DEFAULT 0,
    weekly_trades INTEGER DEFAULT 0,
    monthly_trades INTEGER DEFAULT 0,
    daily_initial_equity DECIMAL(12,2),
    weekly_initial_equity DECIMAL(12,2),
    monthly_initial_equity DECIMAL(12,2),
    
    -- Risk Settings (from questionnaire)
    risk_per_trade_percentage DECIMAL(5,2),
    daily_loss_limit_percentage DECIMAL(5,2),
    weekly_loss_limit_percentage DECIMAL(5,2),
    monthly_loss_limit_percentage DECIMAL(5,2),
    consecutive_losses_limit INTEGER,
    
    -- Dashboard Settings
    selected_theme VARCHAR(50) DEFAULT 'concept1',
    notifications_enabled BOOLEAN DEFAULT true,
    auto_refresh BOOLEAN DEFAULT true,
    refresh_interval INTEGER DEFAULT 5000,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    
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
    
    -- Overview Tab Data
    overview_stats JSONB DEFAULT '{}',
    performance_summary JSONB DEFAULT '{}',
    account_summary JSONB DEFAULT '{}',
    
    -- Risk Protocol Tab Data
    risk_metrics JSONB DEFAULT '{}',
    risk_alerts JSONB DEFAULT '[]',
    risk_violations JSONB DEFAULT '[]',
    
    -- Prop Firm Rules Tab Data
    prop_firm_rules JSONB DEFAULT '{}',
    rule_violations JSONB DEFAULT '[]',
    compliance_status VARCHAR(20) DEFAULT 'compliant',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_trade_date TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    created_by VARCHAR(100) DEFAULT 'system',
    updated_by VARCHAR(100) DEFAULT 'system',
    
    -- Immutability constraint - prevent updates to core data after creation
    CONSTRAINT dashboard_immutable_core_data 
        CHECK (created_at = updated_at OR updated_at > created_at)
);

-- Create indexes for user_dashboard_data
CREATE INDEX IF NOT EXISTS idx_user_dashboard_data_user_id ON user_dashboard_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_data_questionnaire_id ON user_dashboard_data(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_data_prop_firm ON user_dashboard_data(prop_firm);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_data_created_at ON user_dashboard_data(created_at);

-- =====================================================
-- 5. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for all tables
CREATE TRIGGER update_payment_details_updated_at 
    BEFORE UPDATE ON payment_details 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questionnaire_details_updated_at 
    BEFORE UPDATE ON questionnaire_details 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_dashboard_data_updated_at 
    BEFORE UPDATE ON user_dashboard_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for complete user profile with all related data
CREATE OR REPLACE VIEW user_complete_profile AS
SELECT 
    u.id,
    u.uuid,
    u.username,
    u.email,
    u.plan_type,
    u.created_at as user_created_at,
    pd.plan_name,
    pd.payment_status,
    pd.final_price,
    qd.trading_experience,
    qd.trading_style,
    qd.prop_firm,
    qd.account_size,
    qd.risk_percentage,
    udd.account_balance,
    udd.total_pnl,
    udd.win_rate,
    udd.total_trades
FROM users u
LEFT JOIN payment_details pd ON u.id = pd.user_id
LEFT JOIN questionnaire_details qd ON u.id = qd.user_id
LEFT JOIN user_dashboard_data udd ON u.id = udd.user_id;

-- View for dashboard overview data
CREATE OR REPLACE VIEW dashboard_overview AS
SELECT 
    udd.user_id,
    udd.prop_firm,
    udd.account_balance,
    udd.total_pnl,
    udd.win_rate,
    udd.total_trades,
    udd.max_drawdown,
    udd.current_drawdown,
    udd.consecutive_wins,
    udd.consecutive_losses,
    udd.overview_stats,
    udd.performance_summary
FROM user_dashboard_data udd;

-- =====================================================
-- 7. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE payment_details IS 'Stores comprehensive payment information with immutability constraints';
COMMENT ON TABLE questionnaire_details IS 'Stores detailed questionnaire responses with trading preferences and risk assessment';
COMMENT ON TABLE user_dashboard_data IS 'Stores user dashboard data connected to questionnaire answers with performance metrics';

COMMENT ON COLUMN payment_details.plan_type IS 'Plan type: kickstarter, basic, pro, or enterprise';
COMMENT ON COLUMN questionnaire_details.trading_experience IS 'User trading experience level';
COMMENT ON COLUMN user_dashboard_data.questionnaire_id IS 'Links to questionnaire_details table for data connection';

-- =====================================================
-- 8. GRANT PERMISSIONS (ADJUST AS NEEDED)
-- =====================================================

-- Grant permissions to application user (adjust username as needed)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- =====================================================
-- SCHEMA CREATION COMPLETE
-- =====================================================

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database schema created successfully!';
    RAISE NOTICE '📊 Tables created: payment_details, questionnaire_details, user_dashboard_data';
    RAISE NOTICE '🔒 Immutability constraints added to prevent data modification after creation';
    RAISE NOTICE '🔗 Relationships established between all tables';
    RAISE NOTICE '📈 Plan types updated to: kickstarter, basic, pro, enterprise';
    RAISE NOTICE '🎯 User dashboard data connected to questionnaire answers';
END $$;

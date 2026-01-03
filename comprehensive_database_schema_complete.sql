-- COMPREHENSIVE DATABASE SCHEMA FOR TRADEREDGEPRO
-- Captures ALL data from signup-enhanced, enhanced-payment, questionnaire, and dashboard
-- PostgreSQL Database: postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS signal_tracking CASCADE;
DROP TABLE IF EXISTS user_dashboard_data CASCADE;
DROP TABLE IF EXISTS questionnaire_responses CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS enhanced_users CASCADE;

-- =============================================
-- 1. ENHANCED USERS TABLE (Signup-Enhanced Data)
-- =============================================
CREATE TABLE enhanced_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic signup information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    country VARCHAR(100),
    
    -- Authentication
    password_hash VARCHAR(255) NOT NULL,
    
    -- Plan information
    selected_plan_name VARCHAR(100),
    selected_plan_price DECIMAL(10,2),
    selected_plan_period VARCHAR(50),
    selected_plan_description TEXT,
    
    -- Agreement tracking
    agree_to_terms BOOLEAN DEFAULT false,
    agree_to_marketing BOOLEAN DEFAULT false,
    
    -- Registration metadata
    registration_method VARCHAR(50) DEFAULT 'api', -- api, fallback
    registration_ip VARCHAR(45),
    user_agent TEXT,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
    email_verified BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Unique identifiers for dashboard
    unique_id VARCHAR(100) UNIQUE,
    access_token VARCHAR(255)
);

-- =============================================
-- 2. PAYMENT TRANSACTIONS TABLE (Enhanced-Payment Data)
-- =============================================
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User reference
    user_id UUID REFERENCES enhanced_users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    
    -- Plan information
    plan_name_payment VARCHAR(100) NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_price DECIMAL(10,2) NOT NULL,
    
    -- Coupon information
    coupon_code VARCHAR(50),
    coupon_applied BOOLEAN DEFAULT false,
    coupon_discount_percentage DECIMAL(5,2),
    
    -- Payment method details
    payment_method VARCHAR(50) NOT NULL, -- paypal, stripe, cryptomus, crypto, free_coupon
    payment_provider VARCHAR(100), -- PayPal, Stripe, Cryptomus, Cryptocurrency, Free
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
    
    -- Cryptocurrency specific fields
    crypto_currency VARCHAR(10), -- ETH, SOL, BTC, etc.
    crypto_network VARCHAR(50), -- Ethereum Mainnet, Solana Mainnet, etc.
    crypto_transaction_hash VARCHAR(255),
    crypto_from_address VARCHAR(255),
    crypto_to_address VARCHAR(255),
    crypto_amount VARCHAR(50),
    crypto_verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, failed
    crypto_screenshot_filename VARCHAR(255),
    
    -- Stripe specific fields
    stripe_payment_intent_id VARCHAR(255),
    stripe_client_secret VARCHAR(255),
    
    -- PayPal specific fields
    paypal_order_id VARCHAR(255),
    paypal_payer_id VARCHAR(255),
    
    -- Cryptomus specific fields
    cryptomus_order_id VARCHAR(255),
    cryptomus_payment_id VARCHAR(255),
    
    -- Processing metadata
    payment_processing_time INTEGER, -- in seconds
    payment_error_message TEXT,
    verification_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_completed_at TIMESTAMP WITH TIME ZONE,
    verification_completed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 3. QUESTIONNAIRE RESPONSES TABLE (Questionnaire Data)
-- =============================================
CREATE TABLE questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User reference
    user_id UUID REFERENCES enhanced_users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    
    -- Trading preferences
    trades_per_day VARCHAR(20) NOT NULL, -- 1-2, 3-5, 6-10, 10+
    trading_session VARCHAR(50) NOT NULL, -- asian, european, us, any
    
    -- Asset selections
    crypto_assets JSONB DEFAULT '[]', -- Array of selected crypto assets
    forex_assets JSONB DEFAULT '[]', -- Array of selected forex pairs
    custom_forex_pairs JSONB DEFAULT '[]', -- Custom added forex pairs
    
    -- Account information
    has_account VARCHAR(10) NOT NULL, -- yes, no
    account_equity DECIMAL(15,2), -- Current equity if has account
    
    -- Prop firm details
    prop_firm VARCHAR(255) NOT NULL,
    account_type VARCHAR(100) NOT NULL, -- Challenge, Funded, Demo, etc.
    account_size DECIMAL(15,2) NOT NULL,
    account_number VARCHAR(255) NOT NULL, -- Required field
    
    -- Risk management
    risk_percentage DECIMAL(5,2) NOT NULL, -- 0.5 to 2.5
    risk_reward_ratio VARCHAR(10) NOT NULL, -- 1, 2, 3, 4
    
    -- Challenge specific (if applicable)
    challenge_step INTEGER, -- 1, 2, 3 for challenge accounts
    
    -- Psychology and experience assessment
    trading_experience VARCHAR(50) DEFAULT 'intermediate',
    psychology_score INTEGER,
    
    -- Milestone access level (based on account type and experience)
    milestone_access_level INTEGER DEFAULT 1, -- 1-4 (M1-M4)
    
    -- Form completion metadata
    completion_time_seconds INTEGER,
    form_version VARCHAR(20) DEFAULT '1.0',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. USER DASHBOARD DATA TABLE (Dashboard Tracking)
-- =============================================
CREATE TABLE user_dashboard_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User references
    user_id UUID REFERENCES enhanced_users(id) ON DELETE CASCADE,
    user_uuid VARCHAR(255),
    questionnaire_id UUID REFERENCES questionnaire_responses(id),
    
    -- Profile information (from questionnaire)
    prop_firm VARCHAR(255),
    account_type VARCHAR(100),
    account_size DECIMAL(15,2),
    
    -- Current account status
    current_equity DECIMAL(15,2) DEFAULT 0,
    initial_balance DECIMAL(15,2),
    
    -- Performance metrics
    total_pnl DECIMAL(15,2) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
    
    -- Drawdown tracking
    max_drawdown DECIMAL(15,2) DEFAULT 0,
    current_drawdown DECIMAL(15,2) DEFAULT 0,
    daily_pnl DECIMAL(15,2) DEFAULT 0,
    
    -- Signal performance tracking
    signals_taken JSONB DEFAULT '[]', -- Array of signal IDs taken
    signals_won INTEGER DEFAULT 0,
    signals_lost INTEGER DEFAULT 0,
    signals_win_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Milestone-specific signal tracking
    m1_signals_taken INTEGER DEFAULT 0,
    m1_signals_won INTEGER DEFAULT 0,
    m1_signals_lost INTEGER DEFAULT 0,
    m1_win_rate DECIMAL(5,2) DEFAULT 0,
    
    m2_signals_taken INTEGER DEFAULT 0,
    m2_signals_won INTEGER DEFAULT 0,
    m2_signals_lost INTEGER DEFAULT 0,
    m2_win_rate DECIMAL(5,2) DEFAULT 0,
    
    m3_signals_taken INTEGER DEFAULT 0,
    m3_signals_won INTEGER DEFAULT 0,
    m3_signals_lost INTEGER DEFAULT 0,
    m3_win_rate DECIMAL(5,2) DEFAULT 0,
    
    m4_signals_taken INTEGER DEFAULT 0,
    m4_signals_won INTEGER DEFAULT 0,
    m4_signals_lost INTEGER DEFAULT 0,
    m4_win_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Access control
    milestone_access_level INTEGER DEFAULT 1, -- 1-4 based on account type
    
    -- Dashboard preferences
    preferred_timezone VARCHAR(100) DEFAULT 'UTC',
    dashboard_theme VARCHAR(50) DEFAULT 'dark',
    active_tab VARCHAR(50) DEFAULT 'overview',
    
    -- Activity tracking
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_login_time_minutes INTEGER DEFAULT 0,
    dashboard_views INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 5. SIGNAL TRACKING TABLE (Signal Performance)
-- =============================================
CREATE TABLE signal_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User reference
    user_id UUID REFERENCES enhanced_users(id) ON DELETE CASCADE,
    dashboard_data_id UUID REFERENCES user_dashboard_data(id),
    
    -- Signal information
    signal_id VARCHAR(255) NOT NULL,
    signal_symbol VARCHAR(20) NOT NULL,
    signal_type VARCHAR(50), -- BUY, SELL
    signal_price DECIMAL(10,5),
    signal_milestone VARCHAR(10), -- M1, M2, M3, M4
    
    -- Signal metadata
    confidence_score DECIMAL(5,2),
    secondary_confirmations JSONB DEFAULT '{}',
    signal_source VARCHAR(100),
    
    -- User action
    taken_by_user BOOLEAN DEFAULT false,
    taken_at TIMESTAMP WITH TIME ZONE,
    
    -- Trade outcome
    outcome VARCHAR(20), -- win, loss, pending
    pnl DECIMAL(15,2),
    close_price DECIMAL(10,5),
    close_time TIMESTAMP WITH TIME ZONE,
    
    -- Risk management
    risk_amount DECIMAL(15,2),
    reward_amount DECIMAL(15,2),
    actual_risk_reward_ratio DECIMAL(5,2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Enhanced Users indexes
CREATE INDEX idx_enhanced_users_email ON enhanced_users(email);
CREATE INDEX idx_enhanced_users_unique_id ON enhanced_users(unique_id);
CREATE INDEX idx_enhanced_users_status ON enhanced_users(status);
CREATE INDEX idx_enhanced_users_created_at ON enhanced_users(created_at);

-- Payment Transactions indexes
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_user_email ON payment_transactions(user_email);
CREATE INDEX idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);
CREATE INDEX idx_payment_transactions_payment_method ON payment_transactions(payment_method);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(payment_status);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at);

-- Questionnaire Responses indexes
CREATE INDEX idx_questionnaire_responses_user_id ON questionnaire_responses(user_id);
CREATE INDEX idx_questionnaire_responses_user_email ON questionnaire_responses(user_email);
CREATE INDEX idx_questionnaire_responses_prop_firm ON questionnaire_responses(prop_firm);
CREATE INDEX idx_questionnaire_responses_account_type ON questionnaire_responses(account_type);
CREATE INDEX idx_questionnaire_responses_created_at ON questionnaire_responses(created_at);

-- User Dashboard Data indexes
CREATE INDEX idx_user_dashboard_data_user_id ON user_dashboard_data(user_id);
CREATE INDEX idx_user_dashboard_data_questionnaire_id ON user_dashboard_data(questionnaire_id);
CREATE INDEX idx_user_dashboard_data_prop_firm ON user_dashboard_data(prop_firm);
CREATE INDEX idx_user_dashboard_data_last_active ON user_dashboard_data(last_active);
CREATE INDEX idx_user_dashboard_data_updated_at ON user_dashboard_data(updated_at);

-- Signal Tracking indexes
CREATE INDEX idx_signal_tracking_user_id ON signal_tracking(user_id);
CREATE INDEX idx_signal_tracking_signal_id ON signal_tracking(signal_id);
CREATE INDEX idx_signal_tracking_signal_milestone ON signal_tracking(signal_milestone);
CREATE INDEX idx_signal_tracking_outcome ON signal_tracking(outcome);
CREATE INDEX idx_signal_tracking_taken_by_user ON signal_tracking(taken_by_user);
CREATE INDEX idx_signal_tracking_created_at ON signal_tracking(created_at);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_enhanced_users_updated_at BEFORE UPDATE ON enhanced_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questionnaire_responses_updated_at BEFORE UPDATE ON questionnaire_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_dashboard_data_updated_at BEFORE UPDATE ON user_dashboard_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_signal_tracking_updated_at BEFORE UPDATE ON signal_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VIEWS FOR EASY DATA RETRIEVAL
-- =============================================

-- Complete user profile view
CREATE VIEW user_complete_profile AS
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
    u.status,
    u.created_at as signup_date,
    
    -- Payment information
    p.payment_method,
    p.final_price as paid_amount,
    p.payment_status,
    p.coupon_code,
    p.payment_completed_at,
    
    -- Questionnaire information
    q.prop_firm,
    q.account_type,
    q.account_size,
    q.account_number,
    q.trades_per_day,
    q.trading_session,
    q.risk_percentage,
    q.risk_reward_ratio,
    q.milestone_access_level,
    
    -- Dashboard performance
    d.current_equity,
    d.total_pnl,
    d.total_trades,
    d.win_rate,
    d.signals_taken,
    d.signals_won,
    d.signals_lost,
    d.last_active

FROM enhanced_users u
LEFT JOIN payment_transactions p ON u.id = p.user_id
LEFT JOIN questionnaire_responses q ON u.id = q.user_id  
LEFT JOIN user_dashboard_data d ON u.id = d.user_id;

-- Dashboard overview view
CREATE VIEW dashboard_overview AS
SELECT 
    d.user_id,
    u.first_name || ' ' || u.last_name as full_name,
    u.email,
    d.prop_firm,
    d.account_type,
    d.account_size,
    d.current_equity,
    d.total_pnl,
    d.total_trades,
    d.winning_trades,
    d.losing_trades,
    d.win_rate,
    d.max_drawdown,
    d.current_drawdown,
    
    -- Milestone performance summary
    (d.m1_signals_taken + d.m2_signals_taken + d.m3_signals_taken + d.m4_signals_taken) as total_signals_taken,
    (d.m1_signals_won + d.m2_signals_won + d.m3_signals_won + d.m4_signals_won) as total_signals_won,
    
    d.milestone_access_level,
    d.last_active,
    d.updated_at

FROM user_dashboard_data d
JOIN enhanced_users u ON d.user_id = u.id;

-- Signal performance by milestone view
CREATE VIEW signal_performance_by_milestone AS
SELECT 
    user_id,
    signal_milestone,
    COUNT(*) as total_signals,
    COUNT(CASE WHEN taken_by_user = true THEN 1 END) as signals_taken,
    COUNT(CASE WHEN outcome = 'win' THEN 1 END) as signals_won,
    COUNT(CASE WHEN outcome = 'loss' THEN 1 END) as signals_lost,
    ROUND(
        CASE 
            WHEN COUNT(CASE WHEN taken_by_user = true THEN 1 END) > 0 
            THEN (COUNT(CASE WHEN outcome = 'win' THEN 1 END)::decimal / COUNT(CASE WHEN taken_by_user = true THEN 1 END)) * 100 
            ELSE 0 
        END, 2
    ) as win_rate_percentage,
    SUM(CASE WHEN outcome = 'win' THEN pnl ELSE 0 END) as total_profit,
    SUM(CASE WHEN outcome = 'loss' THEN pnl ELSE 0 END) as total_loss,
    SUM(pnl) as net_pnl

FROM signal_tracking 
WHERE taken_by_user = true
GROUP BY user_id, signal_milestone
ORDER BY user_id, signal_milestone;

-- =============================================
-- SAMPLE DATA INSERTION (for testing)
-- =============================================

-- Insert sample user
INSERT INTO enhanced_users (
    first_name, last_name, email, phone, company, country,
    password_hash, selected_plan_name, selected_plan_price, selected_plan_period,
    agree_to_terms, agree_to_marketing, unique_id
) VALUES (
    'John', 'Doe', 'john.doe@example.com', '+1234567890', 'Trading Corp', 'US',
    'hashed_password_123', 'Elite Plan', 1299.00, 'month',
    true, true, 'USER_' || EXTRACT(EPOCH FROM NOW())::bigint
);

-- The schema is now complete and ready for use!
-- All tables are properly indexed and have relationships established
-- Views provide easy access to combined data across all forms
-- Triggers ensure automatic timestamp updates

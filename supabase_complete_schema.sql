-- =====================================================
-- COMPLETE SUPABASE DATABASE SCHEMA
-- For TraderEdge Pro Dual Database System
-- Primary Database: Supabase (this schema)
-- Backup Database: PostgreSQL
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE (Primary User Data)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    unique_id VARCHAR(6) UNIQUE NOT NULL,
    username VARCHAR(80) UNIQUE NOT NULL,
    first_name VARCHAR(80),
    last_name VARCHAR(80),
    phone VARCHAR(40),
    company VARCHAR(120),
    country VARCHAR(120),
    agree_to_marketing BOOLEAN DEFAULT FALSE,
    email VARCHAR(120) UNIQUE NOT NULL,
    normalized_email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(128),
    active_session_id VARCHAR(255) UNIQUE,
    plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('kickstarter', 'basic', 'pro', 'enterprise')),
    risk_tier VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    consent_accepted BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMP WITH TIME ZONE,
    account_screenshot_url TEXT,
    reset_token VARCHAR(100) UNIQUE,
    reset_token_expires TIMESTAMP WITH TIME ZONE,

    -- Dashboard data from questionnaire
    account_balance DECIMAL(12,2) DEFAULT 0,
    total_pnl DECIMAL(12,2) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,

    -- Updated timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid);
CREATE INDEX IF NOT EXISTS idx_users_unique_id ON users(unique_id);
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);

-- =====================================================
-- 2. USER PROGRESS TABLE (Questionnaire Data)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    progress_data TEXT,
    questionnaire_answers TEXT,
    trading_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- =====================================================
-- 3. RISK PLANS TABLE (Risk Management Data)
-- =====================================================

CREATE TABLE IF NOT EXISTS risk_plans (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE UNIQUE,

    -- User Profile from questionnaire
    initial_balance DECIMAL(12,2),
    account_equity DECIMAL(12,2),
    trades_per_day VARCHAR(20),
    trading_session VARCHAR(20),
    crypto_assets TEXT,
    forex_assets TEXT,
    has_account VARCHAR(10),
    experience VARCHAR(20),
    prop_firm VARCHAR(100),
    account_type VARCHAR(50),
    account_size DECIMAL(12,2),
    risk_percentage DECIMAL(5,2),

    -- Risk Parameters
    max_daily_risk DECIMAL(12,2),
    max_daily_risk_pct VARCHAR(10),
    base_trade_risk DECIMAL(12,2),
    base_trade_risk_pct VARCHAR(10),
    min_risk_reward VARCHAR(10),

    -- Trades data
    trades TEXT,

    -- Prop Firm Compliance
    prop_firm_compliance TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for risk_plans
CREATE INDEX IF NOT EXISTS idx_risk_plans_user_id ON risk_plans(user_id);

-- =====================================================
-- 4. PAYMENTS TABLE (Payment Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    payment_token VARCHAR(255),
    plan VARCHAR(50),
    amount_paid DECIMAL(10,2) DEFAULT 0,
    coupon_code VARCHAR(50),
    payment_method VARCHAR(50) DEFAULT 'stripe',
    status VARCHAR(20) DEFAULT 'pending',
    verified_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- =====================================================
-- 5. SIGNALS TABLE (Trading Signals)
-- =====================================================

CREATE TABLE IF NOT EXISTS signals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    signal_id VARCHAR(100) UNIQUE NOT NULL,
    pair VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    entry_price VARCHAR(20) NOT NULL,
    stop_loss VARCHAR(20) NOT NULL,
    take_profit TEXT NOT NULL,
    confidence INTEGER DEFAULT 90,
    analysis TEXT,
    ict_concepts TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active',
    created_by VARCHAR(50) DEFAULT 'admin',
    risk_tier VARCHAR(20) DEFAULT 'medium',
    payload JSONB DEFAULT '{}',
    immutable BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for signals
CREATE INDEX IF NOT EXISTS idx_signals_signal_id ON signals(signal_id);
CREATE INDEX IF NOT EXISTS idx_signals_pair ON signals(pair);
CREATE INDEX IF NOT EXISTS idx_signals_risk_tier ON signals(risk_tier);
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_timestamp ON signals(timestamp);

-- =====================================================
-- 6. USER SIGNALS TABLE (Signal Delivery Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_signals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL, -- References users.uuid
    signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,
    delivered BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint to prevent duplicate deliveries
    UNIQUE(user_id, signal_id)
);

-- Create indexes for user_signals
CREATE INDEX IF NOT EXISTS idx_user_signals_user_id ON user_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_signals_signal_id ON user_signals(signal_id);
CREATE INDEX IF NOT EXISTS idx_user_signals_delivered ON user_signals(delivered);

-- =====================================================
-- 7. TRADES TABLE (Trading Journal)
-- =====================================================

CREATE TABLE IF NOT EXISTS trades (
    id BIGSERIAL PRIMARY KEY,
    signal_id VARCHAR(100),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    account_id BIGINT, -- References accounts(id) when implemented
    date DATE NOT NULL,
    asset VARCHAR(50) NOT NULL,
    direction VARCHAR(4) NOT NULL, -- 'buy' or 'sell'
    entry_price DECIMAL(20,8) NOT NULL,
    exit_price DECIMAL(20,8) NOT NULL,
    sl DECIMAL(20,8),
    tp DECIMAL(20,8),
    lot_size DECIMAL(20,8) NOT NULL,
    trade_duration VARCHAR(50),
    notes TEXT,
    outcome VARCHAR(10) NOT NULL, -- 'win', 'loss', or 'skipped'
    status VARCHAR(10) DEFAULT 'active', -- 'active', 'taken', 'skipped'
    strategy_tag VARCHAR(100),
    screenshot_url TEXT,
    pnl DECIMAL(20,8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for trades
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(date);
CREATE INDEX IF NOT EXISTS idx_trades_asset ON trades(asset);
CREATE INDEX IF NOT EXISTS idx_trades_outcome ON trades(outcome);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);

-- =====================================================
-- 8. ACCOUNTS TABLE (Trading Accounts)
-- =====================================================

CREATE TABLE IF NOT EXISTS accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    prop_firm_id BIGINT, -- References prop_firms(id) when implemented
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for accounts
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- =====================================================
-- 9. AI COACH CHATS TABLE (AI Interactions)
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_coach_chats (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    message_type VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for ai_coach_chats
CREATE INDEX IF NOT EXISTS idx_ai_coach_chats_user_id ON ai_coach_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_chats_session_id ON ai_coach_chats(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_chats_created_at ON ai_coach_chats(created_at);

-- =====================================================
-- 10. PERFORMANCE TABLE (Trading Performance)
-- =====================================================

CREATE TABLE IF NOT EXISTS performance (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    account_id BIGINT REFERENCES accounts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    total_pnl DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, account_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_performance_user_id ON performance(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_date ON performance(date);

-- =====================================================
-- 11. MANUAL VERIFICATION TABLE (Payment Verification)
-- =====================================================

CREATE TABLE IF NOT EXISTS manual_verification (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    razorpay_payment_id VARCHAR(255) NOT NULL,
    razorpay_order_id VARCHAR(255) NOT NULL,
    razorpay_signature TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_admin_review',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    verification_type VARCHAR(50) DEFAULT 'razorpay_manual',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for manual_verification
CREATE INDEX IF NOT EXISTS idx_manual_verification_user_id ON manual_verification(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_verification_status ON manual_verification(status);
CREATE INDEX IF NOT EXISTS idx_manual_verification_created_at ON manual_verification(created_at);

-- =====================================================
-- 12. NOTIFICATIONS TABLE (System Notifications)
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- =====================================================
-- 13. USER ACTIVITIES TABLE (Audit Log)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_data TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for user_activities
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_timestamp ON user_activities(timestamp);

-- =====================================================
-- 14. PROP FIRMS TABLE (Prop Firm Data)
-- =====================================================

CREATE TABLE IF NOT EXISTS prop_firms (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    website TEXT,
    hft_allowed BOOLEAN,
    hft_min_hold_time INTEGER,
    hft_max_trades_per_day INTEGER,
    martingale_allowed BOOLEAN,
    martingale_max_positions INTEGER,
    max_lot_size DECIMAL(10,2),
    max_risk_per_trade DECIMAL(5,2),
    reverse_trading_allowed BOOLEAN,
    reverse_trading_cooldown INTEGER,
    daily_loss_limit DECIMAL(10,2),
    max_drawdown DECIMAL(10,2),
    profit_target_phase1 DECIMAL(10,2),
    profit_target_phase2 DECIMAL(10,2),
    min_trading_days INTEGER,
    consistency_rule DECIMAL(5,2),
    leverage_forex INTEGER,
    leverage_metals INTEGER,
    leverage_crypto INTEGER,
    news_trading VARCHAR(50),
    weekend_holding VARCHAR(50),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_scraped TIMESTAMP WITH TIME ZONE,
    scraping_status VARCHAR(50),
    scraping_error TEXT,
    rules_source_url TEXT,
    rules_last_verified TIMESTAMP WITH TIME ZONE
);

-- Create indexes for prop_firms
CREATE INDEX IF NOT EXISTS idx_prop_firms_name ON prop_firms(name);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables that have updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_plans_updated_at BEFORE UPDATE ON risk_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_signals_updated_at BEFORE UPDATE ON signals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_coach_chats_updated_at BEFORE UPDATE ON ai_coach_chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_updated_at BEFORE UPDATE ON performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_manual_verification_updated_at BEFORE UPDATE ON manual_verification FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
-- Users can only access their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = uuid::text);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = uuid::text);

CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (user_id IN (SELECT id FROM users WHERE uuid::text = auth.uid()::text));
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE uuid::text = auth.uid()::text));
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE uuid::text = auth.uid()::text));

-- Similar policies for other tables...

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- User complete profile view
CREATE OR REPLACE VIEW user_complete_profile AS
SELECT
    u.id,
    u.uuid,
    u.unique_id,
    u.username,
    u.first_name,
    u.last_name,
    u.phone,
    u.company,
    u.country,
    u.agree_to_marketing,
    u.email,
    u.normalized_email,
    u.password_hash,
    u.active_session_id,
    u.plan_type,
    u.risk_tier,
    u.created_at as user_created_at,
    u.last_login,
    u.consent_accepted,
    u.consent_timestamp,
    u.account_screenshot_url,
    u.reset_token,
    u.reset_token_expires,
    u.account_balance,
    u.total_pnl,
    u.win_rate,
    u.total_trades,
    u.updated_at as user_updated_at,
    up.questionnaire_answers,
    up.trading_data,
    rp.prop_firm,
    rp.account_type,
    rp.account_size,
    rp.account_equity,
    rp.risk_percentage,
    rp.has_account,
    rp.experience,
    rp.trading_session,
    rp.crypto_assets,
    rp.forex_assets,
    p.total_pnl as performance_total_pnl,
    p.win_rate as performance_win_rate,
    p.total_trades as performance_total_trades
FROM users u
LEFT JOIN user_progress up ON u.id = up.user_id
LEFT JOIN risk_plans rp ON u.id = rp.user_id
LEFT JOIN (
    SELECT user_id,
           SUM(total_pnl) as total_pnl,
           AVG(win_rate) as win_rate,
           SUM(total_trades) as total_trades
    FROM performance
    GROUP BY user_id
) p ON u.id = p.user_id;

-- Dashboard overview view
CREATE OR REPLACE VIEW dashboard_overview AS
SELECT
    u.id,
    u.uuid,
    u.email,
    u.plan_type,
    u.account_balance,
    u.total_pnl,
    u.win_rate,
    u.total_trades,
    rp.prop_firm,
    rp.account_type,
    rp.account_size,
    rp.account_equity
FROM users u
LEFT JOIN risk_plans rp ON u.id = rp.user_id;

-- =====================================================
-- INITIAL DATA (Optional)
-- =====================================================

-- Insert some sample data for testing (remove in production)
-- INSERT INTO users (unique_id, username, email, normalized_email, plan_type)
-- VALUES ('123456', 'testuser', 'test@example.com', 'test@example.com', 'pro');

-- =====================================================
-- SCHEMA CREATION COMPLETE
-- =====================================================

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✅ Supabase database schema created successfully!';
    RAISE NOTICE '📊 Tables created: users, user_progress, risk_plans, payments, signals, user_signals, trades, accounts, ai_coach_chats, performance, manual_verification, notifications, user_activities, prop_firms';
    RAISE NOTICE '🔐 Row Level Security enabled on all tables';
    RAISE NOTICE '🔗 Relationships and indexes established';
    RAISE NOTICE '🎯 Dual database system ready - Supabase (Primary) + PostgreSQL (Backup)';
END $$;

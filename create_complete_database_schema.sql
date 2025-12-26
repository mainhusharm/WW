-- Complete PostgreSQL Database Schema for TraderEdge Pro
-- Database: postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73f0878g-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2

-- =============================================
-- 1. USERS TABLE (Enhanced Signup Form Data)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(255),
    country VARCHAR(10),
    agree_to_terms BOOLEAN DEFAULT false,
    agree_to_marketing BOOLEAN DEFAULT false,
    plan_type VARCHAR(50) DEFAULT 'premium',
    plan_name VARCHAR(100),
    plan_price DECIMAL(10,2),
    plan_period VARCHAR(20),
    plan_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    registration_ip VARCHAR(45),
    user_agent TEXT
);

-- =============================================
-- 2. PAYMENTS TABLE (Enhanced Payment Page Data)
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    plan_name_payment VARCHAR(100) NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_price DECIMAL(10,2) NOT NULL,
    coupon_code VARCHAR(50),
    coupon_applied BOOLEAN DEFAULT false,
    payment_method VARCHAR(50) NOT NULL, -- 'paypal', 'stripe', 'crypto', 'cryptomus', 'free_coupon'
    payment_provider VARCHAR(50), -- 'PayPal', 'Stripe', 'Cryptocurrency', 'Cryptomus', 'Free'
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    crypto_transaction_hash VARCHAR(255),
    crypto_from_address VARCHAR(255),
    crypto_amount VARCHAR(50),
    crypto_verification_data JSONB,
    payment_processor VARCHAR(50),
    stripe_payment_intent_id VARCHAR(255),
    paypal_order_id VARCHAR(255),
    cryptomus_payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_amount DECIMAL(10,2),
    refund_reason TEXT
);

-- =============================================
-- 3. QUESTIONNAIRE TABLE (Questionnaire Page Data)
-- =============================================
CREATE TABLE IF NOT EXISTS questionnaire (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    trades_per_day VARCHAR(10) NOT NULL, -- '1-2', '3-5', '6-10', '10+'
    trading_session VARCHAR(20) NOT NULL, -- 'asian', 'european', 'us', 'any'
    crypto_assets TEXT[] DEFAULT '{}', -- Array of crypto symbols
    forex_assets TEXT[] DEFAULT '{}', -- Array of forex pairs
    custom_forex_pairs TEXT[] DEFAULT '{}', -- User-added forex pairs
    has_account VARCHAR(3) NOT NULL, -- 'yes' or 'no'
    account_equity DECIMAL(15,2), -- Current equity if has account
    prop_firm VARCHAR(255) NOT NULL,
    account_type VARCHAR(100) NOT NULL,
    account_size DECIMAL(15,2) NOT NULL,
    risk_percentage DECIMAL(4,2) NOT NULL, -- Risk per trade percentage
    risk_reward_ratio VARCHAR(10) NOT NULL, -- '1', '2', '3', '4'
    account_number VARCHAR(100) NOT NULL, -- Prop firm account number
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. USER_DASHBOARD TABLE (Dashboard Data - Based on Questionnaire)
-- =============================================
CREATE TABLE IF NOT EXISTS user_dashboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    
    -- User Profile Data (from questionnaire)
    prop_firm VARCHAR(255),
    account_type VARCHAR(100),
    account_size DECIMAL(15,2),
    risk_per_trade DECIMAL(4,2), -- Risk per trade percentage
    experience VARCHAR(50),
    unique_id VARCHAR(100),
    
    -- Performance Metrics
    account_balance DECIMAL(15,2),
    total_pnl DECIMAL(15,2) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    average_win DECIMAL(15,2) DEFAULT 0,
    average_loss DECIMAL(15,2) DEFAULT 0,
    profit_factor DECIMAL(8,2) DEFAULT 0,
    max_drawdown DECIMAL(8,2) DEFAULT 0,
    current_drawdown DECIMAL(8,2) DEFAULT 0,
    gross_profit DECIMAL(15,2) DEFAULT 0,
    gross_loss DECIMAL(15,2) DEFAULT 0,
    consecutive_wins INTEGER DEFAULT 0,
    consecutive_losses INTEGER DEFAULT 0,
    sharpe_ratio DECIMAL(8,4),
    
    -- Risk Protocol
    max_daily_risk DECIMAL(8,2),
    risk_per_trade_amount DECIMAL(15,2),
    max_drawdown_limit DECIMAL(8,2),
    
    -- Trading State
    initial_equity DECIMAL(15,2),
    current_equity DECIMAL(15,2),
    daily_pnl DECIMAL(15,2) DEFAULT 0,
    daily_trades INTEGER DEFAULT 0,
    daily_initial_equity DECIMAL(15,2),
    
    -- Risk Settings
    risk_per_trade_percentage DECIMAL(4,2),
    daily_loss_limit DECIMAL(4,2),
    consecutive_losses_limit INTEGER,
    
    -- Dashboard Settings
    selected_theme VARCHAR(50) DEFAULT 'concept1',
    notifications_enabled BOOLEAN DEFAULT true,
    auto_refresh BOOLEAN DEFAULT true,
    refresh_interval INTEGER DEFAULT 5000,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Real-time Data
    real_time_data JSONB,
    last_signal JSONB,
    market_status VARCHAR(20) DEFAULT 'open',
    connection_status VARCHAR(20) DEFAULT 'online',
    
    -- Trading Data
    open_positions JSONB DEFAULT '[]',
    trade_history JSONB DEFAULT '[]',
    signals JSONB DEFAULT '[]',
    
    -- User Preferences
    dashboard_layout JSONB,
    widget_settings JSONB,
    alert_settings JSONB,
    
    -- Metadata
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 5. TRADING_SESSIONS TABLE (Trading Activity)
-- =============================================
CREATE TABLE IF NOT EXISTS trading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    initial_equity DECIMAL(15,2) NOT NULL,
    final_equity DECIMAL(15,2),
    daily_pnl DECIMAL(15,2) DEFAULT 0,
    trades_count INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    max_drawdown DECIMAL(8,2) DEFAULT 0,
    risk_per_trade DECIMAL(4,2),
    session_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 6. TRADES TABLE (Individual Trades)
-- =============================================
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    signal_id VARCHAR(255),
    symbol VARCHAR(20) NOT NULL,
    trade_type VARCHAR(10) NOT NULL, -- 'buy', 'sell'
    entry_price DECIMAL(15,6) NOT NULL,
    exit_price DECIMAL(15,6),
    quantity DECIMAL(15,6) NOT NULL,
    pnl DECIMAL(15,2),
    pnl_percentage DECIMAL(8,4),
    risk_amount DECIMAL(15,2),
    reward_amount DECIMAL(15,2),
    risk_reward_ratio DECIMAL(8,4),
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'closed', 'cancelled'
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 7. SIGNALS TABLE (Trading Signals)
-- =============================================
CREATE TABLE IF NOT EXISTS signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    signal_type VARCHAR(20) NOT NULL, -- 'buy', 'sell', 'hold'
    entry_price DECIMAL(15,6) NOT NULL,
    stop_loss DECIMAL(15,6),
    take_profit DECIMAL(15,6),
    confidence_score DECIMAL(4,2), -- 0.00 to 1.00
    timeframe VARCHAR(10), -- '1m', '5m', '15m', '1h', '4h', '1d'
    strategy VARCHAR(100),
    market_condition VARCHAR(50),
    signal_strength VARCHAR(20), -- 'weak', 'medium', 'strong'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'taken', 'cancelled'
    expires_at TIMESTAMP WITH TIME ZONE,
    taken_at TIMESTAMP WITH TIME ZONE,
    taken_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 8. USER_ACTIVITY TABLE (User Actions Log)
-- =============================================
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'signup', 'payment', 'questionnaire', 'trade', 'signal_taken'
    activity_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 9. COUPONS TABLE (Coupon Management)
-- =============================================
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed', 'free'
    discount_value DECIMAL(10,2) NOT NULL,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 10. NOTIFICATIONS TABLE (User Notifications)
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'signal', 'trade', 'payment', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    action_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_email ON payments(user_email);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON payments(payment_status);

-- Questionnaire table indexes
CREATE INDEX IF NOT EXISTS idx_questionnaire_user_id ON questionnaire(user_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_user_email ON questionnaire(user_email);
CREATE INDEX IF NOT EXISTS idx_questionnaire_prop_firm ON questionnaire(prop_firm);

-- User dashboard table indexes
CREATE INDEX IF NOT EXISTS idx_user_dashboard_user_id ON user_dashboard(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_user_email ON user_dashboard(user_email);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_last_activity ON user_dashboard(last_activity);

-- Trading sessions table indexes
CREATE INDEX IF NOT EXISTS idx_trading_sessions_user_id ON trading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_sessions_session_date ON trading_sessions(session_date);

-- Trades table indexes
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades(entry_time);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);

-- Signals table indexes
CREATE INDEX IF NOT EXISTS idx_signals_user_id ON signals(user_id);
CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals(symbol);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at);
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);

-- User activity table indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questionnaire_updated_at BEFORE UPDATE ON questionnaire FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_dashboard_updated_at BEFORE UPDATE ON user_dashboard FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_sessions_updated_at BEFORE UPDATE ON trading_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_signals_updated_at BEFORE UPDATE ON signals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Insert sample coupons
INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, valid_from, valid_until) VALUES
('FREE100', 'Free access coupon', 'fixed', 0, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 year'),
('SAVE50', '50% discount coupon', 'percentage', 50, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '6 months'),
('SAVE25', '25% discount coupon', 'percentage', 25, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '3 months'),
('WELCOME20', '20% welcome discount', 'percentage', 20, 200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 month'),
('STUDENT', '30% student discount', 'percentage', 30, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '6 months'),
('EARLY', '40% early bird discount', 'percentage', 40, 25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 weeks')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- User summary view
CREATE OR REPLACE VIEW user_summary AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.plan_type,
    u.created_at as registration_date,
    q.prop_firm,
    q.account_type,
    q.account_size,
    q.risk_percentage,
    ud.current_equity,
    ud.total_pnl,
    ud.total_trades,
    ud.win_rate,
    p.final_price as last_payment_amount,
    p.payment_status as last_payment_status
FROM users u
LEFT JOIN questionnaire q ON u.id = q.user_id
LEFT JOIN user_dashboard ud ON u.id = ud.user_id
LEFT JOIN LATERAL (
    SELECT final_price, payment_status
    FROM payments p
    WHERE p.user_id = u.id
    ORDER BY p.created_at DESC
    LIMIT 1
) p ON true;

-- Trading performance view
CREATE OR REPLACE VIEW trading_performance AS
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    ud.total_trades,
    ud.winning_trades,
    ud.losing_trades,
    ud.win_rate,
    ud.total_pnl,
    ud.profit_factor,
    ud.max_drawdown,
    ud.current_drawdown,
    ud.current_equity,
    ud.initial_equity,
    (ud.current_equity - ud.initial_equity) as equity_change,
    ROUND(((ud.current_equity - ud.initial_equity) / ud.initial_equity * 100), 2) as equity_change_percentage
FROM users u
JOIN user_dashboard ud ON u.id = ud.user_id;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'PostgreSQL Database Schema Created Successfully!';
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '1. users - Enhanced signup form data';
    RAISE NOTICE '2. payments - Enhanced payment page data';
    RAISE NOTICE '3. questionnaire - Questionnaire page data';
    RAISE NOTICE '4. user_dashboard - Dashboard data (based on questionnaire)';
    RAISE NOTICE '5. trading_sessions - Daily trading activity';
    RAISE NOTICE '6. trades - Individual trades';
    RAISE NOTICE '7. signals - Trading signals';
    RAISE NOTICE '8. user_activity - User actions log';
    RAISE NOTICE '9. coupons - Coupon management';
    RAISE NOTICE '10. notifications - User notifications';
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'All indexes, triggers, and sample data created!';
    RAISE NOTICE 'Ready for API integration!';
    RAISE NOTICE '=============================================';
END $$;

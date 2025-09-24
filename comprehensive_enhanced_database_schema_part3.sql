-- =====================================================
-- SIGNAL TRACKING AND ADDITIONAL TABLES
-- =====================================================

-- =====================================================
-- 5. SIGNAL TRACKING TABLE (DETAILED SIGNAL PERFORMANCE)
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

-- Create indexes for signal_tracking
CREATE INDEX idx_signal_tracking_user_id ON signal_tracking(user_id);
CREATE INDEX idx_signal_tracking_signal_type ON signal_tracking(signal_type);
CREATE INDEX idx_signal_tracking_status ON signal_tracking(status);
CREATE INDEX idx_signal_tracking_symbol ON signal_tracking(symbol);
CREATE INDEX idx_signal_tracking_signal_time ON signal_tracking(signal_time);

-- =====================================================
-- 6. USER SUBSCRIPTIONS TABLE (ENHANCED)
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

-- Create indexes for user_subscriptions
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_plan_type ON user_subscriptions(plan_type);

-- =====================================================
-- 7. USER DASHBOARD SETTINGS TABLE
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

-- Create indexes for user_dashboard_settings
CREATE INDEX idx_user_dashboard_settings_user_id ON user_dashboard_settings(user_id);

-- =====================================================
-- 8. CREATE TRIGGERS FOR AUTOMATIC UPDATES
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
-- 9. CREATE VIEWS FOR COMMON QUERIES
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
-- 10. SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ COMPREHENSIVE DATABASE SCHEMA CREATED SUCCESSFULLY!';
    RAISE NOTICE '📊 Tables created: users, payment_details, questionnaire_details, user_dashboard_data, signal_tracking, user_subscriptions, user_dashboard_settings';
    RAISE NOTICE '🔗 All relationships established between tables';
    RAISE NOTICE '📈 Enhanced signup data: first_name, last_name, email, phone, company, country, agreements';
    RAISE NOTICE '💳 Payment tracking: all payment methods, crypto verification, billing details, coupons';
    RAISE NOTICE '📋 Questionnaire data: trading preferences, risk settings, prop firm, account details, assets';
    RAISE NOTICE '📊 Dashboard tracking: equity changes, signals taken, wins/losses, milestone performance';
    RAISE NOTICE '🎯 Signal performance: detailed tracking by milestone type with full statistics';
    RAISE NOTICE '🔒 Triggers and indexes added for performance and data integrity';
    RAISE NOTICE '👁️ Views created for easy data retrieval and reporting';
END $$;

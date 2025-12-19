-- User Data Schema for TraderEdgePro
-- This schema handles signup, payment, questionnaire, and dashboard data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (signup data)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    country VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' -- active, suspended, deleted
);

-- User subscriptions/payments table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL, -- basic, pro, premium, etc.
    plan_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_cycle VARCHAR(20) NOT NULL, -- monthly, yearly, lifetime
    payment_method VARCHAR(50), -- stripe, paypal, crypto, etc.
    payment_id VARCHAR(255), -- External payment provider ID
    status VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired, pending
    starts_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User questionnaire responses
CREATE TABLE IF NOT EXISTS user_questionnaire (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_equity DECIMAL(15,2) NOT NULL, -- User's trading account equity
    prop_firm_name VARCHAR(200), -- Name of prop firm (if applicable)
    account_type VARCHAR(50) NOT NULL, -- Demo, Beginner, Standard, Pro, Experienced, Funded, Evaluation
    account_number VARCHAR(100), -- Trading account number
    trading_experience VARCHAR(50), -- beginner, intermediate, advanced, expert
    risk_tolerance VARCHAR(20), -- low, medium, high
    preferred_instruments TEXT[], -- Array of preferred trading instruments
    trading_goals TEXT, -- User's trading goals
    daily_risk_limit DECIMAL(10,2), -- Daily risk limit in dollars
    max_drawdown_percent DECIMAL(5,2), -- Maximum acceptable drawdown percentage
    preferred_session VARCHAR(50), -- london, new_york, tokyo, sydney, all
    additional_notes TEXT,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User dashboard settings and preferences
CREATE TABLE IF NOT EXISTS user_dashboard_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_equity DECIMAL(15,2), -- Current dashboard equity (synced with questionnaire)
    display_currency VARCHAR(3) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    theme VARCHAR(20) DEFAULT 'dark', -- dark, light
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT FALSE,
    sound_alerts BOOLEAN DEFAULT TRUE,
    default_lot_size DECIMAL(10,4) DEFAULT 0.01,
    auto_calculate_lot_size BOOLEAN DEFAULT TRUE,
    show_pnl_in_currency BOOLEAN DEFAULT TRUE,
    dashboard_layout VARCHAR(20) DEFAULT 'default', -- default, compact, detailed
    milestone_access_level INTEGER DEFAULT 1, -- 1=M1 only, 2=M1-M2, 3=M1-M3, 4=All
    preferred_view_mode VARCHAR(20) DEFAULT 'milestone', -- milestone, classic
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User trading performance tracking
CREATE TABLE IF NOT EXISTS user_trading_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    starting_balance DECIMAL(15,2),
    ending_balance DECIMAL(15,2),
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(15,2) DEFAULT 0,
    best_trade DECIMAL(15,2) DEFAULT 0,
    worst_trade DECIMAL(15,2) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    profit_factor DECIMAL(8,4) DEFAULT 0,
    max_drawdown DECIMAL(15,2) DEFAULT 0,
    milestone_m1_trades INTEGER DEFAULT 0,
    milestone_m2_trades INTEGER DEFAULT 0,
    milestone_m3_trades INTEGER DEFAULT 0,
    milestone_m4_trades INTEGER DEFAULT 0,
    milestone_m1_wins INTEGER DEFAULT 0,
    milestone_m2_wins INTEGER DEFAULT 0,
    milestone_m3_wins INTEGER DEFAULT 0,
    milestone_m4_wins INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- User sessions for tracking login activity
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    location_info JSONB, -- Country, city, etc.
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_questionnaire_user_id ON user_questionnaire(user_id);
CREATE INDEX IF NOT EXISTS idx_user_questionnaire_account_type ON user_questionnaire(account_type);

CREATE INDEX IF NOT EXISTS idx_user_dashboard_settings_user_id ON user_dashboard_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_user_trading_performance_user_id ON user_trading_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trading_performance_date ON user_trading_performance(date);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_questionnaire_updated_at BEFORE UPDATE ON user_questionnaire
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_dashboard_settings_updated_at BEFORE UPDATE ON user_dashboard_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_trading_performance_updated_at BEFORE UPDATE ON user_trading_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically set milestone access level based on account type
CREATE OR REPLACE FUNCTION set_milestone_access_level()
RETURNS TRIGGER AS $$
BEGIN
    -- Update dashboard settings based on questionnaire account type
    UPDATE user_dashboard_settings 
    SET 
        milestone_access_level = CASE 
            WHEN NEW.account_type IN ('Demo', 'Beginner') THEN 1
            WHEN NEW.account_type = 'Standard' THEN 2
            WHEN NEW.account_type IN ('Pro', 'Experienced') THEN 3
            WHEN NEW.account_type IN ('Funded', 'Evaluation') THEN 4
            ELSE 1
        END,
        current_equity = NEW.account_equity,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id;
    
    -- If dashboard settings don't exist, create them
    INSERT INTO user_dashboard_settings (
        user_id, 
        current_equity, 
        milestone_access_level
    )
    SELECT 
        NEW.user_id,
        NEW.account_equity,
        CASE 
            WHEN NEW.account_type IN ('Demo', 'Beginner') THEN 1
            WHEN NEW.account_type = 'Standard' THEN 2
            WHEN NEW.account_type IN ('Pro', 'Experienced') THEN 3
            WHEN NEW.account_type IN ('Funded', 'Evaluation') THEN 4
            ELSE 1
        END
    WHERE NOT EXISTS (
        SELECT 1 FROM user_dashboard_settings WHERE user_id = NEW.user_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_questionnaire_to_dashboard AFTER INSERT OR UPDATE ON user_questionnaire
    FOR EACH ROW EXECUTE FUNCTION set_milestone_access_level();

-- Comments for documentation
COMMENT ON TABLE users IS 'Main users table storing signup and authentication data';
COMMENT ON TABLE user_subscriptions IS 'User subscription and payment information';
COMMENT ON TABLE user_questionnaire IS 'User questionnaire responses including account details';
COMMENT ON TABLE user_dashboard_settings IS 'User dashboard preferences and settings';
COMMENT ON TABLE user_trading_performance IS 'Daily trading performance tracking';
COMMENT ON TABLE user_sessions IS 'User session management for security';

COMMENT ON COLUMN user_questionnaire.account_equity IS 'Trading account equity from questionnaire';
COMMENT ON COLUMN user_dashboard_settings.current_equity IS 'Current dashboard equity (synced with questionnaire)';
COMMENT ON COLUMN user_dashboard_settings.milestone_access_level IS '1=M1 only, 2=M1-M2, 3=M1-M3, 4=All milestones';

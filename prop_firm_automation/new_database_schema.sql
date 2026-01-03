-- Drop existing tables to start fresh
DROP VIEW IF EXISTS user_dashboard;
DROP TABLE IF EXISTS signal_tracking, support_messages, ai_nexus_chats, journal_entries, subscriptions, payments, users CASCADE;

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    -- Subscription and Plan Details
    subscription_status VARCHAR(50) DEFAULT 'inactive', -- inactive, active, cancelled
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    -- User Questionnaire/Profile Data
    trades_per_day VARCHAR(20), -- e.g., '1-3', '3-5', '5+'
    trading_session VARCHAR(50), -- e.g., 'London', 'New York', 'Asian', 'All'
    crypto_assets JSONB,
    forex_assets JSONB,
    prop_firm VARCHAR(255),
    account_type VARCHAR(100), -- e.g., 'Live', 'Demo', 'Prop Firm Challenge'
    account_size NUMERIC(15, 2),
    risk_percentage NUMERIC(5, 2),
    risk_reward_ratio VARCHAR(10), -- e.g., '1:2'
    -- Dashboard Metrics
    account_equity NUMERIC(15, 2) DEFAULT 0.00,
    win_rate NUMERIC(5, 2) DEFAULT 0.00,
    pnl NUMERIC(15, 2) DEFAULT 0.00
);

-- Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'stripe', 'paypal', 'crypto'
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions Table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    payment_id UUID REFERENCES payments(id),
    plan_name VARCHAR(100) NOT NULL, -- e.g., 'Pro', 'Enterprise'
    duration VARCHAR(50) NOT NULL, -- e.g., 'monthly', 'yearly'
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal Entries Table
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    entry_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Nexus Chat Table
CREATE TABLE ai_nexus_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    sender VARCHAR(50) NOT NULL, -- 'user' or 'ai'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Messages Table
CREATE TABLE support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'closed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signal Tracking Table
CREATE TABLE signal_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    signal_id VARCHAR(255) NOT NULL,
    outcome VARCHAR(20), -- 'win', 'loss', 'breakeven'
    pnl NUMERIC(15, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a view for the user dashboard
CREATE OR REPLACE VIEW user_dashboard AS
SELECT
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.subscription_status,
    u.account_equity,
    u.win_rate,
    u.pnl,
    (SELECT COUNT(*) FROM journal_entries je WHERE je.user_id = u.id) as journal_entries_count,
    (SELECT COUNT(*) FROM signal_tracking st WHERE st.user_id = u.id) as signals_tracked_count
FROM
    users u;

-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_ai_nexus_chats_user_id ON ai_nexus_chats(user_id);
CREATE INDEX idx_support_messages_user_id ON support_messages(user_id);
CREATE INDEX idx_signal_tracking_user_id ON signal_tracking(user_id);

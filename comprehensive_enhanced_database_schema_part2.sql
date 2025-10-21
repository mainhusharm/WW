-- =====================================================
-- COMPREHENSIVE QUESTIONNAIRE AND DASHBOARD TABLES
-- =====================================================

-- =====================================================
-- 3. COMPREHENSIVE QUESTIONNAIRE DETAILS TABLE
-- =====================================================

CREATE TABLE questionnaire_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- Create indexes for questionnaire_details
CREATE INDEX idx_questionnaire_details_user_id ON questionnaire_details(user_id);
CREATE INDEX idx_questionnaire_details_user_email ON questionnaire_details(user_email);
CREATE INDEX idx_questionnaire_details_has_account ON questionnaire_details(has_account);
CREATE INDEX idx_questionnaire_details_prop_firm ON questionnaire_details(prop_firm);
CREATE INDEX idx_questionnaire_details_account_type ON questionnaire_details(account_type);
CREATE INDEX idx_questionnaire_details_created_at ON questionnaire_details(created_at);

-- =====================================================
-- 4. USER DASHBOARD DATA TABLE (COMPREHENSIVE TRACKING)
-- =====================================================

CREATE TABLE user_dashboard_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    current_streak_type VARCHAR(10) CHECK (current_streak_type IN ('win', 'loss', 'none')),
    current_streak_count INTEGER DEFAULT 0,
    
    -- Daily/Weekly/Monthly Tracking
    daily_trades INTEGER DEFAULT 0,
    weekly_trades INTEGER DEFAULT 0,
    monthly_trades INTEGER DEFAULT 0,
    daily_initial_equity DECIMAL(12,2),
    weekly_initial_equity DECIMAL(12,2),
    monthly_initial_equity DECIMAL(12,2),
    
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

-- Create indexes for user_dashboard_data
CREATE INDEX idx_user_dashboard_data_user_id ON user_dashboard_data(user_id);
CREATE INDEX idx_user_dashboard_data_questionnaire_id ON user_dashboard_data(questionnaire_id);
CREATE INDEX idx_user_dashboard_data_prop_firm ON user_dashboard_data(prop_firm);
CREATE INDEX idx_user_dashboard_data_account_type ON user_dashboard_data(account_type);
CREATE INDEX idx_user_dashboard_data_created_at ON user_dashboard_data(created_at);

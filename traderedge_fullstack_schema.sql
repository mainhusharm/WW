-- =====================================================
-- TRADEREDGE PRO FULL-STACK ENHANCEMENT SCHEMA
-- Additional tables for Live Payout Ticker, Prop Firms, and Signals
-- =====================================================

-- Drop existing tables if they exist (uncomment if you want to recreate)
DROP TABLE IF EXISTS calculator_sessions CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS signals CASCADE;
DROP TABLE IF EXISTS prop_firms CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;

-- =====================================================
-- 1. PAYOUTS TABLE (for Live Payout Ticker)
-- =====================================================
CREATE TABLE payouts (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE DEFAULT uuid_generate_v4(),
    username_alias VARCHAR(100) NOT NULL, -- Anonymous username like "@Alex"
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    prop_firm_name VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT true,
    currency VARCHAR(3) DEFAULT 'USD',
    payout_method VARCHAR(50), -- bank_transfer, crypto, paypal, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample payout data for the ticker
INSERT INTO payouts (username_alias, amount, prop_firm_name, payout_method) VALUES
('@Alex', 100000.00, 'FTMO', 'bank_transfer'),
('@SarahK', 4990.50, 'MyForexFunds', 'crypto'),
('@MikeT', 25000.00, 'The5ers', 'paypal'),
('@LisaP', 15000.00, 'FTMO', 'bank_transfer'),
('@JohnD', 75000.00, 'MyForexFunds', 'crypto'),
('@EmmaR', 32000.00, 'The5ers', 'paypal'),
('@DavidM', 18000.00, 'FTMO', 'bank_transfer'),
('@AnnaC', 45000.00, 'MyForexFunds', 'crypto'),
('@TomW', 28000.00, 'The5ers', 'paypal'),
('@SophieL', 95000.00, 'FTMO', 'bank_transfer');

-- Create indexes for payouts
CREATE INDEX idx_payouts_timestamp ON payouts(timestamp DESC);
CREATE INDEX idx_payouts_verified ON payouts(is_verified);
CREATE INDEX idx_payouts_amount ON payouts(amount DESC);

-- =====================================================
-- 2. PROP FIRMS TABLE (for Prop-Finder Wizard)
-- =====================================================
CREATE TABLE prop_firms (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    website_url VARCHAR(500),
    affiliate_link VARCHAR(500),

    -- Firm specifications
    min_account_size DECIMAL(10,2),
    max_account_size DECIMAL(10,2),
    max_leverage INTEGER,
    profit_split_percentage INTEGER, -- e.g., 80 for 80/20 split
    min_trading_days INTEGER,
    max_trading_days INTEGER,
    min_payout_days INTEGER,
    max_payout_days INTEGER,

    -- Restrictions and allowances
    allows_eas BOOLEAN DEFAULT false,
    allows_experts BOOLEAN DEFAULT false,
    allows_indicators BOOLEAN DEFAULT false,
    allows_hedging BOOLEAN DEFAULT true,
    allows_scalping BOOLEAN DEFAULT true,
    allows_news_trading BOOLEAN DEFAULT true,
    weekend_holding BOOLEAN DEFAULT false,

    -- Challenge phases
    has_phase1 BOOLEAN DEFAULT true,
    has_phase2 BOOLEAN DEFAULT true,
    phase1_target DECIMAL(5,2), -- e.g., 8.00 for 8%
    phase2_target DECIMAL(5,2), -- e.g., 5.00 for 5%
    phase1_max_daily_loss DECIMAL(5,2),
    phase1_max_total_loss DECIMAL(5,2),
    phase2_max_daily_loss DECIMAL(5,2),
    phase2_max_total_loss DECIMAL(5,2),

    -- Trading instruments
    allowed_instruments TEXT[], -- ARRAY of allowed instruments
    restricted_pairs TEXT[], -- ARRAY of restricted pairs

    -- Geographic restrictions
    restricted_countries TEXT[], -- ARRAY of restricted countries
    allowed_countries TEXT[], -- ARRAY of specifically allowed countries

    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    trust_score DECIMAL(3,1) DEFAULT 5.0, -- 1.0 to 10.0
    total_reviews INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2), -- e.g., 85.50 for 85.5%

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample prop firm data
INSERT INTO prop_firms (
    name, display_name, description, website_url, affiliate_link,
    min_account_size, max_account_size, max_leverage, profit_split_percentage,
    min_trading_days, max_trading_days, min_payout_days, max_payout_days,
    allows_eas, allows_experts, allows_indicators, allows_hedging, allows_scalping,
    phase1_target, phase2_target, phase1_max_daily_loss, phase1_max_total_loss,
    success_rate, trust_score, total_reviews
) VALUES
('ftmo', 'FTMO', 'World-renowned prop firm with 2-step evaluation process', 'https://ftmo.com', 'https://ftmo.com/en/affiliate-program',
    10000, 200000, 100, 80, 5, 60, 1, 7,
    true, true, true, true, true,
    10.00, 5.00, 5.00, 10.00,
    87.50, 9.2, 15420),

('myforexfunds', 'MyForexFunds', 'Competitive prop firm with flexible account sizes', 'https://myforexfunds.com', 'https://myforexfunds.com/affiliate',
    5000, 100000, 100, 85, 5, 60, 1, 14,
    true, true, true, true, true,
    8.00, 5.00, 5.00, 10.00,
    89.30, 8.8, 9820),

('the5ers', 'The5ers', 'Fast-growing prop firm with excellent payouts', 'https://the5ers.com', 'https://the5ers.com/affiliate',
    5000, 50000, 100, 80, 5, 60, 1, 7,
    true, true, true, true, true,
    10.00, 5.00, 5.00, 10.00,
    85.20, 8.5, 5670);

-- Create indexes for prop_firms
CREATE INDEX idx_prop_firms_name ON prop_firms(name);
CREATE INDEX idx_prop_firms_active ON prop_firms(is_active);
CREATE INDEX idx_prop_firms_featured ON prop_firms(is_featured);
CREATE INDEX idx_prop_firms_min_account ON prop_firms(min_account_size);
CREATE INDEX idx_prop_firms_max_leverage ON prop_firms(max_leverage);

-- =====================================================
-- 3. SIGNALS TABLE (for Signal Feed Live Preview)
-- =====================================================
CREATE TABLE signals (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE DEFAULT uuid_generate_v4(),
    signal_id VARCHAR(50) UNIQUE NOT NULL,
    pair VARCHAR(10) NOT NULL, -- e.g., 'EURUSD', 'GBPUSD'
    direction VARCHAR(4) NOT NULL CHECK (direction IN ('BUY', 'SELL')),

    -- Price levels
    entry DECIMAL(10,5) NOT NULL,
    stop_loss DECIMAL(10,5) NOT NULL,
    take_profit DECIMAL(10,5),

    -- Risk management
    risk_percentage DECIMAL(4,2), -- e.g., 0.50 for 0.5%
    position_size DECIMAL(10,2),
    risk_reward_ratio DECIMAL(4,2),

    -- AI Analysis
    confidence_score DECIMAL(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    ai_rationale TEXT NOT NULL, -- Detailed AI reasoning
    technical_signals JSONB, -- Store technical indicators data
    market_sentiment VARCHAR(20) DEFAULT 'neutral' CHECK (market_sentiment IN ('bullish', 'bearish', 'neutral')),

    -- Timing
    expiry_minutes INTEGER DEFAULT 240, -- Signal valid for X minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Status
    is_active BOOLEAN DEFAULT true,
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'executed', 'cancelled')),

    -- Metadata
    source VARCHAR(50) DEFAULT 'nexus_ai',
    version VARCHAR(10) DEFAULT '1.0',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample signals
INSERT INTO signals (
    signal_id, pair, direction, entry, stop_loss, take_profit,
    confidence_score, ai_rationale, market_sentiment, expiry_minutes
) VALUES
('SIG_EURUSD_SHORT_001', 'EURUSD', 'SELL', 1.08450, 1.08750, 1.07950,
    87.50, 'EUR/USD shows bearish divergence on 4H MACD while RSI indicates overbought conditions at 72. Previous resistance at 1.0875 now acting as strong support. Market sentiment analysis reveals 68% bearish positioning among institutional traders. Entry timed for optimal risk-reward ratio of 1:2.5.', 'bearish', 240),

('SIG_GBPUSD_BUY_002', 'GBPUSD', 'BUY', 1.26750, 1.26400, 1.27500,
    82.30, 'GBP/USD breaking above key resistance level with strong bullish momentum. MACD crossover confirmed on 1H timeframe. Support established at 1.2640 psychological level. Bank of England comments showing hawkish bias. Risk-reward ratio of 1:2.2 with tight stop loss.', 'bullish', 180),

('SIG_USDJPY_SELL_003', 'USDJPY', 'SELL', 157.450, 158.200, 156.200,
    79.80, 'USD/JPY approaching major resistance at 158.200. Bearish engulfing pattern on daily chart. RSI overbought at 78. Japanese Yen strengthening due to risk-off sentiment. Target based on previous support level. Risk management: 1:2.5 ratio.', 'bearish', 300);

-- Create indexes for signals
CREATE INDEX idx_signals_pair ON signals(pair);
CREATE INDEX idx_signals_direction ON signals(direction);
CREATE INDEX idx_signals_confidence ON signals(confidence_score DESC);
CREATE INDEX idx_signals_active ON signals(is_active);
CREATE INDEX idx_signals_expires ON signals(expires_at);
CREATE INDEX idx_signals_created ON signals(created_at DESC);

-- =====================================================
-- 4. LEADS TABLE (for Lead Capture & Email Automation)
-- =====================================================
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(200),
    source VARCHAR(50) DEFAULT 'landing_page', -- landing_page, exit_intent, calculator, etc.
    source_url VARCHAR(500), -- Which page they came from
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Lead qualification
    account_size_interest VARCHAR(20), -- 10k-25k, 25k-50k, 50k-100k, 100k+
    trading_experience VARCHAR(20), -- beginner, intermediate, advanced
    prop_firm_interest TEXT[], -- ARRAY of interested prop firms

    -- Calculator data (if applicable)
    risk_percentage DECIMAL(4,2),
    account_balance DECIMAL(10,2),
    position_size_result DECIMAL(10,2),

    -- Email marketing
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    email_opened BOOLEAN DEFAULT false,
    email_opened_at TIMESTAMP WITH TIME ZONE,
    email_clicked BOOLEAN DEFAULT false,
    email_clicked_at TIMESTAMP WITH TIME ZONE,

    -- Conversion tracking
    converted_to_signup BOOLEAN DEFAULT false,
    converted_at TIMESTAMP WITH TIME ZONE,
    conversion_value DECIMAL(10,2),

    -- Status
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'unqualified')),
    follow_up_count INTEGER DEFAULT 0,
    last_follow_up TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for leads
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_converted ON leads(converted_to_signup);
CREATE INDEX idx_leads_created ON leads(created_at DESC);

-- =====================================================
-- 5. CALCULATOR_SESSIONS TABLE (for Position Sizing Calculator)
-- =====================================================
CREATE TABLE calculator_sessions (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Calculator inputs
    account_balance DECIMAL(10,2) NOT NULL,
    risk_percentage DECIMAL(4,2) NOT NULL,
    stop_loss_pips DECIMAL(6,2),
    entry_price DECIMAL(10,5),
    stop_loss_price DECIMAL(10,5),

    -- Calculator results
    position_size DECIMAL(10,2),
    risk_amount DECIMAL(10,2),
    potential_loss DECIMAL(10,2),
    potential_profit DECIMAL(10,2),

    -- Metadata
    calculator_type VARCHAR(50) DEFAULT 'position_sizing',
    currency_pair VARCHAR(10) DEFAULT 'EURUSD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for calculator_sessions
CREATE INDEX idx_calculator_sessions_session_id ON calculator_sessions(session_id);
CREATE INDEX idx_calculator_sessions_created ON calculator_sessions(created_at DESC);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers to all tables
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prop_firms_updated_at BEFORE UPDATE ON prop_firms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_signals_updated_at BEFORE UPDATE ON signals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to set signal expiry
CREATE OR REPLACE FUNCTION set_signal_expiry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.expires_at = NEW.created_at + INTERVAL '1 minute' * NEW.expiry_minutes;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_signal_expiry_trigger BEFORE INSERT ON signals FOR EACH ROW EXECUTE FUNCTION set_signal_expiry();

-- =====================================================
-- SECURITY POLICIES (RLS - Row Level Security)
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculator_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies (example - adjust based on your auth system)
-- CREATE POLICY "Users can view their own leads" ON leads FOR SELECT USING (auth.uid()::text = user_id::text);

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- Payouts summary view
CREATE VIEW payouts_summary AS
SELECT
    DATE_TRUNC('day', timestamp) as date,
    COUNT(*) as total_payouts,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount,
    MAX(amount) as max_amount
FROM payouts
WHERE is_verified = true
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY date DESC;

-- Signals performance view
CREATE VIEW signals_performance AS
SELECT
    pair,
    direction,
    COUNT(*) as total_signals,
    AVG(confidence_score) as avg_confidence,
    SUM(execution_count) as total_executions,
    CASE WHEN SUM(execution_count) > 0 THEN (SUM(success_count)::float / SUM(execution_count)::float) * 100 ELSE 0 END as success_rate
FROM signals
GROUP BY pair, direction
ORDER BY total_signals DESC;

-- Leads conversion funnel view
CREATE VIEW leads_funnel AS
SELECT
    source,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status != 'new' THEN 1 END) as contacted,
    COUNT(CASE WHEN converted_to_signup = true THEN 1 END) as converted,
    ROUND(((COUNT(CASE WHEN converted_to_signup = true THEN 1 END)::numeric / COUNT(*)::numeric) * 100), 2) as conversion_rate
FROM leads
GROUP BY source
ORDER BY total_leads DESC;

-- Supabase Database Schema for TraderEdge Pro
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 1. USER PROFILES TABLE
-- ===========================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  country TEXT NOT NULL,
  language TEXT DEFAULT 'English',
  bio TEXT,
  unique_id TEXT UNIQUE NOT NULL,
  membership_tier TEXT DEFAULT 'basic',
  setup_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 2. QUESTIONNAIRE DATA TABLE
-- ===========================================
CREATE TABLE questionnaire_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Account Information
  has_account BOOLEAN NOT NULL,
  account_equity NUMERIC,
  account_size NUMERIC,
  prop_firm TEXT NOT NULL,
  account_type TEXT NOT NULL,
  account_number TEXT,
  account_currency TEXT DEFAULT 'USD',

  -- Trading Experience
  trading_experience TEXT NOT NULL,
  risk_tolerance TEXT NOT NULL,
  trading_goals TEXT NOT NULL,
  preferred_markets TEXT[] DEFAULT '{}',
  trading_style TEXT NOT NULL,
  trades_per_day TEXT NOT NULL,
  trading_session TEXT NOT NULL,

  -- Risk Management
  risk_percentage NUMERIC NOT NULL,
  risk_reward_ratio NUMERIC NOT NULL,

  -- Assets
  forex_assets TEXT[] DEFAULT '{}',
  crypto_assets TEXT[] DEFAULT '{}',
  stocks_assets TEXT[] DEFAULT '{}',

  -- Compliance
  max_daily_loss NUMERIC NOT NULL,
  max_total_loss NUMERIC NOT NULL,
  profit_target NUMERIC NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ===========================================
-- 3. PAYMENT RECORDS TABLE
-- ===========================================
CREATE TABLE payment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,

  plan_name TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  final_amount NUMERIC NOT NULL,
  coupon_code TEXT,

  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  transaction_id TEXT,
  payment_processor TEXT,
  currency TEXT DEFAULT 'USD',

  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 4. TRADE RECORDS TABLE
-- ===========================================
CREATE TABLE trade_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,

  symbol TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('BUY', 'SELL')) NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  quantity NUMERIC NOT NULL,
  pnl NUMERIC,

  entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
  exit_time TIMESTAMP WITH TIME ZONE,

  stop_loss NUMERIC,
  take_profit NUMERIC,
  outcome TEXT CHECK (outcome IN ('Target Hit', 'Stop Loss Hit', 'Breakeven', 'Open')),
  notes TEXT,

  signal_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 5. JOURNAL ENTRIES TABLE
-- ===========================================
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,

  date DATE NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('BUY', 'SELL')) NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  quantity NUMERIC NOT NULL,
  pnl NUMERIC,

  notes TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 6. AI CHAT MESSAGES TABLE
-- ===========================================
CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,

  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('user', 'assistant')) NOT NULL,

  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 7. RISK PROTOCOL DATA TABLE
-- ===========================================
CREATE TABLE risk_protocol_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,

  account_balance NUMERIC NOT NULL,
  risk_per_trade NUMERIC NOT NULL,
  max_daily_loss NUMERIC NOT NULL,
  max_drawdown NUMERIC NOT NULL,
  stop_loss_default NUMERIC NOT NULL,
  take_profit_default NUMERIC NOT NULL,
  risk_reward_ratio NUMERIC NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ===========================================
-- 8. PERFORMANCE METRICS TABLE
-- ===========================================
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,

  total_pnl NUMERIC DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  average_win NUMERIC DEFAULT 0,
  average_loss NUMERIC DEFAULT 0,
  profit_factor NUMERIC DEFAULT 0,
  max_drawdown NUMERIC DEFAULT 0,
  current_drawdown NUMERIC DEFAULT 0,
  gross_profit NUMERIC DEFAULT 0,
  gross_loss NUMERIC DEFAULT 0,
  consecutive_wins INTEGER DEFAULT 0,
  consecutive_losses INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ===========================================
-- 9. NOTIFICATIONS TABLE
-- ===========================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,

  type TEXT CHECK (type IN ('signal', 'news', 'trade', 'system')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,

  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 10. USER SETTINGS TABLE
-- ===========================================
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Risk Management
  risk_per_trade NUMERIC DEFAULT 1,
  max_daily_risk NUMERIC DEFAULT 5,
  max_drawdown NUMERIC DEFAULT 10,
  stop_loss_default NUMERIC DEFAULT 50,
  take_profit_default NUMERIC DEFAULT 100,
  risk_reward_ratio NUMERIC DEFAULT 2,

  -- Trading Preferences (JSONB for complex objects)
  trading JSONB DEFAULT '{
    "default_lot_size": 0.1,
    "max_positions": 5,
    "auto_close_on_profit": false,
    "auto_close_on_loss": true,
    "slippage": 3,
    "execution_mode": "market",
    "confirm_trades": true,
    "one_click_trading": false
  }',

  -- Display & Theme
  display JSONB DEFAULT '{
    "theme": "dark",
    "accent_color": "cyan",
    "font_size": "medium",
    "compact_mode": false,
    "show_animations": true,
    "chart_style": "candlestick",
    "default_timeframe": "1h"
  }',

  -- Notifications
  notifications JSONB DEFAULT '{
    "signals": true,
    "news": true,
    "trades": true,
    "price_alerts": true,
    "email": true,
    "push": true,
    "sound": true,
    "desktop": true
  }',

  -- Security
  security JSONB DEFAULT '{
    "two_factor_auth": false,
    "session_timeout": 30,
    "login_notifications": true,
    "device_tracking": true,
    "auto_logout": true
  }',

  -- General
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'America/New_York',
  auto_save BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_unique_id ON user_profiles(unique_id);
CREATE INDEX idx_questionnaire_data_user_id ON questionnaire_data(user_id);
CREATE INDEX idx_payment_records_user_id ON payment_records(user_id);
CREATE INDEX idx_trade_records_user_id ON trade_records(user_id);
CREATE INDEX idx_trade_records_symbol ON trade_records(symbol);
CREATE INDEX idx_trade_records_entry_time ON trade_records(entry_time);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(date);
CREATE INDEX idx_ai_chat_messages_user_id ON ai_chat_messages(user_id);
CREATE INDEX idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);
CREATE INDEX idx_risk_protocol_data_user_id ON risk_protocol_data(user_id);
CREATE INDEX idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- ===========================================
-- RLS (Row Level Security) POLICIES
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_protocol_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Questionnaire Data: Users can only access their own data
CREATE POLICY "Users can view own questionnaire" ON questionnaire_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own questionnaire" ON questionnaire_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questionnaire" ON questionnaire_data
  FOR UPDATE USING (auth.uid() = user_id);

-- Payment Records: Users can only access their own payments
CREATE POLICY "Users can view own payments" ON payment_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON payment_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trade Records: Users can only access their own trades
CREATE POLICY "Users can view own trades" ON trade_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON trade_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON trade_records
  FOR UPDATE USING (auth.uid() = user_id);

-- Journal Entries: Users can only access their own entries
CREATE POLICY "Users can view own journal" ON journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal" ON journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- AI Chat Messages: Users can only access their own chats
CREATE POLICY "Users can view own chats" ON ai_chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chats" ON ai_chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Risk Protocol Data: Users can only access their own data
CREATE POLICY "Users can view own risk data" ON risk_protocol_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own risk data" ON risk_protocol_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own risk data" ON risk_protocol_data
  FOR UPDATE USING (auth.uid() = user_id);

-- Performance Metrics: Users can only access their own metrics
CREATE POLICY "Users can view own performance" ON performance_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance" ON performance_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own performance" ON performance_metrics
  FOR UPDATE USING (auth.uid() = user_id);

-- Notifications: Users can only access their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- User Settings: Users can only access their own settings
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ===========================================
-- FUNCTIONS FOR UPDATED_AT
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questionnaire_data_updated_at
  BEFORE UPDATE ON questionnaire_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_records_updated_at
  BEFORE UPDATE ON trade_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_protocol_data_updated_at
  BEFORE UPDATE ON risk_protocol_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_metrics_updated_at
  BEFORE UPDATE ON performance_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

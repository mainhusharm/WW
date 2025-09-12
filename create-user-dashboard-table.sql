-- Create user dashboard table
-- Run this in your Supabase SQL Editor

CREATE TABLE "user dashboard" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  
  -- User Profile Data
  prop_firm TEXT,
  account_type TEXT,
  account_size DECIMAL(12,2),
  risk_per_trade DECIMAL(5,2),
  experience TEXT,
  unique_id TEXT,
  
  -- Performance Metrics
  account_balance DECIMAL(12,2),
  total_pnl DECIMAL(12,2) DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  average_win DECIMAL(12,2) DEFAULT 0,
  average_loss DECIMAL(12,2) DEFAULT 0,
  profit_factor DECIMAL(8,2) DEFAULT 0,
  max_drawdown DECIMAL(12,2) DEFAULT 0,
  current_drawdown DECIMAL(12,2) DEFAULT 0,
  gross_profit DECIMAL(12,2) DEFAULT 0,
  gross_loss DECIMAL(12,2) DEFAULT 0,
  consecutive_wins INTEGER DEFAULT 0,
  consecutive_losses INTEGER DEFAULT 0,
  sharpe_ratio DECIMAL(8,2),
  
  -- Risk Protocol
  max_daily_risk DECIMAL(12,2),
  risk_per_trade_amount DECIMAL(12,2),
  max_drawdown_limit DECIMAL(12,2),
  
  -- Trading State
  initial_equity DECIMAL(12,2),
  current_equity DECIMAL(12,2),
  daily_pnl DECIMAL(12,2) DEFAULT 0,
  daily_trades INTEGER DEFAULT 0,
  daily_initial_equity DECIMAL(12,2),
  
  -- Risk Settings
  risk_per_trade_percentage DECIMAL(5,2),
  daily_loss_limit DECIMAL(5,2),
  consecutive_losses_limit INTEGER,
  
  -- Dashboard Settings
  selected_theme TEXT DEFAULT 'concept1',
  notifications_enabled BOOLEAN DEFAULT true,
  auto_refresh BOOLEAN DEFAULT true,
  refresh_interval INTEGER DEFAULT 5000,
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  
  -- Real-time Data
  real_time_data JSONB,
  last_signal JSONB,
  market_status TEXT,
  connection_status TEXT DEFAULT 'online',
  
  -- Trading Data
  open_positions JSONB DEFAULT '[]',
  trade_history JSONB DEFAULT '[]',
  signals JSONB DEFAULT '[]',
  
  -- User Preferences
  dashboard_layout JSONB,
  widget_settings JSONB,
  alert_settings JSONB,
  
  -- Metadata
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for now
ALTER TABLE "user dashboard" DISABLE ROW LEVEL SECURITY;

-- Create indexes for faster queries
CREATE INDEX idx_user_dashboard_user_id ON "user dashboard" (user_id);
CREATE INDEX idx_user_dashboard_user_email ON "user dashboard" (user_email);
CREATE INDEX idx_user_dashboard_last_activity ON "user dashboard" (last_activity);

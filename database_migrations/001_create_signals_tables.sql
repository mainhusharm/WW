-- Migration: Create signals tables for real-time signal pipeline
-- This migration creates the core tables for the robust signal system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create signals table (immutable by users)
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,        -- e.g. BTCUSD, EURUSD
  side TEXT NOT NULL,          -- buy/sell
  entry_price NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  rr_ratio NUMERIC,            -- computed risk:reward
  risk_tier TEXT NOT NULL,     -- e.g. "low", "medium", "high" (matches questionnaire options)
  payload JSONB NOT NULL,      -- extra metadata: tags, timeframe, notes
  created_by UUID NOT NULL,    -- admin user id
  origin TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL DEFAULT 'active', -- active|archived
  immutable BOOLEAN NOT NULL DEFAULT true, -- true = users can't delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create join table mapping signals to specific user risk groups (optional optimization)
CREATE TABLE IF NOT EXISTS signal_risk_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,
  risk_tier TEXT NOT NULL
);

-- Create user signals mapping (materialized per-user mapping for fast user queries)
CREATE TABLE IF NOT EXISTS user_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(uuid),
  signal_id UUID NOT NULL REFERENCES signals(id),
  delivered BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_signals_risk_tier ON signals (risk_tier);
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals (status);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_signals_userid ON user_signals (user_id);
CREATE INDEX IF NOT EXISTS idx_user_signals_signal_id ON user_signals (signal_id);
CREATE INDEX IF NOT EXISTS idx_user_signals_delivered ON user_signals (delivered);
CREATE INDEX IF NOT EXISTS idx_signal_risk_map_risk_tier ON signal_risk_map (risk_tier);

-- Add constraints
ALTER TABLE signals ADD CONSTRAINT chk_side CHECK (side IN ('buy', 'sell', 'BUY', 'SELL'));
ALTER TABLE signals ADD CONSTRAINT chk_risk_tier CHECK (risk_tier IN ('low', 'medium', 'high'));
ALTER TABLE signals ADD CONSTRAINT chk_status CHECK (status IN ('active', 'archived'));
ALTER TABLE signals ADD CONSTRAINT chk_origin CHECK (origin IN ('admin', 'system'));

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_signals_updated_at 
    BEFORE UPDATE ON signals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE signals IS 'Core signals table - immutable by users, only admin can create/archive';
COMMENT ON TABLE user_signals IS 'Tracks which users received which signals for audit and delivery tracking';
COMMENT ON TABLE signal_risk_map IS 'Maps signals to risk tiers for efficient querying';
COMMENT ON COLUMN signals.immutable IS 'Prevents logical deletion by users. DB user roles + API enforce no deletes';
COMMENT ON COLUMN signals.origin IS 'Source of signal - admin or system generated';
COMMENT ON COLUMN user_signals.delivered IS 'Whether signal was successfully delivered to user via WebSocket';

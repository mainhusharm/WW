-- Create questionnaire details table
-- Run this in your Supabase SQL Editor

CREATE TABLE "questionnaire details" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  
  -- Trading preferences
  trades_per_day TEXT NOT NULL,
  trading_session TEXT NOT NULL,
  crypto_assets TEXT[] DEFAULT '{}',
  forex_assets TEXT[] DEFAULT '{}',
  custom_forex_pairs TEXT[] DEFAULT '{}',
  
  -- Account information
  has_account TEXT NOT NULL CHECK (has_account IN ('yes', 'no')),
  account_equity DECIMAL(10,2),
  prop_firm TEXT,
  account_type TEXT,
  account_size DECIMAL(10,2),
  
  -- Risk management
  risk_percentage DECIMAL(3,1) NOT NULL,
  risk_reward_ratio TEXT NOT NULL,
  
  -- Screenshot upload
  account_screenshot TEXT, -- Base64 encoded image
  screenshot_filename TEXT,
  screenshot_size INTEGER,
  screenshot_type TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for now
ALTER TABLE "questionnaire details" DISABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_questionnaire_user_id ON "questionnaire details" (user_id);
CREATE INDEX idx_questionnaire_user_email ON "questionnaire details" (user_email);

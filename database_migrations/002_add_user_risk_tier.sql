-- Migration: Add risk_tier column to users table for signal filtering
-- This migration adds the risk tier information to users table

-- Add risk_tier column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'risk_tier') THEN
        ALTER TABLE users ADD COLUMN risk_tier TEXT DEFAULT 'medium';
    END IF;
END $$;

-- Add constraint for risk_tier values
ALTER TABLE users ADD CONSTRAINT chk_users_risk_tier CHECK (risk_tier IN ('low', 'medium', 'high'));

-- Add index for efficient querying by risk tier
CREATE INDEX IF NOT EXISTS idx_users_risk_tier ON users (risk_tier);

-- Add comment
COMMENT ON COLUMN users.risk_tier IS 'User risk preference from questionnaire - used for signal filtering';

-- Update existing users to have medium risk tier if null
UPDATE users SET risk_tier = 'medium' WHERE risk_tier IS NULL;

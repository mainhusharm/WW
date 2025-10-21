-- Enhanced PostgreSQL Database Schema for TraderEdge Pro
-- This extends the existing schema to support the enhanced signup, payment, and questionnaire pages

-- First, ensure we have the base users table with all required fields
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(255),
    country VARCHAR(100),
    agree_to_marketing BOOLEAN DEFAULT FALSE,
    plan_type VARCHAR(50) DEFAULT 'premium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Enhanced payments table for the new payment system
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_method VARCHAR(50), -- 'cryptomus', 'stripe', etc.
    payment_status VARCHAR(50) DEFAULT 'pending',
    transaction_id VARCHAR(255),
    cryptocurrency VARCHAR(20), -- BTC, USDT, ETH, etc.
    network VARCHAR(50), -- tron, ethereum, bsc, etc.
    plan_name VARCHAR(100), -- 'Premium Trading Plan'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced questionnaire table for trading preferences
CREATE TABLE IF NOT EXISTS questionnaire_responses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    prop_firm VARCHAR(200),
    account_type VARCHAR(50), -- 'Challenge', 'Funded', 'Personal'
    challenge_step VARCHAR(50), -- 'Step 1', 'Step 2', 'Funded'
    account_size DECIMAL(15,2),
    risk_per_trade DECIMAL(5,2), -- Percentage
    risk_reward_ratio VARCHAR(20), -- '1:1', '1:2', '1:3'
    crypto_assets JSONB, -- Array of selected crypto assets
    forex_pairs JSONB, -- Array of selected forex pairs
    account_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_questionnaire_user_id ON questionnaire_responses(user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_questionnaire_updated_at ON questionnaire_responses;
CREATE TRIGGER update_questionnaire_updated_at BEFORE UPDATE ON questionnaire_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

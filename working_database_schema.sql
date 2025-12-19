-- Enhanced User Data Database Schema for Render Deployment
-- This schema includes encryption and proper data storage

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with enhanced security
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    normalized_email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(200),
    phone VARCHAR(20),
    company VARCHAR(200),
    country VARCHAR(50),
    trading_experience VARCHAR(50),
    trading_goals TEXT,
    risk_tolerance VARCHAR(50),
    preferred_markets VARCHAR(100),
    trading_style VARCHAR(50),
    agree_to_marketing BOOLEAN DEFAULT false,
    plan_type VARCHAR(50) DEFAULT 'free',
    unique_id VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE
);

-- Enhanced customer data table with encryption support
CREATE TABLE IF NOT EXISTS customer_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    customer_uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    
    -- Personal Information (encrypted)
    full_name_encrypted TEXT,
    phone_encrypted TEXT,
    address_encrypted TEXT,
    date_of_birth_encrypted TEXT,
    
    -- Account Information
    membership_tier VARCHAR(50) DEFAULT 'free',
    account_status VARCHAR(50) DEFAULT 'active',
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_amount DECIMAL(10,2) DEFAULT 0,
    payment_date TIMESTAMP WITH TIME ZONE,
    
    -- Trading Information
    account_type VARCHAR(50),
    prop_firm VARCHAR(100),
    account_size DECIMAL(15,2) DEFAULT 0,
    trading_experience VARCHAR(50),
    risk_tolerance VARCHAR(50),
    trading_goals TEXT,
    
    -- Technical Information
    ip_address INET,
    user_agent TEXT,
    signup_source VARCHAR(100) DEFAULT 'website',
    referral_code VARCHAR(50),
    
    -- Questionnaire Data (JSON)
    questionnaire_data JSONB,
    
    -- Admin Information
    admin_verified BOOLEAN DEFAULT false,
    admin_notes TEXT,
    data_capture_complete BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Risk plan questionnaire data
CREATE TABLE IF NOT EXISTS risk_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    prop_firm VARCHAR(100),
    account_type VARCHAR(50),
    account_size DECIMAL(15,2),
    risk_percentage DECIMAL(5,2),
    has_account BOOLEAN DEFAULT false,
    account_equity DECIMAL(15,2),
    trading_session VARCHAR(50),
    crypto_assets JSONB,
    forex_assets JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    transaction_uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(50),
    transaction_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User activities log
CREATE TABLE IF NOT EXISTS user_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    activity_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin access logs
CREATE TABLE IF NOT EXISTS admin_access_logs (
    id SERIAL PRIMARY KEY,
    admin_user_id INTEGER,
    action_type VARCHAR(100) NOT NULL,
    target_user_id INTEGER,
    action_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_normalized_email ON users(normalized_email);
CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid);
CREATE INDEX IF NOT EXISTS idx_customer_data_user_id ON customer_data(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_data_uuid ON customer_data(customer_uuid);
CREATE INDEX IF NOT EXISTS idx_risk_plans_user_id ON risk_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_data_updated_at BEFORE UPDATE ON customer_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_plans_updated_at BEFORE UPDATE ON risk_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample admin user (password: admin123)
INSERT INTO users (username, email, normalized_email, password_hash, plan_type, unique_id, is_verified, is_active)
VALUES (
    'admin',
    'admin@tradingplatform.com',
    'admin@tradingplatform.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', -- admin123
    'admin',
    'ADMIN-001',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Create view for customer dashboard
CREATE OR REPLACE VIEW customer_dashboard_view AS
SELECT 
    u.id,
    u.uuid,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    u.full_name,
    u.phone,
    u.company,
    u.country,
    u.trading_experience,
    u.trading_goals,
    u.risk_tolerance,
    u.preferred_markets,
    u.trading_style,
    u.agree_to_marketing,
    u.plan_type,
    u.created_at,
    u.last_login,
    u.is_active,
    u.is_verified,
    cd.customer_uuid,
    cd.membership_tier,
    cd.account_status,
    cd.payment_status,
    cd.payment_method,
    cd.payment_amount,
    cd.payment_date,
    cd.account_type,
    cd.prop_firm,
    cd.account_size,
    cd.questionnaire_data,
    cd.admin_verified,
    cd.admin_notes,
    cd.data_capture_complete,
    cd.created_at as customer_created_at,
    cd.updated_at as customer_updated_at,
    cd.last_active
FROM users u
LEFT JOIN customer_data cd ON u.id = cd.user_id
WHERE u.is_active = true;

-- Grant permissions (adjust as needed for your Render setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
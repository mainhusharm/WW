-- =====================================================
-- COMPREHENSIVE ENHANCED DATABASE SCHEMA FOR TRADEREDGE PRO
-- =====================================================
-- This schema captures ALL data from enhanced signup, payment, questionnaire, and dashboard

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. ENHANCED USERS TABLE (CORE USER DATA)
-- =====================================================

DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE DEFAULT uuid_generate_v4(),
    
    -- Basic Information (from enhanced signup)
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(200),
    phone VARCHAR(20),
    company VARCHAR(200),
    country VARCHAR(100),
    
    -- Agreement and Consent (from enhanced signup)
    agree_to_terms BOOLEAN DEFAULT false,
    agree_to_marketing BOOLEAN DEFAULT false,
    privacy_policy_accepted BOOLEAN DEFAULT false,
    
    -- Account Status
    is_verified BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    membership_tier VARCHAR(20) DEFAULT 'free' CHECK (membership_tier IN ('free', 'kickstarter', 'starter', 'pro', 'enterprise')),
    plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'kickstarter', 'starter', 'pro', 'enterprise')),
    
    -- Registration Details
    registration_method VARCHAR(20) DEFAULT 'web' CHECK (registration_method IN ('web', 'api', 'fallback')),
    registration_ip VARCHAR(45),
    user_agent TEXT,
    referral_source VARCHAR(100),
    
    -- Authentication
    email_verification_token VARCHAR(255),
    email_verified_at TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit Fields
    created_by VARCHAR(100) DEFAULT 'system',
    updated_by VARCHAR(100) DEFAULT 'system'
);

-- Create indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_plan_type ON users(plan_type);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =====================================================
-- 2. ENHANCED PAYMENT DETAILS TABLE
-- =====================================================

CREATE TABLE payment_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_uuid UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(200) NOT NULL,
    
    -- Plan Information (from payment form)
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('kickstarter', 'starter', 'pro', 'enterprise')),
    plan_name VARCHAR(100) NOT NULL,
    plan_duration VARCHAR(50) DEFAULT 'monthly',
    plan_description TEXT,
    
    -- Pricing Information
    original_price DECIMAL(10,2) NOT NULL CHECK (original_price >= 0),
    discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    final_price DECIMAL(10,2) NOT NULL CHECK (final_price >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Coupon and Promotions
    coupon_code VARCHAR(50),
    coupon_applied BOOLEAN DEFAULT false,
    coupon_message TEXT,
    promotion_id VARCHAR(50),
    referral_code VARCHAR(50),
    
    -- Payment Method Details
    payment_method VARCHAR(50) NOT NULL, -- stripe, paypal, crypto_eth, crypto_sol, bank_transfer
    payment_provider VARCHAR(50),
    payment_provider_id VARCHAR(255),
    payment_intent_id VARCHAR(255),
    
    -- Transaction Information
    transaction_id VARCHAR(255) UNIQUE,
    transaction_hash VARCHAR(255), -- For crypto payments
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    
    -- Crypto Payment Details
    crypto_currency VARCHAR(10), -- ETH, SOL, BTC, etc.
    crypto_address VARCHAR(255), -- Receiving address
    crypto_amount DECIMAL(18,8), -- Amount in crypto
    crypto_network VARCHAR(50), -- Ethereum, Solana, etc.
    crypto_explorer_url TEXT,
    crypto_from_address VARCHAR(255), -- Sender's address
    crypto_verification_screenshot TEXT, -- Base64 or file path
    crypto_verification_status VARCHAR(20) DEFAULT 'pending' CHECK (crypto_verification_status IN ('pending', 'verified', 'rejected')),
    
    -- Billing Information
    billing_country VARCHAR(50),
    billing_state VARCHAR(50),
    billing_city VARCHAR(100),
    billing_address TEXT,
    billing_postal_code VARCHAR(20),
    company_name VARCHAR(200),
    tax_id VARCHAR(50),
    vat_number VARCHAR(50),
    
    -- Contact Information
    phone VARCHAR(20),
    alternate_email VARCHAR(255),
    
    -- Payment Processing Data
    payment_data JSONB, -- Store provider-specific data
    webhook_data JSONB, -- Store webhook responses
    refund_data JSONB, -- Store refund information
    verification_data JSONB, -- Store verification details
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_date TIMESTAMP WITH TIME ZONE,
    verification_date TIMESTAMP WITH TIME ZONE,
    refund_date TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    created_by VARCHAR(100) DEFAULT 'system',
    updated_by VARCHAR(100) DEFAULT 'system'
);

-- Create indexes for payment_details
CREATE INDEX idx_payment_details_user_id ON payment_details(user_id);
CREATE INDEX idx_payment_details_user_email ON payment_details(user_email);
CREATE INDEX idx_payment_details_transaction_id ON payment_details(transaction_id);
CREATE INDEX idx_payment_details_payment_status ON payment_details(payment_status);
CREATE INDEX idx_payment_details_payment_method ON payment_details(payment_method);
CREATE INDEX idx_payment_details_created_at ON payment_details(created_at);

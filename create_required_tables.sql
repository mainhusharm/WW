#!/bin/bash
# Create the required database tables for deploy_working_api.py
echo "🔧 Creating Required Database Tables"
echo "===================================="

# This script creates the tables that deploy_working_api.py expects
echo "Creating tables: users, payment_details, questionnaire_details, user_dashboard"

# Note: This would need to be run on your PostgreSQL database
# You can run this via psql or your database admin interface

cat << 'EOF'
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    country VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50) DEFAULT 'Standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payment_details table
CREATE TABLE IF NOT EXISTS payment_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    plan_name_payment VARCHAR(100),
    original_price DECIMAL(10,2),
    final_price DECIMAL(10,2),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'completed',
    payment_provider VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create questionnaire_details table
CREATE TABLE IF NOT EXISTS questionnaire_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    trades_per_day VARCHAR(50),
    trading_session VARCHAR(50),
    prop_firm VARCHAR(100),
    account_type VARCHAR(50),
    risk_percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_dashboard table
CREATE TABLE IF NOT EXISTS user_dashboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    current_equity DECIMAL(15,2) DEFAULT 0,
    total_pnl DECIMAL(15,2) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_payment_details_user_email ON payment_details(user_email);
CREATE INDEX IF NOT EXISTS idx_questionnaire_details_user_email ON questionnaire_details(user_email);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_user_email ON user_dashboard(user_email);
EOF

echo ""
echo "✅ Database schema created!"
echo ""
echo "📋 Next Steps:"
echo "1. Run this SQL in your PostgreSQL database"
echo "2. Or use the existing enhanced database schema"
echo "3. Test the API again"
echo ""
echo "🔗 To run this SQL:"
echo "   psql \"postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2\" -f create_required_tables.sql"

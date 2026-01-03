-- Migration to clean and recreate database schema
-- Drop all existing tables and recreate with proper schema

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS customer_activity CASCADE;
DROP TABLE IF EXISTS ticket_messages CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS prop_firm_rules CASCADE;
DROP TABLE IF EXISTS prop_firms CASCADE;
DROP TABLE IF EXISTS signal_tracking CASCADE;
DROP TABLE IF EXISTS trading_signals CASCADE;
DROP TABLE IF EXISTS trading_journal CASCADE;
DROP TABLE IF EXISTS user_dashboard_data CASCADE;
DROP TABLE IF EXISTS questionnaire_responses CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS enhanced_users CASCADE;
DROP TABLE IF EXISTS user_analytics CASCADE;
DROP TABLE IF EXISTS system_analytics CASCADE;

-- Drop views
DROP VIEW IF EXISTS user_complete_profile CASCADE;
DROP VIEW IF EXISTS dashboard_overview CASCADE;

-- Drop functions and triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

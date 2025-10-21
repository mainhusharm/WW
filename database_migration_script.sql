-- =====================================================
-- DATABASE MIGRATION SCRIPT FOR TRADEREDGE PRO
-- =====================================================
-- This script safely migrates existing data to the new schema
-- Run this AFTER running the comprehensive_database_schema.sql

-- =====================================================
-- 1. BACKUP EXISTING DATA (SAFETY FIRST)
-- =====================================================

-- Create backup tables for existing data
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;
CREATE TABLE IF NOT EXISTS customer_data_backup AS SELECT * FROM customer_data;

-- =====================================================
-- 2. MIGRATE EXISTING USERS DATA
-- =====================================================

-- Update existing plan_type values to new format
UPDATE users 
SET plan_type = CASE 
    WHEN plan_type = 'premium' THEN 'pro'
    WHEN plan_type = 'free' THEN 'basic'
    WHEN plan_type = 'professional' THEN 'pro'
    ELSE plan_type
END
WHERE plan_type IN ('premium', 'free', 'professional');

-- Ensure all users have valid plan types
UPDATE users 
SET plan_type = 'basic' 
WHERE plan_type NOT IN ('kickstarter', 'basic', 'pro', 'enterprise');

-- =====================================================
-- 3. MIGRATE EXISTING CUSTOMER DATA TO NEW TABLES
-- =====================================================

-- Migrate customer_data to questionnaire_details
INSERT INTO questionnaire_details (
    user_id,
    user_uuid,
    user_email,
    user_name,
    first_name,
    last_name,
    phone,
    country,
    trading_experience,
    trading_goals,
    trading_style,
    preferred_markets,
    has_account,
    account_equity,
    prop_firm,
    account_type,
    account_size,
    risk_percentage,
    risk_tolerance,
    additional_notes,
    marketing_consent,
    terms_accepted,
    privacy_policy_accepted,
    created_at,
    updated_at
)
SELECT 
    cd.user_id,
    u.uuid,
    u.email,
    COALESCE(cd.full_name_encrypted, u.full_name, CONCAT(u.first_name, ' ', u.last_name)),
    u.first_name,
    u.last_name,
    u.phone,
    u.country,
    COALESCE(cd.trading_experience, u.trading_experience, 'beginner'),
    COALESCE(cd.trading_goals, u.trading_goals),
    u.trading_style,
    ARRAY[COALESCE(u.preferred_markets, 'forex')],
    CASE 
        WHEN cd.account_size > 0 THEN 'yes'
        ELSE 'no'
    END,
    cd.account_size,
    cd.prop_firm,
    cd.account_type,
    cd.account_size,
    CASE 
        WHEN cd.risk_tolerance = 'low' THEN 1.0
        WHEN cd.risk_tolerance = 'medium' THEN 2.0
        WHEN cd.risk_tolerance = 'high' THEN 3.0
        ELSE 2.0
    END,
    cd.risk_tolerance,
    cd.admin_notes,
    u.agree_to_marketing,
    true, -- Assume terms were accepted for existing users
    true, -- Assume privacy policy was accepted
    cd.created_at,
    cd.updated_at
FROM customer_data cd
JOIN users u ON cd.user_id = u.id
WHERE NOT EXISTS (
    SELECT 1 FROM questionnaire_details qd 
    WHERE qd.user_id = cd.user_id
);

-- =====================================================
-- 4. CREATE INITIAL DASHBOARD DATA
-- =====================================================

-- Create initial dashboard data for users with questionnaire data
INSERT INTO user_dashboard_data (
    user_id,
    user_uuid,
    questionnaire_id,
    prop_firm,
    account_type,
    account_size,
    account_currency,
    risk_per_trade,
    trading_experience,
    trading_style,
    unique_id,
    account_balance,
    initial_equity,
    current_equity,
    max_daily_risk,
    risk_per_trade_amount,
    risk_per_trade_percentage,
    daily_loss_limit_percentage,
    weekly_loss_limit_percentage,
    monthly_loss_limit_percentage,
    consecutive_losses_limit,
    created_at,
    updated_at
)
SELECT 
    qd.user_id,
    qd.user_uuid,
    qd.id,
    qd.prop_firm,
    qd.account_type,
    qd.account_size,
    'USD',
    qd.risk_percentage,
    qd.trading_experience,
    qd.trading_style,
    u.unique_id,
    COALESCE(qd.account_equity, qd.account_size, 0),
    COALESCE(qd.account_equity, qd.account_size, 0),
    COALESCE(qd.account_equity, qd.account_size, 0),
    (qd.account_size * qd.risk_percentage / 100),
    (qd.account_size * qd.risk_percentage / 100),
    qd.risk_percentage,
    CASE 
        WHEN qd.risk_percentage <= 1 THEN 2.0
        WHEN qd.risk_percentage <= 2 THEN 3.0
        WHEN qd.risk_percentage <= 3 THEN 5.0
        ELSE 10.0
    END,
    CASE 
        WHEN qd.risk_percentage <= 1 THEN 5.0
        WHEN qd.risk_percentage <= 2 THEN 10.0
        WHEN qd.risk_percentage <= 3 THEN 15.0
        ELSE 20.0
    END,
    CASE 
        WHEN qd.risk_percentage <= 1 THEN 10.0
        WHEN qd.risk_percentage <= 2 THEN 20.0
        WHEN qd.risk_percentage <= 3 THEN 30.0
        ELSE 40.0
    END,
    CASE 
        WHEN qd.risk_percentage <= 1 THEN 3
        WHEN qd.risk_percentage <= 2 THEN 5
        WHEN qd.risk_percentage <= 3 THEN 7
        ELSE 10
    END,
    qd.created_at,
    qd.updated_at
FROM questionnaire_details qd
JOIN users u ON qd.user_id = u.id
WHERE NOT EXISTS (
    SELECT 1 FROM user_dashboard_data udd 
    WHERE udd.user_id = qd.user_id
);

-- =====================================================
-- 5. UPDATE EXISTING PAYMENT DATA (IF ANY)
-- =====================================================

-- If you have existing payment data, migrate it here
-- This is a template - adjust based on your existing payment table structure

-- Example migration for existing payment data:
/*
INSERT INTO payment_details (
    user_id,
    user_uuid,
    user_email,
    user_name,
    plan_type,
    plan_name,
    original_price,
    final_price,
    payment_method,
    payment_status,
    created_at,
    updated_at
)
SELECT 
    user_id,
    (SELECT uuid FROM users WHERE id = user_id),
    (SELECT email FROM users WHERE id = user_id),
    (SELECT COALESCE(full_name, username) FROM users WHERE id = user_id),
    plan_type,
    plan_type || ' Plan',
    amount,
    amount,
    'migrated',
    'completed',
    created_at,
    updated_at
FROM your_existing_payment_table
WHERE NOT EXISTS (
    SELECT 1 FROM payment_details pd 
    WHERE pd.user_id = your_existing_payment_table.user_id
);
*/

-- =====================================================
-- 6. DATA VALIDATION AND CLEANUP
-- =====================================================

-- Validate that all users have valid plan types
DO $$
DECLARE
    invalid_plan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_plan_count
    FROM users 
    WHERE plan_type NOT IN ('kickstarter', 'basic', 'pro', 'enterprise');
    
    IF invalid_plan_count > 0 THEN
        RAISE WARNING 'Found % users with invalid plan types. Updating to basic.', invalid_plan_count;
        UPDATE users 
        SET plan_type = 'basic' 
        WHERE plan_type NOT IN ('kickstarter', 'basic', 'pro', 'enterprise');
    END IF;
END $$;

-- Ensure all questionnaire data has required fields
UPDATE questionnaire_details 
SET trading_experience = 'beginner'
WHERE trading_experience IS NULL;

UPDATE questionnaire_details 
SET trades_per_day = '1-5'
WHERE trades_per_day IS NULL;

UPDATE questionnaire_details 
SET trading_session = 'london'
WHERE trading_session IS NULL;

UPDATE questionnaire_details 
SET risk_percentage = 2.0
WHERE risk_percentage IS NULL;

UPDATE questionnaire_details 
SET risk_reward_ratio = '1:2'
WHERE risk_reward_ratio IS NULL;

-- =====================================================
-- 7. CREATE SUMMARY REPORT
-- =====================================================

-- Display migration summary
DO $$
DECLARE
    user_count INTEGER;
    questionnaire_count INTEGER;
    dashboard_count INTEGER;
    payment_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO questionnaire_count FROM questionnaire_details;
    SELECT COUNT(*) INTO dashboard_count FROM user_dashboard_data;
    SELECT COUNT(*) INTO payment_count FROM payment_details;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Users migrated: %', user_count;
    RAISE NOTICE 'Questionnaire records: %', questionnaire_count;
    RAISE NOTICE 'Dashboard records: %', dashboard_count;
    RAISE NOTICE 'Payment records: %', payment_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- 8. CLEANUP (OPTIONAL - UNCOMMENT IF YOU WANT TO REMOVE BACKUP TABLES)
-- =====================================================

-- Uncomment these lines if you want to remove backup tables after successful migration
-- DROP TABLE IF EXISTS users_backup;
-- DROP TABLE IF EXISTS customer_data_backup;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

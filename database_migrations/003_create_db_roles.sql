-- Migration: Create database roles and permissions for signal system
-- This migration sets up proper database security for the signal pipeline

-- Create application role for API access (no delete permissions on signals)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'trading_app_role') THEN
        CREATE ROLE trading_app_role;
    END IF;
END $$;

-- Create admin role for signal management
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'trading_admin_role') THEN
        CREATE ROLE trading_admin_role;
    END IF;
END $$;

-- Grant basic permissions to application role
GRANT CONNECT ON DATABASE trading_journal TO trading_app_role;
GRANT USAGE ON SCHEMA public TO trading_app_role;

-- Grant read/write permissions to application role (but no delete on signals)
GRANT SELECT, INSERT, UPDATE ON users TO trading_app_role;
GRANT SELECT, INSERT, UPDATE ON user_signals TO trading_app_role;
GRANT SELECT, INSERT ON signals TO trading_app_role; -- No UPDATE/DELETE on signals
GRANT SELECT ON signal_risk_map TO trading_app_role;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO trading_app_role;

-- Grant admin role full permissions
GRANT CONNECT ON DATABASE trading_journal TO trading_admin_role;
GRANT USAGE ON SCHEMA public TO trading_admin_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO trading_admin_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO trading_admin_role;

-- Create function to check if user can delete signals (admin only)
CREATE OR REPLACE FUNCTION can_delete_signal(user_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN user_role = 'admin' OR user_role = 'trading_admin_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to archive signal (admin only)
CREATE OR REPLACE FUNCTION archive_signal(signal_uuid UUID, user_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT can_delete_signal(user_role) THEN
        RAISE EXCEPTION 'Insufficient permissions to archive signal';
    END IF;
    
    UPDATE signals 
    SET status = 'archived', updated_at = now()
    WHERE id = signal_uuid AND status = 'active';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON ROLE trading_app_role IS 'Application role with limited permissions - cannot delete signals';
COMMENT ON ROLE trading_admin_role IS 'Admin role with full permissions for signal management';
COMMENT ON FUNCTION can_delete_signal IS 'Checks if user role can delete/archive signals';
COMMENT ON FUNCTION archive_signal IS 'Archives a signal (admin only)';

-- Fresh User Data Table Schema for PostgreSQL
-- This table will capture ALL data from frontend forms

DROP TABLE IF EXISTS user_data CASCADE;

CREATE TABLE user_data (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Basic Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    
    -- Additional Information
    company VARCHAR(255),
    country VARCHAR(10),
    
    -- Agreements
    agree_to_terms BOOLEAN DEFAULT FALSE,
    agree_to_marketing BOOLEAN DEFAULT FALSE,
    
    -- Plan Information
    plan_type VARCHAR(100) DEFAULT 'Standard',
    plan_price DECIMAL(10,2),
    
    -- Metadata
    registration_method VARCHAR(50) DEFAULT 'web',
    status VARCHAR(50) DEFAULT 'active',
    access_token VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_user_data_email ON user_data(email);
CREATE INDEX idx_user_data_user_id ON user_data(user_id);
CREATE INDEX idx_user_data_created_at ON user_data(created_at);
CREATE INDEX idx_user_data_status ON user_data(status);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_data_updated_at 
    BEFORE UPDATE ON user_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for easy data retrieval
CREATE OR REPLACE VIEW user_data_summary AS
SELECT 
    user_id,
    first_name,
    last_name,
    email,
    phone,
    company,
    country,
    plan_type,
    status,
    created_at,
    CASE 
        WHEN last_login IS NOT NULL THEN 'Active'
        ELSE 'Never Logged In'
    END as login_status
FROM user_data
ORDER BY created_at DESC;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON user_data TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE user_data_id_seq TO your_app_user;

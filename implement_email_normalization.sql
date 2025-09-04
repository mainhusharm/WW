-- Email Normalization and One Email - One Account Implementation
-- This script ensures only one account can exist per email by normalizing Gmail addresses
-- and blocking duplicates with proper database constraints

-- Add normalized_email column to users table
ALTER TABLE users ADD COLUMN normalized_email TEXT;

-- Function to normalize email (remove dots and aliases for Gmail)
CREATE OR REPLACE FUNCTION normalize_email(email TEXT) RETURNS TEXT AS $$
DECLARE
  local_part TEXT;
  domain_part TEXT;
BEGIN
  domain_part := split_part(email, '@', 2);
  local_part := lower(split_part(email, '@', 1));

  IF domain_part = 'gmail.com' THEN
    local_part := regexp_replace(local_part, '\.', '', 'g');
    local_part := split_part(local_part, '+', 1);
  END IF;

  RETURN local_part || '@' || domain_part;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to automatically set normalized_email before insert/update
CREATE OR REPLACE FUNCTION set_normalized_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_email := normalize_email(NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically normalize emails
CREATE TRIGGER normalize_email_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_normalized_email();

-- Add unique constraint on normalized_email to prevent duplicates
ALTER TABLE users ADD CONSTRAINT unique_normalized_email UNIQUE(normalized_email);

-- Update existing users to have normalized emails
UPDATE users SET normalized_email = normalize_email(email) WHERE normalized_email IS NULL;

-- Create index for better performance
CREATE INDEX idx_users_normalized_email ON users(normalized_email);

-- Verify the implementation
SELECT 
    'Email normalization implemented successfully' as status,
    COUNT(*) as total_users,
    COUNT(normalized_email) as users_with_normalized_email
FROM users;

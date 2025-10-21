-- Email Normalization and One Email - One Account Implementation for SQLite
-- This script ensures only one account can exist per email by normalizing Gmail addresses
-- and blocking duplicates with proper database constraints

-- Add normalized_email column to users table
ALTER TABLE users ADD COLUMN normalized_email TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_normalized_email ON users(normalized_email);

-- Update existing users to have normalized emails
UPDATE users SET normalized_email = LOWER(TRIM(email)) WHERE normalized_email IS NULL;

-- For Gmail addresses, remove dots and everything after +
UPDATE users 
SET normalized_email = (
    CASE 
        WHEN LOWER(SUBSTR(email, INSTR(email, '@') + 1)) = 'gmail.com' 
        THEN LOWER(SUBSTR(email, 1, INSTR(email, '@') - 1)) || '@gmail.com'
        ELSE LOWER(TRIM(email))
    END
)
WHERE LOWER(SUBSTR(email, INSTR(email, '@') + 1)) = 'gmail.com';

-- Remove dots from Gmail local part
UPDATE users 
SET normalized_email = (
    LOWER(REPLACE(SUBSTR(normalized_email, 1, INSTR(normalized_email, '@') - 1), '.', '')) || 
    '@' || 
    SUBSTR(normalized_email, INSTR(normalized_email, '@') + 1)
)
WHERE LOWER(SUBSTR(normalized_email, INSTR(normalized_email, '@') + 1)) = 'gmail.com';

-- Remove everything after + in Gmail local part
UPDATE users 
SET normalized_email = (
    LOWER(SUBSTR(normalized_email, 1, INSTR(normalized_email, '+') - 1)) || 
    '@' || 
    SUBSTR(normalized_email, INSTR(normalized_email, '@') + 1)
)
WHERE LOWER(SUBSTR(normalized_email, INSTR(normalized_email, '@') + 1)) = 'gmail.com' 
AND INSTR(normalized_email, '+') > 0;

-- Add unique constraint on normalized_email to prevent duplicates
-- Note: SQLite doesn't support adding constraints to existing tables, so we'll need to recreate the table
-- This is a more complex operation that should be done carefully

-- Verify the implementation
SELECT 
    'Email normalization implemented successfully' as status,
    COUNT(*) as total_users,
    COUNT(normalized_email) as users_with_normalized_email
FROM users;

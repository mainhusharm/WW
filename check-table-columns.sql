-- Check what columns exist in the payment details table
-- Run this in your Supabase SQL Editor

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment details' 
ORDER BY ordinal_position;

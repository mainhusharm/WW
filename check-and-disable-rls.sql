-- Check and disable RLS for payment details table
-- Run this in your Supabase SQL Editor

-- First, check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'payment details';

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow public insert on payment details" ON "payment details";
DROP POLICY IF EXISTS "Allow public read on payment details" ON "payment details";
DROP POLICY IF EXISTS "Allow public update on payment details" ON "payment details";
DROP POLICY IF EXISTS "Allow public delete on payment details" ON "payment details";

-- Disable RLS
ALTER TABLE "payment details" DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'payment details';

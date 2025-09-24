-- Basic Payment Details Table
-- Run this in your Supabase SQL Editor

-- Drop the existing table if it exists
DROP TABLE IF EXISTS "payment details";

-- Create a basic payment details table with only essential columns
CREATE TABLE "payment details" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for now
ALTER TABLE "payment details" DISABLE ROW LEVEL SECURITY;

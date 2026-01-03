-- Fix Payment Details Table
-- Run this in your Supabase SQL Editor

-- Drop the existing table if it exists
DROP TABLE IF EXISTS "payment details";

-- Create the payment details table with correct structure
CREATE TABLE "payment details" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_price DECIMAL(10,2) NOT NULL,
  coupon_code TEXT,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_provider TEXT,
  payment_provider_id TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  country TEXT,
  company TEXT,
  phone TEXT,
  payment_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_payment_details_user_id ON "payment details" (user_id);
CREATE INDEX idx_payment_details_user_email ON "payment details" (user_email);
CREATE INDEX idx_payment_details_transaction_id ON "payment details" (transaction_id);
CREATE INDEX idx_payment_details_created_at ON "payment details" (created_at);

-- Disable RLS for now
ALTER TABLE "payment details" DISABLE ROW LEVEL SECURITY;

-- Add a comment to the table
COMMENT ON TABLE "payment details" IS 'Stores payment information from the payment-enhanced page';

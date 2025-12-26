-- Clean up existing coupon codes from payment_transactions table
-- This script removes all coupon-related data from existing payments

-- First, let's see what coupon codes currently exist in the database
SELECT DISTINCT coupon_code
FROM payment_transactions
WHERE coupon_code IS NOT NULL AND coupon_code != '';

-- Remove all coupon codes from existing payment transactions
-- This sets coupon_code to NULL and resets related fields
UPDATE payment_transactions
SET
    coupon_code = NULL,
    coupon_applied = false,
    coupon_discount_percentage = NULL
WHERE coupon_code IS NOT NULL;

-- Verify the cleanup
SELECT COUNT(*) as payments_with_coupons
FROM payment_transactions
WHERE coupon_code IS NOT NULL OR coupon_applied = true;

-- Optional: If you want to completely remove any payment records that used coupons
-- (Uncomment the following lines if needed)
-- DELETE FROM payment_transactions
-- WHERE coupon_code IS NOT NULL;

COMMIT;

-- Fix RLS policies for the payments table
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Option A: Disable RLS entirely on payments (simplest, if you rely on app-level auth)
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------
-- Option B: Keep RLS but add permissive policies (recommended for security)
-- Comment out Option A above and use these instead:
-- -----------------------------------------------------------------------

-- Allow authenticated users to read all payments in their org
-- CREATE POLICY "payments_select" ON payments
--   FOR SELECT USING (true);

-- Allow authenticated users to insert payments
-- CREATE POLICY "payments_insert" ON payments
--   FOR INSERT WITH CHECK (true);

-- Allow authenticated users to update payments
-- CREATE POLICY "payments_update" ON payments
--   FOR UPDATE USING (true);

-- Also run the payments table migration if not done yet:
ALTER TABLE payments ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
UPDATE payments SET description = plan WHERE description = '' AND plan IS NOT NULL;
ALTER TABLE payments ALTER COLUMN plan DROP NOT NULL;

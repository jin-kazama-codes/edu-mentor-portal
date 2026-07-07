-- Migration: Make payments flexible — replace fixed plan enum with free-text description
-- Run this in Supabase SQL Editor

-- Step 1: Add the new description column (free text, not constrained)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';

-- Step 2: Migrate existing plan values into the description column
UPDATE payments SET description = plan WHERE description = '' AND plan IS NOT NULL;

-- Step 3: Drop the constraint on the plan column (make it free text / nullable)
ALTER TABLE payments
  ALTER COLUMN plan DROP NOT NULL;

-- Step 4 (optional): If you want to fully remove the plan column after migration
-- ALTER TABLE payments DROP COLUMN IF EXISTS plan;
-- (Leave plan column as nullable for backwards compatibility)

-- =============================================================
-- PROPER FIX: Run this in Supabase SQL Editor.
-- This creates Supabase Auth accounts for all existing users
-- in your public.users table so they get real JWTs on login,
-- which makes all RLS policies work correctly.
-- 
-- After running this, revert MentorsView.tsx to use the direct
-- supabase.from('mentors').insert() call instead of the RPC.
-- The standard password for all users is: Password123!
-- =============================================================

-- Step 1: Verify which users exist in auth.users vs public.users
SELECT 
  u.email,
  u.role,
  u.organization,
  CASE WHEN a.email IS NOT NULL THEN 'Has Auth Account' ELSE 'NO AUTH ACCOUNT' END as auth_status
FROM public.users u
LEFT JOIN auth.users a ON LOWER(a.email) = LOWER(u.email)
ORDER BY auth_status DESC, u.role;

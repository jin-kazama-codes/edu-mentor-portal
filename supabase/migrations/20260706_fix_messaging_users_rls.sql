-- Migration to fix messaging visibility by updating the RLS select policy on the users table.
-- This allows authenticated users to view profiles of other users in the same organization.

-- 1. Drop the old restricted policy
DROP POLICY IF EXISTS users_select ON users;

-- 2. Create the updated policy allowing same-organization visibility
CREATE POLICY users_select ON users FOR SELECT USING (
  LOWER(email) = LOWER(auth.jwt() ->> 'email')
  OR organization = get_current_user_org()
  OR get_current_user_role() = 'Super Admin'
);

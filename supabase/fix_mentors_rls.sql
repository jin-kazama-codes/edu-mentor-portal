-- =============================================================
-- FIX: mentors table INSERT RLS policy for Organization Admin
-- The original mentors_modify policy used FOR ALL with USING only,
-- which does NOT cover INSERT (INSERT needs WITH CHECK).
-- This script drops the old combined policy and creates proper
-- separate INSERT / UPDATE / DELETE policies.
-- Run this in your Supabase SQL Editor.
-- =============================================================

-- Drop all existing mentors policies before recreating
DROP POLICY IF EXISTS mentors_modify ON mentors;
DROP POLICY IF EXISTS mentors_insert ON mentors;
DROP POLICY IF EXISTS mentors_update ON mentors;
DROP POLICY IF EXISTS mentors_delete ON mentors;

-- Allow INSERT: Super Admin or Org Admin inserting into their own org
CREATE POLICY mentors_insert ON mentors FOR INSERT WITH CHECK (
  get_current_user_role() = 'Super Admin'
  OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
  OR (check_permission('User and Role Management', 'create') AND organization = get_current_user_org())
);

-- Allow UPDATE: Super Admin or Org Admin updating records in their own org
CREATE POLICY mentors_update ON mentors FOR UPDATE USING (
  get_current_user_role() = 'Super Admin'
  OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
  OR (check_permission('User and Role Management', 'update') AND organization = get_current_user_org())
);

-- Allow DELETE: Super Admin or Org Admin deleting records in their own org
CREATE POLICY mentors_delete ON mentors FOR DELETE USING (
  get_current_user_role() = 'Super Admin'
  OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
  OR (check_permission('User and Role Management', 'delete') AND organization = get_current_user_org())
);

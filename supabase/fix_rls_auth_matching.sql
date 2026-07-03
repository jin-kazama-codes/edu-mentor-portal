-- =============================================================
-- FIX: RLS helper functions to match by JWT email instead of auth.uid()
-- Also adds Organization Admin bypass to check_permission()
-- Run this in your Supabase SQL Editor.
-- =============================================================

-- Fix get_current_user_role() to match by email
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Fix get_current_user_org() to match by email  
CREATE OR REPLACE FUNCTION get_current_user_org()
RETURNS TEXT AS $$
  SELECT organization FROM users WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Fix check_permission() — now bypasses for BOTH Super Admin AND Organization Admin
CREATE OR REPLACE FUNCTION check_permission(module_name TEXT, action_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  u_role TEXT;
  u_org TEXT;
  has_perm BOOLEAN;
BEGIN
  SELECT role, organization INTO u_role, u_org 
  FROM users 
  WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email');
  
  IF u_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Super Admin and Organization Admin have full access
  IF u_role IN ('Super Admin', 'Organization Admin') THEN
    RETURN TRUE;
  END IF;

  -- Check organization-specific policy
  SELECT ((roles -> u_role ->> action_name)::boolean) INTO has_perm
  FROM permissions
  WHERE module = module_name AND organization = u_org;
  
  -- Fall back to global default policy
  IF has_perm IS NULL THEN
    SELECT ((roles -> u_role ->> action_name)::boolean) INTO has_perm
    FROM permissions
    WHERE module = module_name AND organization = 'Global';
  END IF;
  
  RETURN COALESCE(has_perm, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fix users_select policy (self-lookup by email)
DROP POLICY IF EXISTS users_select ON users;
CREATE POLICY users_select ON users FOR SELECT USING (
  LOWER(email) = LOWER(auth.jwt() ->> 'email')
  OR (check_permission('User and Role Management', 'read') AND organization = get_current_user_org())
  OR get_current_user_role() = 'Super Admin'
);

-- Fix users_insert policy — explicitly allow Org Admin to insert in their org
DROP POLICY IF EXISTS users_insert ON users;
CREATE POLICY users_insert ON users FOR INSERT WITH CHECK (
  get_current_user_role() = 'Super Admin'
  OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
  OR (check_permission('User and Role Management', 'create') AND organization = get_current_user_org())
);

-- Fix users_update policy
DROP POLICY IF EXISTS users_update ON users;
CREATE POLICY users_update ON users FOR UPDATE USING (
  LOWER(email) = LOWER(auth.jwt() ->> 'email')
  OR get_current_user_role() = 'Super Admin'
  OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
  OR (check_permission('User and Role Management', 'update') AND organization = get_current_user_org())
);

-- Fix users_delete policy
DROP POLICY IF EXISTS users_delete ON users;
CREATE POLICY users_delete ON users FOR DELETE USING (
  get_current_user_role() = 'Super Admin'
  OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
  OR (check_permission('User and Role Management', 'delete') AND organization = get_current_user_org())
);

-- Fix sessions_select policy
DROP POLICY IF EXISTS sessions_select ON sessions;
CREATE POLICY sessions_select ON sessions FOR SELECT USING (
  get_current_user_role() = 'Super Admin'
  OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
  OR (get_current_user_role() = 'Mentor' AND organization = get_current_user_org() 
      AND mentor = (SELECT name FROM users WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')))
  OR (get_current_user_role() = 'Assistant' AND organization = get_current_user_org() 
      AND mentor = (SELECT name FROM users WHERE id = (
        SELECT mentor_id FROM users WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
      )))
  OR (get_current_user_role() = 'Student' AND organization = get_current_user_org() 
      AND student = (SELECT name FROM users WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')))
);

-- Fix students_select policy
DROP POLICY IF EXISTS students_select ON students;
CREATE POLICY students_select ON students FOR SELECT USING (
  get_current_user_role() = 'Super Admin'
  OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
  OR (get_current_user_role() = 'Mentor' AND organization = get_current_user_org() AND name = ANY (
        SELECT unnest("studentsAssigned") FROM mentors 
        WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
     ))
  OR (get_current_user_role() = 'Assistant' AND organization = get_current_user_org())
  OR LOWER(email) = LOWER(auth.jwt() ->> 'email')
);

-- Fix mentors_select policy
DROP POLICY IF EXISTS mentors_select ON mentors;
CREATE POLICY mentors_select ON mentors FOR SELECT USING (
  get_current_user_role() = 'Super Admin'
  OR (organization = get_current_user_org() AND check_permission('User and Role Management', 'read'))
  OR LOWER(email) = LOWER(auth.jwt() ->> 'email')
);

-- Fix evaluations_select policy
DROP POLICY IF EXISTS evaluations_select ON evaluations;
CREATE POLICY evaluations_select ON evaluations FOR SELECT USING (
  (get_current_user_role() = 'Super Admin' OR (organization = get_current_user_org() AND get_current_user_role() = 'Organization Admin'))
  OR (get_current_user_role() = 'Mentor' AND organization = get_current_user_org() AND "studentName" = ANY (
        SELECT unnest("studentsAssigned") FROM mentors 
        WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
     ))
  OR (get_current_user_role() = 'Student' AND organization = get_current_user_org() 
      AND "studentName" = (SELECT name FROM users WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')))
);

-- Fix payments_select policy
DROP POLICY IF EXISTS payments_select ON payments;
CREATE POLICY payments_select ON payments FOR SELECT USING (
  get_current_user_role() = 'Super Admin'
  OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
  OR (get_current_user_role() = 'Student' AND organization = get_current_user_org() 
      AND student = (SELECT name FROM users WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')))
);

-- Drop the old select policy for mentors if it exists
DROP POLICY IF EXISTS mentors_select ON mentors;

-- Recreate mentors_select policy to allow students to read mentors in their organization
CREATE POLICY mentors_select ON mentors FOR SELECT USING (
  get_current_user_role() = 'Super Admin'
  OR (organization = get_current_user_org() AND check_permission('User and Role Management', 'read'))
  OR LOWER(email) = LOWER(auth.jwt() ->> 'email')
  OR (get_current_user_role() = 'Student' AND organization = get_current_user_org())
);

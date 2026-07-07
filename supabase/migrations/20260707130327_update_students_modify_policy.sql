-- 20260707130327_update_students_modify_policy.sql
-- Migration to update the RLS modify policy for the students table to allow Mentors and Assistants to update progress.

-- Drop the old policy
DROP POLICY IF EXISTS students_modify ON students;

-- Recreate the policy with expanded roles
CREATE POLICY students_modify ON students FOR ALL USING (
  get_current_user_role() = 'Super Admin'
  OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
  OR (get_current_user_role() = 'Mentor' AND organization = get_current_user_org() AND (
        mentor = (SELECT name FROM mentors WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email'))
     ))
  OR (get_current_user_role() = 'Assistant' AND organization = get_current_user_org() AND (
        mentor = (
          SELECT name FROM mentors WHERE id = (
            SELECT mentor_id FROM users WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
          )
        )
     ))
);

-- Migration to add day_begin and day_end columns to student_attendance
-- and update the RLS modify policy to allow students to log their own attendance.

-- Add day_begin and day_end columns if they don't exist
ALTER TABLE student_attendance ADD COLUMN IF NOT EXISTS day_begin TIMESTAMPTZ;
ALTER TABLE student_attendance ADD COLUMN IF NOT EXISTS day_end TIMESTAMPTZ;

-- Drop the old modify policy
DROP POLICY IF EXISTS student_attendance_modify ON student_attendance;

-- Recreate the modify policy with Student role permission added
CREATE POLICY student_attendance_modify ON student_attendance FOR ALL USING (
  get_current_user_role() = 'Super Admin'
  OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
  OR (get_current_user_role() = 'Mentor' AND organization = get_current_user_org() AND (
        student_id IN (
          SELECT id FROM students 
          WHERE mentor = (SELECT name FROM mentors WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email'))
        )
     ))
  OR (get_current_user_role() = 'Assistant' AND organization = get_current_user_org() AND (
        student_id IN (
          SELECT id FROM students WHERE organization = get_current_user_org()
        )
     ))
  OR (get_current_user_role() = 'Student' AND organization = get_current_user_org() AND (
        student_id IN (
          SELECT id FROM students WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
        )
     ))
);

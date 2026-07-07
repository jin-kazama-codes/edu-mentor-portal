-- 20260707120614_create_student_attendance.sql
-- Migration to set up student attendance tracking with RLS policies and automatic calculation triggers.

-- Create student_attendance table if it does not exist
CREATE TABLE IF NOT EXISTS student_attendance (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- Format: YYYY-MM-DD
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'On Leave', 'On Field', 'Wfh', 'Half', 'Weekend')),
  organization TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (student_id, date)
);

-- Add performance-optimizing indexes
CREATE INDEX IF NOT EXISTS idx_student_attendance_org ON student_attendance (organization);
CREATE INDEX IF NOT EXISTS idx_student_attendance_student_date ON student_attendance (student_id, date);

-- Enable Row Level Security (RLS)
ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to support clean reapplies if needed)
DROP POLICY IF EXISTS student_attendance_select ON student_attendance;
DROP POLICY IF EXISTS student_attendance_modify ON student_attendance;

-- SELECT Policy:
-- Super Admins and Org Admins see all logs in their respective scopes.
-- Mentors see their assigned students' records.
-- Assistants see their mentor's assigned students' records.
-- Students see only their own attendance.
CREATE POLICY student_attendance_select ON student_attendance FOR SELECT USING (
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

-- MODIFY Policy:
-- Admins, Mentors, and Assistants can insert, update, or delete.
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
);

-- Trigger function to automatically compute and update the student's overall attendance rate
CREATE OR REPLACE FUNCTION update_student_attendance_percentage()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id TEXT;
  v_present_count NUMERIC;
  v_half_count NUMERIC;
  v_absent_count NUMERIC;
  v_leave_count NUMERIC;
  v_field_count NUMERIC;
  v_wfh_count NUMERIC;
  v_total_days NUMERIC;
  v_percentage INTEGER;
  v_latest_status TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_student_id := OLD.student_id;
  ELSE
    v_student_id := NEW.student_id;
  END IF;

  -- Count statuses for active evaluated days
  SELECT 
    COUNT(*) FILTER (WHERE status = 'Present'),
    COUNT(*) FILTER (WHERE status = 'Half'),
    COUNT(*) FILTER (WHERE status = 'Absent'),
    COUNT(*) FILTER (WHERE status = 'On Leave'),
    COUNT(*) FILTER (WHERE status = 'On Field'),
    COUNT(*) FILTER (WHERE status = 'Wfh')
  INTO 
    v_present_count,
    v_half_count,
    v_absent_count,
    v_leave_count,
    v_field_count,
    v_wfh_count
  FROM student_attendance
  WHERE student_id = v_student_id;

  -- Calculate total evaluated days (excluding weekends)
  v_total_days := v_present_count + v_absent_count + v_field_count + v_wfh_count + v_half_count + v_leave_count;

  IF v_total_days > 0 THEN
    v_percentage := ROUND(((v_present_count + v_field_count + v_wfh_count + (v_half_count * 0.5)) / v_total_days) * 100);
    UPDATE students 
    SET attendance = v_percentage
    WHERE id = v_student_id;
  END IF;

  -- Find the most recent marked attendance status (excluding 'Weekend')
  SELECT status INTO v_latest_status
  FROM student_attendance
  WHERE student_id = v_student_id AND status != 'Weekend'
  ORDER BY date DESC
  LIMIT 1;

  IF v_latest_status = 'On Leave' THEN
    UPDATE students
    SET status = 'On Leave'
    WHERE id = v_student_id;
  ELSIF v_latest_status IS NOT NULL OR v_total_days = 0 THEN
    -- If they are not On Leave, and they were previously marked On Leave, revert them to Active.
    UPDATE students
    SET status = 'Active'
    WHERE id = v_student_id AND status = 'On Leave';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger
DROP TRIGGER IF EXISTS trigger_update_student_attendance_percentage ON student_attendance;
CREATE TRIGGER trigger_update_student_attendance_percentage
AFTER INSERT OR UPDATE OR DELETE ON student_attendance
FOR EACH ROW
EXECUTE FUNCTION update_student_attendance_percentage();

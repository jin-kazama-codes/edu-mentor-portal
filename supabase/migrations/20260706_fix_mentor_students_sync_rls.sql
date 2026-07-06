-- Migration to fix mentor student visibility by updating RLS policies and sync trigger

-- 1. Drop old policies
DROP POLICY IF EXISTS students_select ON students;
DROP POLICY IF EXISTS evaluations_select ON evaluations;

-- 2. Create updated students_select policy
CREATE POLICY students_select ON students FOR SELECT USING (
  get_current_user_role() = 'Super Admin'
  OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
  -- Mentors can see their assigned students
  OR (get_current_user_role() = 'Mentor' AND organization = get_current_user_org() AND (
        name = ANY (
          SELECT unnest("studentsAssigned") FROM mentors 
          WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
        )
        OR
        mentor = (
          SELECT name FROM mentors 
          WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
        )
     ))
  -- Assistants can see all students in their organization
  OR (get_current_user_role() = 'Assistant' AND organization = get_current_user_org())
  -- Students see their own student record
  OR LOWER(email) = LOWER(auth.jwt() ->> 'email')
);

-- 3. Create updated evaluations_select policy
CREATE POLICY evaluations_select ON evaluations FOR SELECT USING (
  (get_current_user_role() = 'Super Admin' OR (organization = get_current_user_org() AND get_current_user_role() = 'Organization Admin'))
  OR (get_current_user_role() = 'Mentor' AND organization = get_current_user_org() AND (
        "studentName" = ANY (
          SELECT unnest("studentsAssigned") FROM mentors 
          WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
        )
        OR
        "studentName" IN (
          SELECT name FROM students 
          WHERE mentor = (SELECT name FROM mentors WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email'))
        )
     ))
  OR (get_current_user_role() = 'Student' AND organization = get_current_user_org() 
      AND "studentName" = (SELECT name FROM users WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')))
);

-- 4. Create trigger function to sync mentors.studentsAssigned when students table is modified
CREATE OR REPLACE FUNCTION sync_mentor_assigned_students()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE mentors 
    SET "studentsAssigned" = ARRAY(
      SELECT DISTINCT name FROM students WHERE mentor = NEW.mentor AND organization = NEW.organization
    )
    WHERE name = NEW.mentor AND organization = NEW.organization;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.mentor <> NEW.mentor THEN
      UPDATE mentors 
      SET "studentsAssigned" = ARRAY(
        SELECT DISTINCT name FROM students WHERE mentor = OLD.mentor AND organization = OLD.organization
      )
      WHERE name = OLD.mentor AND organization = OLD.organization;
    END IF;
    
    UPDATE mentors 
    SET "studentsAssigned" = ARRAY(
      SELECT DISTINCT name FROM students WHERE mentor = NEW.mentor AND organization = NEW.organization
    )
    WHERE name = NEW.mentor AND organization = NEW.organization;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE mentors 
    SET "studentsAssigned" = ARRAY(
      SELECT DISTINCT name FROM students WHERE mentor = OLD.mentor AND organization = OLD.organization
    )
    WHERE name = OLD.mentor AND organization = OLD.organization;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create the trigger on the students table
DROP TRIGGER IF EXISTS trigger_sync_mentor_assigned_students ON students;
CREATE TRIGGER trigger_sync_mentor_assigned_students
AFTER INSERT OR UPDATE OR DELETE ON students
FOR EACH ROW
EXECUTE FUNCTION sync_mentor_assigned_students();

-- 6. Perform a one-time sync of existing data to ensure consistency
UPDATE mentors m
SET "studentsAssigned" = ARRAY(
  SELECT DISTINCT name FROM students s 
  WHERE s.mentor = m.name AND s.organization = m.organization
);

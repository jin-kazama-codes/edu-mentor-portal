-- Allow Assistant role to SELECT evaluations of students assigned to their mentor
DROP POLICY IF EXISTS evaluations_select ON evaluations;
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
  OR (get_current_user_role() = 'Assistant' AND organization = get_current_user_org() AND (
        "studentName" IN (
          SELECT name FROM students 
          WHERE mentor = (
            SELECT name FROM users 
            WHERE id = (SELECT mentor_id FROM users WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email'))
          )
        )
     ))
  OR (get_current_user_role() = 'Student' AND organization = get_current_user_org() 
      AND "studentName" = (SELECT name FROM users WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')))
);

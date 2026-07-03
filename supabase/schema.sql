-- Edu-Mentor Portal Database Schema Setup with Multi-Tenant RLS
-- Run this in your Supabase SQL Editor to create all required tables.

-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS assignment_mentors CASCADE;
DROP TABLE IF EXISTS unassigned_students CASCADE;
DROP TABLE IF EXISTS report_revenue_trend CASCADE;
DROP TABLE IF EXISTS report_monthly_sessions CASCADE;
DROP TABLE IF EXISTS report_mentor_activity CASCADE;
DROP TABLE IF EXISTS report_student_growth CASCADE;
DROP TABLE IF EXISTS content_resources CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_channels CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS mentors CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- 1. Organizations table
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('Enterprise', 'Premium Growth', 'Standard', 'Basic')),
  users INTEGER NOT NULL DEFAULT 0,
  students INTEGER NOT NULL DEFAULT 0,
  mentors INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Suspended', 'Trialing')) DEFAULT 'Active',
  "renewalDate" TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Mentors table
CREATE TABLE mentors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  "studentsAssigned" TEXT[] NOT NULL DEFAULT '{}',
  experience TEXT NOT NULL,
  rating NUMERIC NOT NULL DEFAULT 0.0,
  availability TEXT NOT NULL CHECK (availability IN ('Full-time', 'Part-time', 'Weekends Only', 'On-demand')),
  "upcomingSessions" INTEGER NOT NULL DEFAULT 0,
  performance TEXT NOT NULL CHECK (performance IN ('Outstanding', 'Exceeding', 'Meeting', 'Needs Review')),
  avatar TEXT NOT NULL,
  organization TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Students table
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Others')),
  age INTEGER NOT NULL,
  grade TEXT NOT NULL,
  mentor TEXT NOT NULL, -- Mentor name reference
  guardian TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  attendance INTEGER NOT NULL DEFAULT 0 CHECK (attendance >= 0 AND attendance <= 100),
  "upcomingSession" TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Active', 'On Leave', 'Graduated', 'Suspended')) DEFAULT 'Active',
  avatar TEXT NOT NULL,
  organization TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Users table (application users)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('Super Admin', 'Organization Admin', 'Mentor', 'Assistant', 'Student')),
  organization TEXT NOT NULL,
  mentor_id TEXT, -- For Assistants to be attached to a specific Mentor (points to users.id)
  status TEXT NOT NULL CHECK (status IN ('Active', 'Inactive', 'Pending')) DEFAULT 'Active',
  avatar TEXT NOT NULL,
  "createdDate" TEXT NOT NULL,
  "lastLogin" TEXT NOT NULL,
  number TEXT,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Others')),
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  student TEXT NOT NULL,
  mentor TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  duration TEXT NOT NULL,
  "meetingLink" TEXT NOT NULL,
  attendance TEXT NOT NULL CHECK (attendance IN ('Present', 'Absent', 'Excused', 'Pending')) DEFAULT 'Pending',
  homework TEXT NOT NULL,
  notes TEXT NOT NULL,
  "privateNotes" TEXT,
  "sharedNotes" TEXT,
  "voiceNotesUrl" TEXT,
  files TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('Completed', 'Upcoming', 'Cancelled')),
  category TEXT NOT NULL CHECK (category IN ('Academic', 'Behavioral', 'Doubt Clearing', 'Exam Prep', 'Special Need')),
  organization TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Chat Channels table
CREATE TABLE chat_channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('channel', 'direct')),
  "unreadCount" INTEGER NOT NULL DEFAULT 0,
  subtitle TEXT NOT NULL,
  avatar TEXT,
  organization TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Chat Messages table
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  avatar TEXT,
  text TEXT NOT NULL,
  time TEXT NOT NULL,
  "isSelf" BOOLEAN NOT NULL DEFAULT false,
  organization TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Payments table
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  amount NUMERIC NOT NULL,
  student TEXT NOT NULL,
  organization TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Paid', 'Pending', 'Failed', 'Refunded')),
  date TEXT NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('Monthly Pro', 'Annual Elite', 'Quarterly Basic', 'One-Time Session')),
  "refundAmount" NUMERIC,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Audit Logs table
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  "user" TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Super Admin', 'Organization Admin', 'Mentor', 'Assistant', 'Student')),
  organization TEXT NOT NULL,
  action TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Success', 'Failed', 'Warning')),
  severity TEXT NOT NULL CHECK (severity IN ('Info', 'Medium', 'High', 'Critical')),
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Permissions table
CREATE TABLE permissions (
  module TEXT NOT NULL,
  organization TEXT NOT NULL DEFAULT 'Global',
  roles JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (module, organization)
);

-- 11. Content Resources table
CREATE TABLE content_resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  duration TEXT,
  category TEXT NOT NULL,
  author TEXT NOT NULL,
  rating NUMERIC NOT NULL DEFAULT 0.0,
  size TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  bookmarked BOOLEAN NOT NULL DEFAULT false,
  organization TEXT NOT NULL DEFAULT 'Global',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 12. Student Growth Report Data
CREATE TABLE report_student_growth (
  id SERIAL PRIMARY KEY,
  month TEXT NOT NULL,
  "ActiveStudents" INTEGER NOT NULL,
  "NewRegistrations" INTEGER NOT NULL,
  organization TEXT NOT NULL DEFAULT 'Global',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 13. Mentor Activity Report Data
CREATE TABLE report_mentor_activity (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  "Sessions" INTEGER NOT NULL,
  "Hours" INTEGER NOT NULL,
  "FeedbackRating" NUMERIC NOT NULL,
  organization TEXT NOT NULL DEFAULT 'Global',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 14. Monthly Sessions Report Data
CREATE TABLE report_monthly_sessions (
  id SERIAL PRIMARY KEY,
  month TEXT NOT NULL,
  "Completed" INTEGER NOT NULL,
  "Cancelled" INTEGER NOT NULL,
  "Upcoming" INTEGER NOT NULL,
  organization TEXT NOT NULL DEFAULT 'Global',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 15. Revenue Trend Report Data
CREATE TABLE report_revenue_trend (
  id SERIAL PRIMARY KEY,
  month TEXT NOT NULL,
  "Revenue" INTEGER NOT NULL,
  "Subscriptions" INTEGER NOT NULL,
  "Sessions" INTEGER NOT NULL,
  organization TEXT NOT NULL DEFAULT 'Global',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 16. Assignment view - unassigned students
CREATE TABLE unassigned_students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "subjectNeed" TEXT NOT NULL,
  grade TEXT NOT NULL,
  avatar TEXT NOT NULL,
  organization TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 17. Assignment view - mentors
CREATE TABLE assignment_mentors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  "assignedCount" INTEGER NOT NULL,
  "maxCapacity" INTEGER NOT NULL,
  avatar TEXT NOT NULL,
  "activeStudents" TEXT[] NOT NULL DEFAULT '{}',
  organization TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 18. Evaluations table
CREATE TABLE evaluations (
  id TEXT PRIMARY KEY,
  "studentName" TEXT NOT NULL,
  academic INTEGER NOT NULL DEFAULT 85,
  behaviour INTEGER NOT NULL DEFAULT 90,
  attendance INTEGER NOT NULL DEFAULT 95,
  communication INTEGER NOT NULL DEFAULT 82,
  "tutorComments" TEXT NOT NULL,
  "improvementAreas" TEXT NOT NULL,
  goals TEXT NOT NULL,
  "parentFeedback" TEXT NOT NULL,
  "isSigned" BOOLEAN NOT NULL DEFAULT false,
  organization TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add performance-optimizing indexes
CREATE INDEX idx_users_org_role ON users (organization, role);
CREATE INDEX idx_students_org ON students (organization);
CREATE INDEX idx_mentors_org ON mentors (organization);
CREATE INDEX idx_sessions_org ON sessions (organization);
CREATE INDEX idx_evaluations_org ON evaluations (organization);
CREATE INDEX idx_payments_org ON payments (organization);
CREATE INDEX idx_audit_logs_org ON audit_logs (organization);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_student_growth ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_mentor_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_monthly_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_revenue_trend ENABLE ROW LEVEL SECURITY;
ALTER TABLE unassigned_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Dynamic RLS Helpers to extract session context
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()::text;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_user_org()
RETURNS TEXT AS $$
  SELECT organization FROM users WHERE id = auth.uid()::text;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_permission(module_name TEXT, action_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  u_role TEXT;
  u_org TEXT;
  has_perm BOOLEAN;
BEGIN
  -- 1. Extract context
  SELECT role, organization INTO u_role, u_org FROM users WHERE id = auth.uid()::text;
  
  -- If not logged in, deny
  IF u_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Super Admin bypasses check for standard permission logic
  IF u_role = 'Super Admin' THEN
    RETURN TRUE;
  END IF;

  -- 2. Query permissions table for dynamic RBAC rule.
  -- First check if there is an organization-specific policy template
  SELECT ((roles -> u_role ->> action_name)::boolean) INTO has_perm
  FROM permissions
  WHERE module = module_name AND organization = u_org;
  
  -- If not found, fall back to global default policy template
  IF has_perm IS NULL THEN
    SELECT ((roles -> u_role ->> action_name)::boolean) INTO has_perm
    FROM permissions
    WHERE module = module_name AND organization = 'Global';
  END IF;
  
  RETURN COALESCE(has_perm, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================
-- ROW LEVEL SECURITY POLICIES DEFINITIONS
-- ==============================================================

-- 1. Organizations policies
CREATE POLICY org_select ON organizations FOR SELECT USING (
  id = get_current_user_org() OR get_current_user_role() = 'Super Admin'
);
CREATE POLICY org_all ON organizations FOR ALL USING (
  get_current_user_role() = 'Super Admin'
);

-- 2. Permissions policies
CREATE POLICY permissions_select ON permissions FOR SELECT USING (
  organization = get_current_user_org() OR organization = 'Global' OR get_current_user_role() = 'Super Admin'
);
CREATE POLICY permissions_modify ON permissions FOR ALL USING (
  get_current_user_role() = 'Super Admin' 
  OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
);

-- 3. Users policies
CREATE POLICY users_select ON users FOR SELECT USING (
  id = auth.uid()::text 
  OR (check_permission('User and Role Management', 'read') AND organization = get_current_user_org())
  OR get_current_user_role() = 'Super Admin'
);
CREATE POLICY users_insert ON users FOR INSERT WITH CHECK (
  get_current_user_role() = 'Super Admin'
  OR (check_permission('User and Role Management', 'create') AND organization = get_current_user_org())
);
CREATE POLICY users_update ON users FOR UPDATE USING (
  id = auth.uid()::text
  OR get_current_user_role() = 'Super Admin'
  OR (check_permission('User and Role Management', 'update') AND organization = get_current_user_org())
);
CREATE POLICY users_delete ON users FOR DELETE USING (
  get_current_user_role() = 'Super Admin'
  OR (check_permission('User and Role Management', 'delete') AND organization = get_current_user_org())
);

-- 4. Mentors policies
CREATE POLICY mentors_select ON mentors FOR SELECT USING (
  get_current_user_role() = 'Super Admin'
  OR (organization = get_current_user_org() AND check_permission('User and Role Management', 'read'))
  OR email = (SELECT email FROM users WHERE id = auth.uid()::text)
);
CREATE POLICY mentors_modify ON mentors FOR ALL USING (
  get_current_user_role() = 'Super Admin'
  OR (organization = get_current_user_org() AND check_permission('User and Role Management', 'update'))
);

-- 5. Students policies
CREATE POLICY students_select ON students FOR SELECT USING (
  get_current_user_role() = 'Super Admin'
  OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
  -- Mentors can see their assigned students
  OR (get_current_user_role() = 'Mentor' AND organization = get_current_user_org() AND name = ANY (
        SELECT unnest("studentsAssigned") FROM mentors WHERE email = (SELECT email FROM users WHERE id = auth.uid()::text)
     ))
  -- Assistants can see all students in their organization
  OR (get_current_user_role() = 'Assistant' AND organization = get_current_user_org())
  -- Students see their own student record
  OR email = (SELECT email FROM users WHERE id = auth.uid()::text)
);
CREATE POLICY students_modify ON students FOR ALL USING (
  get_current_user_role() = 'Super Admin'
  OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
);

-- 6. Sessions policies
CREATE POLICY sessions_select ON sessions FOR SELECT USING (
  get_current_user_role() = 'Super Admin'
  OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
  OR (get_current_user_role() = 'Mentor' AND organization = get_current_user_org() AND mentor = (SELECT name FROM users WHERE id = auth.uid()::text))
  OR (get_current_user_role() = 'Assistant' AND organization = get_current_user_org() AND mentor = (SELECT name FROM users WHERE id = (SELECT mentor_id FROM users WHERE id = auth.uid()::text)))
  OR (get_current_user_role() = 'Student' AND organization = get_current_user_org() AND student = (SELECT name FROM users WHERE id = auth.uid()::text))
);
CREATE POLICY sessions_modify ON sessions FOR ALL USING (
  get_current_user_role() = 'Super Admin'
  OR (check_permission('Session Scheduling', 'create') AND organization = get_current_user_org())
);

-- 7. Chat Channels & Messages policies
CREATE POLICY chat_channels_select ON chat_channels FOR SELECT USING (
  get_current_user_role() = 'Super Admin' OR organization = get_current_user_org()
);
CREATE POLICY chat_channels_modify ON chat_channels FOR ALL USING (
  get_current_user_role() = 'Super Admin' OR organization = get_current_user_org()
);
CREATE POLICY chat_messages_select ON chat_messages FOR SELECT USING (
  get_current_user_role() = 'Super Admin' OR organization = get_current_user_org()
);
CREATE POLICY chat_messages_insert ON chat_messages FOR INSERT WITH CHECK (
  (get_current_user_role() = 'Super Admin' OR organization = get_current_user_org())
  AND check_permission('Messaging', 'create')
);

-- 8. Payments policies
CREATE POLICY payments_select ON payments FOR SELECT USING (
  get_current_user_role() = 'Super Admin'
  OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
  OR (get_current_user_role() = 'Student' AND organization = get_current_user_org() AND student = (SELECT name FROM users WHERE id = auth.uid()::text))
);
CREATE POLICY payments_modify ON payments FOR ALL USING (
  get_current_user_role() = 'Super Admin'
);

-- 9. Evaluations policies
CREATE POLICY evaluations_select ON evaluations FOR SELECT USING (
  (get_current_user_role() = 'Super Admin' OR (organization = get_current_user_org() AND get_current_user_role() = 'Organization Admin'))
  OR (get_current_user_role() = 'Mentor' AND organization = get_current_user_org() AND "studentName" = ANY (
        SELECT unnest("studentsAssigned") FROM mentors WHERE email = (SELECT email FROM users WHERE id = auth.uid()::text)
     ))
  OR (get_current_user_role() = 'Student' AND organization = get_current_user_org() AND "studentName" = (SELECT name FROM users WHERE id = auth.uid()::text))
);
CREATE POLICY evaluations_modify ON evaluations FOR ALL USING (
  get_current_user_role() = 'Super Admin'
  OR (organization = get_current_user_org() AND check_permission('Student Evaluations', 'update'))
);

-- 10. Audit Logs policies
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT USING (
  get_current_user_role() = 'Super Admin'
  OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
);
CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT WITH CHECK (
  true -- Anyone authenticated/system is allowed to log actions
);

-- 11. Content Resources policies
CREATE POLICY content_resources_select ON content_resources FOR SELECT USING (
  organization = 'Global' OR organization = get_current_user_org() OR get_current_user_role() = 'Super Admin'
);
CREATE POLICY content_resources_modify ON content_resources FOR ALL USING (
  get_current_user_role() = 'Super Admin'
  OR (organization = get_current_user_org() AND check_permission('Content Library', 'update'))
);

-- 12. Report tables
CREATE POLICY reports_select ON report_student_growth FOR SELECT USING (
  get_current_user_role() = 'Super Admin' OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
);
CREATE POLICY reports_ma_select ON report_mentor_activity FOR SELECT USING (
  get_current_user_role() = 'Super Admin' OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
);
CREATE POLICY reports_ms_select ON report_monthly_sessions FOR SELECT USING (
  get_current_user_role() = 'Super Admin' OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
);
CREATE POLICY reports_rt_select ON report_revenue_trend FOR SELECT USING (
  get_current_user_role() = 'Super Admin' OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
);

-- 13. Assignment views policies
CREATE POLICY assignment_ment_select ON assignment_mentors FOR SELECT USING (
  get_current_user_role() = 'Super Admin' OR organization = get_current_user_org()
);
CREATE POLICY assignment_ment_modify ON assignment_mentors FOR ALL USING (
  get_current_user_role() = 'Super Admin' OR (organization = get_current_user_org() AND check_permission('Mentor Assignments', 'update'))
);
CREATE POLICY unassigned_select ON unassigned_students FOR SELECT USING (
  get_current_user_role() = 'Super Admin' OR organization = get_current_user_org()
);
CREATE POLICY unassigned_modify ON unassigned_students FOR ALL USING (
  get_current_user_role() = 'Super Admin' OR (organization = get_current_user_org() AND check_permission('Mentor Assignments', 'update'))
);

-- 14. Helper function to resolve role and organization before login (bypassing RLS)
CREATE OR REPLACE FUNCTION public.resolve_user_login(email_input TEXT)
RETURNS TABLE (role TEXT, organization TEXT, password TEXT)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.role, u.organization, u.password
  FROM public.users u
  WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(email_input));
END;
$$ LANGUAGE plpgsql;


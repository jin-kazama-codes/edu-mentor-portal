-- =============================================================
-- FIX: Add mentor via SECURITY DEFINER RPC (bypasses RLS)
-- This solves the 401/42501 error when the Supabase Auth JWT
-- is absent (user logged in via localStorage fallback).
-- The function validates the caller's role from the users table
-- using the p_user_email parameter before inserting.
-- Run this in your Supabase SQL Editor.
-- =============================================================

CREATE OR REPLACE FUNCTION add_mentor_bypass_rls(
  p_user_email  TEXT,
  p_id          TEXT,
  p_name        TEXT,
  p_email       TEXT,
  p_subjects    TEXT[],
  p_experience  TEXT,
  p_rating      NUMERIC,
  p_availability TEXT,
  p_upcoming_sessions INTEGER,
  p_performance TEXT,
  p_avatar      TEXT,
  p_organization TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role TEXT;
  caller_org  TEXT;
BEGIN
  -- Look up the caller by their email in the users table
  SELECT role, organization
    INTO caller_role, caller_org
    FROM users
   WHERE LOWER(email) = LOWER(p_user_email)
   LIMIT 1;

  -- Must be a known user
  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'Not authenticated: user % not found', p_user_email;
  END IF;

  -- Only Super Admin and Organization Admin may add mentors
  IF caller_role NOT IN ('Super Admin', 'Organization Admin') THEN
    RAISE EXCEPTION 'Permission denied: role % cannot add mentors', caller_role;
  END IF;

  -- Org Admin can only add mentors to their own organization
  IF caller_role = 'Organization Admin' AND caller_org <> p_organization THEN
    RAISE EXCEPTION 'Permission denied: cannot add mentor to organization %', p_organization;
  END IF;

  -- Insert the mentor record (runs as postgres owner, bypassing RLS)
  INSERT INTO mentors (
    id, name, email, subjects, "studentsAssigned",
    experience, rating, availability, "upcomingSessions",
    performance, avatar, organization
  ) VALUES (
    p_id, p_name, p_email, p_subjects, ARRAY[]::TEXT[],
    p_experience, p_rating, p_availability, p_upcoming_sessions,
    p_performance, p_avatar, p_organization
  );
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION add_mentor_bypass_rls TO anon, authenticated;

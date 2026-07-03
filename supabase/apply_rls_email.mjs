import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ueqjrtymqstqtggiumee.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

// Execute raw SQL via the rpc endpoint
async function sql(statement, label) {
  const { error } = await supabase.rpc('exec_sql', { query: statement }).single();
  if (error) {
    // exec_sql might not exist – use a workaround via the REST /sql endpoint
    console.warn(`⚠️  exec_sql failed for "${label}": ${error.message}`);
    return false;
  }
  console.log(`✅  ${label}`);
  return true;
}

// We'll use the Supabase management API to run SQL via the pg endpoint
async function runSQL(statement, label) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: statement })
      }
    );
    if (!response.ok) {
      const body = await response.text();
      console.warn(`⚠️   ${label}: ${body}`);
      return false;
    }
    console.log(`✅  ${label}`);
    return true;
  } catch (e) {
    console.warn(`⚠️   ${label}: ${e.message}`);
    return false;
  }
}

// Use the Supabase pg proxy or pg connection to run statements
// Fallback: use supabase-js rpc calls for each individual statement

async function applyViaRpc(statement, label) {
  // Try calling a stored procedure named 'exec_sql'
  const { data, error } = await supabase.rpc('exec_sql', { sql_text: statement });
  if (error) {
    console.warn(`⚠️   ${label}: ${error.message}`);
    return false;
  }
  console.log(`✅  ${label}`);
  return true;
}

// Since we can't directly run DDL via supabase-js client (it only runs through the PostgREST API),
// we'll apply the changes by dropping and recreating the policies and functions via 
// specific REST API calls using the Supabase project ref and service key.

const PROJECT_REF = 'ueqjrtymqstqtggiumee';

async function execSQL(sql, label) {
  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
      }
    );
    
    if (!response.ok) {
      const body = await response.text();
      // Try alternate endpoint
      const response2 = await fetch(
        `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql`,
        {
          method: 'POST',
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ sql_text: sql })
        }
      );
      if (!response2.ok) {
        console.warn(`⚠️   ${label}: HTTP ${response.status} - ${body.substring(0, 200)}`);
        return false;
      }
    }
    console.log(`✅  ${label}`);
    return true;
  } catch(e) {
    console.warn(`⚠️   ${label}: ${e.message}`);
    return false;
  }
}

// ============================================================
// SQL STATEMENTS TO APPLY
// ============================================================
const statements = [
  // --- Helper Functions (email-based) ---
  {
    label: 'Replace get_current_user_role() → email-based',
    sql: `
      CREATE OR REPLACE FUNCTION get_current_user_role()
      RETURNS TEXT AS $$
        SELECT role FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(auth.email()));
      $$ LANGUAGE sql SECURITY DEFINER;
    `
  },
  {
    label: 'Replace get_current_user_org() → email-based',
    sql: `
      CREATE OR REPLACE FUNCTION get_current_user_org()
      RETURNS TEXT AS $$
        SELECT organization FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(auth.email()));
      $$ LANGUAGE sql SECURITY DEFINER;
    `
  },
  {
    label: 'Replace check_permission() → email-based',
    sql: `
      CREATE OR REPLACE FUNCTION check_permission(module_name TEXT, action_name TEXT)
      RETURNS BOOLEAN AS $$
      DECLARE
        u_role TEXT;
        u_org TEXT;
        has_perm BOOLEAN;
      BEGIN
        SELECT role, organization INTO u_role, u_org 
        FROM users 
        WHERE LOWER(TRIM(email)) = LOWER(TRIM(auth.email()));
        
        IF u_role IS NULL THEN
          RETURN FALSE;
        END IF;
        
        IF u_role = 'Super Admin' THEN
          RETURN TRUE;
        END IF;

        SELECT ((roles -> u_role ->> action_name)::boolean) INTO has_perm
        FROM permissions
        WHERE module = module_name AND organization = u_org;
        
        IF has_perm IS NULL THEN
          SELECT ((roles -> u_role ->> action_name)::boolean) INTO has_perm
          FROM permissions
          WHERE module = module_name AND organization = 'Global';
        END IF;
        
        RETURN COALESCE(has_perm, FALSE);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  },

  // --- Drop old policies and recreate with email-based lookups ---
  { label: 'Drop users_select policy', sql: `DROP POLICY IF EXISTS users_select ON users;` },
  {
    label: 'Recreate users_select → email-based',
    sql: `
      CREATE POLICY users_select ON users FOR SELECT USING (
        LOWER(TRIM(email)) = LOWER(TRIM(auth.email()))
        OR (check_permission('User and Role Management', 'read') AND organization = get_current_user_org())
        OR get_current_user_role() = 'Super Admin'
      );
    `
  },
  { label: 'Drop users_update policy', sql: `DROP POLICY IF EXISTS users_update ON users;` },
  {
    label: 'Recreate users_update → email-based',
    sql: `
      CREATE POLICY users_update ON users FOR UPDATE USING (
        LOWER(TRIM(email)) = LOWER(TRIM(auth.email()))
        OR get_current_user_role() = 'Super Admin'
        OR (check_permission('User and Role Management', 'update') AND organization = get_current_user_org())
      );
    `
  },
  { label: 'Drop mentors_select policy', sql: `DROP POLICY IF EXISTS mentors_select ON mentors;` },
  {
    label: 'Recreate mentors_select → email-based',
    sql: `
      CREATE POLICY mentors_select ON mentors FOR SELECT USING (
        get_current_user_role() = 'Super Admin'
        OR (organization = get_current_user_org() AND check_permission('User and Role Management', 'read'))
        OR LOWER(TRIM(email)) = LOWER(TRIM(auth.email()))
      );
    `
  },
  { label: 'Drop students_select policy', sql: `DROP POLICY IF EXISTS students_select ON students;` },
  {
    label: 'Recreate students_select → email-based',
    sql: `
      CREATE POLICY students_select ON students FOR SELECT USING (
        get_current_user_role() = 'Super Admin'
        OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
        OR (get_current_user_role() = 'Mentor' AND organization = get_current_user_org() AND name = ANY (
              SELECT unnest("studentsAssigned") FROM mentors WHERE LOWER(TRIM(email)) = LOWER(TRIM(auth.email()))
           ))
        OR (get_current_user_role() = 'Assistant' AND organization = get_current_user_org())
        OR LOWER(TRIM(email)) = LOWER(TRIM(auth.email()))
      );
    `
  },
  { label: 'Drop sessions_select policy', sql: `DROP POLICY IF EXISTS sessions_select ON sessions;` },
  {
    label: 'Recreate sessions_select → email-based',
    sql: `
      CREATE POLICY sessions_select ON sessions FOR SELECT USING (
        get_current_user_role() = 'Super Admin'
        OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
        OR (get_current_user_role() = 'Mentor' AND organization = get_current_user_org() 
            AND mentor = (SELECT name FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(auth.email()))))
        OR (get_current_user_role() = 'Assistant' AND organization = get_current_user_org() 
            AND mentor = (SELECT name FROM users WHERE id = (SELECT mentor_id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(auth.email())))))
        OR (get_current_user_role() = 'Student' AND organization = get_current_user_org() 
            AND student = (SELECT name FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(auth.email()))))
      );
    `
  },
  { label: 'Drop payments_select policy', sql: `DROP POLICY IF EXISTS payments_select ON payments;` },
  {
    label: 'Recreate payments_select → email-based',
    sql: `
      CREATE POLICY payments_select ON payments FOR SELECT USING (
        get_current_user_role() = 'Super Admin'
        OR (get_current_user_role() = 'Organization Admin' AND organization = get_current_user_org())
        OR (get_current_user_role() = 'Student' AND organization = get_current_user_org() 
            AND student = (SELECT name FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(auth.email()))))
      );
    `
  },
  { label: 'Drop evaluations_select policy', sql: `DROP POLICY IF EXISTS evaluations_select ON evaluations;` },
  {
    label: 'Recreate evaluations_select → email-based',
    sql: `
      CREATE POLICY evaluations_select ON evaluations FOR SELECT USING (
        (get_current_user_role() = 'Super Admin' OR (organization = get_current_user_org() AND get_current_user_role() = 'Organization Admin'))
        OR (get_current_user_role() = 'Mentor' AND organization = get_current_user_org() AND "studentName" = ANY (
              SELECT unnest("studentsAssigned") FROM mentors WHERE LOWER(TRIM(email)) = LOWER(TRIM(auth.email()))
           ))
        OR (get_current_user_role() = 'Student' AND organization = get_current_user_org() 
            AND "studentName" = (SELECT name FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(auth.email()))))
      );
    `
  }
];

async function main() {
  console.log('🚀  Applying email-based RLS updates to Supabase...\n');
  
  let successCount = 0;
  let failCount = 0;

  for (const stmt of statements) {
    const ok = await execSQL(stmt.sql, stmt.label);
    if (ok) successCount++;
    else failCount++;
  }

  console.log(`\n📊  Results: ${successCount} succeeded, ${failCount} failed`);

  if (failCount > 0) {
    console.log('\n⚠️  Some statements failed via Management API. Trying alternative RPC approach...');
    console.log('Please run these statements manually in the Supabase SQL Editor.');
  }
}

main().catch(console.error);

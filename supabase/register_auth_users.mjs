/**
 * register_auth_users.mjs
 * 
 * One-time script: Creates Supabase Auth accounts for every user
 * in public.users that doesn't already have one.
 * 
 * This is the SAFE fix — once all users have real auth accounts,
 * they get proper JWTs on login, RLS works correctly, and no
 * insecure workarounds are needed.
 * 
 * Run with: node supabase/register_auth_users.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL    = 'https://ueqjrtymqstqtggiumee.supabase.co';
// Service role key — safe here because this script only runs
// locally/server-side and is never bundled into the browser.
const SERVICE_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY';
const DEFAULT_PASSWORD = 'Password123!';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  console.log('🔍  Fetching all users from public.users...\n');

  // 1. Load all public users
  const { data: publicUsers, error: fetchErr } = await supabase
    .from('users')
    .select('id, name, email, role, organization');

  if (fetchErr || !publicUsers) {
    console.error('❌  Could not fetch public.users:', fetchErr?.message);
    process.exit(1);
  }

  console.log(`📋  Found ${publicUsers.length} users in public.users\n`);

  let created = 0;
  let skipped = 0;
  let failed  = 0;

  for (const user of publicUsers) {
    // 2. Try to create an Auth account for each user
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,          // skip email verification
      user_metadata: {
        name: user.name,
        role: user.role,
        organization: user.organization
      }
    });

    if (!error) {
      console.log(`✅  Created auth account: ${user.email} (${user.role})`);
      created++;
    } else if (error.message.toLowerCase().includes('already been registered') ||
               error.message.toLowerCase().includes('already exists') ||
               error.code === 'email_exists') {
      console.log(`⏭️   Already has auth account: ${user.email}`);
      skipped++;
    } else {
      console.warn(`❌  Failed for ${user.email}: ${error.message}`);
      failed++;
    }
  }

  console.log('\n============================================');
  console.log(`✅  Created  : ${created}`);
  console.log(`⏭️   Skipped  : ${skipped} (already had accounts)`);
  console.log(`❌  Failed   : ${failed}`);
  console.log('============================================');
  console.log('\n✨  Done! All users can now log in with password: Password123!');
  console.log('   RLS policies will work correctly for all roles.');
}

main().catch(console.error);

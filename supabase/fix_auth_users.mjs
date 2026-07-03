/**
 * fix_auth_users.mjs
 *
 * Ensures ALL users in public.users have:
 *  1. A confirmed Supabase Auth account
 *  2. Password set to Password123! (what the app uses internally)
 *  3. Email confirmed (no email verification blocker)
 *
 * Run with: node supabase/fix_auth_users.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://ueqjrtymqstqtggiumee.supabase.co';
const SERVICE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY';
const DEFAULT_PASSWORD = 'Password123!';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  console.log('🔍  Fetching all users from public.users...\n');

  // 1. Load all public.users
  const { data: publicUsers, error: fetchErr } = await supabase
    .from('users')
    .select('id, name, email, role, organization');

  if (fetchErr || !publicUsers) {
    console.error('❌  Could not fetch public.users:', fetchErr?.message);
    process.exit(1);
  }

  console.log(`📋  Found ${publicUsers.length} users\n`);

  // 2. Load all existing Supabase Auth users
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error('❌  Could not list auth users:', authErr.message);
    process.exit(1);
  }

  const authUsers = authData?.users || [];
  const authByEmail = new Map(authUsers.map(u => [u.email?.toLowerCase(), u]));

  console.log(`🔐  Found ${authUsers.length} Supabase Auth users\n`);
  console.log('─'.repeat(60));

  for (const user of publicUsers) {
    const email = user.email.toLowerCase();
    const existing = authByEmail.get(email);

    if (existing) {
      // Update password + ensure email is confirmed
      const { error: updateErr } = await supabase.auth.admin.updateUserById(
        existing.id,
        {
          password: DEFAULT_PASSWORD,
          email_confirm: true
        }
      );

      if (updateErr) {
        console.log(`❌  Failed to update ${user.email}: ${updateErr.message}`);
      } else {
        console.log(`✅  Updated   ${user.email} (${user.role}) — password reset, email confirmed`);
      }
    } else {
      // Create new auth account
      const { error: createErr } = await supabase.auth.admin.createUser({
        email: user.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role,
          organization: user.organization
        }
      });

      if (createErr) {
        console.log(`❌  Failed to create ${user.email}: ${createErr.message}`);
      } else {
        console.log(`🆕  Created   ${user.email} (${user.role}) — new auth account`);
      }
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log('✨  All done! Every user now has:');
  console.log('   • A confirmed Supabase Auth account');
  console.log(`   • Password: ${DEFAULT_PASSWORD}`);
  console.log('\n👉  Log out of the app and log back in to get a fresh JWT.');
  console.log('   Adding mentors will work correctly after re-login.');
}

main().catch(console.error);

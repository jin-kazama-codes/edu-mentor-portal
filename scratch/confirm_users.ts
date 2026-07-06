import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use the secret key from .env.local (uncommented/read directly)
const supabaseSecretKey = process.env.VITE_SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error('Missing env vars');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  console.log('Fetching users from auth admin API...');
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  console.log(`Found ${users.length} auth users.`);
  for (const user of users) {
    if (!user.email_confirmed_at) {
      console.log(`Confirming email for user: ${user.email} (${user.id})...`);
      const { data, error: updateErr } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );
      if (updateErr) {
        console.error(`Failed to update ${user.email}:`, updateErr);
      } else {
        console.log(`Successfully confirmed ${user.email}`);
      }
    } else {
      console.log(`User ${user.email} is already confirmed.`);
    }
  }
}

run();

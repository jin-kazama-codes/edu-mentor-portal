import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: '7achingangar@gmail.com',
    password: 'Password123!'
  });

  if (authErr) {
    console.error('Auth error for 7achingangar@gmail.com:', authErr);
    return;
  }
  console.log('Signed in successfully as 7achingangar@gmail.com.');
  console.log('User ID:', authData.user?.id);

  // Fetch users using the session of the logged-in user
  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('id, email, name, role, organization, mentor_id');
  
  if (usersErr) {
    console.error('Error fetching users:', usersErr);
  } else {
    console.log('--- USERS VISIBLE TO 7achingangar ---');
    console.log(JSON.stringify(users, null, 2));
  }

  // Fetch channels visible to 7achingangar
  const { data: channels, error: channelsErr } = await supabase
    .from('chat_channels')
    .select('*');
  
  if (channelsErr) {
    console.error('Error fetching channels:', channelsErr);
  } else {
    console.log('--- CHANNELS VISIBLE TO 7achingangar ---');
    console.log(JSON.stringify(channels, null, 2));
  }
}

check();

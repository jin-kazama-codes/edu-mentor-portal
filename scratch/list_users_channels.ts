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

async function listAll() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'mahinbhat@gmail.com',
    password: 'Password123!'
  });

  if (authErr) {
    console.error('Auth error:', authErr);
    return;
  }
  console.log('Signed in successfully.');

  const { data: users, error: usersErr } = await supabase.from('users').select('id, name, email, role, organization, mentor_id');
  if (usersErr) {
    console.error('Error fetching users:', usersErr);
  } else {
    console.log('--- ALL USERS ---');
    console.table(users);
  }

  const { data: channels, error: channelsErr } = await supabase.from('chat_channels').select('*');
  if (channelsErr) {
    console.error('Error fetching channels:', channelsErr);
  } else {
    console.log('--- ALL CHANNELS ---');
    console.table(channels);
  }
}

listAll();

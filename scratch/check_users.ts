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
  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('id, email, name, role, organization, mentor_id');
  
  if (usersErr) {
    console.error('Error fetching users:', usersErr);
    return;
  }
  
  console.log('--- ALL USERS ---');
  console.log(JSON.stringify(users, null, 2));

  const { data: channels, error: channelsErr } = await supabase
    .from('chat_channels')
    .select('*');
  
  if (channelsErr) {
    console.error('Error fetching channels:', channelsErr);
    return;
  }
  
  console.log('--- ALL CHANNELS ---');
  console.log(JSON.stringify(channels, null, 2));
}

check();

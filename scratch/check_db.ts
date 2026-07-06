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
  // Sign in as Mandeep Singh
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'mandeepsingh@gmail.com',
    password: 'Password123!'
  });

  if (authErr) {
    console.error('Auth error:', authErr);
  } else {
    console.log('Signed in successfully as Mandeep Singh.');
  }

  // Fetch channels visible to Mandeep
  const { data: channels, error: channelsErr } = await supabase.from('chat_channels').select('*');
  if (channelsErr) {
    console.error('Error fetching channels:', channelsErr);
  } else {
    console.log('--- CHANNELS VISIBLE TO MANDEEP ---');
    console.log(JSON.stringify(channels, null, 2));
  }

  // Fetch messages in Mandeep - Faisal channel
  const targetChannel = 'ch-codevamp-faisalkhan-mandeepsingh';
  const { data: messages, error: messagesErr } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('channel_id', targetChannel);
  if (messagesErr) {
    console.error('Error fetching messages:', messagesErr);
  } else {
    console.log(`--- MESSAGES IN CHANNEL ${targetChannel} ---`);
    console.log(JSON.stringify(messages, null, 2));
  }
}

check();

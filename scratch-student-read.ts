import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const email = 'teststudent@gmail.com';
const password = 'Password123!';

async function test() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('Logging in as student...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authErr) {
    console.error('Login failed:', authErr.message);
    return;
  }

  console.log('Login successful! ID:', authData.user?.id);

  // Attempt to select from mentors table
  console.log('Attempting to select mentors...');
  const { data, error } = await supabase.from('mentors').select('*');
  
  if (error) {
    console.error('Select failed:', error);
  } else {
    console.log('Select successful! Found mentors:', data);
  }
}

test();

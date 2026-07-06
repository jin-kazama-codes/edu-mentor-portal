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
  // Query all users to find the assistant
  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'Assistant');

  if (usersErr) {
    console.error('Error fetching assistants:', usersErr);
  } else {
    console.log('--- ASSISTANT USERS ---');
    console.log(JSON.stringify(users, null, 2));
  }

  // Query mentors
  const { data: mentors, error: mentorsErr } = await supabase
    .from('mentors')
    .select('*');

  if (mentorsErr) {
    console.error('Error fetching mentors:', mentorsErr);
  } else {
    console.log('--- MENTORS ---');
    console.log(JSON.stringify(mentors, null, 2));
  }

  // Query students
  const { data: students, error: studentsErr } = await supabase
    .from('students')
    .select('*');

  if (studentsErr) {
    console.error('Error fetching students:', studentsErr);
  } else {
    console.log('--- STUDENTS ---');
    console.log(JSON.stringify(students, null, 2));
  }
}

check();

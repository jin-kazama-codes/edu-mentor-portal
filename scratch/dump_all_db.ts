import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function check() {
  const { data: students, error: studentsErr } = await supabase
    .from('students')
    .select('id, name, email, mentor, organization');
  
  if (studentsErr) {
    console.error('Error fetching students:', studentsErr.message);
    return;
  }
  
  console.log('--- ALL STUDENTS ---');
  console.log(JSON.stringify(students, null, 2));
}

check();

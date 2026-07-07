import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const email = '7achingangwarassistant1@gmail.com';
const password = 'Password123!';

async function test() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('Logging in as assistant...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authErr) {
    console.error('Login failed:', authErr.message);
    return;
  }

  console.log('Login successful! ID:', authData.user?.id);

  // 1. Fetch mentor's name
  const { data: resolvedName } = await supabase
    .rpc('get_mentor_name_for_assistant_email', { assistant_email: email });
  console.log('Resolved mentor name:', resolvedName);

  // 2. Fetch accessible students
  let studentsQuery = supabase.from('students').select('*');
  studentsQuery = studentsQuery.eq('organization', 'Physics wala');
  studentsQuery = studentsQuery.eq('mentor', resolvedName);
  
  const { data: students, error: studErr } = await studentsQuery;
  console.log('Students fetched:', students?.map(s => s.name), 'error:', studErr);

  // 3. Fetch evaluations
  if (students && students.length > 0) {
    const studentNames = students.map(s => s.name);
    const { data: evals, error: evalErr } = await supabase
      .from('evaluations')
      .select('*')
      .eq('organization', 'Physics wala')
      .in('studentName', studentNames);
    console.log('Evaluations fetched by assistant:', evals, 'error:', evalErr);
  }
}

test();

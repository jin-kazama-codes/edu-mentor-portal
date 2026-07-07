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

  // Attempt to insert/upsert an evaluation for Test Student
  const payload = {
    id: `eval-${Date.now()}`,
    studentName: 'Test Student',
    academic: 85,
    behaviour: 90,
    attendance: 95,
    communication: 80,
    tutorComments: 'Keep up the good work!',
    improvementAreas: 'Revision of algebra',
    goals: '1. Complete all homework on time.',
    parentFeedback: '',
    isSigned: false,
    organization: 'Physics wala'
  };

  console.log('Attempting to insert evaluation for Test Student...');
  const { data, error } = await supabase.from('evaluations').insert(payload).select();
  
  if (error) {
    console.error('Insert failed:', error);
  } else {
    console.log('Insert successful! Saved record:', data);
  }
}

test();

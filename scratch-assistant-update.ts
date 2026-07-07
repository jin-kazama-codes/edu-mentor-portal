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

  // Attempt to update the existing evaluation record eval-1783353906383
  const payload = {
    academic: 90,
    behaviour: 92,
    attendance: 94,
    communication: 88,
    tutorComments: 'UPDATED BY ASSISTANT!',
    improvementAreas: 'Updated improvement areas',
    goals: 'Updated milestones',
    isSigned: true // publish it
  };

  console.log('Attempting to update evaluation eval-1783353906383...');
  const { data, error } = await supabase
    .from('evaluations')
    .update(payload)
    .eq('id', 'eval-1783353906383')
    .select();
  
  if (error) {
    console.error('Update failed:', error);
  } else {
    console.log('Update successful! Result:', data);
  }
}

test();

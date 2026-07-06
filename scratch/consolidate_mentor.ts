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

async function run() {
  console.log('Starting mentor consolidation...');

  // 1. Update 7achingangar@gmail.com in users table
  const { data: updateUserData, error: updateUserErr } = await supabase
    .from('users')
    .update({
      organization: 'Physics wala',
      name: 'Sachin mentor'
    })
    .eq('email', '7achingangar@gmail.com');
  
  if (updateUserErr) {
    console.error('Error updating user 7achingangar@gmail.com:', updateUserErr.message);
  } else {
    console.log('Successfully updated user 7achingangar@gmail.com in users table.');
  }

  // 2. Update 7achingangar@gmail.com in mentors table
  const { data: updateMentorData, error: updateMentorErr } = await supabase
    .from('mentors')
    .update({
      organization: 'Physics wala',
      name: 'Sachin mentor'
    })
    .eq('email', '7achingangar@gmail.com');

  if (updateMentorErr) {
    console.error('Error updating mentor 7achingangar@gmail.com:', updateMentorErr.message);
  } else {
    console.log('Successfully updated mentor 7achingangar@gmail.com in mentors table.');
  }

  // 3. Update assistants' mentor_id to point to usr-1783339789836 (7achingangar@gmail.com)
  const { data: updateAsstData, error: updateAsstErr } = await supabase
    .from('users')
    .update({
      mentor_id: 'usr-1783339789836'
    })
    .in('email', ['7achingangwarassistant1@gmail.com', '7achingangwarassistant2@gmail.com']);

  if (updateAsstErr) {
    console.error('Error updating assistants:', updateAsstErr.message);
  } else {
    console.log('Successfully updated assistants to point to Sachin mentor.');
  }

  // 4. Update student mentor names to 'Sachin mentor'
  const { data: updateStudentsData, error: updateStudentsErr } = await supabase
    .from('students')
    .update({
      mentor: 'Sachin mentor'
    })
    .eq('organization', 'Physics wala');

  if (updateStudentsErr) {
    console.error('Error updating students:', updateStudentsErr.message);
  } else {
    console.log('Successfully updated students to reference Sachin mentor.');
  }

  // 5. Delete duplicate mentor from users table
  const { data: deleteUserVal, error: deleteUserErr } = await supabase
    .from('users')
    .delete()
    .eq('email', '7achingangwarmentor@gmail.com');

  if (deleteUserErr) {
    console.error('Error deleting duplicate mentor from users:', deleteUserErr.message);
  } else {
    console.log('Successfully deleted duplicate mentor from users.');
  }

  // 6. Delete duplicate mentor from mentors table
  const { data: deleteMentorVal, error: deleteMentorErr } = await supabase
    .from('mentors')
    .delete()
    .eq('email', '7achingangwarmentor@gmail.com');

  if (deleteMentorErr) {
    console.error('Error deleting duplicate mentor from mentors:', deleteMentorErr.message);
  } else {
    console.log('Successfully deleted duplicate mentor from mentors.');
  }

  console.log('Consolidation complete!');
}

run();

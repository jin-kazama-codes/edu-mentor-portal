import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

const supabase = createClient(supabaseUrl, supabaseSecretKey);

async function check() {
  try {
    console.log('Querying student with email: teststudent@gmail.com...');
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('email', 'teststudent@gmail.com')
      .maybeSingle();

    if (studentError) {
      console.error('Error querying student:', studentError);
      return;
    }

    console.log('Student record found:', student);

    if (student) {
      console.log('Student mentor name in record:', student.mentor);
      if (student.mentor) {
        const { data: mentor, error: mentorError } = await supabase
          .from('mentors')
          .select('*')
          .eq('name', student.mentor)
          .maybeSingle();

        if (mentorError) {
          console.error('Error querying mentor by name:', mentorError);
        } else {
          console.log('Mentor record found matching name:', mentor);
        }
      }
    }
  } catch (err) {
    console.error('Unhandled error:', err);
  }
}

check();

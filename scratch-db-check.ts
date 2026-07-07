import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

const supabase = createClient(supabaseUrl, supabaseSecretKey);

async function check() {
  try {
    const { data: users } = await supabase.from('users').select('*').eq('id', 'usr-1783339789836');
    console.log('User usr-1783339789836:', users);
  } catch (err) {
    console.error('Error:', err);
  }
}

check();

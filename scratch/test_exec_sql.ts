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
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1;' });
  if (error) {
    console.log('exec_sql does not exist or failed:', error.message);
  } else {
    console.log('exec_sql exists and returned:', data);
  }
}

check();

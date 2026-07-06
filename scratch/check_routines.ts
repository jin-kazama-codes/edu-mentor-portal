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
  const { data, error } = await supabase.rpc('resolve_user_login', { email_input: '7achingangar@gmail.com' });
  console.log('resolve_user_login test:', data, error);

  // We can query pg_proc using a select on a view or table if we bypass RLS
  // Wait, let's see if we can query pg_catalog tables via supabase client.
  // Actually, standard REST API doesn't expose pg_catalog tables directly unless they are exposed in the schema list.
  // But let's check if we can query pg_proc.
  const { data: procData, error: procErr } = await supabase
    .from('pg_proc')
    .select('*')
    .limit(1);
  console.log('pg_proc query test:', procData, procErr);
}

check();

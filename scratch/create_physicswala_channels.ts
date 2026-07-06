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

const channels = [
  {
    id: 'ch-physicswala-sachin-sachinmentor',
    name: 'Sachin - Sachin mentor',
    type: 'direct',
    unreadCount: 0,
    subtitle: 'Direct Message',
    avatar: '',
    organization: 'Physics wala'
  },
  {
    id: 'ch-physicswala-sachin-sachinassistant1',
    name: 'Sachin - Sachin assistant1',
    type: 'direct',
    unreadCount: 0,
    subtitle: 'Direct Message',
    avatar: '',
    organization: 'Physics wala'
  },
  {
    id: 'ch-physicswala-sachin-sachinassistant2',
    name: 'Sachin - Sachin assistant2',
    type: 'direct',
    unreadCount: 0,
    subtitle: 'Direct Message',
    avatar: '',
    organization: 'Physics wala'
  },
  {
    id: 'ch-physicswala-sachinassistant1-sachinmentor',
    name: 'Sachin mentor - Sachin assistant1',
    type: 'direct',
    unreadCount: 0,
    subtitle: 'Direct Message',
    avatar: '',
    organization: 'Physics wala'
  },
  {
    id: 'ch-physicswala-sachinassistant2-sachinmentor',
    name: 'Sachin mentor - Sachin assistant2',
    type: 'direct',
    unreadCount: 0,
    subtitle: 'Direct Message',
    avatar: '',
    organization: 'Physics wala'
  }
];

async function run() {
  console.log('Inserting direct channels for Physics wala...');

  for (const channel of channels) {
    const { data, error } = await supabase
      .from('chat_channels')
      .upsert(channel, { onConflict: 'id' });
    
    if (error) {
      console.error(`Failed to upsert channel ${channel.id}:`, error.message);
    } else {
      console.log(`Successfully upserted channel ${channel.id}`);
    }
  }

  console.log('Channels insertion complete!');
}

run();

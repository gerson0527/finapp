import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './load-env.mjs';

loadEnv();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

const email = process.argv[2] || 'demo@finapp.test';
const password = process.argv[3] || 'Demo1234!';

const { data, error } = await supabase.auth.signInWithPassword({ email, password });

if (error) {
  console.error('Login failed:');
  console.error('  status:', error.status);
  console.error('  code:', error.code);
  console.error('  message:', error.message);
  process.exit(1);
}

console.log('Login OK');
console.log('  user:', data.user?.id);
console.log('  email:', data.user?.email);

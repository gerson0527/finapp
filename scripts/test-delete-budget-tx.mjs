import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './load-env.mjs';

loadEnv();

const email = 'demo@finapp.test';
const password = 'Demo1234!';

const admin = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
await admin.connect();
const { rows: users } = await admin.query(`SELECT id FROM auth.users WHERE email = $1`, [email]);
const userId = users[0].id;
const { rows: [tx] } = await admin.query(
  `SELECT id, description, date, account_id, type, amount, budget_id
   FROM transactions
   WHERE user_id = $1 AND budget_id IS NOT NULL
   ORDER BY date ASC LIMIT 1`,
  [userId]
);
await admin.end();

console.log('Budget tx:', tx);

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);
await supabase.auth.signInWithPassword({ email, password });

const { error: delError } = await supabase
  .from('transactions')
  .delete()
  .eq('id', tx.id)
  .eq('user_id', userId);

console.log('delete:', delError?.message ?? 'OK');

const delta = tx.type === 'income' ? -tx.amount : tx.amount;
const { error: balError } = await supabase.rpc('update_account_balance', {
  account_id: tx.account_id,
  delta,
});
console.log('balance:', balError?.message ?? 'OK');

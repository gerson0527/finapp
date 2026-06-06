/**
 * Prueba eliminar transacciones de distintos meses (requiere sesión demo en .env o service role).
 */
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './load-env.mjs';

loadEnv();

const email = 'demo@finapp.test';
const password = 'Demo1234!';

const admin = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
await admin.connect();

const { rows: users } = await admin.query(`SELECT id FROM auth.users WHERE email = $1`, [email]);
if (!users.length) {
  console.error('No demo user');
  process.exit(1);
}
const userId = users[0].id;

const { rows: txs } = await admin.query(
  `SELECT id, date, description, type, amount, budget_id
   FROM transactions
   WHERE user_id = $1
   ORDER BY date ASC
   LIMIT 3`,
  [userId]
);
console.log('Old month txs:', txs);

const { rows: currentTxs } = await admin.query(
  `SELECT id, date, description, type, amount, budget_id
   FROM transactions
   WHERE user_id = $1
   ORDER BY date DESC
   LIMIT 3`,
  [userId]
);
console.log('Recent txs:', currentTxs);

await admin.end();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
if (loginErr) {
  console.error('Login failed:', loginErr.message);
  process.exit(1);
}

async function tryDelete(label, id) {
  const { data: tx, error: fetchError } = await supabase
    .from('transactions')
    .select('id, type, amount, account_id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError) {
    console.log(`${label}: fetch FAIL`, fetchError.message);
    return;
  }

  const { error: delError } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (delError) {
    console.log(`${label}: delete FAIL`, delError.message);
    return;
  }

  const delta = tx.type === 'income' ? -tx.amount : tx.amount;
  const { error: acctError } = await supabase.rpc('update_account_balance', {
    account_id: tx.account_id,
    delta,
  });

  if (acctError) {
    console.log(`${label}: balance FAIL`, acctError.message, '(tx already deleted!)');
    return;
  }

  console.log(`${label}: OK`);
}

// Pick editable tx (no budget_id) from old month
const oldEditable = txs.find((t) => !t.budget_id);
const recentEditable = currentTxs.find((t) => !t.budget_id);

if (oldEditable) await tryDelete(`OLD ${oldEditable.description}`, oldEditable.id);
if (recentEditable) await tryDelete(`NEW ${recentEditable.description}`, recentEditable.id);

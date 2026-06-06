import pg from 'pg';
import { loadEnv } from './load-env.mjs';

loadEnv();

const email = process.argv[2] || 'demo@finapp.test';
const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
await client.connect();

const { rows } = await client.query(
  `SELECT confirmation_token, recovery_token, email_change, email_change_token_new, phone
   FROM auth.users WHERE email = $1`,
  [email]
);

console.log(JSON.stringify(rows, null, 2));
await client.end();

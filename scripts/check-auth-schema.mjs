import pg from 'pg';
import { loadEnv } from './load-env.mjs';

loadEnv();

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
await client.connect();

const cols = await client.query(`
  SELECT column_name FROM information_schema.columns
  WHERE table_schema = 'auth' AND table_name = 'identities'
  ORDER BY ordinal_position
`);
console.log('identities:', cols.rows.map((r) => r.column_name).join(', '));
await client.end();

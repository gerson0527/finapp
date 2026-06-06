import pg from 'pg';
import { loadEnv } from './load-env.mjs';

loadEnv();

const email = process.argv[2] || 'demo@finapp.test';
const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  connectionTimeoutMillis: 20000,
});

await client.connect();

const { rows } = await client.query(
  `SELECT u.id, u.email, u.email_confirmed_at, u.confirmed_at,
          u.encrypted_password IS NOT NULL AS has_password,
          u.banned_until, u.deleted_at, u.is_sso_user,
          i.provider, i.provider_id, i.email AS identity_email, i.identity_data
   FROM auth.users u
   LEFT JOIN auth.identities i ON i.user_id = u.id
   WHERE u.email = $1`,
  [email]
);

console.log(JSON.stringify(rows, null, 2));
await client.end();

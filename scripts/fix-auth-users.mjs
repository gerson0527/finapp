/**
 * Corrige usuarios creados por SQL con tokens NULL en auth.users.
 * GoTrue devuelve 500 "Database error querying schema" al iniciar sesión.
 *
 * Uso: node scripts/fix-auth-users.mjs
 */
import pg from 'pg';
import { loadEnv } from './load-env.mjs';

loadEnv();

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
await client.connect();

const { rowCount } = await client.query(`
  UPDATE auth.users
  SET
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_new = COALESCE(email_change_token_new, '')
  WHERE confirmation_token IS NULL
     OR recovery_token IS NULL
     OR email_change IS NULL
     OR email_change_token_new IS NULL
`);

console.log(`✅ ${rowCount ?? 0} usuario(s) corregido(s) en auth.users`);
await client.end();

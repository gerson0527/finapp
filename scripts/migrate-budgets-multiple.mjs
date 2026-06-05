import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from './load-env.mjs';

loadEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONNECTION_STRING = process.env.SUPABASE_DB_URL;

if (!CONNECTION_STRING) {
  console.error('❌ Define SUPABASE_DB_URL en .env');
  process.exit(1);
}

async function main() {
  const client = new pg.Client({ connectionString: CONNECTION_STRING });
  await client.connect();
  const sql = readFileSync(
    resolve(__dirname, '..', 'supabase', 'migrations', '20250605_budgets_multiple.sql'),
    'utf-8'
  );
  try {
    await client.query(sql);
    console.log('✅ Migración budgets_multiple aplicada');
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

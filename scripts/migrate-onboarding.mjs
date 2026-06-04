import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONNECTION_STRING = process.env.SUPABASE_DB_URL;

if (!CONNECTION_STRING) {
  console.error('❌ Define SUPABASE_DB_URL en tu entorno.');
  console.error('   Ejemplo: postgresql://postgres:TU_PASSWORD@db.vicnaxvswxfgxqeepsjz.supabase.co:5432/postgres');
  console.error('   La contraseña está en Supabase → Project Settings → Database');
  process.exit(1);
}

async function main() {
  const client = new pg.Client({ connectionString: CONNECTION_STRING });
  await client.connect();
  console.log('✅ Conectado a Supabase');

  const sqlPath = resolve(__dirname, '..', 'supabase', 'migrations', '20250603_user_onboarding.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  try {
    await client.query(sql);
    console.log('✅ Migración de onboarding aplicada');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

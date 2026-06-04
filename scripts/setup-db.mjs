import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONNECTION_STRING = process.env.SUPABASE_DB_URL;

if (!CONNECTION_STRING) {
  console.error('❌ Define SUPABASE_DB_URL:\n   postgresql://postgres:PASS@db.vicnaxvswxfgxqeepsjz.supabase.co:5432/postgres');
  process.exit(1);
}

async function main() {
  const client = new pg.Client({ connectionString: CONNECTION_STRING });
  await client.connect();
  console.log('✅ Conectado a Supabase PostgreSQL');

  const sqlPath = resolve(__dirname, '..', 'supabase-schema.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      await client.query(stmt + ';');
      console.log(`  ✓ ${stmt.slice(0, 60).replace(/\n/g, ' ')}...`);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        console.log(`  - ya existe (omitido)`);
      } else {
        console.error(`  ✗ ERROR: ${msg.slice(0, 120)}`);
      }
    }
  }

  await client.end();
  console.log('\n✅ Esquema aplicado correctamente');
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});

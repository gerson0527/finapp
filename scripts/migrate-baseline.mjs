import pg from 'pg';
import { readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from './load-env.mjs';
import { printDbUrlHelp, warnIfSuspiciousDbUrl } from './db-url-hint.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, '..', 'supabase', 'migrations');

loadEnv();

const CONNECTION_STRING = process.env.SUPABASE_DB_URL;
if (!CONNECTION_STRING) {
  console.error('❌ Define SUPABASE_DB_URL en .env');
  process.exit(1);
}

warnIfSuspiciousDbUrl(CONNECTION_STRING);

async function main() {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  const client = new pg.Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  for (const name of files) {
    await client.query(
      'INSERT INTO _schema_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
      [name]
    );
    console.log(`  ✓ marcada: ${name}`);
  }

  await client.end();
  console.log('\n✅ Baseline listo. Las migraciones existentes no se volverán a ejecutar.');
  console.log('   Solo se aplicarán archivos nuevos con: npm run db:migrate');
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  printDbUrlHelp(err.message);
  process.exit(1);
});

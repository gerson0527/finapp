import pg from 'pg';
import { readdirSync, readFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from './load-env.mjs';
import { printDbUrlHelp, warnIfSuspiciousDbUrl } from './db-url-hint.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, '..', 'supabase', 'migrations');

loadEnv();

const CONNECTION_STRING = process.env.SUPABASE_DB_URL;

if (!CONNECTION_STRING) {
  console.error(`
❌ Falta SUPABASE_DB_URL en tu archivo .env

1. Supabase Dashboard → tu proyecto → Settings → Database
2. En "Connection string" elige URI (modo Session o Direct)
3. Reemplaza [YOUR-PASSWORD] por la contraseña de la base de datos
4. Añade en .env:

SUPABASE_DB_URL=postgresql://postgres:TU_PASSWORD@db.vicnaxvswxfgxqeepsjz.supabase.co:5432/postgres

Luego ejecuta: npm run db:migrate
`);
  process.exit(1);
}

warnIfSuspiciousDbUrl(CONNECTION_STRING);

function listMigrationFiles() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query('SELECT name FROM _schema_migrations ORDER BY name');
  return new Set(rows.map((r) => r.name));
}

async function applyMigration(client, filename) {
  const sql = readFileSync(join(MIGRATIONS_DIR, filename), 'utf-8');
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('INSERT INTO _schema_migrations (name) VALUES ($1)', [filename]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function main() {
  const files = listMigrationFiles();
  if (files.length === 0) {
    console.log('No hay archivos en supabase/migrations/');
    return;
  }

  const client = new pg.Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Conectado a Supabase PostgreSQL\n');

  await ensureMigrationsTable(client);
  const applied = await getAppliedMigrations(client);

  const pending = files.filter((f) => !applied.has(f));
  const already = files.filter((f) => applied.has(f));

  if (already.length > 0) {
    console.log('Ya aplicadas:');
    for (const f of already) console.log(`  ✓ ${f}`);
    console.log('');
  }

  if (pending.length === 0) {
    console.log('✅ No hay migraciones pendientes.');
    await client.end();
    return;
  }

  console.log(`Pendientes (${pending.length}):`);
  for (const f of pending) console.log(`  → ${f}`);
  console.log('');

  for (const filename of pending) {
    process.stdout.write(`Aplicando ${filename}... `);
    try {
      await applyMigration(client, filename);
      console.log('✅');
    } catch (err) {
      console.log('❌');
      console.error(`\nError en ${filename}:\n${err.message}\n`);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log(`\n✅ ${pending.length} migración(es) aplicada(s) correctamente.`);
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  printDbUrlHelp(err.message);
  process.exit(1);
});

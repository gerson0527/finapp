import pg from 'pg';
import { loadEnv } from './load-env.mjs';
import { printDbUrlHelp, warnIfSuspiciousDbUrl } from './db-url-hint.mjs';

loadEnv();

const CONNECTION_STRING = process.env.SUPABASE_DB_URL;
const args = process.argv.slice(2);
const confirmed = args.includes('--confirm');
const includeCategories = args.includes('--categories') || args.includes('--full');
const includeUsers = args.includes('--users') || args.includes('--full');

const SEED_CATEGORIES = [
  ['Alimentación', 'restaurant', '#AAFF00', 'expense'],
  ['Transporte', 'car', '#FFA500', 'expense'],
  ['Entretenimiento', 'film', '#FF6B6B', 'expense'],
  ['Supermercado', 'cart', '#AAFF00', 'expense'],
  ['Suscripciones', 'play-circle', '#4A9EFF', 'expense'],
  ['Compras', 'bag', '#FF6B6B', 'expense'],
  ['Nómina', 'cash', '#AAFF00', 'income'],
  ['Banco', 'business', '#4A9EFF', 'income'],
  ['Freelance', 'laptop', '#AAFF00', 'income'],
];

function printHelp() {
  console.log(`
Uso:
  npm run db:clear -- --confirm --users
  npm run db:clear -- --confirm --full

Opciones:
  --confirm       Obligatorio. Sin esto no borra nada.
  --users         Borra cuentas de login (auth.users). Tendrás que registrarte de nuevo.
  --categories    Borra categorías y restaura las predeterminadas.
  --full          Todo nuevo: --users + --categories + datos de la app.

Qué borra siempre (con --confirm):
  • transacciones, presupuestos, metas de ahorro
  • cuentas, perfiles, configuración de balance mensual

Qué NO borra:
  • historial de migraciones (_schema_migrations)
`);
}

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

if (!CONNECTION_STRING) {
  console.error('❌ Falta SUPABASE_DB_URL en .env');
  process.exit(1);
}

if (!confirmed) {
  console.error('⚠️  Esto borrará datos de la base de datos.\n');
  printHelp();
  process.exit(1);
}

warnIfSuspiciousDbUrl(CONNECTION_STRING);

async function countRows(client, table, schema = 'public') {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS n FROM ${schema}.${table}`
  );
  return rows[0]?.n ?? 0;
}

async function safeQuery(client, sql) {
  try {
    await client.query(sql);
  } catch (err) {
    if (err.code === '42P01') return false;
    throw err;
  }
  return true;
}

async function deleteAuthUsers(client) {
  const tables = [
    'DELETE FROM auth.sessions',
    'DELETE FROM auth.refresh_tokens',
    'DELETE FROM auth.mfa_factors',
    'DELETE FROM auth.mfa_challenges',
    'DELETE FROM auth.one_time_tokens',
    'DELETE FROM auth.flow_state',
    'DELETE FROM auth.identities',
    'DELETE FROM auth.users',
  ];

  for (const sql of tables) {
    const ok = await safeQuery(client, sql);
    if (ok) {
      console.log(`  ✓ ${sql.replace('DELETE FROM ', '')}`);
    }
  }
}

async function main() {
  const client = new pg.Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('✅ Conectado a Supabase PostgreSQL\n');

  const before = {
    transactions: await countRows(client, 'transactions'),
    budgets: await countRows(client, 'budgets'),
    savings_goals: await countRows(client, 'savings_goals'),
    accounts: await countRows(client, 'accounts'),
    profiles: await countRows(client, 'profiles'),
    monthly_balance_config: await countRows(client, 'monthly_balance_config'),
    categories: await countRows(client, 'categories'),
    auth_users: await countRows(client, 'users', 'auth'),
  };

  console.log('Registros actuales:');
  for (const [table, n] of Object.entries(before)) {
    console.log(`  ${table}: ${n}`);
  }
  console.log('');

  await client.query('BEGIN');
  try {
    await client.query(`
      TRUNCATE TABLE
        transactions,
        budgets,
        savings_goals,
        monthly_balance_config,
        accounts,
        profiles
      RESTART IDENTITY CASCADE;
    `);
    console.log('✓ Datos de la app eliminados');

    if (includeCategories) {
      await client.query('TRUNCATE TABLE categories RESTART IDENTITY CASCADE;');
      for (const [name, icon, color, type] of SEED_CATEGORIES) {
        await client.query(
          'INSERT INTO categories (name, icon, color, type) VALUES ($1, $2, $3, $4)',
          [name, icon, color, type]
        );
      }
      console.log(`✓ Categorías restauradas (${SEED_CATEGORIES.length} predeterminadas)`);
    }

    if (includeUsers) {
      console.log('✓ Eliminando usuarios de login...');
      await deleteAuthUsers(client);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }

  await client.end();
  console.log('\n✅ Base de datos limpiada.');

  if (includeUsers) {
    console.log('   No quedan usuarios. Regístrate de nuevo en la app.');
  } else {
    console.log('   Los usuarios de login se mantienen. Usa --users para borrarlos.');
  }

  if (!includeCategories) {
    console.log('   Las categorías se mantuvieron. Usa --categories o --full para resetearlas.');
  }
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  printDbUrlHelp(err.message);
  process.exit(1);
});

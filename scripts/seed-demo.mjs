/**
 * Seed de datos de prueba — usuario demo con historial de meses anteriores.
 *
 * Uso:
 *   npm run db:seed
 *   npm run db:seed -- --fresh   (borra y recrea el usuario demo)
 *
 * Credenciales:
 *   Email:    demo@finapp.test
 *   Password: Demo1234!
 */
import pg from 'pg';
import { randomUUID } from 'crypto';
import { loadEnv } from './load-env.mjs';
import { printDbUrlHelp, warnIfSuspiciousDbUrl } from './db-url-hint.mjs';

loadEnv();

const CONNECTION_STRING = process.env.SUPABASE_DB_URL;
const DEMO_EMAIL = 'demo@finapp.test';
const DEMO_PASSWORD = 'Demo1234!';
const DEMO_NAME = 'María Demo';
const MONTHLY_INCOME = 4_500_000;
const MONTHS_COUNT = 6;

const BUDGET_TEMPLATES = [
  { title: 'Netflix', category: 'Suscripciones', limit: 150_000 },
  { title: 'Spotify', category: 'Suscripciones', limit: 50_000 },
  { title: 'Supermercado', category: 'Supermercado', limit: 850_000 },
  { title: 'Transporte', category: 'Transporte', limit: 320_000 },
  { title: 'Gym', category: 'Entretenimiento', limit: 120_000 },
];

const SYSTEM_CATEGORIES = [
  ['Alimentación', 'restaurant', '#AAFF00', 'expense'],
  ['Transporte', 'car', '#FFA500', 'expense'],
  ['Entretenimiento', 'film', '#FF6B6B', 'expense'],
  ['Supermercado', 'cart', '#AAFF00', 'expense'],
  ['Suscripciones', 'play-circle', '#4A9EFF', 'expense'],
  ['Compras', 'bag', '#FF6B6B', 'expense'],
  ['Nómina', 'cash', '#AAFF00', 'income'],
  ['Banco', 'business', '#4A9EFF', 'income'],
  ['Freelance', 'laptop', '#AAFF00', 'income'],
  ['Ahorro', 'wallet', '#00D4AA', 'expense'],
];

function getRecentMonths(count) {
  const months = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

function padDay(month, day) {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  const d = Math.min(day, last);
  return `${month}-${String(d).padStart(2, '0')}`;
}

function timeAt(h, m) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

async function ensureSystemCategories(client) {
  for (const [name, icon, color, type] of SYSTEM_CATEGORIES) {
    await client.query(
      `INSERT INTO categories (name, icon, color, type, user_id)
       SELECT $1, $2, $3, $4, NULL
       WHERE NOT EXISTS (
         SELECT 1 FROM categories WHERE name = $1 AND user_id IS NULL
       )`,
      [name, icon, color, type]
    );
  }

  const { rows } = await client.query(
    `SELECT id, name FROM categories WHERE user_id IS NULL`
  );
  const map = {};
  for (const row of rows) map[row.name] = row.id;
  return map;
}

async function deleteDemoUser(client) {
  const { rows } = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [DEMO_EMAIL]);
  if (!rows.length) return false;
  await client.query(`DELETE FROM auth.users WHERE id = $1`, [rows[0].id]);
  return true;
}

async function createDemoUser(client) {
  await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

  const { rows: instanceRows } = await client.query(`SELECT id FROM auth.instances LIMIT 1`);
  const instanceId = instanceRows[0]?.id ?? '00000000-0000-0000-0000-000000000000';

  const userId = randomUUID();
  const identityId = randomUUID();

  await client.query(
    `INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at,
      confirmation_token, recovery_token, email_change, email_change_token_new,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, is_sso_user
    ) VALUES (
      $1, $2, 'authenticated', 'authenticated', $3,
      crypt($4, gen_salt('bf')),
      NOW(), NOW(),
      '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      $5::jsonb,
      NOW(), NOW(), false
    )`,
    [
      userId,
      instanceId,
      DEMO_EMAIL,
      DEMO_PASSWORD,
      JSON.stringify({ display_name: DEMO_NAME }),
    ]
  );

  const userIdText = String(userId);

  const emailLower = DEMO_EMAIL.toLowerCase();

  await client.query(
    `INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      $1, $2,
      jsonb_build_object('sub', $3::text, 'email', $4::text, 'email_verified', true),
      'email', $4::text,
      NOW(), NOW(), NOW()
    )`,
    [identityId, userId, userIdText, emailLower]
  );

  return userId;
}

function buildMonthPlan(monthIndex, totalMonths, cats) {
  const variance = monthIndex * 17_000;
  const income = MONTHLY_INCOME + variance;

  const expenses = [
    { day: 1, desc: 'Nómina mensual', cat: 'Nómina', type: 'income', amount: income, budget: null },
    { day: 8, desc: 'Netflix', cat: 'Suscripciones', type: 'expense', amount: 149_900, budget: 'Netflix' },
    { day: 8, desc: 'Spotify', cat: 'Suscripciones', type: 'expense', amount: 49_900, budget: 'Spotify' },
    { day: 10, desc: 'Mercado semanal', cat: 'Supermercado', type: 'expense', amount: 185_000 + variance % 40_000, budget: 'Supermercado' },
    { day: 18, desc: 'Mercado quincenal', cat: 'Supermercado', type: 'expense', amount: 210_000, budget: 'Supermercado' },
    { day: 25, desc: 'Compras fin de mes', cat: 'Supermercado', type: 'expense', amount: 245_000 - variance % 30_000, budget: 'Supermercado' },
    { day: 4, desc: 'Uber / Transmilenio', cat: 'Transporte', type: 'expense', amount: 45_000, budget: 'Transporte' },
    { day: 12, desc: 'Gasolina', cat: 'Transporte', type: 'expense', amount: 95_000, budget: 'Transporte' },
    { day: 20, desc: 'Transporte', cat: 'Transporte', type: 'expense', amount: 72_000, budget: 'Transporte' },
    { day: 28, desc: 'Taxi', cat: 'Transporte', type: 'expense', amount: 38_000, budget: 'Transporte' },
    { day: 15, desc: 'Gym', cat: 'Entretenimiento', type: 'expense', amount: 99_000, budget: 'Gym' },
    { day: 14, desc: 'Almuerzo fuera', cat: 'Alimentación', type: 'expense', amount: 42_000 + monthIndex * 3_000, budget: null },
    { day: 22, desc: 'Cena', cat: 'Alimentación', type: 'expense', amount: 68_000, budget: null },
  ];

  if (monthIndex === totalMonths - 1) {
    expenses.push({
      day: 3,
      desc: 'Proyecto freelance',
      cat: 'Freelance',
      type: 'income',
      amount: 850_000,
      budget: null,
    });
  }

  if (monthIndex >= totalMonths - 2) {
    expenses.push({
      day: 6,
      desc: 'Ropa',
      cat: 'Compras',
      type: 'expense',
      amount: 180_000 + monthIndex * 5_000,
      budget: null,
    });
  }

  return expenses.filter((e) => cats[e.cat]);
}

async function seedUserData(client, userId, cats) {
  await client.query(
    `INSERT INTO profiles (id, onboarding_completed, monthly_income)
     VALUES ($1, true, $2)
     ON CONFLICT (id) DO UPDATE SET onboarding_completed = true, monthly_income = $2`,
    [userId, MONTHLY_INCOME]
  );

  const accountId = randomUUID();
  await client.query(
    `INSERT INTO accounts (id, user_id, name, type, balance, currency, color)
     VALUES ($1, $2, 'Cuenta Principal', 'checking', 0, 'COP', '#FFE566')`,
    [accountId, userId]
  );

  await client.query(
    `INSERT INTO savings_goals (user_id, title, subtitle, icon, color, target_amount, saved_amount)
     VALUES ($1, 'Fondo de Emergencia', 'Red de Seguridad', 'shield-checkmark', '#AAFF00', $2, $3)`,
    [userId, MONTHLY_INCOME * 3, 2_400_000]
  );

  await client.query(
    `INSERT INTO savings_goals (user_id, title, subtitle, icon, color, target_amount, saved_amount)
     VALUES ($1, 'Viaje a la costa', 'Vacaciones 2026', 'airplane', '#4A9EFF', $2, $3)`,
    [userId, 3_500_000, 890_000]
  );

  await client.query(
    `INSERT INTO notification_settings (user_id, daily_reminder_enabled, daily_reminder_time, budget_alerts_enabled)
     VALUES ($1, true, '20:00', true)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

  const months = getRecentMonths(MONTHS_COUNT);
  let runningBalance = 0;
  let txCount = 0;
  let budgetCount = 0;

  for (let mi = 0; mi < months.length; mi++) {
    const month = months[mi];
    const budgetIds = {};

    for (const tpl of BUDGET_TEMPLATES) {
      const catId = cats[tpl.category];
      if (!catId) continue;
      const budgetId = randomUUID();
      budgetIds[tpl.title] = budgetId;
      await client.query(
        `INSERT INTO budgets (id, user_id, title, category_id, month, limit_amount)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [budgetId, userId, tpl.title, catId, month, tpl.limit]
      );
      budgetCount++;
    }

    const plan = buildMonthPlan(mi, months.length, cats).sort((a, b) => a.day - b.day);

    for (const item of plan) {
      const isRecurring =
        mi === months.length - 1 && item.budget === 'Netflix' && item.type === 'expense';

      await client.query(
        `INSERT INTO transactions (
          user_id, type, amount, description, category_id, account_id,
          date, time, budget_id, is_recurring, recurrence_day
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          userId,
          item.type,
          item.amount,
          item.desc,
          cats[item.cat],
          accountId,
          padDay(month, item.day),
          timeAt(9 + (item.day % 8), (item.day * 7) % 60),
          item.budget ? budgetIds[item.budget] ?? null : null,
          isRecurring,
          isRecurring ? 8 : null,
        ]
      );

      runningBalance += item.type === 'income' ? item.amount : -item.amount;
      txCount++;
    }

    await client.query(
      `INSERT INTO monthly_balance_config (user_id, month, net_balance)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, month) DO UPDATE SET net_balance = $3`,
      [userId, month, runningBalance]
    );
  }

  await client.query(`UPDATE accounts SET balance = $1 WHERE id = $2`, [runningBalance, accountId]);

  return { txCount, budgetCount, runningBalance, months };
}

async function main() {
  const fresh = process.argv.includes('--fresh');

  if (!CONNECTION_STRING) {
    console.error('❌ Falta SUPABASE_DB_URL en .env');
    process.exit(1);
  }

  warnIfSuspiciousDbUrl(CONNECTION_STRING);

  const client = new pg.Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Conectado a Supabase PostgreSQL\n');

  try {
    await client.query('BEGIN');

    const cats = await ensureSystemCategories(client);

    const { rows: existing } = await client.query(
      `SELECT id FROM auth.users WHERE email = $1`,
      [DEMO_EMAIL]
    );

    if (existing.length && !fresh) {
      console.log('ℹ️  Usuario demo ya existe. Usa --fresh para recrearlo.\n');
      await client.query('ROLLBACK');
      printCredentials(existing[0].id);
      await client.end();
      return;
    }

    if (existing.length && fresh) {
      await deleteDemoUser(client);
      console.log('✓ Usuario demo anterior eliminado');
    }

    const userId = await createDemoUser(client);
    console.log('✓ Usuario demo creado');

    const stats = await seedUserData(client, userId, cats);

    await client.query('COMMIT');

    console.log('\n✅ Seed completado\n');
    console.log(`   Transacciones: ${stats.txCount}`);
    console.log(`   Presupuestos:  ${stats.budgetCount} (${MONTHS_COUNT} meses)`);
    console.log(`   Balance final: $${stats.runningBalance.toLocaleString('es-CO')} COP`);
    console.log(`   Meses:         ${stats.months[0]} → ${stats.months[stats.months.length - 1]}`);
    printCredentials(userId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

function printCredentials(userId) {
  console.log('\n── Credenciales de prueba ──');
  console.log(`   Email:    ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
  console.log(`   Nombre:   ${DEMO_NAME}`);
  console.log(`   User ID:  ${userId}`);
  console.log('\n   Inicia sesión en la app con esos datos.\n');
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  printDbUrlHelp(err.message);
  process.exit(1);
});

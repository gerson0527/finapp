import pg from 'pg';
import { loadEnv } from './load-env.mjs';

loadEnv();

const USER_ID = '59d7d875-fedb-48c1-9eb5-13cfcf122ffa';

async function main() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error('Missing SUPABASE_DB_URL');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const { rows } = await client.query(
    `SELECT id, description, date, time, amount, type, is_recurring, recurrence_day, recurring_source_id, created_at
     FROM transactions
     WHERE user_id = $1
       AND date BETWEEN '2026-06-01' AND '2026-06-30'
     ORDER BY date, description, created_at`,
    [USER_ID]
  );

  console.log('=== Transacciones junio 2026 ===');
  for (const r of rows) {
    console.log(
      `${r.date} ${r.time?.slice?.(0, 5) ?? r.time} | ${r.description} | $${r.amount} | recurring=${r.is_recurring} | source=${r.recurring_source_id ?? 'null'} | id=${r.id.slice(0, 8)}`
    );
  }
  console.log('Total:', rows.length);

  const { rows: dupes } = await client.query(
    `SELECT description, date, amount, COUNT(*)::int AS n,
            array_agg(id ORDER BY created_at) AS ids,
            array_agg(is_recurring ORDER BY created_at) AS recurring_flags,
            array_agg(recurring_source_id::text ORDER BY created_at) AS sources
     FROM transactions
     WHERE user_id = $1 AND date BETWEEN '2026-06-01' AND '2026-06-30'
     GROUP BY description, date, amount
     HAVING COUNT(*) > 1`,
    [USER_ID]
  );

  console.log('\n=== Posibles duplicados (misma descripción/fecha/monto) ===');
  console.log(JSON.stringify(dupes, null, 2));

  const { rows: idx } = await client.query(
    `SELECT indexname FROM pg_indexes WHERE tablename = 'transactions' AND indexname LIKE '%recurring%'`
  );
  console.log('\n=== Índices recurring ===', idx.map((i) => i.indexname));

  await client.end();
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});

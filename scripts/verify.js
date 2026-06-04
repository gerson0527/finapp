const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DB, ssl: { rejectUnauthorized: false } });

async function main() {
  await c.connect();
  const { rows: cats } = await c.query('SELECT count(*)::int as n FROM categories');
  const { rows: acct } = await c.query('SELECT name, balance FROM accounts');
  const { rows: goals } = await c.query('SELECT count(*)::int as n FROM savings_goals');
  const { rows: names } = await c.query("SELECT name FROM categories ORDER BY name");
  console.log('Categorias:', cats[0].n);
  console.log('Cuenta:', acct[0].name, acct[0].balance);
  console.log('Metas:', goals[0].n);
  console.log('Nombres:', names.map(r => r.name).join(', '));
  await c.end();
}

main().catch(e => console.error(e.message));

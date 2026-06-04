const { Client } = require('pg');
const CONNECTION_STRING = process.env.DB;
if (!CONNECTION_STRING) { console.error('Define DB'); process.exit(1); }

async function main() {
  const c = new Client({ connectionString: CONNECTION_STRING, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const { rows: r1 } = await c.query("SELECT count(*)::int as n FROM categories");
  console.log('categorias:', r1[0].n);

  if (r1[0].n > 10) {
    await c.query("DELETE FROM transactions");
    await c.query("DELETE FROM budgets");
    await c.query("DELETE FROM categories");
    await c.query("DELETE FROM accounts WHERE name NOT LIKE '%Principal%'");
    await c.query("DELETE FROM savings_goals");
    console.log('duplicados eliminados');

    await c.query("INSERT INTO categories (name, icon, color, type) VALUES " +
      "('Alimentación', 'restaurant', '#AAFF00', 'expense')," +
      "('Transporte', 'car', '#FFA500', 'expense')," +
      "('Entretenimiento', 'film', '#FF6B6B', 'expense')," +
      "('Supermercado', 'cart', '#AAFF00', 'expense')," +
      "('Suscripciones', 'play-circle', '#4A9EFF', 'expense')," +
      "('Compras', 'bag', '#FF6B6B', 'expense')," +
      "('Nómina', 'cash', '#AAFF00', 'income')," +
      "('Banco', 'business', '#4A9EFF', 'income')," +
      "('Freelance', 'laptop', '#AAFF00', 'income')");
    console.log('categorias re-insertadas');

    await c.query("INSERT INTO accounts (name, type, balance, currency) VALUES " +
      "('Cuenta Principal', 'checking', 24560800, 'COP')");
    console.log('cuenta re-insertada');

    await c.query("INSERT INTO savings_goals (title, subtitle, icon, color, target_amount, saved_amount) VALUES " +
      "('Viaje a Cartagena', 'Fondo de Vacaciones', 'airplane', '#4A9EFF', 3000000, 1200000), " +
      "('Fondo de Emergencia', 'Red de Seguridad', 'shield-checkmark', '#AAFF00', 8000000, 3500000)");
    console.log('metas re-insertadas');
  }

  const { rows: r2 } = await c.query("SELECT count(*)::int as n FROM categories");
  console.log('categorias final:', r2[0].n);

  await c.end();
  console.log('OK');
}

main().catch(e => console.error(e.message));

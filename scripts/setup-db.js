const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const CONNECTION_STRING = process.env.DB;
if (!CONNECTION_STRING) { console.error('❌ Define DB env var'); process.exit(1); }

function splitSQL(sql) {
  const stmts = [];
  let buf = '';
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i];

    // String literal
    if (ch === "'" || ch === '"') {
      const quote = ch;
      buf += quote;
      i++;
      while (i < sql.length) {
        buf += sql[i];
        if (sql[i] === quote && sql[i - 1] !== '\\') break;
        i++;
      }
      i++;
      continue;
    }

    // Dollar-quoted string: $tag$ ... $tag$
    if (ch === '$') {
      let j = i + 1;
      let tag = '';
      while (j < sql.length && sql[j] !== '$') { tag += sql[j]; j++; }
      if (j < sql.length && sql[j] === '$') {
        const start = `$${tag}$`;
        buf += start;
        const rest = sql.slice(j + 1);
        const endIdx = rest.indexOf(start);
        if (endIdx !== -1) {
          buf += rest.slice(0, endIdx + start.length);
          i = j + 1 + endIdx + start.length;
          continue;
        }
      }
    }

    // Line comment
    if (ch === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      i++;
      continue;
    }

    // Block comment
    if (ch === '/' && sql[i + 1] === '*') {
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    // Statement separator
    if (ch === ';') {
      const t = buf.trim();
      if (t && t.length > 3) stmts.push(t);
      buf = '';
      i++;
      continue;
    }

    buf += ch;
    i++;
  }

  const t = buf.trim();
  if (t && t.length > 3) stmts.push(t);
  return stmts;
}

async function main() {
  const client = new Client({ connectionString: CONNECTION_STRING, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ Conectado a PostgreSQL');

  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase-schema.sql'), 'utf-8');
  const statements = splitSQL(sql);

  let ok = 0, err = 0;
  for (const stmt of statements) {
    try {
      await client.query(stmt);
      console.log(`  ✓ ${stmt.replace(/\n/g, ' ').slice(0, 65)}`);
      ok++;
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('already exists')) { console.log(`  - ya existe`); ok++; }
      else { console.error(`  ✗ ${msg.slice(0, 120)}`); err++; }
    }
  }
  await client.end();
  console.log(`\n✅ ${ok} OK, ${err} errores`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

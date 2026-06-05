/** Mensajes útiles cuando falla la conexión a PostgreSQL. */
export function printDbUrlHelp(errorMessage = '') {
  const isAuth = /password authentication failed|authentication failed/i.test(errorMessage);

  console.error(`
❌ No se pudo conectar a Supabase PostgreSQL.
${isAuth ? '\nCausa habitual: la contraseña en SUPABASE_DB_URL es incorrecta.\n' : ''}
Cómo obtener la URL correcta:

1. Abre https://supabase.com/dashboard → tu proyecto
2. Settings → Database
3. En "Database password":
   - Si no la recuerdas → "Reset database password" y copia la nueva
4. En "Connection string" → pestaña URI → modo "Direct connection"
5. Copia la URI y reemplaza [YOUR-PASSWORD] por esa contraseña

Formato esperado en .env:
SUPABASE_DB_URL=postgresql://postgres:TU_PASSWORD_REAL@db.vicnaxvswxfgxqeepsjz.supabase.co:5432/postgres

⚠️  NO uses:
   - La anon key (EXPO_PUBLIC_SUPABASE_ANON_KEY)
   - El ID del proyecto (vicnaxvswxfgxqeepsjz)
   - El texto literal [YOUR-PASSWORD]

Si la contraseña tiene caracteres especiales (@ # % / etc.), codifícala en URL
o resetea la contraseña en Supabase usando solo letras y números.

Luego: npm run db:migrate
`);
}

export function warnIfSuspiciousDbUrl(url) {
  try {
    const parsed = new URL(url);
    const password = decodeURIComponent(parsed.password || '');
    const host = parsed.hostname || '';
    const projectRef = host.replace(/^db\./, '').replace(/\.supabase\.co$/, '');

    if (!password || password === '[YOUR-PASSWORD]' || password === 'TU_PASSWORD') {
      console.warn('⚠️  SUPABASE_DB_URL parece tener un placeholder en lugar de contraseña real.\n');
      return;
    }

    if (projectRef && password === projectRef) {
      console.warn(
        '⚠️  En SUPABASE_DB_URL pusiste el ID del proyecto como contraseña.\n' +
        '   Debes usar la "Database password" de Settings → Database.\n'
      );
    }
  } catch {
    // URL mal formada; el error de conexión lo mostrará después
  }
}

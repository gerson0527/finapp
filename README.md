# FinApp

App de finanzas personales con **Expo SDK 56**, **Supabase** y UI neo-brutalista.

## Requisitos

- Node.js 22+
- Cuenta en [Supabase](https://supabase.com)

## Configuración

1. Copia `.env.example` a `.env` y completa las variables de Supabase.
2. Ejecuta las migraciones en `supabase/migrations/` (SQL Editor de Supabase).
3. Instala dependencias e inicia:

```bash
npm install
npm start
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo |
| `npm run start:go` | Modo Expo Go |
| `npm run start:dev` | Development build |
| `npm run web` | Versión web |

## EAS

Proyecto vinculado a Expo Application Services. Ver `eas.json`.

## Desplegar en Vercel (navegador / móvil)

1. Importa el repo [gerson0527/finapp](https://github.com/gerson0527/finapp) en [vercel.com](https://vercel.com).
2. En **Environment Variables** añade:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Vercel usará `vercel.json` (build: `npm run build:web`, salida: `dist`).
4. Tras el deploy, abre la URL desde el navegador del teléfono.

Build local: `npm run build:web`

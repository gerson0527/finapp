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

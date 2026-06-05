import { AuthError } from '@supabase/supabase-js';

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed:
    'Tu cuenta aún no está activa. En Supabase desactiva "Confirm email" (Authentication → Providers → Email).',
  user_already_registered: 'Este correo ya está registrado. Inicia sesión en su lugar.',
  over_email_send_rate_limit:
    'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  weak_password: 'La contraseña es muy débil. Usa al menos 6 caracteres.',
  signup_disabled:
    'El proveedor Email está desactivado en Supabase. Ve a Authentication → Providers (Proveedores) → Email y actívalo. Tu pantalla de "Registros de usuarios" ya está bien; falta encender Email en Proveedores.',
  email_provider_disabled:
    'El proveedor Email está desactivado. Authentication → Providers → Email → activar el proveedor. "Confirmar correo" puede quedar apagado.',
};

function codeFromError(error: unknown): string | undefined {
  if (error instanceof AuthError && error.code) return error.code;
  if (error instanceof Error && 'code' in error && typeof (error as { code?: string }).code === 'string') {
    return (error as { code: string }).code;
  }
  return undefined;
}

export function getAuthErrorMessage(error: unknown): string {
  const code = codeFromError(error);
  if (code === 'email_provider_disabled') return MESSAGES.email_provider_disabled;
  if (code && MESSAGES[code]) return MESSAGES[code];

  if (error instanceof AuthError) {
    if (error.message === 'Invalid login credentials') {
      return MESSAGES.invalid_credentials;
    }
  }

  if (error instanceof Error && error.message) {
    if (/email signups are disabled/i.test(error.message)) {
      return MESSAGES.email_provider_disabled;
    }
    return error.message;
  }

  return 'Ocurrió un error. Inténtalo de nuevo.';
}

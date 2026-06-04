import { AuthError } from '@supabase/supabase-js';

const MESSAGES: Record<string, string> = {
  invalid_credentials:
    'Correo o contraseña incorrectos. Si acabas de registrarte, confirma tu email primero.',
  email_not_confirmed:
    'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
  user_already_registered: 'Este correo ya está registrado. Inicia sesión en su lugar.',
  over_email_send_rate_limit:
    'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  weak_password: 'La contraseña es muy débil. Usa al menos 6 caracteres.',
};

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    const byCode = error.code ? MESSAGES[error.code] : undefined;
    if (byCode) return byCode;

    if (error.message === 'Invalid login credentials') {
      return MESSAGES.invalid_credentials;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Ocurrió un error. Inténtalo de nuevo.';
}

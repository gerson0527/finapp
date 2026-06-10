import { supabase } from '@/lib/supabase';

/** Evita llamar auth.getUser() (red) en cada servicio; se sincroniza desde AuthContext. */
let cachedUserId: string | null | undefined;

export function setAuthUserIdCache(userId: string | null) {
  cachedUserId = userId;
}

export async function getCurrentUserIdOrNull(): Promise<string | null> {
  if (cachedUserId !== undefined) return cachedUserId;

  const { data: { session } } = await supabase.auth.getSession();
  cachedUserId = session?.user?.id ?? null;
  return cachedUserId;
}

export async function getCurrentUserId(): Promise<string> {
  const id = await getCurrentUserIdOrNull();
  if (!id) throw new Error('No autenticado');
  return id;
}

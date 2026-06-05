import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, Session } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type AuthStateListener = (session: Session | null) => void;

/** Listener central de sesión — usar desde AuthContext */
export function onAuthSessionChange(listener: AuthStateListener) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    listener(session);
  });
  return () => data.subscription.unsubscribe();
}

export async function getAuthSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

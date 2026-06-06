import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { getAuthSession, onAuthSessionChange, supabase } from '@/lib/supabase';
import { needsOnboarding } from '@/services/profileService';

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  onboardingComplete: boolean | null;
  pendingWelcome: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ type: 'success' | 'info'; title: string; message: string }>;
  signOut: () => Promise<void>;
  refreshOnboarding: () => Promise<void>;
  completeWelcome: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [pendingWelcome, setPendingWelcome] = useState(false);

  const refreshOnboarding = useCallback(async () => {
    if (!session) {
      setOnboardingComplete(null);
      return;
    }
    try {
      const pending = await needsOnboarding();
      setOnboardingComplete(!pending);
    } catch {
      setOnboardingComplete(false);
    }
  }, [session]);

  useEffect(() => {
    let mounted = true;

    async function applySession(session: Session | null) {
      if (!mounted) return;
      setSession(session);
      if (session) {
        try {
          const pending = await needsOnboarding();
          setOnboardingComplete(!pending);
        } catch {
          setOnboardingComplete(false);
        }
      } else {
        setOnboardingComplete(null);
        setPendingWelcome(false);
      }
      setIsLoading(false);
    }

    getAuthSession().then(applySession);

    const unsubscribe = onAuthSessionChange((session) => {
      applySession(session);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setPendingWelcome(true);
  }

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.session) setPendingWelcome(true);

    if (data.user?.identities?.length === 0) {
      const err = new Error('Este correo ya está registrado. Inicia sesión en su lugar.');
      (err as Error & { code?: string }).code = 'user_already_registered';
      throw err;
    }

    if (data.session) {
      return {
        type: 'success' as const,
        title: 'Cuenta creada',
        message: 'Tu cuenta está lista. Redirigiendo…',
      };
    }

    return {
      type: 'info' as const,
      title: 'Cuenta creada',
      message: 'Tu cuenta fue creada. Inicia sesión con tu correo y contraseña.',
    };
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setPendingWelcome(false);
  }

  function completeWelcome() {
    setPendingWelcome(false);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        onboardingComplete,
        pendingWelcome,
        signIn,
        signUp,
        signOut,
        refreshOnboarding,
        completeWelcome,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

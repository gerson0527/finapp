import { useEffect } from 'react';
import { useApp } from '@/src/context/AppContext';

/** Recarga datos cuando cambia refreshKey (tras crear/editar/borrar). */
export function useAppRefresh(refresh: () => void, extraDeps: unknown[] = []) {
  const { refreshKey } = useApp();

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, refresh, ...extraDeps]);
}

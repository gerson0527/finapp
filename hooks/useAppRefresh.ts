import { useEffect, useRef } from 'react';
import { useApp } from '@/src/context/AppContext';

/** Recarga al montar y cuando cambia refreshKey (sin duplicar la carga inicial). */
export function useAppRefresh(refresh: () => void, extraDeps: unknown[] = []) {
  const { refreshKey } = useApp();
  const mounted = useRef(false);
  const lastKey = useRef(refreshKey);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      lastKey.current = refreshKey;
      refresh();
      return;
    }
    if (lastKey.current !== refreshKey) {
      lastKey.current = refreshKey;
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, refresh, ...extraDeps]);
}

import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { useApp } from '@/src/context/AppContext';

const STALE_MS = 20_000;

/** Recarga al enfocar la pantalla solo si los datos están viejos o hubo cambios globales. */
export function useFocusRefresh(refresh: () => void, deps: unknown[] = []) {
  const { refreshKey } = useApp();
  const lastLoadedAt = useRef(0);
  const lastRefreshKey = useRef(refreshKey);

  useFocusEffect(
    useCallback(() => {
      const keyChanged = lastRefreshKey.current !== refreshKey;
      const stale = Date.now() - lastLoadedAt.current > STALE_MS;
      const neverLoaded = lastLoadedAt.current === 0;

      if (neverLoaded || keyChanged || stale) {
        lastRefreshKey.current = refreshKey;
        lastLoadedAt.current = Date.now();
        refresh();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refresh, refreshKey, ...deps])
  );
}

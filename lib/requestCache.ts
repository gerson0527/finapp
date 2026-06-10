const store = new Map<string, { data: unknown; expires: number }>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry || Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: unknown, ttlMs: number) {
  store.set(key, { data, expires: Date.now() + ttlMs });
}

export function invalidateRequestCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Lectura con caché en memoria (TTL corto). Se invalida con triggerRefresh(). */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 30_000
): Promise<T> {
  const hit = getCached<T>(key);
  if (hit !== null) return hit;
  const data = await fetcher();
  setCache(key, data, ttlMs);
  return data;
}

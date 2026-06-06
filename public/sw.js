const STATIC_CACHE = 'finapp-static-v1';
const SUPABASE_HOST = 'supabase.co';

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico',
];

const STATIC_PATH_RE =
  /\.(?:js|css|woff2?|ttf|otf|png|jpe?g|webp|svg|ico|json|html)$|\/_expo\/|\/assets\/|\/icons\/|\/screenshots\//i;

function isSupabaseRequest(url) {
  return url.hostname.includes(SUPABASE_HOST);
}

function isStaticAsset(url, request) {
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'font') {
    return true;
  }
  return STATIC_PATH_RE.test(url.pathname);
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const fallback = await cache.match('/');
    if (fallback) return fallback;
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin && !isSupabaseRequest(url)) return;

  if (isSupabaseRequest(url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isStaticAsset(url, request)) {
    event.respondWith(cacheFirst(request));
  }
});

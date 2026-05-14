const CACHE_NAME = 'qhse-terrain-v6';

/** Précache léger : pas de HTML (évite un shell figé d’une ancienne build). */
const PRECACHE_URLS = ['/manifest.webmanifest'];

const INDEX_URL = new URL('/index.html', self.location.origin).href;
const ROOT_URL = new URL('/', self.location.origin).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {});
      /* Première installation : activer tout de suite. Mise à jour : attendre SKIP_WAITING (toast client). */
      if (!self.registration.active) {
        await self.skipWaiting();
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

/** Cache first + revalidate (stale-while-revalidate) — extensions terrain demandées. */
function isCacheFirstStaticPath(pathname) {
  return /\.(?:js|css|woff2|svg|png)$/i.test(pathname);
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

/** Document / shell HTML : network first, repli cache. */
function isNavigateOrShellRequest(request, url) {
  if (request.mode === 'navigate') return true;
  const p = url.pathname;
  return p === '/' || p === '/index.html';
}

async function putResponse(cache, request, response) {
  try {
    await cache.put(request, response.clone());
  } catch {
    /* réponse non cacheable (opaque, range, etc.) */
  }
}

/** Réseau uniquement — jamais de réponse API depuis le cache (QHSE). */
function networkOnly(request) {
  return fetch(request);
}

async function safeFetch(request) {
  try {
    return await fetch(request);
  } catch {
    return null;
  }
}

/** Réseau → mise à jour cache ; échec → cache (requête, index, /). */
async function networkFirstNavigate(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(request);
    if (res.ok) {
      await putResponse(cache, request, res);
      return res;
    }
    const fallback =
      (await caches.match(request)) || (await caches.match(INDEX_URL)) || (await caches.match(ROOT_URL));
    return fallback || res;
  } catch {
    const fallback =
      (await caches.match(request)) || (await caches.match(INDEX_URL)) || (await caches.match(ROOT_URL));
    if (fallback) return fallback;
    return new Response('Hors ligne', { status: 503, statusText: 'Service Unavailable' });
  }
}

/** Static assets (JS/CSS/etc.) : network first pour éviter les vieux chunks, fallback cache. */
async function networkFirstStatic(request) {
  const cache = await caches.open(CACHE_NAME);
  const networkRes = await safeFetch(request);
  if (networkRes && networkRes.ok) {
    await putResponse(cache, request, networkRes);
    return networkRes;
  }

  const cached = await cache.match(request);
  if (cached) return cached;

  if (networkRes) return networkRes;
  return new Response('', { status: 503, statusText: 'Service Unavailable' });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  if (req.headers.has('range')) {
    event.respondWith(safeFetch(req).then((res) => res || new Response('', { status: 503, statusText: 'Service Unavailable' })));
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(networkOnly(req));
    return;
  }

  if (isNavigateOrShellRequest(req, url)) {
    event.respondWith(networkFirstNavigate(req));
    return;
  }

  if (isCacheFirstStaticPath(url.pathname)) {
    event.respondWith(networkFirstStatic(req));
    return;
  }

  event.respondWith(safeFetch(req).then((res) => res || new Response('', { status: 503, statusText: 'Service Unavailable' })));
});

// Notification de mise à jour SW
self.addEventListener('message', (event) => {
  if (event?.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'terrain-incident-sync') {
    event.waitUntil(
      self.clients.matchAll().then(clients =>
        clients.forEach(c => c.postMessage({ type: 'SW_SYNC_INCIDENTS' }))
      )
    );
  }
  if (event.tag === 'terrain-risk-sync') {
    event.waitUntil(
      self.clients.matchAll().then(clients =>
        clients.forEach(c => c.postMessage({ type: 'SW_SYNC_RISKS' }))
      )
    );
  }
});

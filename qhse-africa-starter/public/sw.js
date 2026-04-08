const CACHE_NAME = 'qhse-terrain-v4';

/** Précache léger : pas de HTML (évite un shell figé d’une ancienne build). */
const PRECACHE_URLS = ['/manifest.webmanifest'];

const INDEX_URL = new URL('/index.html', self.location.origin).href;
const ROOT_URL = new URL('/', self.location.origin).href;

self.addEventListener('message', (event) => {
  if (event?.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  /* Active rapidement la nouvelle version ; le client marque la mise à jour avant la fin d’install
     (updatefound) pour recharger une seule fois au controllerchange. */
  self.skipWaiting();
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

function isStaticAssetPath(pathname) {
  return /\.(?:js|css|mjs|png|jpg|jpeg|gif|svg|webp|ico|avif|woff2?|ttf|eot|otf|webmanifest|map)$/i.test(
    pathname
  );
}

/** Document ou entrées shell explicites : toujours réseau d’abord, pas de shell obsolète servi en priorité. */
function isAppShellRequest(request, url) {
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

/** Réseau → mise à jour du cache ; échec → cache (requête, puis index, puis /). */
async function networkFirstShell(request) {
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

/** Cache d’abord (offline rapide) ; mise à jour en arrière-plan si le réseau répond. */
async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  const networkPromise = fetch(request)
    .then(async (res) => {
      if (res.ok) {
        const cache = await caches.open(CACHE_NAME);
        await putResponse(cache, request, res);
      }
      return res;
    })
    .catch(() => null);

  if (cached) {
    void networkPromise;
    return cached;
  }

  const res = await networkPromise;
  if (res) return res;
  return new Response('', { status: 504, statusText: 'Gateway Timeout' });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const req = event.request;
  const url = new URL(req.url);

  /* Ne pas intercepter les appels vers une autre origine (API Railway) : évite chemins
     opaques / conflits CSP ; le document parle directement à l’API. */
  if (url.origin !== self.location.origin) return;

  /* Requêtes partielles : ne pas les mettre en cache (put échoue souvent). */
  if (req.headers.has('range')) {
    event.respondWith(fetch(req));
    return;
  }

  if (isAppShellRequest(req, url)) {
    event.respondWith(networkFirstShell(req));
    return;
  }

  if (isStaticAssetPath(url.pathname)) {
    event.respondWith(cacheFirstStatic(req));
    return;
  }

  /* Autres GET même origine : réseau d’abord, repli cache générique (sans forcer le shell). */
  event.respondWith(
    fetch(req)
      .then(async (res) => {
        if (res.ok) {
          const cache = await caches.open(CACHE_NAME);
          await putResponse(cache, req, res);
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});

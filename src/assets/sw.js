/* India Helpline service worker — offline directory cache.
   Works at any base path (site root or GitHub Pages project sub-path):
   all paths are computed from this worker's registration scope.
   Strategy: navigations = network-first with cache fallback (withdrawn
   records disappear after refresh); directory.json = network-first;
   static assets = cache-first with background refresh. */
const VERSION = 'v1';
const SCOPE = new URL(self.registration.scope).pathname; // e.g. '/' or '/india-helpline/'
const SHELL = [
  'ui/styles.css',
  'ui/app.js',
  'ui/favicon.svg',
  'manifest.webmanifest',
  'directory.json',
  'index.html',
  'hi/index.html',
].map((p) => SCOPE + p);

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) =>
      Promise.allSettled(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' }))))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

async function staleWhileRevalidate(req, cache) {
  const cached = await cache.match(req);
  const netFetch = fetch(req).then((res) => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  return cached || netFetch || Response.error();
}

async function networkFirst(req, cache, fallbackUrl) {
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
    if (cached) return cached;
    if (fallbackUrl) {
      const fb = await cache.match(fallbackUrl);
      if (fb) return fb;
    }
    return Response.error();
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (!url.pathname.startsWith(SCOPE)) return; // don't capture paths outside our scope
  const cache = caches.open(VERSION);

  if (req.mode === 'navigate') {
    e.respondWith(networkFirst(req, cache, SCOPE + 'index.html'));
    return;
  }
  if (url.pathname.endsWith('/directory.json')) {
    e.respondWith(networkFirst(req, cache));
    return;
  }
  e.respondWith(staleWhileRevalidate(req, cache));
});

// tell open clients the cached build date when asked
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'cache-date') {
    caches.open(VERSION).then((c) => c.match(SCOPE + 'directory.json')).then((m) => {
      if (!m) return;
      m.json().then((j) => {
        if (j && j.build) e.source.postMessage({ type: 'cached-date', date: j.build });
      }).catch(() => {});
    });
  }
});

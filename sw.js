/* India Helpline service worker — offline directory cache.
   Works at any base path (site root or GitHub Pages project sub-path):
   all paths are computed from this worker's registration scope.
   Strategy: navigations = network-first with cache fallback (withdrawn
   records disappear after refresh); directory.json = network-first;
   static assets = cache-first with background refresh. */
const VERSION = 'v3';
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
  const netFetch = fetch(req.url).then((res) => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  return cached || netFetch || offlineResponse(req);
}

async function networkFirst(req, cache, fallbackUrl) {
  try {
    // NOTE: navigation Requests have mode 'navigate' which fetch() rejects —
    // always fetch by URL string instead of re-fetching the original request.
    const res = await fetch(req.url);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(req, { ignoreSearch: req.mode === 'navigate' })
      || await caches.match(req)
      || (fallbackUrl ? await cache.match(fallbackUrl) : null)
      || (req.mode === 'navigate' ? await caches.match(SCOPE + 'index.html') : null);
    if (cached) return cached;
    return offlineResponse(req);
  }
}

const OFFLINE_HTML =
  '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
  '<title>India Helpline — offline</title><body style="font-family:system-ui;max-width:32rem;margin:3rem auto;padding:0 1.25rem;line-height:1.6">' +
  '<h1>You are offline</h1><p>This page was not saved in your browser yet. Reconnect to load it.</p>' +
  '<p>If this is an emergency, call <a href="tel:112" style="font-size:1.6rem;font-weight:800">112</a> now — calls to emergency services do not need this website.</p>' +
  '</body></html>';

function offlineResponse(req) {
  if (req && req.mode === 'navigate') {
    return new Response(OFFLINE_HTML, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
  return new Response('offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
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

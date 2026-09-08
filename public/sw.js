// Bump this on any deploy that changes STATIC_ASSETS or the caching strategy below.
const CACHE_NAME = 'medoxatoz-v3';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.webp',
  '/offline.html',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Fetch:
//   - Navigations (actual page loads): network-first, falling back to the
//     precached /offline.html on failure. Previously this fell back to
//     caches.match(request), which almost never matched the exact URL being
//     navigated to (only '/' was ever cached) and produced either a raw
//     network error ("page not reachable") or, when the URL WAS '/', a
//     stale cached shell HTML pointing at hashed JS/CSS bundle filenames
//     from a previous deploy that were never cached and no longer exist --
//     hence pages "loading with no CSS". /offline.html is fully
//     self-contained (inline styles, no external requests) so it always
//     renders correctly regardless of what else is or isn't cached.
//   - Everything else (hashed JS/CSS bundles, images, etc.): pass straight
//     through to the network. Only the explicitly precached STATIC_ASSETS
//     get a cache fallback; anything else is simply allowed to fail on its
//     own when offline instead of resolving to a bogus/missing cache entry.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests — always go to network for those
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/offline.html').then((cached) => cached || Response.error())
      )
    );
    return;
  }

  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || Response.error()))
    );
  }
});

// Bump this on any deploy that changes STATIC_ASSETS or the caching strategy below.
const CACHE_NAME = 'medoxatoz-v4';
// Deliberately NOT '/' -- caching the HTML shell this way is exactly what
// produced pages that "loaded with no CSS" (see the fetch handler comment
// below). manifest.json/logo.webp are safe: static, non-HTML, never
// reference a deploy's hashed bundle filenames.
const STATIC_ASSETS = [
  '/manifest.json',
  '/logo.webp',
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

// Fetch: network-first for the explicitly precached STATIC_ASSETS only,
// falling back to their own cached copy when offline. Everything else
// (page navigations included) passes straight through to the network with
// no interception -- a failed navigation gets the browser/WebView's own
// native offline handling instead of a custom page.
//
// This used to also intercept navigations and serve a custom offline
// fallback page. That's deliberately gone: the in-app <OfflineOverlay/>
// (mounted in the root layout) now covers the real, common case -- the app
// is already loaded and loses connectivity mid-session -- using this app's
// actual UI instead of a separate static HTML file, which a service worker
// (no DOM/React access, just raw Response bytes) could never really share
// design with anyway. A stale cached '/' previously also produced pages
// that "loaded with no CSS" (referencing a previous deploy's hashed bundle
// filenames, never cached and often gone) -- not intercepting navigations
// at all avoids that failure mode entirely.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests — always go to network for those
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (!STATIC_ASSETS.includes(url.pathname)) return;

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
});

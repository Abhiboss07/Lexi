// Lexi Service Worker — Offline Shell and Static Asset Caching
const CACHE_NAME = 'lexi-offline-v1';

// Dynamic base resolution based on registration scope (e.g., '/' or '/Lexi/')
const getBaseScope = () => {
  try {
    return new URL(self.registration.scope).pathname;
  } catch {
    return '/';
  }
};

const getPrecacheAssets = () => {
  const base = getBaseScope();
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return [
    normalizedBase,
    `${normalizedBase}index.html`,
    `${normalizedBase}favicon.svg`,
    `${normalizedBase}manifest.webmanifest`,
  ];
};

// Install: pre-cache application shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(getPrecacheAssets()).catch((err) => {
        console.warn('Lexi precache partial failure:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: delete old cache versions and claim immediate control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for navigation with cache fallback; stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignore non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Do not intercept or cache external AI endpoints or non-HTTP(S) schemes
  if (
    url.hostname.includes('googleapis.com') ||
    url.protocol.startsWith('chrome-extension')
  ) {
    return;
  }

  // 1. Navigation requests (HTML documents): network first with offline index.html fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const base = getBaseScope();
          const normalizedBase = base.endsWith('/') ? base : `${base}/`;
          const fallbackShell = (await caches.match(`${normalizedBase}index.html`)) || (await caches.match(normalizedBase));
          if (fallbackShell) return fallbackShell;
          const rootFallback = (await caches.match('/index.html')) || (await caches.match('/'));
          if (rootFallback) return rootFallback;
          return new Response('Offline - Lexi', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        })
    );
    return;
  }

  // 2. Static assets (JS, CSS, fonts, images, SVGs)
  const isStaticAsset =
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|woff|woff2|json)$/);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return networkResponse;
          })
          .catch(() => {
            // Offline and not in cache
            return cachedResponse;
          });

        // Return cached immediately if available, while updating cache in background
        return cachedResponse || fetchPromise;
      })
    );
  }
});

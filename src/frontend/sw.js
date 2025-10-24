/**
 * Service Worker - Offline-first caching strategy
 * Cache static assets and API responses for offline functionality
 */

const CACHE_VERSION = 'ctech-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/home',
  '/login',
  '/services',
  '/schedule',
  '/css/main.css',
  '/css/enhancements.css',
  '/css/floating-buttons.css',
  '/css/loader.css',
  '/css/presentation-mode.css',
  '/css/c5-modal.css',
  '/css/c5-animation.css',
  '/css/c5-redesign.css',
  '/css/schedule.css',
  '/js/themeManager.js',
  '/js/headerManager.js',
  '/js/scrollAnimations.js',
  '/js/presentationMode.js',
  '/js/c5Modal.js',
  '/js/c5ScrollAnimation.js',
  '/js/responsiveHelper.js',
  '/img/logo.webp'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/services',
  '/api/chatbot',
  '/api/status'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', CACHE_VERSION);

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })))
        .catch(err => {
          console.warn('[Service Worker] Failed to cache some static assets:', err);
          // Continue even if some assets fail
          return Promise.resolve();
        });
    }).then(() => {
      console.log('[Service Worker] Installed successfully');
      return self.skipWaiting(); // Activate immediately
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...', CACHE_VERSION);

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('ctech-') && cacheName !== STATIC_CACHE && cacheName !== API_CACHE && cacheName !== IMAGE_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activated');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - Network First, fallback to Cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Images - Cache First, fallback to Network
  if (request.destination === 'image' || url.pathname.startsWith('/img/') || url.pathname.startsWith('/uploads/')) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Static assets - Cache First, fallback to Network
  event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
});

/**
 * Network First Strategy - Try network, fallback to cache
 * Best for API requests that need fresh data
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[Service Worker] Serving from cache:', request.url);
      return cachedResponse;
    }

    // Return offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Không có kết nối internet. Vui lòng thử lại sau.',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Cache First Strategy - Try cache, fallback to network
 * Best for static assets that don't change often
 */
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log('[Service Worker] Serving from cache:', request.url);
    return cachedResponse;
  }

  console.log('[Service Worker] Cache miss, fetching from network:', request.url);

  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Failed to fetch:', request.url, error);

    // Return offline page for HTML requests
    if (request.destination === 'document') {
      return new Response(
        `<!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Offline - CTECH</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #16a34a; }
            p { color: #666; }
            button { background: #16a34a; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
            button:hover { background: #15803d; }
          </style>
        </head>
        <body>
          <h1>Không có kết nối internet</h1>
          <p>Vui lòng kiểm tra kết nối mạng và thử lại.</p>
          <button onclick="window.location.reload()">Thử lại</button>
        </body>
        </html>`,
        {
          status: 503,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    return new Response('Offline', { status: 503 });
  }
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

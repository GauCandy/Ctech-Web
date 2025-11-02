// Service Worker for Schedule Page Offline Support
const CACHE_NAME = 'schedule-cache-v10'; // Network-first strategy: always serve latest when online
const ASSETS_TO_CACHE = [
  '/schedule.html',
  '/css/main.css',
  '/css/schedule.css',
  '/css/loader.css',
  '/css/user-menu.css',
  '/js/themeManager.js',
  '/js/remoteGestures.js',
  '/js/headerManager.js',
  '/js/swRegister.js',
  '/js/scheduleManager.js',
  '/img/logo.webp',
  '/manifest.json',
  '/',  // Root page for fallback
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[Service Worker] Installed successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated successfully');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // IMPORTANT: Skip all non-GET requests (POST, PUT, DELETE, etc.)
  // This ensures file uploads and mutations work correctly
  if (request.method !== 'GET') {
    return; // Let browser handle it normally
  }

  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    // Network first for API calls (GET only)
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Optionally cache successful GET API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Try cache if network fails
          return caches.match(request);
        })
    );
  } else {
    // Network first for static assets - always try online first
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Don't cache if not a success response
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Update cache with latest version
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          console.log('[Service Worker] Serving from network:', request.url);
          return response;
        })
        .catch((error) => {
          console.log('[Service Worker] Network failed, trying cache:', request.url);

          // Network failed - try cache as fallback
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('[Service Worker] Serving from cache (offline):', request.url);
                return cachedResponse;
              }

              // No cache either - return offline page for documents
              if (request.destination === 'document') {
                return caches.match('/schedule.html');
              }

              throw error;
            });
        })
    );
  }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

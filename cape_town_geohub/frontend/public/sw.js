const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `geohub-${CACHE_VERSION}`;
const DATA_CACHE_NAME = `geohub-data-${CACHE_VERSION}`;
const TILE_CACHE_NAME = `geohub-tiles-${CACHE_VERSION}`;

// Application shell files to cache on install
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/index.css',
  '/assets/index.js'
];

// Map tile URL patterns
const TILE_PATTERNS = [
  /^https:\/\/[a-z]\.basemaps\.cartocdn\.com/,
  /^https:\/\/[a-z]\.tile\.openstreetmap\.org/
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/services\//,
  /\/api\/transport\//,
  /\/api\/safety\//,
  /\/api\/environment\//,
  /\/api\/land-use\//,
  /\/api\/utilities\//
];

// Maximum cache sizes
const MAX_TILE_CACHE_ITEMS = 500;
const MAX_DATA_CACHE_ITEMS = 50;
const TILE_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const DATA_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Failed to cache app shell:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('geohub-') &&
                     name !== CACHE_NAME &&
                     name !== DATA_CACHE_NAME &&
                     name !== TILE_CACHE_NAME;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle tile requests
  if (isTileRequest(url.href)) {
    event.respondWith(handleTileRequest(event.request));
    return;
  }

  // Handle API requests
  if (isApiRequest(url.pathname)) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Handle app shell requests
  event.respondWith(handleAppShellRequest(event.request));
});

// Check if URL is a map tile
function isTileRequest(url) {
  return TILE_PATTERNS.some(pattern => pattern.test(url));
}

// Check if URL is an API endpoint
function isApiRequest(pathname) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(pathname));
}

// Handle map tile requests with LRU caching
async function handleTileRequest(request) {
  const cache = await caches.open(TILE_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Return cached tile, refresh in background
    refreshTileCache(request, cache);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Clone and cache the response
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);

      // Enforce cache size limit
      enforceTileCacheLimit(cache);
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Tile fetch failed:', error);
    return new Response('', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Handle API requests with stale-while-revalidate
async function handleApiRequest(request) {
  const cache = await caches.open(DATA_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Try network first for fresh data
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    // Fall back to cache
    if (cachedResponse) {
      console.log('[SW] Serving cached API response:', request.url);
      return cachedResponse;
    }

    // Return offline error response
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are offline and this data is not cached',
        cached: false
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle app shell requests
async function handleAppShellRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && request.method === 'GET') {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // For navigation requests, return the cached index.html
    if (request.mode === 'navigate') {
      const indexResponse = await cache.match('/index.html');
      if (indexResponse) {
        return indexResponse;
      }
    }

    return new Response('Offline', { status: 503 });
  }
}

// Refresh tile in background
async function refreshTileCache(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse);
    }
  } catch (error) {
    // Silent fail for background refresh
  }
}

// Enforce tile cache size limit using LRU eviction
async function enforceTileCacheLimit(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_TILE_CACHE_ITEMS) {
    const keysToDelete = keys.slice(0, keys.length - MAX_TILE_CACHE_ITEMS);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
    console.log(`[SW] Evicted ${keysToDelete.length} old tiles from cache`);
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_DATASET':
      cacheDataset(payload.url, payload.name);
      break;

    case 'CLEAR_CACHE':
      clearCache(payload.cacheName);
      break;

    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
  }
});

// Cache a specific dataset
async function cacheDataset(url, name) {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    const response = await fetch(url);
    if (response.ok) {
      await cache.put(url, response);
      notifyClients('DATASET_CACHED', { name, url, success: true });
    }
  } catch (error) {
    notifyClients('DATASET_CACHED', { name, url, success: false, error: error.message });
  }
}

// Clear a specific cache
async function clearCache(cacheName) {
  try {
    await caches.delete(cacheName);
    notifyClients('CACHE_CLEARED', { cacheName, success: true });
  } catch (error) {
    notifyClients('CACHE_CLEARED', { cacheName, success: false, error: error.message });
  }
}

// Get cache status
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};

  for (const name of cacheNames) {
    if (name.startsWith('geohub-')) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      status[name] = {
        itemCount: keys.length,
        items: keys.map(req => req.url)
      };
    }
  }

  // Get storage estimate
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    status.storage = {
      usage: estimate.usage,
      quota: estimate.quota,
      percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
    };
  }

  return status;
}

// Notify all clients
function notifyClients(type, payload) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type, payload });
    });
  });
}

// Background sync for queued actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queued-actions') {
    event.waitUntil(syncQueuedActions());
  }
});

async function syncQueuedActions() {
  // Get queued actions from IndexedDB
  // Process each action
  // Notify clients of sync completion
  notifyClients('SYNC_COMPLETE', { timestamp: Date.now() });
}

// Periodic background sync for data refresh
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-data') {
    event.waitUntil(refreshCachedData());
  }
});

async function refreshCachedData() {
  const cache = await caches.open(DATA_CACHE_NAME);
  const keys = await cache.keys();

  for (const request of keys) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response);
      }
    } catch (error) {
      console.log('[SW] Failed to refresh:', request.url);
    }
  }

  notifyClients('DATA_REFRESHED', { timestamp: Date.now() });
}

console.log('[SW] Service worker loaded');

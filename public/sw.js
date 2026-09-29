/* A.J Motorbike Spares service worker - Enhanced offline support */
const CACHE = 'aj-spares-v1';
const PRECACHE = ['/', '/index.html', '/manifest.json', '/favicon.svg'];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      console.log('[SW] Pre-caching assets');
      return cache.addAll(PRECACHE);
    }).then(() => {
      console.log('[SW] Service worker activated');
      self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((keys) => {
      console.log('[SW] Found caches:', keys);
      return Promise.all(
        keys
          .filter((k) => k !== CACHE)
          .map((k) => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Firebase API calls - network first with offline fallback
  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('firebaseapp.com')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Cache successful responses for offline fallback
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => {
          // Return cached data if available, else offline message
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response('Offline - Data not cached', { status: 503 });
          });
        })
    );
    return;
  }

  // Static assets - network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((res) => {
        // Cache successful responses
        if (res.ok && request.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return res;
      })
      .catch(() => {
        // Try cache, then home page fallback
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          return caches.match('/').then((home) => home || new Response('Offline - Page not cached', { status: 503 }));
        });
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ('focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/sales');
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_SALE_NOTIFICATION') {
    const { title, body } = event.data;
    self.registration.showNotification(title || 'New sale', {
      body: body || 'A sale was completed',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'aj-sale',
      renotify: true,
    });
  }
});

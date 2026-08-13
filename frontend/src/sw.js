import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute }          from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin }        from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim }            from 'workbox-core';

// Precache estático inyectado por Vite-PWA
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// UpdateNotification.jsx llama a updateServiceWorker(true), que le manda este
// mensaje al SW en espera para activarlo de inmediato. Con la estrategia
// injectManifest, vite-plugin-pwa NO agrega este listener automáticamente
// (a diferencia de generateSW) — sin él, el botón "Actualizar" no hace nada.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
clientsClaim();

// Navegación → siempre index.html
registerRoute(
  new NavigationRoute(new NetworkFirst({ cacheName: 'navigation' }), {
    denylist: [/^\/api/],
  })
);

// Google Fonts
registerRoute(
  ({ url }) => url.origin.includes('fonts.google') || url.origin.includes('fonts.gstatic'),
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Transacciones
registerRoute(
  ({ url }) => url.pathname.includes('/api/transactions'),
  new NetworkFirst({
    cacheName: 'transactions-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Cuentas
registerRoute(
  ({ url }) => url.pathname.includes('/api/accounts'),
  new NetworkFirst({
    cacheName: 'accounts-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Reportes
registerRoute(
  ({ url }) => url.pathname.includes('/api/reports'),
  new StaleWhileRevalidate({
    cacheName: 'reports-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 2 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Categorías y recurrentes
registerRoute(
  ({ url }) => url.pathname.includes('/api/categories') || url.pathname.includes('/api/recurring'),
  new StaleWhileRevalidate({
    cacheName: 'static-api-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// ── Push Notifications ────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try { data = event.data.json(); }
  catch { data = { title: 'FinanceApp', body: event.data.text(), url: '/' }; }

  event.waitUntil(
    self.registration.showNotification(data.title || 'FinanceApp', {
      body:    data.body || '',
      icon:    '/icons/icon-192x192.png',
      badge:   '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      data:    { url: data.url || '/' },
      actions: [{ action: 'open', title: 'Ver ahora' }],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':    ['react', 'react-dom', 'react-router-dom'],
          'recharts-vendor': ['recharts'],
          'zustand-vendor':  ['zustand'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',        // notificamos al usuario cuando hay actualización
      includeAssets: ['icons/*.png', 'icons/*.svg', 'icons/icon.svg'],
      manifest: {
        name: 'FinanceApp — Finanzas Personales',
        short_name: 'FinanceApp',
        description: 'Gestiona tus finanzas personales de forma inteligente',
        theme_color: '#7c3aed',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'es',
        categories: ['finance', 'productivity'],
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Nueva transacción',
            short_name: 'Transacción',
            url: '/transactions',
            icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            url: '/',
            icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // Fuentes de Google — cache first (rara vez cambian)
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Transacciones — network first, fallback a cache
          {
            urlPattern: /\/api\/transactions/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'transactions-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Cuentas — network first
          {
            urlPattern: /\/api\/accounts/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'accounts-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Reportes — stale while revalidate
          {
            urlPattern: /\/api\/reports/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'reports-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 2 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Categorías y recurrentes — stale while revalidate
          {
            urlPattern: /\/api\/(categories|recurring)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-api-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,   // no activar SW en dev para evitar problemas de caché
      },
    }),
  ],
});

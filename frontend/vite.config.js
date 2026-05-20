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
      strategies:   'injectManifest',
      srcDir:       'src',
      filename:     'sw.js',
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/*.png', 'icons/*.svg', 'icons/icon.svg'],
      manifest: {
        name: 'FinanceApp — Finanzas Personales',
        short_name: 'FinanceApp',
        description: 'Gestiona tus finanzas personales de forma inteligente',
        theme_color: '#7c3aed',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/dashboard',
        scope: '/',
        lang: 'es',
        categories: ['finance', 'productivity'],
        icons: [
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any'      },
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any'      },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Nueva transacción', short_name: 'Transacción', url: '/transactions', icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }] },
          { name: 'Dashboard',         short_name: 'Dashboard',   url: '/dashboard',    icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }] },
        ],
      },
      devOptions: {
        enabled:  false,
        type:     'module',
      },
    }),
  ],
});

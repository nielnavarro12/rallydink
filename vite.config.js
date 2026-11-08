import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: "Drive 'N Dink",
        short_name: "Drive'NDink",
        theme_color: '#0b0f14',
        icons: [
          { src: '/images/logo.jpeg', sizes: '192x192', type: 'image/jpeg' },
          { src: '/images/logo.jpeg', sizes: '512x512', type: 'image/jpeg' }
        ]
      }
    })
  ],
  resolve: {
    // Prevents duplicate @firebase module instances brought in by workbox-build
    dedupe: ['firebase', '@firebase/app', '@firebase/firestore', '@firebase/analytics']
  },
  optimizeDeps: {
    // Force Vite to pre-bundle Firebase modules together
    include: [
      'firebase/app',
      'firebase/firestore',
      'firebase/analytics'
    ]
  },
  base: './', // relative asset paths: works on GitHub Pages under /repo-name/ and on any other host
  server: { host: true }, // reachable from other devices on your Wi-Fi
});

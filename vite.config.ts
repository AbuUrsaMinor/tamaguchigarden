import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/tamaguchigarden/', // Set base for GitHub Pages deployment
  worker: {
    format: 'es', // Use ES modules for workers
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      filename: 'sw.js',
      manifestFilename: 'manifest.webmanifest',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'Tamaguchi Garden',
        short_name: 'TamaGarden',
        description: 'Virtual garden that grows while you focus',
        theme_color: '#242424',
        background_color: '#242424',
        display: 'standalone',
        start_url: './index.html',
        scope: './',
        icons: [
          {
            src: 'vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        cleanupOutdatedCaches: true,
        sourcemap: true,
        navigateFallback: 'index.html',
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    headers: {
      'Service-Worker-Allowed': '/',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  preview: {
    headers: {
      'Service-Worker-Allowed': '/',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
})

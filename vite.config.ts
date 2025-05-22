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
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'Tamaguchi Garden',
        short_name: 'TamaGarden',
        description: 'A virtual garden with Tamaguchi-like creatures',
        theme_color: '#242424',
        background_color: '#242424',
        display: 'standalone',
        start_url: '/tamaguchigarden/',
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
    }),
  ],
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'N Mobile – Postime për Instagram',
        short_name: 'N Mobile',
        description: 'Krijo postime për Instagram nga fotot e telefonave në pak sekonda.',
        lang: 'sq',
        theme_color: '#141416',
        background_color: '#141416',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      // the AI background-removal runtime (onnxruntime, lazy-loaded) is not precached for offline use
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'], globIgnores: ['**/ort*', '**/*.wasm'] }
    })
  ]
})

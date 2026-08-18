import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    // Allow access via any host (e.g. Cloudflare tunnels, LAN IPs)
    allowedHosts: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Universal Media Streamer',
        short_name: 'UMS',
        description: 'Stream HLS, DASH, direct media files, YouTube, and IPTV in one player',
        theme_color: '#0f172a',
        background_color: '#0a0a0f',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: {
    // Ensure only one copy of React is bundled - prevents the
    // "Cannot read properties of null (reading 'useContext')" error
    // that occurs when framer-motion or other deps bring their own React.
    dedupe: ['react', 'react-dom'],
  },
});

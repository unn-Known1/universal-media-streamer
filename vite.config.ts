import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Universal Media Streamer',
        short_name: 'UMS',
        description: 'Stream HLS, DASH, and direct media files',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
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

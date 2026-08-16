import { defineConfig } from 'vite';
import reactPlugin from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    reactPlugin(),
    // PWA: makes the app installable and usable offline. See docs/PWA.md.
    VitePWA({
      registerType: 'prompt',
      // Auto-generate the full icon set (192/512, maskable, apple-touch,
      // favicon.ico) from public/favicon.svg at build time.
      pwaAssets: {
        preset: 'minimal-2023',
        image: 'public/favicon.svg',
      },
      manifest: {
        name: 'Phoebis — ASCII Art Editor',
        short_name: 'Phoebis',
        description: 'A browser-based phoxel/ASCII art editor',
        theme_color: '#1A1B1E',
        background_color: '#1A1B1E',
        display: 'standalone',
        start_url: '/',
        scope: '/',
      },
      workbox: {
        // Precache the BDF fonts (fetched at runtime via /fonts/*.bdf) plus
        // generated icons so the app works fully offline.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,bdf}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  optimizeDeps: {
    include: ['@phosphor-icons/react'],
  },
});

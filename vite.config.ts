import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /api/exoplanets to the official TAP sync endpoint during local development
      '/api/exoplanets': {
        target: 'https://exoplanetarchive.ipac.caltech.edu',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/exoplanets/, '/TAP/sync'),
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

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
      // Proxy /api/gemini to the local proxy server (Express) in development
      '/api/gemini': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      // Proxy /api/predict to local proxy during development so we avoid CORS and can use server-side PREDICT_ENDPOINT
      '/api/predict': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

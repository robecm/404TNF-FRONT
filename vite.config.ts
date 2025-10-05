import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // No proxy: client calls the official Exoplanet Archive API directly
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Set a higher threshold for chunk size warnings (e.g., 1000 kB)
    chunkSizeWarningLimit: 1000,
    // Configure Rollup options for more control over the build process
    rollupOptions: {
      output: {
        // Use a manual chunking strategy to optimize bundle sizes
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});

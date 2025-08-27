import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react({
        fastRefresh: true,
      }),
    ],
    base: '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // Keep React and related packages together to prevent hook errors
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'react-vendor';
              }
              if (id.includes('@react-three') || id.includes('three')) {
                return 'three-vendor';
              }
              if (id.includes('gsap')) {
                return 'gsap-vendor';
              }
              return 'vendor';
            }
          },
        },
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
    server: {
      port: 5175,
      host: true,
      strictPort: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    define: {
      'process.env': {},
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@react-three/drei', '@react-three/fiber', 'three', 'gsap'],
      esbuildOptions: {
        target: 'es2020',
      },
    },
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
    },
  };
});

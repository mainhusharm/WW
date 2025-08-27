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
        jsxRuntime: 'automatic',
      }),
    ],
    base: '/',
    build: {
      target: 'es2015',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
      rollupOptions: {
        external: [],
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // Ensure ALL React-related packages are bundled together
              if (id.includes('react') || 
                  id.includes('react-dom') || 
                  id.includes('react-router') ||
                  id.includes('@react-three') ||
                  id.includes('three') ||
                  id.includes('gsap') ||
                  id.includes('socket.io') ||
                  id.includes('uuid') ||
                  id.includes('axios') ||
                  id.includes('lucide-react') ||
                  id.includes('@heroicons/react')) {
                return 'react-core';
              }
              // Bundle other vendor packages
              return 'vendor';
            }
          },
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
        },
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
        },
      },
    },
    server: {
      port: 5175,
      host: true,
      strictPort: false,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    preview: {
      port: parseInt(process.env.PORT) || 4173,
      host: '0.0.0.0',
      strictPort: false,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        'react': resolve(__dirname, 'node_modules/react'),
        'react-dom': resolve(__dirname, 'node_modules/react-dom'),
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

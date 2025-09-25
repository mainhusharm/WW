import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react({
        // Ensure React 18 compatibility
        jsxImportSource: 'react',
      }),
    ],
    base: '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      chunkSizeWarningLimit: 1000, // Back to 1000 since we have good chunking now
      rollupOptions: {
        output: {
          // Manual chunk splitting for better optimization
          manualChunks: {
            // Vendor chunks
            'vendor-react': ['react', 'react-dom'],
            'vendor-router': ['react-router-dom'],
            'vendor-ui': ['lucide-react', '@heroicons/react'],
            'vendor-charts': ['recharts'],
            'vendor-3d': ['three', '@react-three/fiber', '@react-three/drei'],
            'vendor-animations': ['gsap'],
            'vendor-utils': ['axios', 'uuid', 'zod'],
            'vendor-payments': ['@stripe/stripe-js'],
            'vendor-socket': ['socket.io-client', 'pusher-js'],
          },
          // Ensure consistent chunk naming
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `js/[name]-[hash].js`;
          },
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || '';
            const info = name.split('.');
            const ext = info[info.length - 1];
            if (/\.(css)$/.test(name)) {
              return `css/[name]-[hash].${ext}`;
            }
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(name)) {
              return `images/[name]-[hash].${ext}`;
            }
            return `assets/[name]-[hash].${ext}`;
          },
        },
        plugins: [
          {
            name: 'csp-injection',
            generateBundle(options, bundle) {
              // Inject CSP meta tag into HTML files
              Object.keys(bundle).forEach(fileName => {
                if (fileName.endsWith('.html')) {
                  const file = bundle[fileName];
                  if (file.type === 'asset' && file.source) {
                    const html = file.source.toString();
                    const cspMeta = '<meta http-equiv="Content-Security-Policy" content="default-src * \'unsafe-inline\' \'unsafe-eval\' data: blob:; script-src * \'unsafe-inline\' \'unsafe-eval\' data: blob:; style-src * \'unsafe-inline\' \'unsafe-hashes\' data: blob:; frame-src * data: blob:; connect-src * data: blob:; img-src * data: blob:;">';
                    
                    if (!html.includes('Content-Security-Policy')) {
                      const updatedHtml = html.replace('<head>', `<head>${cspMeta}`);
                      file.source = updatedHtml;
                    }
                  }
                }
              });
            }
          }
        ]
      },
      minify: mode === 'production' ? 'terser' : false,
      terserOptions: mode === 'production' ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
          passes: 1,
          // Remove unsafe options that break React
          unsafe: false,
          unsafe_comps: false,
          unsafe_math: false,
          unsafe_proto: false,
        },
        mangle: {
          toplevel: false, // Don't mangle top-level to preserve React internals
          properties: {
            // Only mangle properties starting with underscore, not React internals
            regex: /^_[a-zA-Z]/
          },
          // Preserve React internal properties
          reserved: [
            'ReactCurrentOwner',
            'ReactCurrentDispatcher',
            'ReactCurrentBatchConfig',
            'ReactCurrentActQueue',
            'ReactCurrentCache',
            'ReactCurrentOwner',
            'ReactCurrentDispatcher',
            'ReactCurrentBatchConfig',
            'ReactCurrentActQueue',
            'ReactCurrentCache'
          ]
        },
        format: {
          comments: false,
        }
      } : undefined,
      // Ensure proper target for modern browsers
      target: 'es2020',
    },
    server: {
      port: 5175,
      host: true,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'https://backend-topb.onrender.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
        },
      },
      headers: {
        'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; style-src * 'unsafe-inline' 'unsafe-hashes' data: blob:; frame-src * data: blob:; connect-src * data: blob:; img-src * data: blob:;"
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        // Ensure React 18 compatibility
        'react': resolve(__dirname, 'node_modules/react'),
        'react-dom': resolve(__dirname, 'node_modules/react-dom'),
      },
    },
    define: {
      'process.env': {},
      // Ensure React 18 features are properly defined
      __DEV__: mode === 'development',
      // Force React 18 mode
      __REACT_18__: 'true',
      // Add global variables for 3D components
      global: 'globalThis',
    },
    optimizeDeps: {
      include: [
        'react', 
        'react-dom', 
        'react-router-dom', 
        '@react-three/drei', 
        '@react-three/fiber', 
        'three', 
        'gsap'
      ],
      exclude: [
        // Exclude packages that might cause React 18 issues
        'react-devtools',
        'react-error-overlay'
      ],
      esbuildOptions: {
        target: 'es2020',
        // Ensure proper JSX handling
        jsx: 'automatic',
        // Force React 18 compatibility
        define: {
          'process.env': '{}',
          '__REACT_18__': 'true'
        }
      },
    },
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
      target: 'es2020',
      // Ensure React 18 compatibility
      jsx: 'automatic',
    },
  };
});

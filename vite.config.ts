import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react({
        fastRefresh: mode === 'development',
        // Ensure React 18 compatibility
        jsxImportSource: 'react',
      }),
    ],
    base: '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Ensure consistent chunk naming
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `js/[name]-[hash].js`;
          },
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(css)$/.test(assetInfo.name)) {
              return `css/[name]-[hash].${ext}`;
            }
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
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
        },
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
          target: env.VITE_API_URL || 'https://backend-8j0e.onrender.com',
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

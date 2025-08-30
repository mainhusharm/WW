import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@heroicons/react', 'lucide-react'],
          charts: ['three', '@react-three/fiber', '@react-three/drei'],
          utils: ['axios', 'socket.io-client', 'uuid']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@api': resolve(__dirname, 'src/api'),
      '@config': resolve(__dirname, 'src/config')
    }
  },

  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL),
    'process.env.REACT_APP_FOREX_API_URL': JSON.stringify(process.env.REACT_APP_FOREX_API_URL)
  },

  server: {
    port: 3000,
    host: true
  },

  preview: {
    port: 4173,
    host: true
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@heroicons/react',
      'lucide-react',
      'axios',
      'socket.io-client'
    ]
  }
});

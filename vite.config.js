import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    host: 'localhost',
    port: 5173,
  },

  // Pre-bundle all listed dependencies in development so Vite serves them as
  // a single request each instead of loading hundreds of individual ESM files.
  // This is the main fix for the "102 requests in dev mode" problem.
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      '@inertiajs/react',
      'axios',
      'framer-motion',
      'lucide-react',
      'react-toastify',
      'chart.js',
      'react-chartjs-2',
      'file-saver',
      'xlsx-js-style',
    ],
    // Force re-optimization when package.json changes
    force: false,
  },

  plugins: [
    laravel({
      input: ['resources/js/app.jsx', 'resources/css/app.css'],
      refresh: true,
    }),
    react(),
  ],

  build: {
    // Increase chunk size warning limit slightly (default 500 kB is too strict for apps)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor libraries from app code so the browser can cache them
        // independently. Library code rarely changes; app code changes often.
        manualChunks: (id) => {
          // React core runtime
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          // Inertia + routing
          if (id.includes('node_modules/@inertiajs')) {
            return 'vendor-inertia';
          }
          // Animation library (large, rarely changes)
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          // Chart libraries (large)
          if (
            id.includes('node_modules/chart.js') ||
            id.includes('node_modules/react-chartjs-2')
          ) {
            return 'vendor-charts';
          }
          // Excel / file export (large, rarely used)
          if (
            id.includes('node_modules/xlsx-js-style') ||
            id.includes('node_modules/file-saver')
          ) {
            return 'vendor-export';
          }
          // Icon library (many small files, better as one chunk)
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // Toast notifications
          if (id.includes('node_modules/react-toastify')) {
            return 'vendor-toast';
          }
          // HTTP client
          if (id.includes('node_modules/axios')) {
            return 'vendor-http';
          }
          // All other node_modules go into a generic vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },
});

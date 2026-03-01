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
        // Keep all node_modules together in a single vendor chunk so React is
        // always guaranteed to be initialised before any package that calls
        // React.createContext() at module-evaluation time.
        // Splitting React into its own chunk causes a race condition in
        // production where vendor-misc is loaded in parallel and tries to call
        // createContext before vendor-react has finished evaluating.
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
});

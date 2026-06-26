import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables across local development and deployment pipelines
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.BACKEND_URL || env.VITE_API_URL || 'http://localhost:3000';

  return {
    plugins: [react()],
    resolve: {
      // 🎯 FORCE VITE TO DEDUPLICATE DEPENDENCIES: Prevents context state splits
      dedupe: ['react', 'react-dom', 'react-router'],
    },
    optimizeDeps: {
      // Pre-bundle essential dependencies instantly into a single global memory layer
      include: ['react', 'react-dom', 'react-router'],
    },
    server: {
      port: 5173, // Locks your sandbox to the port expected by your Google OAuth redirect loops
      proxy: {
        // Intercepts any frontend call starting with '/api' and routes it to your Express backend
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.js',
      css: true,

      env: {
        VITE_API_URL: 'http://localhost:3000'
      },

      
      /* 🌟 AUTOMATED ISOLATION LAYER FOR COMPONENT SUITE PASSES */
      mockReset: true,      // Clears mock implementations between individual tests
      restoreMocks: true,   // Restores spy hooks to their native, unpolluted states
      clearMocks: true,     // Resets call counters between test passes completely
      
      // Prevents concurrent tests from interfering with shared global intercept references
      sequence: { 
        shuffle: false, 
        concurrent: false 
      },
      
      /* 🚀 MODERN COMPONENT TESTING WORKFLOW LOCK */
      pool: 'threads',
      threads: {
        singleThread: true // Keeps tests serial to prevent shared database/fetch state collision leaks
      }
    },
  };
});


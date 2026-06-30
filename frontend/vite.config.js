import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const apiTarget = env.BACKEND_URL || env.VITE_API_URL || 'http://localhost:3000';

  return {
    plugins: [
      react(),
      visualizer({
        filename: 'dist/stats.html',
        title: 'SocialSphere Production Build Asset Distribution Map',
        open: false,
        gzipSize: true,
        brotliSize: true,
      })
    ],
    resolve: {
      dedupe: ['react', 'react-dom', 'react-router'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router'],
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    
    /* 🚀 ==========================================================================
       PRODUCTION COMPILATION OPTIMIZATION MATRIX HOOKS
       ========================================================================== */
    build: {
      target: 'esnext',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProduction, 
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.info', 'console.debug'] : [],
        },
      },
      sourcemap: !isProduction,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 500,
      
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-router') || id.includes('@remix-run')) {
                return 'vendor-router';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              return 'vendor-core';
            }
          },
        },
      },
    },
    
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.js',
      css: true,
      env: { VITE_API_URL: 'http://localhost:3000' },
      
      mockReset: true,
      restoreMocks: true,
      clearMocks: true,
      
      sequence: { shuffle: false, concurrent: false },
      
      pool: 'threads',
      threads: {
        singleThread: true
      }
    },
  };
});

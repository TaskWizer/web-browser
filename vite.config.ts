import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Support both VITE_ prefixed and non-prefixed environment variables
    const apiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
    const modelName = env.VITE_GEMINI_MODEL || env.GEMINI_MODEL || 'models/gemma-3-27b-it';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://127.0.0.1:3001',
            changeOrigin: true,
            // keep path as-is (/api/proxy)
            rewrite: (p) => p,
          }
        }
      },
      plugins: [react()],
      define: {
        // Legacy support for process.env
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_MODEL': JSON.stringify(modelName),
      },
      // Vite automatically exposes VITE_ prefixed env vars to import.meta.env
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
        dedupe: ['react', 'react-dom']
      }
    };
});

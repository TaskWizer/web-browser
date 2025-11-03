import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Support both VITE_ prefixed and non-prefixed environment variables
    const apiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
    const modelName = env.VITE_GEMINI_MODEL || env.GEMINI_MODEL || 'models/gemma-3-27b-it';

    // Determine build mode based on environment variable
    const buildMode = env.BUILD_MODE || (mode === 'development' ? 'spa' : 'library'); // 'library', 'standalone', or 'spa'

    // Library mode configuration for monorepo package
    if (buildMode === 'library') {
      return {
        plugins: [
          react({
            jsxImportSource: 'react',
            // @ts-ignore - fastRefresh is deprecated but still supported
            fastRefresh: true,
          })
        ],
        build: {
          lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'TaskWizerWebBrowser',
            fileName: (format) => `index.${format}.js`,
            formats: ['es', 'umd']
          },
          rollupOptions: {
            external: ['react', 'react-dom', '@taskwizer/shared'],
            output: {
              globals: {
                react: 'React',
                'react-dom': 'ReactDOM'
              }
            }
          }
        },
        define: {
          // Legacy support for process.env
          'process.env.API_KEY': JSON.stringify(apiKey),
          'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
          'process.env.GEMINI_MODEL': JSON.stringify(modelName),
        },
        resolve: {
          alias: {
            '@': path.resolve(__dirname, '.'),
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
        }
      };
    }

    // Standalone/SPA mode for Cloudflare Pages deployment
    const isStandalone = buildMode === 'standalone' || buildMode === 'spa';

    return {
      plugins: [
        react({
          jsxImportSource: 'react',
          // @ts-ignore - fastRefresh is deprecated but still supported
          fastRefresh: true,
        })
      ],
      build: isStandalone ? {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html')
          }
        }
      } : undefined,
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
      define: {
        // Legacy support for process.env
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_MODEL': JSON.stringify(modelName),
        // Build mode flags
        'process.env.BUILD_MODE': JSON.stringify(buildMode),
        'process.env.STANDALONE': JSON.stringify(isStandalone),
      },
      // Vite automatically exposes VITE_ prefixed env vars to import.meta.env
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
        dedupe: ['react', 'react-dom']
      },
      // For standalone mode, handle shared package dependencies
      ...(isStandalone && {
        define: {
          'process.env.API_KEY': JSON.stringify(apiKey),
          'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
          'process.env.GEMINI_MODEL': JSON.stringify(modelName),
          'process.env.BUILD_MODE': JSON.stringify(buildMode),
          'process.env.STANDALONE': JSON.stringify(isStandalone),
          // Mock shared package imports for standalone builds
          'globalThis.__STANDALONE__': JSON.stringify(true),
        }
      })
    };
});

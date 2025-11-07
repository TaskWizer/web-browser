import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';

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
        }),
        // Sentry plugin for error tracking and source maps
        sentryVitePlugin({
          org: process.env.SENTRY_ORG || 'taskwizer',
          project: process.env.SENTRY_PROJECT || 'web-browser',
          authToken: process.env.SENTRY_AUTH_TOKEN,
          // Only upload source maps in production
          sourcemaps: {
            assets: './dist/**',
          },
        }),
        // PWA plugin for service worker and offline support
        VitePWA({
          registerType: 'autoUpdate',
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/r\.jina\.ai\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'jina-api-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24, // 24 hours
                  },
                },
              },
              {
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'images-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                  },
                },
              },
              {
                urlPattern: /\.(?:woff2?|eot|ttf|otf)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'fonts-cache',
                  expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                },
              },
            ],
          },
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
          manifest: {
            name: 'TaskWizer Web Browser',
            short_name: 'TaskWizer',
            description: 'Advanced web browser with AI-powered search and PWA capabilities',
            theme_color: '#1a1a2e',
            background_color: '#0f0f1e',
            display: 'standalone',
            orientation: 'portrait-primary',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable',
              },
            ],
          },
        }),
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
            target: 'http://127.0.0.1:3002',
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

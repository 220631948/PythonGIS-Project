import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'
// Sentry plugin disabled natively
const sentryPlugin = null

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const envApiUrl = env.VITE_API_URL || ''
  const proxyTarget = env.API_PROXY_TARGET
    || (envApiUrl.startsWith('http') ? envApiUrl.replace(/\/+$/, '') : 'http://127.0.0.1:8000')

  return {
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-leaflet', 'lucide-react', 'react-leaflet-cluster'],
  },
  base: '/', // Relative path for production
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png'],
      manifest: {
        name: 'Cape Town GeoHub',
        short_name: 'CT GeoHub',
        description: 'Production technical map for Cape Town land use, services, and safety analysis.',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.openstreetmap\.org\/.*png/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.basemaps\.cartocdn\.com\/.*png/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'carto-tiles',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/citymaps\.capetown\.gov\.za\/.*\/MapServer\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'cct-arcgis-data',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
    ...(sentryPlugin ? [sentryPlugin] : []),
  ],
  build: {
    outDir: '../static',
    emptyOutDir: true,
    copyPublicDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor: React runtime
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Vendor: Leaflet ecosystem
          'vendor-leaflet': ['leaflet', 'react-leaflet'],
          // Vendor: lucide icons
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
  publicDir: 'public',
  // Dev server configuration with proxy for API calls
  server: {
    // Use a predictable port that avoids conflicts with other local apps
    port: Number(process.env.VITE_DEV_PORT) || 5173,
    strictPort: false,
    host: true, // Listen on all addresses (0.0.0.0)
    hmr: {
      overlay: true,
      port: Number(process.env.VITE_DEV_PORT) || 5173,
    },
    // Proxy API requests to the FastAPI backend during development
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Preview server configuration (for vite preview)
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  }
})

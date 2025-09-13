import { resolve } from 'path'
import { defineConfig } from 'vite'
import compression from 'vite-plugin-compression2'

export default defineConfig(({ command }) => ({
  // don't include public dir's content in dist, since those files are only required
  // for the development server (playwright tests)
  publicDir: command === 'build' ? false : 'public',
  plugins: [
    // Emit only gzip bundles for production; no Brotli
    compression({ algorithms: ['gzip'] })
  ],
  build: {
    target: 'es2019',
    lib: {
      entry: 'src/clock-weather-card.ts',
      formats: ['es']
    },
    rollupOptions: {
      output: {
        // Keep other assets (svg, translations) under assets/
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  server: {
    host: true,
    cors: true,
    allowedHosts: true,
    proxy: {
      '/src/clock-weather-card-dev.js': {
        target: 'http://localhost:5173',
        rewrite: () => '/src/clock-weather-card.js'
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
}))

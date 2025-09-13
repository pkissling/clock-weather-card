import { resolve } from 'path'
import { defineConfig } from 'vite'
import compression from 'vite-plugin-compression'

export default defineConfig(({ command }) => ({
  // don't include public dir's content in dist, since those files are only required
  // for the development server (playwright tests)
  publicDir: command === 'build' ? false : 'public',
  plugins: [
    compression(),
  ],
  build: {
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

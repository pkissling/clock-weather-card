import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: 'src/clock-weather-card.ts',
      output: {
        dir: 'dist',
        format: 'es',
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
})

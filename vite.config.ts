import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('ha-card'),
        },
      },
    }),
    vueDevTools(),
  ],
  build: {
    rollupOptions: {
      input: 'src/clock-weather-card.ts',
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
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

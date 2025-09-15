import { resolve } from 'path'
import { defineConfig, type Plugin } from 'vite'
import compression from 'vite-plugin-compression2'

const CUSTOM_ELEMENT_PREFIX = 'clock-weather-card'
const DEV_SUFFIX = '-dev'
const SRC_PATH_PATTERN = /[\\/]src[\\/]/

const appendSuffix = (name: string): string => {
  return name.endsWith(DEV_SUFFIX) ? name : `${name}${DEV_SUFFIX}`
}

const customElementDevSuffixPlugin = (): Plugin => {
  let isDevMode = false

  return {
    name: 'clock-weather-card-dev-suffix',
    enforce: 'pre',
    configResolved (config) {
      isDevMode = config.mode === 'development'
    },
    transform (code, id) {
      if (!isDevMode) return null
      if (!SRC_PATH_PATTERN.test(id)) return null
      if (!/\.[tj]sx?$/.test(id)) return null

      let transformed = code

      const decoratorPattern = new RegExp(`@customElement\\(\\s*(['"])(${CUSTOM_ELEMENT_PREFIX}(?:-[a-z0-9-]+)?)\\1\\s*\\)`, 'g')
      transformed = transformed.replace(decoratorPattern, (_match, quote: string, name: string) => {
        return `@customElement(${quote}${appendSuffix(name)}${quote})`
      })

      const htmlTagPattern = new RegExp(`<(/?)(${CUSTOM_ELEMENT_PREFIX}(?:-[a-z0-9-]+)?)(?=[\\s>/])`, 'g')
      transformed = transformed.replace(htmlTagPattern, (_match, slash: string, name: string) => {
        return `<${slash}${appendSuffix(name)}`
      })

      const normalizedId = id.replace(/\\/g, '/')
      if (normalizedId.endsWith('/src/styles.ts')) {
        const cssSelectorPattern = new RegExp(`(${CUSTOM_ELEMENT_PREFIX}(?:-[a-z0-9-]+)?)(?=\\s*\\{)`, 'g')
        transformed = transformed.replace(cssSelectorPattern, (name: string) => appendSuffix(name))
      }

      if (transformed === code) return null

      return { code: transformed, map: null }
    }
  }
}

export default defineConfig(({ command }) => ({
  // don't include public dir's content in dist, since those files are only required
  // for the development server (playwright tests)
  publicDir: command === 'build' ? false : 'public',
  plugins: [
    customElementDevSuffixPlugin(),
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

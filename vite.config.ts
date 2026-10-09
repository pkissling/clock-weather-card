import { resolve } from 'path'
import { defineConfig, type Plugin } from 'vite'
import compression from 'vite-plugin-compression2'
import zipPack from 'vite-plugin-zip-pack'

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
        const cssSelectorPattern = new RegExp(`(${CUSTOM_ELEMENT_PREFIX}(?:-[a-z0-9-]+)?)(?![a-z0-9-])`, 'g')
        transformed = transformed.replace(cssSelectorPattern, (name: string) => appendSuffix(name))
      }

      if (transformed === code) return null

      return { code: transformed, map: null }
    }
  }
}

const MAX_BUNDLE_BYTES = 210_000

const bundleSizeBudgetPlugin = (): Plugin => ({
  name: 'clock-weather-card-bundle-size-budget',
  apply: 'build',
  generateBundle (_options, bundle) {
    for (const chunk of Object.values(bundle)) {
      if (chunk.type === 'chunk' && chunk.code.length > MAX_BUNDLE_BYTES) {
        this.error(`${chunk.fileName} is ${chunk.code.length} bytes, over the ${MAX_BUNDLE_BYTES} byte budget`)
      }
    }
  }
})

export default defineConfig(({ command }) => ({
  // Resolve emitted assets relative to the card's own URL (e.g. /hacsfiles/clock-weather-card/), not the HA origin.
  base: './',
  plugins: [
    customElementDevSuffixPlugin(),
    bundleSizeBudgetPlugin(),
    // Emit only gzip bundles for production; no Brotli
    compression({ algorithms: ['gzip'] }),
    // Pack the dist into a single zip for HACS distribution
    ...(command === 'build'
      ? [zipPack({
        inDir: 'dist',
        outDir: 'dist',
        outFileName: 'clock-weather-card.zip',
        filter: (fileName) => /\.(js|svg)$/.test(fileName),
      })]
      : []),
  ],
  build: {
    target: 'es2019',
    // Vite's default minifier keeps whitespace in ES library builds.
    minify: 'terser',
    lib: {
      entry: 'src/clock-weather-card.ts',
      formats: ['es']
    },
    rollupOptions: {
      output: {
        // Flat at the dist root so HACS's flat install layout can resolve them; hashed so upgrades bust browser caches.
        assetFileNames: '[name]-[hash][extname]',
        chunkFileNames: '[name]-[hash].js',
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
      '@': resolve(import.meta.dirname, './src')
    }
  }
}))

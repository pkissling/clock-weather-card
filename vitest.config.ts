import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

export default mergeConfig(
  // vite.config.ts is a function — call it with a dummy context to get the resolved config
  typeof viteConfig === 'function' ? viteConfig({ command: 'serve', mode: 'test' }) : viteConfig,
  defineConfig({
    test: {
      include: ['test/unit/**/*.test.ts'],
    },
  }),
)

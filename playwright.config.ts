import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Tests must run serially — they share a single HA entity state */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* No retries */
  retries: 0,
  /* Single worker — tests share a single HA instance and entity state */
  workers: 1,
  /* Timeout for each test — increased for HA page loads */
  timeout: 30_000,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['list'], ['html']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.HA_URL || 'http://127.0.0.1:8123',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: process.env.CI ? 'retain-on-failure': 'on',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
    }
  ],

  /* HA container lifecycle is managed by globalSetup/globalTeardown */
  globalSetup: './e2e/utils/ha-setup.ts',
  globalTeardown: './e2e/utils/ha-teardown.ts',
})

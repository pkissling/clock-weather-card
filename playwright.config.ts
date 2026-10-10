import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* No retries */
  retries: 0,
  /* The whole suite shares one HA container. */
  workers: 1,
  /* Baselines are rendered in the pinned Docker image; host fonts would never match them. */
  ignoreSnapshots: !process.env.E2E_IN_DOCKER,
  expect: { toHaveScreenshot: { threshold: 0, maxDiffPixels: 0 } },
  /* Timeout for each test - increased for HA page loads */
  timeout: 30_000,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['list'], ['html']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* baseURL is set by the sharedContext fixture in e2e/utils/fixtures.ts, since HA's port is only known after globalSetup. */
    /* Trace export on passing icon-heavy tests takes 30s+ and blows the test timeout. */
    trace: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
        // Freezes SMIL animations in the SVG icons at their first frame, so screenshots are deterministic.
        launchOptions: { firefoxUserPrefs: { 'image.animation_mode': 'none' } },
      },
    }
  ],

  /* HA container lifecycle is managed by globalSetup/globalTeardown */
  globalSetup: './e2e/utils/ha-setup.ts',
  globalTeardown: './e2e/utils/ha-teardown.ts',
})

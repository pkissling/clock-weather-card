import { type Locator, test as base } from '@playwright/test'

import { type MockOptions, setupCard as setupCardTest } from './test-utils'

type ClockWeatherCardFixtures = {
  clockWeatherCard: Locator
  // hui-error-card hides the message in non-visible DOM; _config.message is the only reliable read.
  cardErrorMessage: () => Promise<string | null>
  setupCard: (opts?: MockOptions) => Promise<Locator>
}

export const test = base.extend<ClockWeatherCardFixtures>({
  clockWeatherCard: async ({ page }, use) => {
    await use(page.locator('clock-weather-card'))
  },

  cardErrorMessage: async ({ page }, use) => {
    await use(() => page.locator('hui-error-card')
      .evaluate(el => (el as { _config?: { message?: string } })._config?.message ?? null))
  },

  setupCard: async ({ page, clockWeatherCard }, use) => {
    await use(async (opts?: MockOptions) => {
      await setupCardTest(page, opts)
      return clockWeatherCard
    })
  },
})

export { expect } from '@playwright/test'

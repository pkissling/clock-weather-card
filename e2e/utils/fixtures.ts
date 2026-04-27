import { type Locator, test as base } from '@playwright/test'

import { type MockOptions, setupCardTest } from './test-utils'

type ClockWeatherCardFixtures = {
  clockWeatherCard: Locator
  setupCard: (opts?: MockOptions) => Promise<Locator>
}

export const test = base.extend<ClockWeatherCardFixtures>({
  clockWeatherCard: async ({ page }, use) => {
    await use(page.locator('clock-weather-card'))
  },

  setupCard: async ({ page, clockWeatherCard }, use) => {
    await use(async (opts?: MockOptions) => {
      await setupCardTest(page, opts)
      return clockWeatherCard
    })
  },
})

export { expect } from '@playwright/test'

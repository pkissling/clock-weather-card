import { expect, type Locator, test as base } from '@playwright/test'

import { readHaState } from './ha-state'
import { type MockOptions, setupCard as setupCardTest } from './test-utils'

// Our error component holds the plain message; HA's own hui-error-card (setConfig errors) only has it in _config.
const readErrorMessage = async (scope: Locator): Promise<string | null> => {
  const errorCard = scope.locator('clock-weather-card-error, hui-error-card')
    .first()
  if (await errorCard.count() === 0) return null
  return errorCard.evaluate((el) => {
    if (el.localName === 'clock-weather-card-error') return (el as { message?: string }).message ?? null
    return (el as { _config?: { message?: string } })._config?.message ?? null
  })
}

type ErrorMessagePoll = ReturnType<typeof expect.poll<string | null>>

type ClockWeatherCardFixtures = {
  clockWeatherCard: Locator
  cardErrorMessage: (scope?: Locator) => ErrorMessagePoll
  setupCard: (opts?: MockOptions) => Promise<Locator>
}

export const test = base.extend<ClockWeatherCardFixtures>({
  // The HA container's host port is chosen dynamically in globalSetup — after
  // playwright.config.ts is evaluated — so resolve baseURL from the state file
  // here. An explicit HA_URL still takes precedence (matching the config).
  baseURL: async ({}, use) => {
    await use(process.env.HA_URL ?? readHaState().haUrl)
  },

  clockWeatherCard: async ({ page }, use) => {
    await use(page.locator('clock-weather-card'))
  },

  cardErrorMessage: async ({ page }, use) => {
    await use((scope = page.locator(':root')) => expect.poll(() => readErrorMessage(scope)))
  },

  setupCard: async ({ page, clockWeatherCard }, use) => {
    await use(async (opts?: MockOptions) => {
      await setupCardTest(page, opts)
      return clockWeatherCard
    })
  },
})

export { expect }

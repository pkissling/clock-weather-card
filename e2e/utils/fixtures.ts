import { type BrowserContext, expect, type Locator, test as base } from '@playwright/test'

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
  freshPage: boolean
  clockWeatherCard: Locator
  cardErrorMessage: (scope?: Locator) => ErrorMessagePoll
  setupCard: (opts?: MockOptions) => Promise<Locator>
}

type WorkerFixtures = {
  sharedContext: BrowserContext
}

export const test = base.extend<ClockWeatherCardFixtures, WorkerFixtures>({
  // Booting the HA frontend dominates a test's runtime, so one page is reused across a worker's tests.
  sharedContext: [async ({ browser }, use, workerInfo) => {
    const { contextOptions, ...options } = workerInfo.project.use
    const context = await browser.newContext({
      ...options,
      ...contextOptions,
      // The HA container's host port is only known after globalSetup, so the config's baseURL is a placeholder.
      baseURL: process.env.HA_URL ?? readHaState().haUrl,
    })
    await use(context)
    await context.close()
  }, { scope: 'worker' }],

  // Opt-in for tests that alter the page itself (e.g. routes), so nothing leaks into the shared page.
  freshPage: [false, { option: true }],

  page: async ({ sharedContext, freshPage }, use, testInfo) => {
    const page = (!freshPage && sharedContext.pages()[0]) || await sharedContext.newPage()
    await use(page)
    // A failed test may leave the page in any state, so the next test starts from a fresh load.
    if (freshPage || testInfo.status !== testInfo.expectedStatus) await page.close()
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

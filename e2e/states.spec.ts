import { test } from '@playwright/test'
import { expectScreenshot, mockClockWeatherCardState } from './utils'


test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

for (const state of ['sunny', 'cloudy', 'rainy', 'snowy', 'foggy', 'windy']) {
  test(state, async ({ page }) => {
    await mockClockWeatherCardState(page, { weatherState: { state } })
    await expectScreenshot(page, state)
  })
}

import { test } from '@playwright/test'

import { mockClockWeatherCardState, toHaveScreenshot } from './test-utils'


test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('with title', async ({ page }) => {
  await mockClockWeatherCardState(page, { cardConfig: { title: 'My Weather' } })
  await toHaveScreenshot(page)
})

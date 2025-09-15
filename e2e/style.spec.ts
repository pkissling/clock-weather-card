import { expect, test } from '@playwright/test'

import { mockClockWeatherCardState } from './test-utils'


test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('title reduces bottom padding of card header', async ({ page }) => {
  await mockClockWeatherCardState(page, { cardConfig: { title: 'My Weather' } })

  await expect(page.locator('h1.card-header')).toHaveText('My Weather')
  await expect(page.locator('h1.card-header')).toHaveCSS('padding-bottom', '0px')
})

import { expect, test } from '@playwright/test'

import { setupCardTest } from './utils/test-utils'

test('title reduces bottom padding of card header', async ({ page }) => {
  await setupCardTest(page, {
    cardConfig: 'title: My Weather',
  })

  await expect(page.locator('h1.card-header'))
    .toHaveText('My Weather')
  await expect(page.locator('h1.card-header'))
    .toHaveCSS('padding-bottom', '0px')
})

import { expect, test } from '@playwright/test'

import { setupCardTest } from './utils/test-utils'

test('with title', async ({ page }) => {
  await setupCardTest(page, {
    cardConfig: `title: My Weather`,
  })

  await expect(page.locator('h1.card-header'))
    .toHaveText('My Weather')
})

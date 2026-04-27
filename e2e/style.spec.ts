import { expect, test } from './utils/fixtures'

test('title reduces bottom padding of card header', async ({ page, setupCard }) => {
  await setupCard({
    cardConfig: 'title: My Weather',
  })

  await expect(page.locator('h1.card-header'))
    .toHaveText('My Weather')
  await expect(page.locator('h1.card-header'))
    .toHaveCSS('padding-bottom', '0px')
})

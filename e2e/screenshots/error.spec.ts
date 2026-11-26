import { expect, test } from '../utils/fixtures'

test('config error', async ({ page, setupCard }) => {
  await setupCard({ cardConfig: 'time_zone: pst8' })
  await expect(page.locator('hui-error-card'))
    .toHaveScreenshot()
})

import { expect, test } from '../utils/fixtures'

test('default config', async ({ setupCard, clockWeatherCard }) => {
  await setupCard({})
  await expect(clockWeatherCard)
    .toHaveScreenshot()
})

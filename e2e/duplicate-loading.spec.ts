import { expect, test } from './utils/fixtures'

test.describe('duplicate loading', () => {
  test.use({ freshPage: true })

  test('evaluating the bundle a second time neither throws nor duplicates the card picker entry', async ({ page, setupCard, clockWeatherCard }) => {
    await setupCard()

    await page.evaluate(url => import(url), '/local/clock-weather-card.js?second-load')

    const pickerEntries = await page.evaluate(() => window.customCards.filter(card => card.type === 'clock-weather-card').length)
    expect(pickerEntries)
      .toBe(1)
    await expect(clockWeatherCard.locator('ha-card'))
      .toBeVisible()
  })
})

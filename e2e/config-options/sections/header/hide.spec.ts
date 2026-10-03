import { expect, test } from '../../../utils/fixtures'

test.describe('sections.header.hide', () => {
  test('renders the header section by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard()

    await expect(clockWeatherCard.locator('clock-weather-card-today'))
      .toHaveCount(1)
  })

  test('hides the section and the divider of the next section when hide: true', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          header:
            hide: true
      `,
    })

    await expect(clockWeatherCard.locator('clock-weather-card-today'))
      .toHaveCount(0)
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item')
      .first())
      .toBeVisible()
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast > clock-weather-card-divider'))
      .toBeHidden()
    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast > clock-weather-card-divider'))
      .toBeVisible()
  })

  test('removes the section at runtime when hide flips to true (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard()
    await expect(clockWeatherCard.locator('clock-weather-card-today'))
      .toHaveCount(1)

    await setupCard({
      cardConfig: `
        sections:
          header:
            hide: true
      `,
    })

    await expect(clockWeatherCard.locator('clock-weather-card-today'))
      .toHaveCount(0)
  })
})

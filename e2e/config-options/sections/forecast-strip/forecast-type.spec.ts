import { expect, test } from '../../../utils/fixtures'

test.describe('sections.forecast_strip.forecast_type', () => {
  test('accepts hourly', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            forecast_type: hourly
      `,
    })

    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(24)
  })

  test('rejects daily', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            forecast_type: daily
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.forecast_strip.forecast_type" has invalid value "daily"')
    await expect(clockWeatherCard.locator('clock-weather-card-today'))
      .toHaveCount(0)
  })

  test('surfaces an invalid value at runtime when the config changes (no reload)', async ({ setupCard, cardErrorMessage }) => {
    await setupCard()

    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            forecast_type: daily
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.forecast_strip.forecast_type" has invalid value "daily"')
  })
})

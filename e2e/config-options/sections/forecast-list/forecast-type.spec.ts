import { expect, test } from '../../../utils/fixtures'

test.describe('sections.forecast_list.forecast_type', () => {
  test('accepts daily', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_list:
            forecast_type: daily
      `,
    })

    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item'))
      .toHaveCount(5)
  })

  test('rejects hourly', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_list:
            forecast_type: hourly
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.forecast_list.forecast_type" has invalid value "hourly"')
    await expect(clockWeatherCard.locator('clock-weather-card-today'))
      .toHaveCount(0)
  })

  test('surfaces an invalid value at runtime when the config changes (no reload)', async ({ setupCard, cardErrorMessage }) => {
    await setupCard()

    await setupCard({
      cardConfig: `
        sections:
          forecast_list:
            forecast_type: hourly
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.forecast_list.forecast_type" has invalid value "hourly"')
  })
})

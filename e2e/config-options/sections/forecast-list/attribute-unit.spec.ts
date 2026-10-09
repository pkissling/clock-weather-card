import { expect, test } from '../../../utils/fixtures'
import { dailyForecast, DEFAULT_DATE } from '../../../utils/test-utils'

const unitConfig = (unit: string | null): string => `
  entity: weather.mock_weather
  sections:
    forecast_list:
      forecast_type: daily
      attribute: dew_point
${unit === null ? '' : `      attribute_unit: "${unit}"`}
`

const forecast_daily = dailyForecast(DEFAULT_DATE, ['sunny', 'cloudy'], i => ({ templow: 10, temperature: 20, dew_point: [5, 7][i] }))

test.describe('sections.forecast_list.attribute_unit', () => {
  test('replaces the resolved unit', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: unitConfig('kn'), weather: { forecast_daily } })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item .temperature-high'))
      .toHaveText(['5 kn', '7 kn'])
  })

  test('shows no unit when empty', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: unitConfig(''), weather: { forecast_daily } })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item .temperature-high'))
      .toHaveText(['5', '7'])
  })

  test('swaps the unit at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: unitConfig('kn'), weather: { forecast_daily } })
    const first = clockWeatherCard.locator('clock-weather-card-forecast-list-item .temperature-high')
      .first()
    await expect(first)
      .toHaveText('5 kn')

    await setupCard({ cardConfig: unitConfig(null), weather: { forecast_daily } })

    await expect(first).not.toHaveText('5 kn')
  })

  test('rejects a non-string unit', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'sections:\n  forecast_list:\n    attribute_unit: 5' })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_list.attribute_unit" has invalid value "5", expected a string')
  })
})

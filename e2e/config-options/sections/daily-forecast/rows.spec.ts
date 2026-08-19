import type { DailyWeatherForecast } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'

function makeDaily(count: number): DailyWeatherForecast[] {
  const base = Date.UTC(2025, 8, 14, 0, 0, 0)
  return Array.from({ length: count }, (_, i) => ({
    datetime: new Date(base + i * 24 * 60 * 60 * 1000)
      .toISOString(),
    condition: 'sunny',
    templow: 10 + i,
    temperature: 20 + i,
    precipitation_probability: 0,
  }))
}

test.describe('sections.daily_forecast.rows', () => {
  test('renders 5 rows by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      weather: { forecast_daily: makeDaily(10) },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item'))
      .toHaveCount(5)
  })

  test('truncates to the configured value', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            rows: 3
      `,
      weather: { forecast_daily: makeDaily(10) },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item'))
      .toHaveCount(3)
  })

  test('renders all items when rows exceeds the available forecast count', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            rows: 14
      `,
      weather: { forecast_daily: makeDaily(4) },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item'))
      .toHaveCount(4)
  })

  test('rejects zero', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            rows: 0
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.daily_forecast.rows" has invalid value "0"')
    await expect(clockWeatherCard.locator('clock-weather-card-today'))
      .toHaveCount(0)
  })

  test('rejects non-integer values', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            rows: 3.5
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.daily_forecast.rows" has invalid value "3.5"')
  })

  test('updates the rendered count at runtime when rows changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            rows: 2
      `,
      weather: { forecast_daily: makeDaily(10) },
    })
    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item'))
      .toHaveCount(2)

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            rows: 6
      `,
      weather: { forecast_daily: makeDaily(10) },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item'))
      .toHaveCount(6)
  })
})

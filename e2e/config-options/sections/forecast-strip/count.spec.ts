import type { WeatherForecast } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'

function makeHourly(count: number): WeatherForecast[] {
  const base = Date.UTC(2025, 8, 14, 12, 0, 0)
  return Array.from({ length: count }, (_, i) => ({
    datetime: new Date(base + i * 60 * 60 * 1000)
      .toISOString(),
    condition: 'sunny',
    temperature: 20 + i,
    precipitation_probability: 0,
  }))
}

test.describe('sections.forecast_strip.count', () => {
  test('caps the rendered items to 24 by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      weather: { forecast_hourly: makeHourly(30) },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(24)
  })

  test('truncates to the configured value', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_strip:
            count: 3
      `,
      weather: { forecast_hourly: makeHourly(10) },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(3)
  })

  test('renders all items when count exceeds the available forecast count', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_strip:
            count: 10
      `,
      weather: { forecast_hourly: makeHourly(5) },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(3)
  })

  test('rejects zero', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_strip:
            count: 0
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_strip.count" has invalid value "0", expected a positive integer')
    await expect(clockWeatherCard.locator('clock-weather-card-header'))
      .toHaveCount(0)
  })

  test('rejects negative values', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_strip:
            count: -1
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_strip.count" has invalid value "-1", expected a positive integer')
    await expect(clockWeatherCard.locator('clock-weather-card-header'))
      .toHaveCount(0)
  })

  test('rejects non-integer values', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_strip:
            count: 3.5
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_strip.count" has invalid value "3.5", expected a positive integer')
    await expect(clockWeatherCard.locator('clock-weather-card-header'))
      .toHaveCount(0)
  })

  test('updates the rendered count at runtime when count changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_strip:
            count: 4
      `,
      weather: { forecast_hourly: makeHourly(10) },
    })
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(4)

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_strip:
            count: 7
      `,
      weather: { forecast_hourly: makeHourly(10) },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(7)
  })
})

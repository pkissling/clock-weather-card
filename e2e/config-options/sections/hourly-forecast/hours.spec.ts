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

test.describe('sections.hourly_forecast.hours', () => {
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
          hourly_forecast:
            hours: 3
      `,
      weather: { forecast_hourly: makeHourly(10) },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(3)
  })

  test('renders all items when hours exceeds the available forecast count', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            hours: 10
      `,
      weather: { forecast_hourly: makeHourly(5) },
    })

    // makeHourly(5) emits hours 12..16 UTC; the default mocked clock is 14:20 UTC so the
    // filter retains 15 and 16 UTC. "Now" + 2 future = 3 items rendered.
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(3)
  })

  test('rejects zero', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            hours: 0
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.hourly_forecast.hours" has invalid value "0"')
    await expect(clockWeatherCard.locator('clock-weather-card-today'))
      .toHaveCount(0)
  })

  test('rejects negative values', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            hours: -1
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.hourly_forecast.hours" has invalid value "-1"')
    await expect(clockWeatherCard.locator('clock-weather-card-today'))
      .toHaveCount(0)
  })

  test('rejects non-integer values', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            hours: 3.5
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.hourly_forecast.hours" has invalid value "3.5"')
    await expect(clockWeatherCard.locator('clock-weather-card-today'))
      .toHaveCount(0)
  })

  test('updates the rendered count at runtime when hours changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            hours: 4
      `,
      weather: { forecast_hourly: makeHourly(10) },
    })
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(4)

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            hours: 7
      `,
      weather: { forecast_hourly: makeHourly(10) },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(7)
  })
})

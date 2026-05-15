import type { WeatherForecast } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'

// Pin the browser clock so the 18:00 entry becomes "Now" and 20/21:00 are future.
const FIXED_NOW = new Date('2025-09-14T18:00:00+00:00')
const FORECAST_HOURLY: WeatherForecast[] = [
  { datetime: '2025-09-14T18:00:00+00:00', condition: 'sunny', temperature: 22.7, precipitation_probability: 0 },
  { datetime: '2025-09-14T20:00:00+00:00', condition: 'sunny', temperature: 21.4, precipitation_probability: 0 },
  { datetime: '2025-09-14T21:00:00+00:00', condition: 'cloudy', temperature: 19.6, precipitation_probability: 0 },
]

test.describe('sections.hourly_forecast.round_temperatures', () => {
  test('rounds temperatures by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: FIXED_NOW,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })

    const items = clockWeatherCard.locator('clock-weather-card-hourly-forecast-item')
    // "Now" + 2 future forecasts.
    await expect(items)
      .toHaveCount(3)
    await expect(items.nth(0)
      .locator('.temperature'))
      .toHaveText('23°C')
    await expect(items.nth(1)
      .locator('.temperature'))
      .toHaveText('21°C')
    await expect(items.nth(2)
      .locator('.temperature'))
      .toHaveText('20°C')
  })

  test('renders fractional temperatures when round_temperatures: false', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: FIXED_NOW,
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            round_temperatures: false
      `,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })

    const items = clockWeatherCard.locator('clock-weather-card-hourly-forecast-item')
    await expect(items)
      .toHaveCount(3)
    await expect(items.nth(0)
      .locator('.temperature'))
      .toHaveText('22.7°C')
    await expect(items.nth(1)
      .locator('.temperature'))
      .toHaveText('21.4°C')
    await expect(items.nth(2)
      .locator('.temperature'))
      .toHaveText('19.6°C')
  })

  test('toggles rounding at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: FIXED_NOW,
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            round_temperatures: false
      `,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })
    const firstTemp = clockWeatherCard.locator('clock-weather-card-hourly-forecast-item')
      .first()
      .locator('.temperature')
    await expect(firstTemp)
      .toHaveText('22.7°C')

    await setupCard({
      date: FIXED_NOW,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })

    await expect(firstTemp)
      .toHaveText('23°C')
  })
})

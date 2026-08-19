import type { DailyWeatherForecast } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'

const TODAY = new Date('2025-09-14T14:20:59+00:00')

const DAILY: DailyWeatherForecast[] = [
  { datetime: '2025-09-14T00:00:00+00:00', condition: 'sunny', templow: 5.4, temperature: 14.7, precipitation_probability: 0 },
  { datetime: '2025-09-15T00:00:00+00:00', condition: 'cloudy', templow: 3.6, temperature: 12.2, precipitation_probability: 0 },
]

test.describe('sections.daily_forecast.round_temperatures', () => {
  test('rounds temperatures by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      weather: { temperature: 10, forecast_daily: DAILY },
    })

    const items = clockWeatherCard.locator('clock-weather-card-daily-forecast-item')
    await expect(items.nth(0)
      .locator('.temperature-low'))
      .toHaveText('5°C')
    await expect(items.nth(0)
      .locator('.temperature-high'))
      .toHaveText('15°C')
    await expect(items.nth(1)
      .locator('.temperature-low'))
      .toHaveText('4°C')
    await expect(items.nth(1)
      .locator('.temperature-high'))
      .toHaveText('12°C')
  })

  test('renders fractional temperatures when round_temperatures: false', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            round_temperatures: false
      `,
      weather: { temperature: 10, forecast_daily: DAILY },
    })

    const items = clockWeatherCard.locator('clock-weather-card-daily-forecast-item')
    await expect(items.nth(0)
      .locator('.temperature-low'))
      .toHaveText('5.4°C')
    await expect(items.nth(0)
      .locator('.temperature-high'))
      .toHaveText('14.7°C')
  })

  test('toggles rounding at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            round_temperatures: false
      `,
      weather: { temperature: 10, forecast_daily: DAILY },
    })
    const firstHigh = clockWeatherCard.locator('clock-weather-card-daily-forecast-item')
      .first()
      .locator('.temperature-high')
    await expect(firstHigh)
      .toHaveText('14.7°C')

    await setupCard({
      date: TODAY,
      weather: { temperature: 10, forecast_daily: DAILY },
    })

    await expect(firstHigh)
      .toHaveText('15°C')
  })
})

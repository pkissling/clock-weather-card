import type { DailyWeatherForecast, WeatherForecast } from '../../../src/types'
import { expect, test } from '../../utils/fixtures'

const NOW = new Date('2025-09-14T18:00:00+00:00')
const HOURLY: WeatherForecast[] = [
  { datetime: '2025-09-14T18:00:00+00:00', condition: 'sunny', temperature: 22.7, precipitation_probability: 0 },
  { datetime: '2025-09-14T19:00:00+00:00', condition: 'sunny', temperature: 21.4, precipitation_probability: 0 },
]
const DAILY: DailyWeatherForecast[] = [
  { datetime: '2025-09-14T00:00:00+00:00', condition: 'sunny', templow: 5.4, temperature: 14.7, precipitation_probability: 0 },
]

test.describe('round_temperatures', () => {
  test('rounds temperatures in every section by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ date: NOW, weather: { temperature: 21.6, forecast_hourly: HOURLY, forecast_daily: DAILY } })

    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment')
      .first())
      .toHaveText('22°C')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .label')
      .first())
      .toHaveText('23°C')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item .temperature-low')
      .first())
      .toHaveText('5°C')
  })

  test('shows fractional temperatures in every section when false', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: NOW,
      cardConfig: 'round_temperatures: false',
      weather: { temperature: 21.6, forecast_hourly: HOURLY, forecast_daily: DAILY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment')
      .first())
      .toHaveText('21.6°C')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .label')
      .first())
      .toHaveText('22.7°C')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item .temperature-low')
      .first())
      .toHaveText('5.4°C')
  })

  test('is overridden per section', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: NOW,
      cardConfig: `
        round_temperatures: false
        sections:
          header:
            round_temperatures: true
          forecast_list:
            round_temperatures: true
      `,
      weather: { temperature: 21.6, forecast_hourly: HOURLY, forecast_daily: DAILY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-weather-segment')
      .first())
      .toHaveText('22°C')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .label')
      .first())
      .toHaveText('22.7°C')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item .temperature-low')
      .first())
      .toHaveText('5°C')
  })

  test('toggles rounding at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: 'round_temperatures: false', weather: { temperature: 21.6 } })
    const temperature = clockWeatherCard.locator('clock-weather-card-weather-segment')
      .first()
    await expect(temperature)
      .toHaveText('21.6°C')

    await setupCard({ weather: { temperature: 21.6 } })

    await expect(temperature)
      .toHaveText('22°C')
  })

  test('rejects a non-boolean value', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'round_temperatures: fals' })

    await cardErrorMessage()
      .toContain('Config option "round_temperatures" has invalid value "fals", expected true or false')
  })
})

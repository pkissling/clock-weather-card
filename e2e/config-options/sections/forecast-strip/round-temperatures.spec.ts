import type { WeatherForecast } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'

const FIXED_NOW = new Date('2025-09-14T18:00:00+00:00')
const FORECAST_HOURLY: WeatherForecast[] = [
  { datetime: '2025-09-14T18:00:00+00:00', condition: 'sunny', temperature: 22.7, precipitation_probability: 0 },
  { datetime: '2025-09-14T20:00:00+00:00', condition: 'sunny', temperature: 21.4, precipitation_probability: 0 },
  { datetime: '2025-09-14T21:00:00+00:00', condition: 'cloudy', temperature: 19.6, precipitation_probability: 0 },
]

test.describe('sections.forecast_strip.round_temperatures', () => {
  test('rounds temperatures by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: FIXED_NOW,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })

    const items = clockWeatherCard.locator('clock-weather-card-forecast-strip-item')
    await expect(items)
      .toHaveCount(3)
    await expect(items.nth(0)
      .locator('.label'))
      .toHaveText('23°C')
    await expect(items.nth(1)
      .locator('.label'))
      .toHaveText('21°C')
    await expect(items.nth(2)
      .locator('.label'))
      .toHaveText('20°C')
  })

  test('renders fractional temperatures when round_temperatures: false', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: FIXED_NOW,
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_strip:
            round_temperatures: false
      `,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })

    const items = clockWeatherCard.locator('clock-weather-card-forecast-strip-item')
    await expect(items)
      .toHaveCount(3)
    await expect(items.nth(0)
      .locator('.label'))
      .toHaveText('22.7°C')
    await expect(items.nth(1)
      .locator('.label'))
      .toHaveText('21.4°C')
    await expect(items.nth(2)
      .locator('.label'))
      .toHaveText('19.6°C')
  })

  test('toggles rounding at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: FIXED_NOW,
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_strip:
            round_temperatures: false
      `,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })
    const firstTemp = clockWeatherCard.locator('clock-weather-card-forecast-strip-item')
      .first()
      .locator('.label')
    await expect(firstTemp)
      .toHaveText('22.7°C')

    await setupCard({
      date: FIXED_NOW,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })

    await expect(firstTemp)
      .toHaveText('23°C')
  })

  test('rejects a non-boolean value', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            round_temperatures: fals
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_strip.round_temperatures" has invalid value "fals", expected true or false')
  })
})

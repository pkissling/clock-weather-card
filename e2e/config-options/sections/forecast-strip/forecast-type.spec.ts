import { WeatherEntityFeature } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'
import { dailyForecast } from '../../../utils/test-utils'

const NOW = new Date('2025-09-14T14:20:00+00:00')
const DAILY = dailyForecast(NOW, ['sunny', 'cloudy', 'rainy'], i => ({ templow: 10 + i, temperature: 20 + i, precipitation_probability: 0 }))

test.describe('sections.forecast_strip.forecast_type', () => {
  test('accepts hourly', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            forecast_type: hourly
      `,
    })

    const items = clockWeatherCard.locator('clock-weather-card-forecast-strip-item')
    await expect(items)
      .toHaveCount(24)
    await expect(items.locator('.temperature-low'))
      .toHaveCount(0)
  })

  test('accepts daily and renders one column per day with high and low', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: NOW,
      timeZone: 'UTC',
      cardConfig: `
        sections:
          forecast_strip:
            forecast_type: daily
      `,
      weather: { forecast_daily: DAILY },
    })

    const items = clockWeatherCard.locator('clock-weather-card-forecast-strip-item')
    await expect(items.locator('.time'))
      .toHaveText(['Today', 'Mon', 'Tue'])
    await expect(items.locator('.label'))
      .toHaveText(['20°C', '21°C', '22°C'])
    await expect(items.locator('.temperature-low'))
      .toHaveText(['10°C', '11°C', '12°C'])
  })

  test('limits daily columns to count', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: NOW,
      timeZone: 'UTC',
      cardConfig: `
        sections:
          forecast_strip:
            forecast_type: daily
            count: 2
      `,
      weather: { forecast_daily: DAILY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item'))
      .toHaveCount(2)
  })

  test('switches from hourly to daily at runtime (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ date: NOW, timeZone: 'UTC', weather: { forecast_daily: DAILY } })
    const items = clockWeatherCard.locator('clock-weather-card-forecast-strip-item')
    await expect(items)
      .toHaveCount(24)

    await setupCard({
      date: NOW,
      timeZone: 'UTC',
      cardConfig: `
        sections:
          forecast_strip:
            forecast_type: daily
      `,
      weather: { forecast_daily: DAILY },
    })

    await expect(items.locator('.time'))
      .toHaveText(['Today', 'Mon', 'Tue'])
  })

  test('renders an inline warning when the entity does not advertise FORECAST_DAILY', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            forecast_type: daily
      `,
      weather: { supportedFeatures: [WeatherEntityFeature.FORECAST_HOURLY] },
    })

    await cardErrorMessage(clockWeatherCard.locator('clock-weather-card-forecast-strip'))
      .toBe('Entity "weather.mock_weather" does not support daily forecasts')
  })

  test('rejects twice_daily', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            forecast_type: twice_daily
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_strip.forecast_type" has invalid value "twice_daily"')
    await expect(clockWeatherCard.locator('clock-weather-card-header'))
      .toHaveCount(0)
  })

  test('surfaces an invalid value at runtime when the config changes (no reload)', async ({ setupCard, cardErrorMessage }) => {
    await setupCard()

    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            forecast_type: twice_daily
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_strip.forecast_type" has invalid value "twice_daily"')
  })
})

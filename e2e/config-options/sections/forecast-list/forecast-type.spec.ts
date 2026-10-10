import { WeatherEntityFeature } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'
import { hourlyForecast } from '../../../utils/test-utils'

const NOW = new Date('2025-09-14T14:20:00+00:00')
const HOURLY_TEMPS = [21, 23, 20]
const HOURLY = hourlyForecast(NOW, ['sunny', 'sunny', 'cloudy'], i => ({ temperature: HOURLY_TEMPS[i], precipitation_probability: 0 }))

test.describe('sections.forecast_list.forecast_type', () => {
  test('accepts daily', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_list:
            forecast_type: daily
      `,
    })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item'))
      .toHaveCount(5)
  })

  test('accepts hourly and spans each bar from the previous hour to this hour', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: NOW,
      timeZone: 'UTC',
      cardConfig: `
        sections:
          forecast_list:
            forecast_type: hourly
      `,
      weather: { temperature: 22, forecast_hourly: HOURLY },
    })

    const items = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
    await expect(items.locator('.label'))
      .toHaveText(['Now', '3:00 PM', '4:00 PM'])
    // The "Now" row starts from the current temperature (22°C).
    await expect(items.locator('.temperature-low'))
      .toHaveText(['21°C', '21°C', '20°C'])
    await expect(items.locator('.temperature-high'))
      .toHaveText(['22°C', '23°C', '23°C'])
    await expect(items.locator('.dot'))
      .toHaveCount(1)
    await expect(items.nth(0)
      .locator('.dot'))
      .toHaveCount(1)
  })

  test('limits hourly rows to count', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_list:
            forecast_type: hourly
            count: 8
      `,
    })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item'))
      .toHaveCount(8)
  })

  test('switches from daily to hourly at runtime (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ date: NOW, timeZone: 'UTC', weather: { forecast_hourly: HOURLY } })
    const items = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
    await expect(items.nth(0)
      .locator('.label'))
      .toHaveText('Today')

    await setupCard({
      date: NOW,
      timeZone: 'UTC',
      cardConfig: `
        sections:
          forecast_list:
            forecast_type: hourly
      `,
      weather: { forecast_hourly: HOURLY },
    })

    await expect(items.locator('.label'))
      .toHaveText(['Now', '3:00 PM', '4:00 PM'])
  })

  test('renders an inline warning when the entity does not advertise FORECAST_HOURLY', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_list:
            forecast_type: hourly
      `,
      weather: { supportedFeatures: [WeatherEntityFeature.FORECAST_DAILY] },
    })

    await cardErrorMessage(clockWeatherCard.locator('clock-weather-card-forecast-list'))
      .toBe('Entity "weather.mock_weather" does not support hourly forecasts')
  })

  test('rejects twice_daily', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_list:
            forecast_type: twice_daily
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_list.forecast_type" has invalid value "twice_daily"')
    await expect(clockWeatherCard.locator('clock-weather-card-header'))
      .toHaveCount(0)
  })

  test('surfaces an invalid value at runtime when the config changes (no reload)', async ({ setupCard, cardErrorMessage }) => {
    await setupCard()

    await setupCard({
      cardConfig: `
        sections:
          forecast_list:
            forecast_type: twice_daily
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_list.forecast_type" has invalid value "twice_daily"')
  })
})

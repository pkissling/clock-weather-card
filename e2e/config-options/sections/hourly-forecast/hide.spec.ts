import { expect, test } from '../../../utils/fixtures'

// Default mock clock is 14:20:59Z — the 14:00 entry becomes "Now" and the rest are future hours.
const FORECAST_HOURLY = [
  { datetime: '2025-09-14T14:00:00+00:00', condition: 'sunny', temperature: 22, precipitation_probability: 0 },
  { datetime: '2025-09-14T15:00:00+00:00', condition: 'sunny', temperature: 21, precipitation_probability: 10 },
  { datetime: '2025-09-14T16:00:00+00:00', condition: 'cloudy', temperature: 20, precipitation_probability: 30 },
  { datetime: '2025-09-14T17:00:00+00:00', condition: 'rainy', temperature: 18, precipitation_probability: 80 },
]

test.describe('sections.hourly_forecast.hide', () => {
  test('renders the hourly forecast section by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      weather: { forecast_hourly: FORECAST_HOURLY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast'))
      .toHaveCount(1)
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(FORECAST_HOURLY.length)
  })

  test('hides the section when hide: true', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            hide: true
      `,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast'))
      .toHaveCount(0)
    await expect(clockWeatherCard.locator('clock-weather-card-today'))
      .toHaveCount(1)
  })

  test('renders an inline warning when the resolved entity does not advertise FORECAST_HOURLY', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      weather: {
        forecast_hourly: FORECAST_HOURLY,
        supportedFeatures: 1, // FORECAST_DAILY only
      },
    })

    const section = clockWeatherCard.locator('clock-weather-card-hourly-forecast')
    await expect(section)
      .toBeVisible()
    await expect(section)
      .toContainText('does not support hourly forecasts')
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(0)
    await expect(clockWeatherCard.locator('clock-weather-card-today'))
      .toHaveCount(1)
  })

  test('removes the warning section at runtime when hide flips to true (unsupported entity, no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      weather: {
        forecast_hourly: FORECAST_HOURLY,
        supportedFeatures: 1, // FORECAST_DAILY only
      },
    })
    const section = clockWeatherCard.locator('clock-weather-card-hourly-forecast')
    await expect(section)
      .toBeVisible()
    await expect(section)
      .toContainText('does not support hourly forecasts')

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            hide: true
      `,
      weather: {
        forecast_hourly: FORECAST_HOURLY,
        supportedFeatures: 1,
      },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast'))
      .toHaveCount(0)
  })

  test('removes the section at runtime when hide flips to true (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      weather: { forecast_hourly: FORECAST_HOURLY },
    })
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast'))
      .toHaveCount(1)

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            hide: true
      `,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast'))
      .toHaveCount(0)
  })
})

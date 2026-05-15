import { expect, test } from '../../../utils/fixtures'
import api from '../../../utils/ha-api'

// Default mock clock is 14:20:59Z — the 14:00 entry becomes "Now" and the rest are future hours.
const PRIMARY_HOURLY = [
  { datetime: '2025-09-14T14:00:00+00:00', condition: 'sunny', temperature: 20, precipitation_probability: 0 },
  { datetime: '2025-09-14T15:00:00+00:00', condition: 'sunny', temperature: 21, precipitation_probability: 0 },
  { datetime: '2025-09-14T16:00:00+00:00', condition: 'sunny', temperature: 22, precipitation_probability: 0 },
]
const SECONDARY_HOURLY = [
  { datetime: '2025-09-14T14:00:00+00:00', condition: 'rainy', temperature: 12, precipitation_probability: 85 },
  { datetime: '2025-09-14T15:00:00+00:00', condition: 'rainy', temperature: 11, precipitation_probability: 90 },
  { datetime: '2025-09-14T16:00:00+00:00', condition: 'rainy', temperature: 10, precipitation_probability: 95 },
  { datetime: '2025-09-14T17:00:00+00:00', condition: 'pouring', temperature: 9, precipitation_probability: 100 },
]

test.describe('sections.hourly_forecast.weather_entity', () => {
  test('renders forecasts from the override entity when configured', async ({ setupCard, clockWeatherCard }) => {
    // Seed the override entity before mounting the card so the WS subscription delivers its forecast on first emit.
    await api.setMockWeather({
      entity_id: 'weather.mock_weather_2',
      forecast_hourly: SECONDARY_HOURLY,
    })
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            weather_entity: weather.mock_weather_2
      `,
      weather: { forecast_hourly: PRIMARY_HOURLY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(SECONDARY_HOURLY.length)
    // Index 0 is the "Now" entry — sourced from the override entity's 14:00 forecast (12°C), NOT the primary's 20°C.
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item')
      .first()
      .locator('.temperature'))
      .toHaveText('12°C')
  })

  test('renders an error card when the override entity does not exist', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            weather_entity: weather.does_not_exist
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Referenced entity weather.does_not_exist does not exist')
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast'))
      .toHaveCount(0)
  })

  test('swaps to the override entity at runtime (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      weather: { forecast_hourly: PRIMARY_HOURLY },
    })
    await api.setMockWeather({
      entity_id: 'weather.mock_weather_2',
      forecast_hourly: SECONDARY_HOURLY,
    })

    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(PRIMARY_HOURLY.length)

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            weather_entity: weather.mock_weather_2
      `,
      weather: { forecast_hourly: PRIMARY_HOURLY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(SECONDARY_HOURLY.length)
    // First column (Now) is sourced from the override entity's 14:00 forecast.
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item')
      .first())
      .toContainText('12')
  })

  test('replaces the warning with the strip when the override entity flips to one that supports hourly (no reload)', async ({ setupCard, clockWeatherCard }) => {
    // Seed the override entity with DAILY-only support and some forecast data that would render if it were supported.
    await api.setMockWeather({
      entity_id: 'weather.mock_weather_2',
      forecast_hourly: SECONDARY_HOURLY,
      supported_features: 1, // FORECAST_DAILY only
    })

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            weather_entity: weather.mock_weather_2
      `,
      weather: { forecast_hourly: PRIMARY_HOURLY },
    })

    const section = clockWeatherCard.locator('clock-weather-card-hourly-forecast')
    await expect(section)
      .toContainText('does not support hourly forecasts')
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(0)

    // Swap the override back to the primary entity (which supports hourly) at runtime.
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            weather_entity: weather.mock_weather
      `,
      weather: { forecast_hourly: PRIMARY_HOURLY },
    })

    await expect(section)
      .not.toContainText('does not support hourly forecasts')
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(PRIMARY_HOURLY.length)
  })

  test('replaces the strip with the warning when the override entity flips to one that does not support hourly (no reload)', async ({ setupCard, clockWeatherCard }) => {
    // Seed the secondary entity as DAILY-only so swapping to it triggers the warning branch.
    await api.setMockWeather({
      entity_id: 'weather.mock_weather_2',
      forecast_hourly: SECONDARY_HOURLY,
      supported_features: 1, // FORECAST_DAILY only
    })

    await setupCard({
      weather: { forecast_hourly: PRIMARY_HOURLY },
    })

    const section = clockWeatherCard.locator('clock-weather-card-hourly-forecast')
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(PRIMARY_HOURLY.length)
    await expect(section)
      .not.toContainText('does not support hourly forecasts')

    // Swap to the DAILY-only override at runtime.
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            weather_entity: weather.mock_weather_2
      `,
      weather: { forecast_hourly: PRIMARY_HOURLY },
    })

    await expect(section)
      .toContainText('does not support hourly forecasts')
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(0)
  })
})

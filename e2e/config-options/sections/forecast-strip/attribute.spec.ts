import type { WeatherForecast } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'

const FIXED_NOW = new Date('2025-09-14T18:30:00+00:00')
const FORECAST_HOURLY: (WeatherForecast & Record<string, unknown>)[] = [
  { datetime: '2025-09-14T18:00:00+00:00', condition: 'sunny', temperature: 20, precipitation_probability: 30, wind_speed: 12.4, precipitation: 0 },
  { datetime: '2025-09-14T19:00:00+00:00', condition: 'cloudy', temperature: 19, precipitation_probability: 50, wind_speed: 8, precipitation: 0.44 },
  { datetime: '2025-09-14T20:00:00+00:00', condition: 'rainy', temperature: 18, precipitation_probability: 70, precipitation: 1.2 },
]

const stripConfig = (attribute: string): string => `
  entity: weather.mock_weather
  sections:
    forecast_strip:
      attribute: ${attribute}
      hide_sunrise_sunset: true
`

test.describe('sections.forecast_strip.attribute', () => {
  test('shows the precipitation probability by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ date: FIXED_NOW, weather: { forecast_hourly: FORECAST_HOURLY } })

    const attributes = clockWeatherCard.locator('clock-weather-card-forecast-strip-item .attribute')
    await expect(attributes)
      .toHaveText(['30%', '50%', '70%'])
    await expect(attributes.first()
      .locator('ha-icon'))
      .toHaveAttribute('icon', 'mdi:water')
  })

  test('shows the configured attribute unrounded with its unit and no icon, leaving columns without a value blank', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ date: FIXED_NOW, cardConfig: stripConfig('wind_speed'), weather: { forecast_hourly: FORECAST_HOURLY } })

    const attributes = clockWeatherCard.locator('clock-weather-card-forecast-strip-item .attribute')
    await expect(attributes)
      .toHaveText(['12.4 km/h', '8 km/h', ''])
    await expect(attributes.locator('ha-icon'))
      .toHaveCount(0)
  })

  test('shows zero values when another column is non-zero', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ date: FIXED_NOW, cardConfig: stripConfig('precipitation'), weather: { forecast_hourly: FORECAST_HOURLY } })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .attribute'))
      .toHaveText(['0 mm', '0.44 mm', '1.2 mm'])
  })

  test('accepts any attribute name and shows its values', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: FIXED_NOW,
      cardConfig: stripConfig('snow_depth'),
      weather: { forecast_hourly: FORECAST_HOURLY.map((f, i) => ({ ...f, snow_depth: i + 1 })) },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .attribute'))
      .toHaveText(['1', '2', '3'])
  })

  test('hides the row when every visible column is zero', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: FIXED_NOW,
      cardConfig: stripConfig('humidity'),
      weather: { forecast_hourly: FORECAST_HOURLY.map(f => ({ ...f, humidity: 0 })) },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item'))
      .toHaveCount(3)
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .attribute'))
      .toHaveCount(0)
  })

  test('warns when no forecast entry has the configured attribute', async ({ setupCard, cardErrorMessage, clockWeatherCard }) => {
    await setupCard({ date: FIXED_NOW, cardConfig: stripConfig('humidity'), weather: { forecast_hourly: FORECAST_HOURLY } })

    await cardErrorMessage(clockWeatherCard.locator('clock-weather-card-forecast-strip'))
      .toBe('Forecast of entity "weather.mock_weather" has no attribute "humidity"')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item'))
      .toHaveCount(0)
  })

  test('does not warn when the default attribute is missing', async ({ setupCard, cardErrorMessage, clockWeatherCard }) => {
    await setupCard({
      date: FIXED_NOW,
      weather: { forecast_hourly: FORECAST_HOURLY.map(({ precipitation_probability: _, ...f }) => f) },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item'))
      .toHaveCount(3)
    await cardErrorMessage(clockWeatherCard.locator('clock-weather-card-forecast-strip'))
      .toBeNull()
  })

  test('switches the attribute at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ date: FIXED_NOW, weather: { forecast_hourly: FORECAST_HOURLY } })
    const first = clockWeatherCard.locator('clock-weather-card-forecast-strip-item .attribute')
      .first()
    await expect(first)
      .toHaveText('30%')

    await setupCard({ date: FIXED_NOW, cardConfig: stripConfig('wind_speed'), weather: { forecast_hourly: FORECAST_HOURLY } })

    await expect(first)
      .toHaveText('12.4 km/h')
  })

  test('rejects a non-string attribute', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            attribute: 5
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_strip.attribute" has invalid value "5", expected a non-empty string')
  })
})

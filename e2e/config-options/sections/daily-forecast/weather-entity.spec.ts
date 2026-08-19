import type { DailyWeatherForecast } from '../../../../src/types'
import { WeatherEntityFeature } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'
import api from '../../../utils/ha-api'

const PRIMARY: DailyWeatherForecast[] = [
  { datetime: '2025-09-14T00:00:00+00:00', condition: 'sunny',  templow: 5, temperature: 14, precipitation_probability: 0 },
  { datetime: '2025-09-15T00:00:00+00:00', condition: 'cloudy', templow: 4, temperature: 12, precipitation_probability: 0 },
]
const SECONDARY: DailyWeatherForecast[] = [
  { datetime: '2025-09-14T00:00:00+00:00', condition: 'rainy', templow: -5, temperature: 0, precipitation_probability: 90 },
  { datetime: '2025-09-15T00:00:00+00:00', condition: 'snowy', templow: -8, temperature: -2, precipitation_probability: 100 },
  { datetime: '2025-09-16T00:00:00+00:00', condition: 'snowy', templow: -6, temperature: -1, precipitation_probability: 95 },
]

test.describe('sections.daily_forecast.weather_entity', () => {
  test('renders forecasts from the override entity when configured', async ({ setupCard, clockWeatherCard }) => {
    await api.setMockWeather({
      entity_id: 'weather.mock_weather_2',
      temperature: -3,
      forecast_daily: SECONDARY,
      supported_features: WeatherEntityFeature.FORECAST_DAILY | WeatherEntityFeature.FORECAST_HOURLY,
    })
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            weather_entity: weather.mock_weather_2
      `,
      weather: { forecast_daily: PRIMARY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item'))
      .toHaveCount(SECONDARY.length)
    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item')
      .first()
      .locator('.temperature-high'))
      .toHaveText('0°C')
  })

  test('renders an error card when the override entity does not exist', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            weather_entity: weather.does_not_exist
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Referenced entity weather.does_not_exist does not exist')
    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast'))
      .toHaveCount(0)
  })

  test('swaps to the override entity at runtime (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      weather: { forecast_daily: PRIMARY },
    })
    await api.setMockWeather({
      entity_id: 'weather.mock_weather_2',
      forecast_daily: SECONDARY,
      supported_features: WeatherEntityFeature.FORECAST_DAILY | WeatherEntityFeature.FORECAST_HOURLY,
    })

    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item'))
      .toHaveCount(PRIMARY.length)

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            weather_entity: weather.mock_weather_2
      `,
      weather: { forecast_daily: PRIMARY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item'))
      .toHaveCount(SECONDARY.length)
  })
})

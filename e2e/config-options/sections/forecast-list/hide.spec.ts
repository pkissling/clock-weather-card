import { WeatherEntityFeature } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'

test.describe('sections.forecast_list.hide', () => {
  test('renders the daily forecast section by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard()

    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast'))
      .toHaveCount(1)
    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item'))
      .toHaveCount(5)
  })

  test('hides the section when hide: true', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_list:
            hide: true
      `,
    })

    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast'))
      .toHaveCount(0)
    await expect(clockWeatherCard.locator('clock-weather-card-header'))
      .toHaveCount(1)
  })

  test('removes the warning section at runtime when hide flips to true (unsupported entity, no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      weather: { supportedFeatures: [WeatherEntityFeature.FORECAST_HOURLY] },
    })
    const section = clockWeatherCard.locator('clock-weather-card-daily-forecast')
    await expect(section)
      .toBeVisible()
    await expect(section)
      .toContainText('Entity "weather.mock_weather" does not support daily forecasts')

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_list:
            hide: true
      `,
      weather: { supportedFeatures: [WeatherEntityFeature.FORECAST_HOURLY] },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast'))
      .toHaveCount(0)
  })

  test('removes the section at runtime when hide flips to true (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard()
    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast'))
      .toHaveCount(1)

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_list:
            hide: true
      `,
    })

    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast'))
      .toHaveCount(0)
  })

  test('rejects a non-boolean value', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_list:
            hide: fals
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.forecast_list.hide" has invalid value "fals", expected true or false')
  })
})

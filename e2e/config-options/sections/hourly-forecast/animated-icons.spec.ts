import { expect, test } from '../../../utils/fixtures'

const FORECAST_HOURLY = [
  { datetime: '2025-09-14T15:00:00+00:00', condition: 'rainy', temperature: 12, precipitation_probability: 50 },
]

const HOURLY_ICON = 'clock-weather-card-hourly-forecast-item clock-weather-card-icon img'

test.describe('sections.hourly_forecast.animated_icons', () => {
  test('loads animated assets when sections.hourly_forecast.animated_icons: true', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            animated_icons: false
      `,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })
    const staticSrc = await clockWeatherCard.locator(HOURLY_ICON)
      .first()
      .getAttribute('src')

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            animated_icons: true
      `,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })
    const animatedSrc = await clockWeatherCard.locator(HOURLY_ICON)
      .first()
      .getAttribute('src')

    expect(animatedSrc)
      .toBeTruthy()
    expect(animatedSrc).not.toBe(staticSrc)
  })

  test('updates animated_icons at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        animated_icon: false
        sections:
          hourly_forecast:
            animated_icons: false
      `,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })
    const staticSrc = await clockWeatherCard.locator(HOURLY_ICON)
      .first()
      .getAttribute('src')

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        animated_icon: false
        sections:
          hourly_forecast:
            animated_icons: true
      `,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })

    await expect(clockWeatherCard.locator(HOURLY_ICON)
      .first())
      .not.toHaveAttribute('src', staticSrc!)
  })
})

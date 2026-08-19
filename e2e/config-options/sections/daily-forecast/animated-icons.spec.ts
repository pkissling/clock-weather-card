import type { DailyWeatherForecast } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'

const DAILY: DailyWeatherForecast[] = [
  { datetime: '2025-09-14T00:00:00+00:00', condition: 'rainy', templow: 8, temperature: 14, precipitation_probability: 50 },
]

const DAILY_ICON = 'clock-weather-card-daily-forecast-item clock-weather-card-icon img'

test.describe('sections.daily_forecast.animated_icons', () => {
  test('loads animated assets when sections.daily_forecast.animated_icons: true', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            animated_icons: false
      `,
      weather: { forecast_daily: DAILY },
    })
    const staticSrc = await clockWeatherCard.locator(DAILY_ICON)
      .first()
      .getAttribute('src')

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            animated_icons: true
      `,
      weather: { forecast_daily: DAILY },
    })
    const animatedSrc = await clockWeatherCard.locator(DAILY_ICON)
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
          daily_forecast:
            animated_icons: false
      `,
      weather: { forecast_daily: DAILY },
    })
    const staticSrc = await clockWeatherCard.locator(DAILY_ICON)
      .first()
      .getAttribute('src')

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        animated_icon: false
        sections:
          daily_forecast:
            animated_icons: true
      `,
      weather: { forecast_daily: DAILY },
    })

    await expect(clockWeatherCard.locator(DAILY_ICON)
      .first())
      .not.toHaveAttribute('src', staticSrc!)
  })
})

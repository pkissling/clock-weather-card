import type { DailyWeatherForecast } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'

const TODAY = new Date('2025-09-14T14:20:59+00:00')

const DAILY: DailyWeatherForecast[] = [
  { datetime: '2025-09-14T00:00:00+00:00', condition: 'sunny', templow: 10, temperature: 20, precipitation_probability: 0 },
]

const DAILY_ICON = 'clock-weather-card-daily-forecast-item clock-weather-card-icon img'

test.describe('sections.daily_forecast.weather_icon_type', () => {
  test('falls back to the top-level weather_icon_type by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      cardConfig: `
        entity: weather.mock_weather
        weather_icon_type: line
        animated_icon: false
      `,
      weather: { forecast_daily: DAILY },
    })
    const lineSrc = await clockWeatherCard.locator(DAILY_ICON)
      .first()
      .getAttribute('src')

    await setupCard({
      date: TODAY,
      cardConfig: `
        entity: weather.mock_weather
        weather_icon_type: fill
        animated_icon: false
      `,
      weather: { forecast_daily: DAILY },
    })
    const fillSrc = await clockWeatherCard.locator(DAILY_ICON)
      .first()
      .getAttribute('src')

    expect(lineSrc)
      .toBeTruthy()
    expect(fillSrc)
      .toBeTruthy()
    expect(lineSrc).not.toBe(fillSrc)
  })

  test('overrides the top-level weather_icon_type when set', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      cardConfig: `
        entity: weather.mock_weather
        weather_icon_type: line
        animated_icon: false
      `,
      weather: { forecast_daily: DAILY },
    })
    const inheritedSrc = await clockWeatherCard.locator(DAILY_ICON)
      .first()
      .getAttribute('src')

    await setupCard({
      date: TODAY,
      cardConfig: `
        entity: weather.mock_weather
        weather_icon_type: line
        animated_icon: false
        sections:
          daily_forecast:
            weather_icon_type: fill
      `,
      weather: { forecast_daily: DAILY },
    })
    const overrideSrc = await clockWeatherCard.locator(DAILY_ICON)
      .first()
      .getAttribute('src')

    expect(overrideSrc).not.toBe(inheritedSrc)
  })

  test('rejects values that are not one of the supported icon types', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      date: TODAY,
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            weather_icon_type: gradient
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.daily_forecast.weather_icon_type" has invalid value "gradient"')
    await expect(clockWeatherCard.locator('clock-weather-card-today'))
      .toHaveCount(0)
  })

  test('updates weather_icon_type at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      cardConfig: `
        entity: weather.mock_weather
        animated_icon: false
        sections:
          daily_forecast:
            weather_icon_type: line
      `,
      weather: { forecast_daily: DAILY },
    })
    const lineSrc = await clockWeatherCard.locator(DAILY_ICON)
      .first()
      .getAttribute('src')

    await setupCard({
      date: TODAY,
      cardConfig: `
        entity: weather.mock_weather
        animated_icon: false
        sections:
          daily_forecast:
            weather_icon_type: monochrome
      `,
      weather: { forecast_daily: DAILY },
    })

    await expect(clockWeatherCard.locator(DAILY_ICON)
      .first())
      .not.toHaveAttribute('src', lineSrc!)
  })
})

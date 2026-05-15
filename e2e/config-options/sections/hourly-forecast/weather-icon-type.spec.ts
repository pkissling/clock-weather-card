import type { WeatherForecast } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'

const FORECAST: WeatherForecast[] = [
  { datetime: '2025-09-14T20:00:00+00:00', condition: 'sunny', temperature: 20, precipitation_probability: 0 },
]

const FIXED_NOW = new Date('2025-09-14T18:00:00+00:00')
const HOURLY_ICON = 'clock-weather-card-hourly-forecast-item clock-weather-card-icon img'

test.describe('sections.hourly_forecast.weather_icon_type', () => {
  test('falls back to the top-level weather_icon_type by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: FIXED_NOW,
      cardConfig: `
        entity: weather.mock_weather
        weather_icon_type: line
        animated_icon: false
      `,
      weather: { forecast_hourly: FORECAST },
    })
    const lineSrc = await clockWeatherCard.locator(HOURLY_ICON)
      .first()
      .getAttribute('src')

    await setupCard({
      date: FIXED_NOW,
      cardConfig: `
        entity: weather.mock_weather
        weather_icon_type: fill
        animated_icon: false
      `,
      weather: { forecast_hourly: FORECAST },
    })
    const fillSrc = await clockWeatherCard.locator(HOURLY_ICON)
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
      date: FIXED_NOW,
      cardConfig: `
        entity: weather.mock_weather
        weather_icon_type: line
        animated_icon: false
      `,
      weather: { forecast_hourly: FORECAST },
    })
    const inheritedSrc = await clockWeatherCard.locator(HOURLY_ICON)
      .first()
      .getAttribute('src')

    await setupCard({
      date: FIXED_NOW,
      cardConfig: `
        entity: weather.mock_weather
        weather_icon_type: line
        animated_icon: false
        sections:
          hourly_forecast:
            weather_icon_type: fill
      `,
      weather: { forecast_hourly: FORECAST },
    })
    const overrideSrc = await clockWeatherCard.locator(HOURLY_ICON)
      .first()
      .getAttribute('src')

    expect(overrideSrc).not.toBe(inheritedSrc)
  })

  test('rejects values that are not one of the supported icon types', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      date: FIXED_NOW,
      cardConfig: `
        entity: weather.mock_weather
        sections:
          hourly_forecast:
            weather_icon_type: gradient
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.hourly_forecast.weather_icon_type" has invalid value "gradient"')
    await expect(clockWeatherCard.locator('clock-weather-card-today'))
      .toHaveCount(0)
  })

  test('drops the blue precipitation color when icon type is monochrome', async ({ setupCard, clockWeatherCard }) => {
    const forecast: WeatherForecast[] = [
      { datetime: '2025-09-14T19:00:00+00:00', condition: 'rainy', temperature: 18, precipitation_probability: 70 },
      { datetime: '2025-09-14T20:00:00+00:00', condition: 'rainy', temperature: 17, precipitation_probability: 80 },
    ]

    // Baseline: icon type `line` keeps the info-color (blue).
    await setupCard({
      date: new Date('2025-09-14T18:30:00+00:00'),
      cardConfig: `
        entity: weather.mock_weather
        animated_icon: false
        sections:
          hourly_forecast:
            weather_icon_type: line
      `,
      weather: { forecast_hourly: forecast },
    })
    const lineColor = await clockWeatherCard.locator('clock-weather-card-hourly-forecast-item .precipitation')
      .first()
      .evaluate(el => getComputedStyle(el).color)

    // Monochrome inherits the surrounding text color (matches the temperature label).
    await setupCard({
      date: new Date('2025-09-14T18:30:00+00:00'),
      cardConfig: `
        entity: weather.mock_weather
        animated_icon: false
        sections:
          hourly_forecast:
            weather_icon_type: monochrome
      `,
      weather: { forecast_hourly: forecast },
    })
    const monoPrecipColor = await clockWeatherCard.locator('clock-weather-card-hourly-forecast-item .precipitation')
      .first()
      .evaluate(el => getComputedStyle(el).color)
    const monoTempColor = await clockWeatherCard.locator('clock-weather-card-hourly-forecast-item .temperature')
      .first()
      .evaluate(el => getComputedStyle(el).color)

    expect(monoPrecipColor).not.toBe(lineColor)
    expect(monoPrecipColor)
      .toBe(monoTempColor)
  })

  test('updates weather_icon_type at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: FIXED_NOW,
      cardConfig: `
        entity: weather.mock_weather
        animated_icon: false
        sections:
          hourly_forecast:
            weather_icon_type: line
      `,
      weather: { forecast_hourly: FORECAST },
    })
    const lineSrc = await clockWeatherCard.locator(HOURLY_ICON)
      .first()
      .getAttribute('src')

    await setupCard({
      date: FIXED_NOW,
      cardConfig: `
        entity: weather.mock_weather
        animated_icon: false
        sections:
          hourly_forecast:
            weather_icon_type: monochrome
      `,
      weather: { forecast_hourly: FORECAST },
    })

    await expect(clockWeatherCard.locator(HOURLY_ICON)
      .first())
      .not.toHaveAttribute('src', lineSrc!)
  })
})

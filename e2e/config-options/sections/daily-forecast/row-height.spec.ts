import type { DailyWeatherForecast } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'

const DAILY: DailyWeatherForecast[] = [
  { datetime: '2025-09-14T00:00:00+00:00', condition: 'sunny',  templow: 5, temperature: 14, precipitation_probability: 0 },
  { datetime: '2025-09-15T00:00:00+00:00', condition: 'cloudy', templow: 4, temperature: 12, precipitation_probability: 0 },
]

const DAILY_ICON = 'clock-weather-card-daily-forecast-item clock-weather-card-icon img'

test.describe('sections.daily_forecast.row_height', () => {
  test('applies the configured row height to the icon and the row min-height', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            row_height: 48px
      `,
      weather: { temperature: 9, forecast_daily: DAILY },
    })

    const iconBox = await clockWeatherCard.locator(DAILY_ICON)
      .first()
      .boundingBox()
    expect(iconBox?.height)
      .toBeGreaterThanOrEqual(47)
    expect(iconBox?.height)
      .toBeLessThanOrEqual(49)

    const item = clockWeatherCard.locator('clock-weather-card-daily-forecast-item')
      .first()
    const itemMinHeight = await item.evaluate(el => getComputedStyle(el).minHeight)
    expect(itemMinHeight)
      .toBe('48px')
  })

  test('rejects values that are not a valid CSS length', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            row_height: "tall"
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.daily_forecast.row_height" has invalid value "tall"')
  })

  test('updates the row height at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            row_height: 20px
      `,
      weather: { temperature: 9, forecast_daily: DAILY },
    })
    const smallIcon = await clockWeatherCard.locator(DAILY_ICON)
      .first()
      .boundingBox()
    expect(smallIcon?.height)
      .toBeLessThanOrEqual(21)

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            row_height: 56px
      `,
      weather: { temperature: 9, forecast_daily: DAILY },
    })
    const largeIcon = await clockWeatherCard.locator(DAILY_ICON)
      .first()
      .boundingBox()
    expect(largeIcon?.height)
      .toBeGreaterThanOrEqual(55)
  })
})

import type { DailyWeatherForecast } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'

const DAILY: DailyWeatherForecast[] = [
  { datetime: '2025-09-14T00:00:00+00:00', condition: 'sunny',  templow: 5, temperature: 14, precipitation_probability: 0 },
  { datetime: '2025-09-15T00:00:00+00:00', condition: 'cloudy', templow: 4, temperature: 12, precipitation_probability: 0 },
]

test.describe('sections.daily_forecast.bar_height_ratio', () => {
  test('uses 0.6 by default — bar is 60% of row_height', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            row_height: 100px
      `,
      weather: { temperature: 9, forecast_daily: DAILY },
    })

    const trackHeight = await clockWeatherCard.locator('clock-weather-card-daily-forecast-item .bar-track')
      .first()
      .evaluate(el => parseFloat(getComputedStyle(el).height))
    expect(trackHeight)
      .toBeGreaterThanOrEqual(58)
    expect(trackHeight)
      .toBeLessThanOrEqual(62)
  })

  test('honors a custom ratio', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            row_height: 100px
            bar_height_ratio: 0.3
      `,
      weather: { temperature: 9, forecast_daily: DAILY },
    })

    const trackHeight = await clockWeatherCard.locator('clock-weather-card-daily-forecast-item .bar-track')
      .first()
      .evaluate(el => parseFloat(getComputedStyle(el).height))
    expect(trackHeight)
      .toBeGreaterThanOrEqual(28)
    expect(trackHeight)
      .toBeLessThanOrEqual(32)
  })

  test('rejects values outside (0, 1]', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            bar_height_ratio: 1.5
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.daily_forecast.bar_height_ratio" has invalid value "1.5"')
  })

  test('rejects non-number values', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            bar_height_ratio: "half"
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.daily_forecast.bar_height_ratio" has invalid value "half"')
  })

  test('updates the ratio at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            row_height: 100px
            bar_height_ratio: 0.2
      `,
      weather: { temperature: 9, forecast_daily: DAILY },
    })
    const thin = await clockWeatherCard.locator('clock-weather-card-daily-forecast-item .bar-track')
      .first()
      .evaluate(el => parseFloat(getComputedStyle(el).height))
    expect(thin)
      .toBeLessThanOrEqual(22)

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            row_height: 100px
            bar_height_ratio: 0.8
      `,
      weather: { temperature: 9, forecast_daily: DAILY },
    })
    const thick = await clockWeatherCard.locator('clock-weather-card-daily-forecast-item .bar-track')
      .first()
      .evaluate(el => parseFloat(getComputedStyle(el).height))
    expect(thick)
      .toBeGreaterThanOrEqual(78)
  })
})

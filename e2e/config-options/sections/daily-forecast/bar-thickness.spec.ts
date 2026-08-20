import type { DailyWeatherForecast } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'

const DAILY: DailyWeatherForecast[] = [
  { datetime: '2025-09-14T00:00:00+00:00', condition: 'sunny',  templow: 5, temperature: 14, precipitation_probability: 0 },
  { datetime: '2025-09-15T00:00:00+00:00', condition: 'cloudy', templow: 4, temperature: 12, precipitation_probability: 0 },
]

const BAR_TRACK = 'clock-weather-card-daily-forecast-item .bar-track'

test.describe('sections.daily_forecast.bar_thickness', () => {
  test('uses 60% of row_height by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            row_height: 100px
      `,
      weather: { temperature: 9, forecast_daily: DAILY },
    })

    const trackHeight = await clockWeatherCard.locator(BAR_TRACK)
      .first()
      .evaluate(el => parseFloat(getComputedStyle(el).height))
    expect(trackHeight)
      .toBeGreaterThanOrEqual(58)
    expect(trackHeight)
      .toBeLessThanOrEqual(62)
  })

  test('resolves a percentage relative to row_height', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            row_height: 100px
            bar_thickness: 30%
      `,
      weather: { temperature: 9, forecast_daily: DAILY },
    })

    const trackHeight = await clockWeatherCard.locator(BAR_TRACK)
      .first()
      .evaluate(el => parseFloat(getComputedStyle(el).height))
    expect(trackHeight)
      .toBeGreaterThanOrEqual(28)
    expect(trackHeight)
      .toBeLessThanOrEqual(32)
  })

  test('applies an absolute CSS length independently of row_height', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            row_height: 100px
            bar_thickness: 20px
      `,
      weather: { temperature: 9, forecast_daily: DAILY },
    })

    const trackHeight = await clockWeatherCard.locator(BAR_TRACK)
      .first()
      .evaluate(el => parseFloat(getComputedStyle(el).height))
    expect(trackHeight)
      .toBe(20)
  })

  test('rejects values that are not a valid CSS length', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            bar_thickness: "thick"
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.daily_forecast.bar_thickness" has invalid value "thick"')
  })

  test('rejects unitless numbers', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            bar_thickness: 0.6
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.daily_forecast.bar_thickness" has invalid value "0.6"')
  })

  test('updates the thickness at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            row_height: 100px
            bar_thickness: 20%
      `,
      weather: { temperature: 9, forecast_daily: DAILY },
    })
    const thin = await clockWeatherCard.locator(BAR_TRACK)
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
            bar_thickness: 80%
      `,
      weather: { temperature: 9, forecast_daily: DAILY },
    })
    const thick = await clockWeatherCard.locator(BAR_TRACK)
      .first()
      .evaluate(el => parseFloat(getComputedStyle(el).height))
    expect(thick)
      .toBeGreaterThanOrEqual(78)
  })
})

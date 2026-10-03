import type { DailyWeatherForecast } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'

const DAILY: DailyWeatherForecast[] = [
  { datetime: '2025-09-14T00:00:00+00:00', condition: 'sunny',  templow: 5, temperature: 14, precipitation_probability: 0 },
  { datetime: '2025-09-15T00:00:00+00:00', condition: 'cloudy', templow: 4, temperature: 12, precipitation_probability: 0 },
]

test.describe('sections.forecast_list.hide_current_temp_indicator', () => {
  test('renders the current-temp dot on today\'s row by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      weather: { temperature: 8, forecast_daily: DAILY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item')
      .first()
      .locator('.dot'))
      .toHaveCount(1)
  })

  test('hides the dot when hide_current_temp_indicator: true', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_list:
            hide_current_temp_indicator: true
      `,
      weather: { temperature: 8, forecast_daily: DAILY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item .dot'))
      .toHaveCount(0)
    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item .bar-fill'))
      .toHaveCount(DAILY.length)
  })

  test('toggles the dot at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_list:
            hide_current_temp_indicator: true
      `,
      weather: { temperature: 8, forecast_daily: DAILY },
    })
    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item .dot'))
      .toHaveCount(0)

    await setupCard({
      weather: { temperature: 8, forecast_daily: DAILY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item')
      .first()
      .locator('.dot'))
      .toHaveCount(1)
  })

  test('rejects a non-boolean value', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_list:
            hide_current_temp_indicator: fals
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_list.hide_current_temp_indicator" has invalid value "fals", expected true or false')
  })
})

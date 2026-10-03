import type { DailyWeatherForecast } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'

const DAILY: DailyWeatherForecast[] = [
  { datetime: '2025-09-14T00:00:00+00:00', condition: 'rainy', templow: 8, temperature: 14, precipitation_probability: 50 },
]

const LIST_ICON = 'clock-weather-card-forecast-list-item clock-weather-card-icon img'

test.describe('sections.forecast_list.animated_icons', () => {
  test('loads animated assets when sections.forecast_list.animated_icons: true', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_list:
            animated_icons: false
      `,
      weather: { forecast_daily: DAILY },
    })
    const staticSrc = await clockWeatherCard.locator(LIST_ICON)
      .first()
      .getAttribute('src')

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_list:
            animated_icons: true
      `,
      weather: { forecast_daily: DAILY },
    })
    const animatedSrc = await clockWeatherCard.locator(LIST_ICON)
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
        sections:
          forecast_list:
            animated_icons: false
      `,
      weather: { forecast_daily: DAILY },
    })
    const staticSrc = await clockWeatherCard.locator(LIST_ICON)
      .first()
      .getAttribute('src')

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_list:
            animated_icons: true
      `,
      weather: { forecast_daily: DAILY },
    })

    await expect(clockWeatherCard.locator(LIST_ICON)
      .first())
      .not.toHaveAttribute('src', staticSrc!)
  })

  test('rejects a non-boolean value', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_list:
            animated_icons: fals
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_list.animated_icons" has invalid value "fals", expected true or false')
  })
})

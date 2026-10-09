import type { DailyWeatherForecast } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'
import { dailyForecast, DEFAULT_DATE } from '../../../utils/test-utils'

const FORECAST_DAILY: DailyWeatherForecast[] = dailyForecast(DEFAULT_DATE, ['sunny', 'cloudy', 'rainy'], i => [
  { templow: 10, temperature: 20, precipitation_probability: 20, dew_point: -10 },
  { templow: 11, temperature: 21, precipitation_probability: 80, dew_point: 10 },
  { templow: 12, temperature: 22, dew_point: 30 },
][i])

const listConfig = (attribute: string): string => `
  entity: weather.mock_weather
  sections:
    forecast_list:
      attribute: ${attribute}
`

test.describe('sections.forecast_list.attribute', () => {
  test('shows the attribute value right of a bar that starts at zero', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: listConfig('precipitation_probability'), weather: { forecast_daily: FORECAST_DAILY } })

    const items = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
    await expect(items)
      .toHaveCount(3)
    await expect(items.locator('.temperature-high'))
      .toHaveText(['20%', '80%', ''])
    await expect(items.locator('.temperature-low'))
      .toHaveText(['', '', ''])
    await expect(items.locator('.dot'))
      .toHaveCount(0)
    expect(await items.nth(0)
      .locator('.bar-fill')
      .getAttribute('style'))
      .toContain('left: 0%; right: 75%; background: linear-gradient(to right, #a4c3d2 0%, #79D2B3 50%')
    expect(await items.nth(1)
      .locator('.bar-fill')
      .getAttribute('style'))
      .toContain('left: 0%; right: 0%;')
  })

  test('extends bars of negative values left from zero', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: listConfig('dew_point'), weather: { forecast_daily: FORECAST_DAILY } })

    const items = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
    await expect(items.locator('.temperature-high'))
      .toHaveText(['-10°C', '10°C', '30°C'])
    const fills = await items.locator('.bar-fill')
      .evaluateAll(els => els.map(el => el.getAttribute('style')))
    expect(fills[0])
      .toContain('left: 0%; right: 75%;')
    expect(fills[1])
      .toContain('left: 25%; right: 50%;')
    expect(fills[2])
      .toContain('left: 25%; right: 0%;')
  })

  test('converts temperature attributes to the card\'s temperature_unit', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        temperature_unit: fahrenheit
        sections:
          forecast_list:
            attribute: dew_point
      `,
      weather: { forecast_daily: FORECAST_DAILY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item .temperature-high'))
      .toHaveText(['14°F', '50°F', '86°F'])
  })

  test('applies gradient keys in the attribute\'s units', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_list:
            attribute: precipitation_probability
            gradient:
              0: "#000000"
              100: "#ffffff"
      `,
      weather: { forecast_daily: FORECAST_DAILY },
    })

    expect(await clockWeatherCard.locator('clock-weather-card-forecast-list-item')
      .nth(1)
      .locator('.bar-fill')
      .getAttribute('style'))
      .toContain('linear-gradient(to right, #000000 0%, #cccccc 100%)')
  })

  test('switches from temperature to the attribute at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ weather: { forecast_daily: FORECAST_DAILY } })
    const firstHigh = clockWeatherCard.locator('clock-weather-card-forecast-list-item .temperature-high')
      .first()
    await expect(firstHigh)
      .toHaveText('21°C')

    await setupCard({ cardConfig: listConfig('precipitation_probability'), weather: { forecast_daily: FORECAST_DAILY } })

    await expect(firstHigh)
      .toHaveText('20%')
  })

  test('warns when no forecast entry has the configured attribute', async ({ setupCard, cardErrorMessage, clockWeatherCard }) => {
    await setupCard({ cardConfig: listConfig('snow_depth'), weather: { forecast_daily: FORECAST_DAILY } })

    await cardErrorMessage(clockWeatherCard.locator('clock-weather-card-forecast-list'))
      .toBe('Forecast of entity "weather.mock_weather" has no attribute "snow_depth"')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item'))
      .toHaveCount(0)
  })

  test('rejects a non-string attribute', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: listConfig('5') })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_list.attribute" has invalid value "5", expected a non-empty string')
  })
})

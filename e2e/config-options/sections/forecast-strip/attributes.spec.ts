import type { Locator } from '@playwright/test'

import type { WeatherForecast } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'
import { dailyForecast, DEFAULT_DATE } from '../../../utils/test-utils'

const FIXED_NOW = new Date('2025-09-14T18:30:00+00:00')
const FORECAST_HOURLY: (WeatherForecast & Record<string, unknown>)[] = [
  { datetime: '2025-09-14T18:00:00+00:00', condition: 'sunny', temperature: 20, precipitation_probability: 30, wind_speed: 12.4, precipitation: 0 },
  { datetime: '2025-09-14T19:00:00+00:00', condition: 'cloudy', temperature: 19, precipitation_probability: 50, wind_speed: 8, precipitation: 0.44 },
  { datetime: '2025-09-14T20:00:00+00:00', condition: 'rainy', temperature: 18, precipitation_probability: 70, precipitation: 1.2 },
]

const stripConfig = (...attributes: string[]): string => `
  sections:
    forecast_strip:
      hide_sunrise_sunset: true
      attributes:
${attributes.map(a => `        - ${a.startsWith('{') ? a : `attribute: ${a}`}`)
    .join('\n')}
`

const attributeRows = (clockWeatherCard: Locator): Locator => clockWeatherCard.locator('clock-weather-card-forecast-strip-item .attribute')

const firstAttributeColor = (clockWeatherCard: Locator): Promise<string> =>
  attributeRows(clockWeatherCard)
    .first()
    .evaluate(el => getComputedStyle(el).color)

test.describe('sections.forecast_strip.attributes', () => {
  test('shows the precipitation probability by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ date: FIXED_NOW, weather: { forecast_hourly: FORECAST_HOURLY } })

    await expect(attributeRows(clockWeatherCard))
      .toHaveText(['30%', '50%', '70%'])
    await expect(attributeRows(clockWeatherCard)
      .first()
      .locator('ha-icon'))
      .toHaveAttribute('icon', 'mdi:water')
  })

  test('shows one row per attribute in the configured order', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ date: FIXED_NOW, cardConfig: stripConfig('precipitation', 'precipitation_probability'), weather: { forecast_hourly: FORECAST_HOURLY } })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item')
      .first()
      .locator('.attribute'))
      .toHaveText(['0 mm', '30%'])
  })

  test('shows the configured attribute unrounded with its unit and no icon, leaving columns without a value blank', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ date: FIXED_NOW, cardConfig: stripConfig('wind_speed'), weather: { forecast_hourly: FORECAST_HOURLY } })

    await expect(attributeRows(clockWeatherCard))
      .toHaveText(['12.4 km/h', '8 km/h', ''])
    await expect(attributeRows(clockWeatherCard)
      .locator('ha-icon'))
      .toHaveCount(0)
  })

  test('shows zero values', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ date: FIXED_NOW, cardConfig: stripConfig('precipitation'), weather: { forecast_hourly: FORECAST_HOURLY } })

    await expect(attributeRows(clockWeatherCard))
      .toHaveText(['0 mm', '0.44 mm', '1.2 mm'])
  })

  test('accepts any attribute name and shows its values', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: FIXED_NOW,
      cardConfig: stripConfig('snow_depth'),
      weather: { forecast_hourly: FORECAST_HOURLY.map((f, i) => ({ ...f, snow_depth: i + 1 })) },
    })

    await expect(attributeRows(clockWeatherCard))
      .toHaveText(['1', '2', '3'])
  })

  test('hides a row without any value and keeps the others', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: FIXED_NOW,
      cardConfig: stripConfig('snow_depth', 'precipitation_probability'),
      weather: { forecast_hourly: FORECAST_HOURLY.map(f => ({ ...f, snow_depth: null })) },
    })

    await expect(attributeRows(clockWeatherCard))
      .toHaveText(['30%', '50%', '70%'])
  })

  test('shows no attribute row for an empty list', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ date: FIXED_NOW, cardConfig: 'sections: { forecast_strip: { hide_sunrise_sunset: true, attributes: [] } }', weather: { forecast_hourly: FORECAST_HOURLY } })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item'))
      .toHaveCount(3)
    await expect(attributeRows(clockWeatherCard))
      .toHaveCount(0)
  })

  test('warns when no forecast entry has a configured attribute', async ({ setupCard, cardErrorMessage, clockWeatherCard }) => {
    await setupCard({ date: FIXED_NOW, cardConfig: stripConfig('precipitation_probability', 'humidity'), weather: { forecast_hourly: FORECAST_HOURLY } })

    await cardErrorMessage(clockWeatherCard.locator('clock-weather-card-forecast-strip'))
      .toBe('Forecast of entity "weather.mock_weather" has no attribute "humidity"')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item'))
      .toHaveCount(0)
  })

  test('does not warn when the default attribute is missing', async ({ setupCard, cardErrorMessage, clockWeatherCard }) => {
    await setupCard({
      date: FIXED_NOW,
      weather: { forecast_hourly: FORECAST_HOURLY.map(({ precipitation_probability: _, ...f }) => f) },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item'))
      .toHaveCount(3)
    await expect(attributeRows(clockWeatherCard))
      .toHaveCount(0)
    await cardErrorMessage(clockWeatherCard.locator('clock-weather-card-forecast-strip'))
      .toBeNull()
  })

  test('switches the attributes at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ date: FIXED_NOW, weather: { forecast_hourly: FORECAST_HOURLY } })
    const first = attributeRows(clockWeatherCard)
      .first()
    await expect(first)
      .toHaveText('30%')

    await setupCard({ date: FIXED_NOW, cardConfig: stripConfig('wind_speed'), weather: { forecast_hourly: FORECAST_HOURLY } })

    await expect(first)
      .toHaveText('12.4 km/h')
  })

  test('rejects a value that is not a list', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'sections: { forecast_strip: { attributes: wind_speed } }' })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_strip.attributes" has invalid value "wind_speed", expected a list')
  })

  test('rejects an entry without an attribute', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: stripConfig('{ icon: mdi:gauge }') })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_strip.attributes[0].attribute" has invalid value "null", expected a non-empty string')
  })

  test.describe('icon', () => {
    test('shows the configured icon next to each value', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({ cardConfig: stripConfig('{ attribute: precipitation_probability, icon: "mdi:umbrella" }') })

      await expect(attributeRows(clockWeatherCard)
        .first()
        .locator('ha-icon'))
        .toHaveAttribute('icon', 'mdi:umbrella')
    })

    test('defaults to the water icon for precipitation probability only', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({ date: FIXED_NOW, cardConfig: stripConfig('precipitation_probability', 'precipitation'), weather: { forecast_hourly: FORECAST_HOURLY } })

      await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item')
        .first()
        .locator('.attribute ha-icon'))
        .toHaveCount(1)
      await expect(attributeRows(clockWeatherCard)
        .first()
        .locator('ha-icon'))
        .toHaveAttribute('icon', 'mdi:water')
    })

    test('rejects an empty icon', async ({ setupCard, cardErrorMessage }) => {
      await setupCard({ cardConfig: stripConfig('{ attribute: wind_speed, icon: "" }') })

      await cardErrorMessage()
        .toContain('Config option "sections.forecast_strip.attributes[0].icon" has invalid value "", expected a non-empty string')
    })
  })

  test.describe('unit', () => {
    const forecast_daily = dailyForecast(DEFAULT_DATE, ['sunny', 'cloudy'], i => ({ templow: 10, temperature: 20, wind_speed: [5, 7][i] }))
    const unitConfig = (unit: string): string => `
      sections:
        forecast_strip:
          forecast_type: daily
          attributes:
            - attribute: wind_speed
              unit: "${unit}"
    `

    test('replaces the resolved unit', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({ cardConfig: unitConfig('kn'), weather: { forecast_daily } })

      await expect(attributeRows(clockWeatherCard))
        .toHaveText(['5 kn', '7 kn'])
    })

    test('shows no unit when empty', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({ cardConfig: unitConfig(''), weather: { forecast_daily } })

      await expect(attributeRows(clockWeatherCard))
        .toHaveText(['5', '7'])
    })

    test('rejects a non-string unit', async ({ setupCard, cardErrorMessage }) => {
      await setupCard({ cardConfig: stripConfig('{ attribute: wind_speed, unit: 5 }') })

      await cardErrorMessage()
        .toContain('Config option "sections.forecast_strip.attributes[0].unit" has invalid value "5", expected a string')
    })
  })

  test.describe('color', () => {
    const colorConfig = (color: string, iconType = 'line'): string => `
      sections:
        forecast_strip:
          weather_icon_type: ${iconType}
          attributes:
            - attribute: precipitation_probability
              color: "${color}"
    `

    test('colors the attribute row', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({ cardConfig: colorConfig('#ff0000') })

      expect(await firstAttributeColor(clockWeatherCard))
        .toBe('rgb(255, 0, 0)')
    })

    test('colors precipitation probability blue by default', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({ cardConfig: stripConfig('precipitation_probability') })

      expect(await firstAttributeColor(clockWeatherCard))
        .toBe('rgb(57, 136, 239)')
    })

    test('overrides the monochrome text color', async ({ setupCard, clockWeatherCard }) => {
      await setupCard({ cardConfig: colorConfig('#ff0000', 'monochrome') })

      expect(await firstAttributeColor(clockWeatherCard))
        .toBe('rgb(255, 0, 0)')
    })

    test('rejects an empty color', async ({ setupCard, cardErrorMessage }) => {
      await setupCard({ cardConfig: colorConfig('') })

      await cardErrorMessage()
        .toContain('Config option "sections.forecast_strip.attributes[0].color" has invalid value "", expected a non-empty string')
    })
  })
})

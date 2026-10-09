import type { Locator } from '@playwright/test'

import { expect, test } from '../../../utils/fixtures'

const attributeColor = (color: string | null, iconType = 'line'): string => `
  entity: weather.mock_weather
  sections:
    forecast_strip:
      weather_icon_type: ${iconType}
${color === null ? '' : `      attribute_color: "${color}"`}
`

const firstAttributeColor = (clockWeatherCard: Locator): Promise<string> =>
  clockWeatherCard.locator('clock-weather-card-forecast-strip-item .attribute')
    .first()
    .evaluate(el => getComputedStyle(el).color)

test.describe('sections.forecast_strip.attribute_color', () => {
  test('colors the attribute row', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: attributeColor('#ff0000') })

    expect(await firstAttributeColor(clockWeatherCard))
      .toBe('rgb(255, 0, 0)')
  })

  test('overrides the monochrome text color', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: attributeColor('#ff0000', 'monochrome') })

    expect(await firstAttributeColor(clockWeatherCard))
      .toBe('rgb(255, 0, 0)')
  })

  test('swaps the color at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: attributeColor('#ff0000') })
    expect(await firstAttributeColor(clockWeatherCard))
      .toBe('rgb(255, 0, 0)')

    await setupCard({ cardConfig: attributeColor(null) })

    expect(await firstAttributeColor(clockWeatherCard)).not.toBe('rgb(255, 0, 0)')
  })

  test('rejects an empty color', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: attributeColor('') })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_strip.attribute_color" has invalid value "", expected a non-empty string')
  })
})

import { expect, test } from '../../../utils/fixtures'

const attributeIcon = (icon: string | null): string => `
  entity: weather.mock_weather
  sections:
    forecast_strip:
      attribute: precipitation_probability
${icon === null ? '' : `      attribute_icon: ${icon}`}
`

test.describe('sections.forecast_strip.attribute_icon', () => {
  test('shows the configured icon next to each value', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: attributeIcon('mdi:umbrella') })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .attribute')
      .first()
      .locator('ha-icon'))
      .toHaveAttribute('icon', 'mdi:umbrella')
  })

  test('swaps the icon at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: attributeIcon('mdi:umbrella') })
    const icons = clockWeatherCard.locator('clock-weather-card-forecast-strip-item .attribute ha-icon')
    await expect(icons.first())
      .toHaveAttribute('icon', 'mdi:umbrella')

    await setupCard({ cardConfig: attributeIcon(null) })

    await expect(icons)
      .toHaveCount(0)
  })

  test('rejects an empty icon', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: attributeIcon('""') })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_strip.attribute_icon" has invalid value "", expected a non-empty string')
  })
})

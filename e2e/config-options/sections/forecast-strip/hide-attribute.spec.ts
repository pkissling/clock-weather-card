import { expect, test } from '../../../utils/fixtures'

test.describe('sections.forecast_strip.hide_attribute', () => {
  test('ignores a configured attribute the forecast does not provide', async ({ setupCard, cardErrorMessage, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            hide_attribute: true
            attribute: uv_index
      `,
    })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item'))
      .not.toHaveCount(0)
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .attribute'))
      .toHaveCount(0)
    await cardErrorMessage(clockWeatherCard.locator('clock-weather-card-forecast-strip'))
      .toBeNull()
  })

  test('toggles the attribute row at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    const attributes = clockWeatherCard.locator('clock-weather-card-forecast-strip-item .attribute')
    await setupCard({})
    await expect(attributes)
      .not.toHaveCount(0)

    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            hide_attribute: true
      `,
    })

    await expect(attributes)
      .toHaveCount(0)
  })

  test('rejects a non-boolean value', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            hide_attribute: "yes"
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_strip.hide_attribute" has invalid value "yes", expected true or false')
  })
})

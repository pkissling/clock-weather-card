import { expect, test } from '../../../utils/fixtures'

const LABEL = 'clock-weather-card-forecast-strip-item .label'
const ICON = 'clock-weather-card-forecast-strip-item clock-weather-card-icon'

test.describe('sections.forecast_strip.font_size', () => {
  test('scales the text and the icons at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({})

    await expect(clockWeatherCard.locator(LABEL)
      .first())
      .toHaveCSS('font-size', '14px')
    await expect(clockWeatherCard.locator(ICON)
      .first())
      .toHaveCSS('width', '40px')

    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            font_size: 40px
      `,
    })

    await expect(clockWeatherCard.locator(LABEL)
      .first())
      .toHaveCSS('font-size', '40px')
    await expect(clockWeatherCard.locator(ICON)
      .first())
      .toHaveCSS('width', '100px')
  })

  test('rejects values that are not a valid CSS length', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            font_size: big
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_strip.font_size" has invalid value "big", expected a CSS length in px, rem, em, vh, vw or %')
  })
})

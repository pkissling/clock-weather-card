import { expect, test } from '../../../utils/fixtures'

const LABEL = 'clock-weather-card-forecast-list-item .label'
const ICON = 'clock-weather-card-forecast-list-item clock-weather-card-icon'

test.describe('sections.forecast_list.font_size', () => {
  test('grows the text and the icons at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({})

    await expect(clockWeatherCard.locator(LABEL)
      .first())
      .toHaveCSS('font-size', '14px')
    await expect(clockWeatherCard.locator(ICON)
      .first())
      .toHaveCSS('width', '28px')

    await setupCard({
      cardConfig: `
        sections:
          forecast_list:
            font_size: 20px
      `,
    })

    await expect(clockWeatherCard.locator(LABEL)
      .first())
      .toHaveCSS('font-size', '20px')
    await expect(clockWeatherCard.locator(ICON)
      .first())
      .toHaveCSS('width', '40px')
  })

  test('keeps a larger row_height as the icon size', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_list:
            font_size: 20px
            row_height: 60px
      `,
    })

    await expect(clockWeatherCard.locator(ICON)
      .first())
      .toHaveCSS('width', '60px')
  })

  test('rejects values that are not a valid CSS length', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_list:
            font_size: big
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_list.font_size" has invalid value "big", expected a CSS length in px, rem, em, vh, vw or %')
  })
})

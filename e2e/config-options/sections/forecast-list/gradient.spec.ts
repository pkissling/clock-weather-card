import type { Locator } from '@playwright/test'

import { expect, test } from '../../../utils/fixtures'

// Visual gradient rendering (default palette, custom stops, clamping, single stop) is covered
// by screenshot tests in e2e/screenshots/gradient.spec.ts.

const barFillStyle = (clockWeatherCard: Locator): Promise<string | null> =>
  clockWeatherCard.locator('clock-weather-card-forecast-list-item')
    .first()
    .locator('.bar-fill')
    .getAttribute('style')

test.describe('sections.forecast_list.gradient', () => {
  test('rejects non-string gradient values', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_list:
            gradient:
              0: 12345
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_list.gradient" has invalid value "value at 0", expected hex (#rgb, #rrggbb) or rgb() colors')
  })

  test('rejects gradient colors that are neither hex nor rgb()', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_list:
            gradient:
              10: red
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_list.gradient" has invalid value "value at 10", expected hex (#rgb, #rrggbb) or rgb() colors')
  })

  test('rejects a gradient that is not a map', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_list:
            gradient: red
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_list.gradient" has invalid value "red", expected a map of temperatures to colors')
  })

  test('rejects non-numeric gradient keys', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_list:
            gradient:
              cold: "#0000ff"
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_list.gradient" has invalid value "key cold", expected numeric temperature keys')
  })

  test('swaps the gradient at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({})
    const defaultFill = await barFillStyle(clockWeatherCard)

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_list:
            gradient:
              0: "#000000"
              30: "#ffffff"
      `,
    })
    const customFill = await barFillStyle(clockWeatherCard)

    expect(customFill).not.toBe(defaultFill)
  })
})

import type { Locator } from '@playwright/test'

import { expect, test } from '../../../utils/fixtures'

// Visual gradient rendering (default palette, custom stops, clamping, single stop) is covered
// by screenshot tests in e2e/screenshots/gradient.spec.ts.

const barFillStyle = (clockWeatherCard: Locator): Promise<string | null> =>
  clockWeatherCard.locator('clock-weather-card-daily-forecast-item')
    .first()
    .locator('.bar-fill')
    .getAttribute('style')

test.describe('sections.daily_forecast.gradient', () => {
  test('rejects non-string gradient values', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            gradient:
              0: 12345
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.daily_forecast.gradient" has invalid value "value at "0""')
  })

  test('swaps the gradient at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({})
    const defaultFill = await barFillStyle(clockWeatherCard)

    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          daily_forecast:
            gradient:
              0: "#000000"
              30: "#ffffff"
      `,
    })
    const customFill = await barFillStyle(clockWeatherCard)

    expect(customFill).not.toBe(defaultFill)
  })
})

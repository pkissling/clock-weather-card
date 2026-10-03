import { expect, test } from './utils/fixtures'

test.describe('sections', () => {
  test('stacks header, forecast strip and forecast list in that order', async ({ setupCard, clockWeatherCard }) => {
    await setupCard()

    const sections = clockWeatherCard.locator('.card-content > *')
    await expect(sections)
      .toHaveCount(3)
    expect(await sections.evaluateAll(els => els.map(el => el.localName)))
      .toEqual([
        'clock-weather-card-header',
        'clock-weather-card-hourly-forecast',
        'clock-weather-card-daily-forecast',
      ])
  })

  test('keeps the forecast list divider when only the forecast strip is hidden', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            hide: true
      `,
    })

    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast > clock-weather-card-divider'))
      .toBeVisible()
  })

  test('hides the forecast list divider when it becomes the topmost section', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          header:
            hide: true
          forecast_strip:
            hide: true
      `,
    })

    const divider = clockWeatherCard.locator('clock-weather-card-daily-forecast > clock-weather-card-divider')
    await expect(divider)
      .toHaveCount(1)
    await expect(divider)
      .toBeHidden()
  })
})

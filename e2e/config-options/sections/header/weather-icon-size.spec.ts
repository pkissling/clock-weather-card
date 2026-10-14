import type { Locator } from '@playwright/test'

import { expect, test } from '../../../utils/fixtures'

const height = async (locator: Locator): Promise<number> => (await locator.boundingBox())!.height

test.describe('sections.header.weather_icon_size', () => {
  test('defaults to the height of the rows', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          header:
            rows:
              - font_size: 12rem
                segments:
                  - type: time
      `,
    })
    const header = clockWeatherCard.locator('clock-weather-card-header')
    const detailsHeight = await height(header.locator('clock-weather-card-header-details'))

    await expect.poll(async () => Math.abs(await height(header.locator('clock-weather-card-icon')) - detailsHeight))
      .toBeLessThan(1)
    expect(Math.abs(await height(header) - detailsHeight))
      .toBeLessThan(1)
  })

  test('does not shrink below 9rem by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          header:
            rows:
              - segments:
                  - type: time
      `,
    })

    const rem = await clockWeatherCard.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))

    await expect.poll(async () => Math.abs(await height(clockWeatherCard.locator('clock-weather-card-header clock-weather-card-icon')) - 9 * rem))
      .toBeLessThan(1)
  })

  test('applies the configured size', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: 'sections: { header: { weather_icon_size: 150px } }' })

    await expect.poll(async () => Math.abs(await height(clockWeatherCard.locator('clock-weather-card-header clock-weather-card-icon')) - 150))
      .toBeLessThan(1)
  })

  test('updates the size at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    const icon = clockWeatherCard.locator('clock-weather-card-header clock-weather-card-icon')
    await setupCard({ cardConfig: 'sections: { header: { weather_icon_size: 150px } }' })
    await expect.poll(async () => Math.abs(await height(icon) - 150))
      .toBeLessThan(1)

    await setupCard({ cardConfig: 'sections: { header: { weather_icon_size: 180px } }' })

    await expect.poll(async () => Math.abs(await height(icon) - 180))
      .toBeLessThan(1)
  })

  test('caps the icon at half the card width', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: 'sections: { header: { weather_icon_size: 2000px } }' })
    const header = clockWeatherCard.locator('clock-weather-card-header')
    const headerWidth = (await header.boundingBox())!.width

    await expect.poll(async () => Math.abs((await header.locator('clock-weather-card-icon')
      .boundingBox())!.width - headerWidth / 2))
      .toBeLessThan(1)
  })

  test('rejects values that are not a valid CSS length', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'sections: { header: { weather_icon_size: big } }' })

    await cardErrorMessage()
      .toContain('Config option "sections.header.weather_icon_size" has invalid value "big", expected a CSS length in px, rem, em, vh, vw or %')
  })
})

import type { Locator } from '@playwright/test'

import { expect, test } from '../utils/fixtures'

test.use({ freshPage: true })

const size = async (locator: Locator): Promise<{ width: number, height: number }> => {
  const box = await locator.boundingBox()
  if (!box) throw new Error('element is not visible')
  return { width: box.width, height: box.height }
}

for (const [name, cardConfig] of [
  ['default config', undefined],
  ['hidden strip attribute', 'sections:\n  forecast_strip:\n    hide_attribute: true\n'],
] as const) {
  test(`the skeleton takes the same space as the loaded forecast (${name})`, async ({ setupCard, clockWeatherCard }) => {
    let release!: () => void
    const setup = setupCard({ cardConfig, delayForecast: new Promise<void>(resolve => { release = resolve }) })

    const strip = clockWeatherCard.locator('clock-weather-card-forecast-strip')
    const list = clockWeatherCard.locator('clock-weather-card-forecast-list')
    const stripItem = strip.locator('.skeleton-item, clock-weather-card-forecast-strip-item')
      .first()
    await expect(list.locator('.skeleton--bar'))
      .toHaveCount(5)

    const measure = async (): Promise<Record<string, { width: number, height: number }>> => ({
      card: await size(clockWeatherCard),
      strip: await size(strip),
      stripItem: await size(stripItem),
      list: await size(list),
    })
    const skeleton = await measure()

    release()
    await setup
    await expect(clockWeatherCard.locator('.skeleton'))
      .toHaveCount(0)
    const loaded = await measure()

    for (const [element, { width, height }] of Object.entries(skeleton)) {
      expect.soft(width, `${element} width`)
        .toBeCloseTo(loaded[element].width, 0)
      expect.soft(height, `${element} height`)
        .toBeCloseTo(loaded[element].height, 0)
    }
  })
}

import type { Page } from '@playwright/test'

import { expect, test } from '../utils/fixtures'

const HEADER_ICON = 'clock-weather-card-header clock-weather-card-icon img'

const durations = (svg: string): string[] => [...svg.matchAll(/\bdur="([^"]+)"/g)].map(m => m[1])
// Blob URLs only resolve inside the page that created them.
const readSvg = async (page: Page, src: string): Promise<string> => page.evaluate(async url => (await fetch(url)).text(), src)

test.describe('animation_speed', () => {
  test('shows the bundled icon at the default speed', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ weather: { state: 'sunny' } })

    await expect(clockWeatherCard.locator(HEADER_ICON))
      .not.toHaveAttribute('src', /^blob:/)
  })

  test('stretches the SMIL timings of the icon', async ({ page, setupCard, clockWeatherCard }) => {
    await setupCard({ weather: { state: 'sunny' } })
    const originalSrc = await clockWeatherCard.locator(HEADER_ICON)
      .getAttribute('src')

    await setupCard({ cardConfig: 'animation_speed: 0.5', weather: { state: 'sunny' } })
    await expect(clockWeatherCard.locator(HEADER_ICON))
      .toHaveAttribute('src', /^blob:/)
    const slowedSrc = await clockWeatherCard.locator(HEADER_ICON)
      .getAttribute('src')

    const original = durations(await readSvg(page, originalSrc!))
    const slowed = durations(await readSvg(page, slowedSrc!))
    expect(original.length)
      .toBeGreaterThan(0)
    expect(slowed)
      .toEqual(original.map(d => `${Number(d.slice(0, -1)) * 2}s`))
  })

  test('leaves static icons untouched', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        animation_speed: 0.5
        sections:
          header:
            animated_icons: false
      `,
      weather: { state: 'sunny' },
    })

    await expect(clockWeatherCard.locator(HEADER_ICON))
      .not.toHaveAttribute('src', /^blob:/)
  })

  test('updates animation_speed at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ weather: { state: 'sunny' } })
    await expect(clockWeatherCard.locator(HEADER_ICON))
      .not.toHaveAttribute('src', /^blob:/)

    await setupCard({ cardConfig: 'animation_speed: 0.5', weather: { state: 'sunny' } })

    await expect(clockWeatherCard.locator(HEADER_ICON))
      .toHaveAttribute('src', /^blob:/)
  })

  test('rejects a value that is not a positive number', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'animation_speed: 0' })

    await cardErrorMessage()
      .toContain('Config option "animation_speed" has invalid value "0", expected a positive number')
  })
})

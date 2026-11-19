import type { Locator } from '@playwright/test'

import { expect, test } from '../utils/fixtures'

const paintedPixels = (canvas: Locator): Promise<number> => canvas.evaluate((el: HTMLCanvasElement) => {
  const { data } = el.getContext('2d')!.getImageData(0, 0, el.width, el.height)
  let count = 0
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++
  return count
})

test.describe('weather_animation', () => {
  test('is off by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ weather: { state: 'rainy' } })

    await expect(clockWeatherCard.locator('clock-weather-card-header'))
      .toBeVisible()
    await expect(clockWeatherCard.locator('clock-weather-card-weather-animation'))
      .toHaveCount(0)
  })

  test('lets rain fall behind the content while it rains', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: 'weather_animation: true', weather: { state: 'rainy' } })

    const animation = clockWeatherCard.locator('clock-weather-card-weather-animation')
    const canvas = animation.locator('canvas')
    await expect.poll(() => paintedPixels(canvas))
      .toBeGreaterThan(0)
    const first = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())
    await expect.poll(() => canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL()))
      .not.toBe(first)

    await expect(animation)
      .toHaveAttribute('aria-hidden', 'true')
    await expect(animation)
      .toHaveCSS('pointer-events', 'none')
    await expect(clockWeatherCard.locator('.card-content'))
      .toHaveCSS('position', 'relative')
    // The canvas fills the card inside its 1px border.
    const [cardBox, canvasBox] = await Promise.all([clockWeatherCard.locator('ha-card')
      .boundingBox(), canvas.boundingBox()])
    expect(canvasBox!.width)
      .toBeCloseTo(cardBox!.width - 2, 0)
    expect(canvasBox!.height)
      .toBeCloseTo(cardBox!.height - 2, 0)
  })

  for (const state of ['sunny', 'partlycloudy', 'cloudy', 'fog', 'hail', 'lightning', 'lightning-rainy', 'pouring', 'rainy', 'snowy', 'snowy-rainy', 'windy', 'windy-variant', 'windy-exceptional']) {
    test(`animates ${state}`, async ({ setupCard, clockWeatherCard }) => {
      await setupCard({ cardConfig: 'weather_animation: true', weather: { state } })

      await expect.poll(() => paintedPixels(clockWeatherCard.locator('clock-weather-card-weather-animation canvas')))
        .toBeGreaterThan(0)
    })
  }

  test('shows stars instead of the sun at night', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: 'weather_animation: true', weather: { state: 'sunny' } })
    const canvas = clockWeatherCard.locator('clock-weather-card-weather-animation canvas')
    // The sun's glow covers most of the card; stars are a few dots.
    await expect.poll(() => paintedPixels(canvas))
      .toBeGreaterThan(10_000)

    await setupCard({ cardConfig: 'weather_animation: true', weather: { state: 'sunny' }, sun: { state: 'below_horizon' } })

    await expect.poll(() => paintedPixels(canvas))
      .toBeLessThan(2_000)
    await expect.poll(() => paintedPixels(canvas))
      .toBeGreaterThan(0)
  })

  // Alpha of the canvas at a point given in fractions of the header icon (its 128-unit grid) or, without one, of the card.
  const alphaAt = (canvas: Locator, iconX: number, iconY: number): Promise<number> => canvas.evaluate((el: HTMLCanvasElement, [x, y]) => {
    const box = el.getBoundingClientRect()
    const icon = el.closest('ha-card')!.querySelector('clock-weather-card-header > clock-weather-card-icon img')
      ?.getBoundingClientRect() ?? box
    const ratio = el.width / box.width
    const px = Math.round((icon.left - box.left + x * icon.width) * ratio)
    const py = Math.round((icon.top - box.top + y * icon.height) * ratio)
    return el.getContext('2d')!.getImageData(px, py, 1, 1).data[3]
  }, [iconX, iconY])

  for (const [state, sunX, sunY] of [['sunny', 64, 64], ['partlycloudy', 39, 51]] as const) {
    test(`lets the rays come out of the sun of the ${state} icon`, async ({ setupCard, clockWeatherCard }) => {
      await setupCard({ cardConfig: 'weather_animation: true', weather: { state } })
      const canvas = clockWeatherCard.locator('clock-weather-card-weather-animation canvas')

      await expect.poll(() => alphaAt(canvas, sunX / 128, sunY / 128))
        .toBeGreaterThan(60)
      // A third of the icon's width to the other side of the sun is beyond the glow.
      expect(await alphaAt(canvas, sunX / 128, sunY / 128))
        .toBeGreaterThan(await alphaAt(canvas, sunX / 128 + 1.3, sunY / 128) + 40)
    })
  }

  test('lets the sun peek in from the top right corner without a header', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: `
      weather_animation: true
      sections:
        header:
          hide: true
    `, weather: { state: 'sunny' } })
    const canvas = clockWeatherCard.locator('clock-weather-card-weather-animation canvas')

    await expect.poll(() => alphaAt(canvas, 0.99, 0.01))
      .toBeGreaterThan(60)
    // The rays fade out towards the farthest corner.
    expect(await alphaAt(canvas, 0.01, 0.99))
      .toBeLessThan(5)
  })

  test('lets the rays reach the bottom of a card with a forecast list', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: 'weather_animation: true', weather: { state: 'sunny' } })
    const canvas = clockWeatherCard.locator('clock-weather-card-weather-animation canvas')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list'))
      .toBeVisible()

    // Some ray crosses the bottom row of the card.
    await expect.poll(() => canvas.evaluate((el: HTMLCanvasElement) => {
      const { data } = el.getContext('2d')!.getImageData(0, el.height - 4, el.width, 1)
      let max = 0
      for (let i = 3; i < data.length; i += 4) max = Math.max(max, data[i])
      return max
    }))
      .toBeGreaterThan(0)
  })

  test('stops for a state without an animation', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: 'weather_animation: true', weather: { state: 'rainy' } })
    await expect(clockWeatherCard.locator('clock-weather-card-weather-animation'))
      .toHaveCount(1)

    await setupCard({ cardConfig: 'weather_animation: true', weather: { state: 'exceptional' } })

    await expect(clockWeatherCard.locator('clock-weather-card-header'))
      .toBeVisible()
    await expect(clockWeatherCard.locator('clock-weather-card-weather-animation'))
      .toHaveCount(0)
  })

  test('turns on at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ weather: { state: 'rainy' } })
    await expect(clockWeatherCard.locator('clock-weather-card-header'))
      .toBeVisible()
    await expect(clockWeatherCard.locator('clock-weather-card-weather-animation'))
      .toHaveCount(0)

    await setupCard({ cardConfig: 'weather_animation: true', weather: { state: 'rainy' } })

    await expect.poll(() => paintedPixels(clockWeatherCard.locator('clock-weather-card-weather-animation canvas')))
      .toBeGreaterThan(0)
  })

  test('rejects a non-boolean value', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'weather_animation: yess' })

    await cardErrorMessage()
      .toContain('Config option "weather_animation" has invalid value "yess", expected true or false')
  })

  test.describe('with reduced motion', () => {
    test.use({ freshPage: true })

    test('hides the animation', async ({ page, setupCard, clockWeatherCard }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await setupCard({ cardConfig: 'weather_animation: true', weather: { state: 'rainy' } })

      await expect(clockWeatherCard.locator('clock-weather-card-weather-animation'))
        .toBeHidden()
    })
  })
})

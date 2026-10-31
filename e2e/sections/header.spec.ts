import { expect, test } from '../utils/fixtures'

test.describe('header section', () => {
  test('advances the time every minute', async ({ page, setupCard, clockWeatherCard }) => {
    await setupCard({ date: new Date('2025-09-14T14:20:00Z') })
    const time = clockWeatherCard.locator('clock-weather-card-time-segment')
    await expect(time)
      .toHaveText('16:20')

    await page.clock.setFixedTime(new Date('2025-09-14T14:21:00Z'))
    await page.clock.runFor('01:00')

    await expect(time)
      .toHaveText('16:21')
  })

  test('shows the not-available icon for an unknown weather state', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ weather: { state: 'unknown' } })

    await expect(clockWeatherCard.locator('clock-weather-card-header clock-weather-card-icon img'))
      .toHaveAttribute('src', /not-available/)
  })

  test('gives the details the space the weather icon does not use', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({})
    await clockWeatherCard.evaluate(el => { (el as HTMLElement).style.cssText = 'display: block; width: 400px' })
    try {
      const time = clockWeatherCard.locator('clock-weather-card-time-segment')
      await expect(time)
        .toHaveText('10:20')
      await expect.poll(() => time.evaluate(el => el.scrollWidth <= el.clientWidth))
        .toBe(true)
    } finally {
      await clockWeatherCard.evaluate(el => { (el as HTMLElement).style.cssText = '' })
    }
  })

  test('spreads spare width evenly around the icon and the text', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({})
    await clockWeatherCard.evaluate(el => { (el as HTMLElement).style.cssText = 'display: block; width: 900px' })
    try {
      const box = async (selector: string): Promise<{ x: number, width: number }> => (await clockWeatherCard.locator(selector)
        .boundingBox())!
      await expect.poll(async () => {
        const header = await box('clock-weather-card-header')
        const icon = await box('clock-weather-card-header > clock-weather-card-icon')
        const details = await box('clock-weather-card-header-details')
        const left = icon.x - header.x
        const middle = details.x - (icon.x + icon.width) - 8
        const right = header.x + header.width - (details.x + details.width)
        return Math.max(Math.abs(left - middle), Math.abs(left - right))
      })
        .toBeLessThan(2)
    } finally {
      await clockWeatherCard.evaluate(el => { (el as HTMLElement).style.cssText = '' })
    }
  })

  test('shrinks the default clock on a narrow card instead of truncating it', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({})
    await clockWeatherCard.evaluate(el => { (el as HTMLElement).style.cssText = 'display: block; width: 220px' })
    try {
      const time = clockWeatherCard.locator('clock-weather-card-time-segment')
      const rem = await clockWeatherCard.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))
      await expect.poll(() => time.evaluate(el => parseFloat(getComputedStyle(el).fontSize)))
        .toBeLessThan(4 * rem)
      await expect.poll(() => time.evaluate(el => el.scrollWidth <= el.clientWidth))
        .toBe(true)
    } finally {
      await clockWeatherCard.evaluate(el => { (el as HTMLElement).style.cssText = '' })
    }
  })

  test('truncates the condition rather than the temperature when the row is too narrow', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ weather: { state: 'partlycloudy' } })
    await clockWeatherCard.evaluate(el => { (el as HTMLElement).style.cssText = 'display: block; width: 220px' })
    try {
      const fits = (selector: string): Promise<boolean> => clockWeatherCard.locator(selector)
        .evaluate(el => el.scrollWidth <= el.clientWidth)
      await expect.poll(() => fits('clock-weather-card-weather-segment[attribute="temperature"]'))
        .toBe(true)
      await expect.poll(() => fits('clock-weather-card-weather-segment:not([attribute])'))
        .toBe(false)
    } finally {
      await clockWeatherCard.evaluate(el => { (el as HTMLElement).style.cssText = '' })
    }
  })

  test('advances the time every second when a time segment shows seconds', async ({ page, setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          header:
            rows:
              - segments:
                  - type: time
                    time_pattern: HH:mm:ss
      `,
      date: new Date('2025-09-14T14:20:30Z'),
    })
    const time = clockWeatherCard.locator('clock-weather-card-time-segment')
    await expect(time)
      .toHaveText('16:20:30')

    await page.clock.setFixedTime(new Date('2025-09-14T14:20:31Z'))
    await page.clock.runFor(1000)

    await expect(time)
      .toHaveText('16:20:31')
  })

  test('sizes the details to the widest row so narrower rows stay within it', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          header:
            rows:
              - segments:
                  - type: icon
                    icon: mdi:thermometer
                  - type: weather
                    attribute: temperature
                  - type: spacer
              - font_size: 4rem
                alignment: center
                segments:
                  - type: time
              - segments:
                  - type: spacer
                  - type: weather
                  - type: weather_icon
      `,
    })
    const details = await clockWeatherCard.locator('clock-weather-card-header-details')
      .boundingBox()
    const time = await clockWeatherCard.locator('clock-weather-card-time-segment')
      .boundingBox()
    const temperatureIcon = await clockWeatherCard.locator('clock-weather-card-header-details-row > clock-weather-card-icon-segment')
      .boundingBox()
    const weatherIcon = await clockWeatherCard.locator('clock-weather-card-weather-icon-segment')
      .boundingBox()

    expect(details!.x)
      .toBeCloseTo(time!.x, 0)
    expect(details!.width)
      .toBeCloseTo(time!.width, 0)
    expect(temperatureIcon!.x)
      .toBeGreaterThanOrEqual(time!.x - 0.5)
    expect(weatherIcon!.x + weatherIcon!.width)
      .toBeLessThanOrEqual(time!.x + time!.width + 0.5)
  })

  test('spaces icons tighter and spacer-separated groups wider than adjacent text', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          header:
            rows:
              - segments:
                  - type: icon
                    icon: mdi:thermometer
                  - type: weather
                    attribute: temperature
                  - type: weather
                    attribute: humidity
                  - type: spacer
                  - type: weather
                  - type: weather_icon
      `,
    })
    const segments = clockWeatherCard.locator('clock-weather-card-header-details-row > *')
    const boxes = await segments.evaluateAll(els => els.map((el) => {
      const { left, right } = el.getBoundingClientRect()
      return { left, right }
    }))
    const gap = (from: number, to: number): number => boxes[to].left - boxes[from].right

    expect(gap(0, 1))
      .toBeCloseTo(4, 0)
    expect(gap(1, 2))
      .toBeCloseTo(8, 0)
    expect(gap(2, 4))
      .toBeCloseTo(16, 0)
    expect(gap(4, 5))
      .toBeCloseTo(4, 0)
  })
})

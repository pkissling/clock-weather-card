import { expect, test } from '../utils/fixtures'

test.describe('header section', () => {
  test('advances the time every minute', async ({ page, setupCard, clockWeatherCard }) => {
    await setupCard({ date: new Date('2025-09-14T14:20:00Z') })
    const time = clockWeatherCard.locator('clock-weather-card-time-segment')
    await expect(time)
      .toHaveText('4:20 PM')

    await page.clock.setFixedTime(new Date('2025-09-14T14:21:00Z'))
    await page.clock.runFor('01:00')

    await expect(time)
      .toHaveText('4:21 PM')
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
                segments:
                  - type: spacer
                  - type: time
                  - type: spacer
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

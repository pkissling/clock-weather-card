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
})

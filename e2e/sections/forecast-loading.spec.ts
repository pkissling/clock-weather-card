import { expect, test } from '../utils/fixtures'

test.describe('forecast loading', () => {
  test.use({ freshPage: true })

  test('shows a skeleton in each forecast section until its forecast arrives', async ({ setupCard, clockWeatherCard }) => {
    let release!: () => void
    const setup = setupCard({ delayForecast: new Promise<void>(resolve => { release = resolve }) })

    const strip = clockWeatherCard.locator('clock-weather-card-forecast-strip')
    const list = clockWeatherCard.locator('clock-weather-card-forecast-list')
    await expect(strip.locator('.skeleton-item'))
      .toHaveCount(24)
    await expect(list.locator('.skeleton--bar'))
      .toHaveCount(5)
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item, clock-weather-card-forecast-list-item'))
      .toHaveCount(0)

    release()
    await setup

    await expect(clockWeatherCard.locator('.skeleton'))
      .toHaveCount(0)
    await expect(strip.locator('clock-weather-card-forecast-strip-item')
      .first())
      .toBeVisible()
    await expect(list.locator('clock-weather-card-forecast-list-item')
      .first())
      .toBeVisible()
  })
})

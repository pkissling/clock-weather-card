import { expect, test } from '../utils/fixtures'

test.use({ freshPage: true })

test('forecast skeletons while loading', async ({ setupCard, clockWeatherCard }) => {
  let release!: () => void
  const setup = setupCard({ delayForecast: new Promise<void>(resolve => { release = resolve }) })
  await expect(clockWeatherCard.locator('.skeleton--bar'))
    .toHaveCount(5)
  await expect(clockWeatherCard)
    .toHaveScreenshot()
  release()
  await setup
})

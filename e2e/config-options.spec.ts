import { expect, test } from './utils/fixtures'

test('with title', async ({ clockWeatherCard, setupCard }) => {
  await setupCard({
    cardConfig: 'title: My Weather',
  })

  await expect(clockWeatherCard.locator('h1.card-header'))
    .toHaveText('My Weather')
})

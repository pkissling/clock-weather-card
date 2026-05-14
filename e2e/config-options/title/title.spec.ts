import { expect, test } from '../../utils/fixtures'
import { updateCard } from '../../utils/test-utils'

test.describe('title', () => {
  test('renders the configured title in the card header', async ({ clockWeatherCard, setupCard }) => {
    await setupCard({
      cardConfig: 'title: My Weather',
    })

    await expect(clockWeatherCard.locator('h1.card-header'))
      .toHaveText('My Weather')
  })

  test('does not render the card header when title is an empty string', async ({ clockWeatherCard, setupCard }) => {
    await setupCard({
      cardConfig: 'title: \'\'',
    })

    await expect(clockWeatherCard.locator('h1.card-header'))
      .toHaveCount(0)
  })

  test('does not render the card header when title is omitted', async ({ clockWeatherCard, setupCard }) => {
    await setupCard()

    await expect(clockWeatherCard.locator('h1.card-header'))
      .toHaveCount(0)
  })

  test('updates the title at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: 'title: Initial' })
    await expect(clockWeatherCard.locator('h1.card-header'))
      .toHaveText('Initial')

    await updateCard('title: Updated')

    await expect(clockWeatherCard.locator('h1.card-header'))
      .toHaveText('Updated')
  })
})

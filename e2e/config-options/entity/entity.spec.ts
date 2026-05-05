import { expect, test } from '../../utils/fixtures'
import { cardErrorMessage, updateCard } from '../../utils/test-utils'

test.describe('entity', () => {
  test('reads the configured weather entity to render its state', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
      `,
      weather: { state: 'rainy' },
    })

    await expect(clockWeatherCard)
      .toContainText('Rainy')
  })

  // TODO i think in this case we should also render an error message to avoid confiusion
  test('renders the card without crashing when the configured entity does not exist', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.does_not_exist
      `,
      weather: { state: 'sunny' },
    })

    await expect(clockWeatherCard)
      .toBeVisible()
    await expect(clockWeatherCard)
      .toContainText(/\d{1,2}:\d{2}/)
    // Weather state from the seeded mock_weather entity is not picked up.
    await expect(clockWeatherCard)
      .not.toContainText('Sunny')
  })

  test('throws a configuration error when the entity is empty', async ({ setupCard, clockWeatherCard, page }) => {
    await setupCard({
      cardConfig: `
        entity: ''
      `,
    })

    expect(await cardErrorMessage(page))
      .toContain('entity is required')
    await expect(clockWeatherCard)
      .toHaveCount(0)
  })

  test('throws a configuration error when the entity is omitted', async ({ setupCard, clockWeatherCard, page }) => {
    await setupCard({
      cardConfig: null,
    })

    expect(await cardErrorMessage(page))
      .toContain('entity is required')
    await expect(clockWeatherCard)
      .toHaveCount(0)
  })

  test('updates the entity at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        rows:
          - segments:
              - type: weather
      `,
      weather: { state: 'sunny' },
    })
    await expect(clockWeatherCard)
      .toContainText('Sunny')

    // Switch the configured entity to one that doesn't exist; the weather text should disappear.
    await updateCard(`
      entity: weather.does_not_exist
      animated_icon: false
      rows:
        - segments:
            - type: weather
    `)

    await expect(clockWeatherCard)
      .not.toContainText('Sunny')
  })
})

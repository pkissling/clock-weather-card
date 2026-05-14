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

  test('renders an error card when the configured entity does not exist', async ({ setupCard, clockWeatherCard, page }) => {
    await setupCard({
      cardConfig: `
        entity: weather.does_not_exist
      `,
      weather: { state: 'sunny' },
    })

    expect(await cardErrorMessage(page))
      .toContain('Referenced entity weather.does_not_exist does not exist')
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
      .toContain('Config option "entity" is required')
    await expect(clockWeatherCard)
      .toHaveCount(0)
  })

  test('throws a configuration error when the entity is omitted', async ({ setupCard, clockWeatherCard, page }) => {
    await setupCard({
      cardConfig: null,
    })

    expect(await cardErrorMessage(page))
      .toContain('Config option "entity" is required')
    await expect(clockWeatherCard)
      .toHaveCount(0)
  })

  test('swaps to the error card when the configured entity is replaced with a non-existing one (no reload)', async ({ setupCard, clockWeatherCard, page }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
      `,
      weather: { state: 'sunny' },
    })
    await expect(clockWeatherCard)
      .toContainText('Sunny')

    await updateCard(`
      entity: weather.does_not_exist
    `)

    await expect.poll(() => cardErrorMessage(page))
      .toContain('Referenced entity weather.does_not_exist does not exist')
  })

  test('recovers from the error card when the configured entity is replaced with an existing one (no reload)', async ({ setupCard, clockWeatherCard, page }) => {
    await setupCard({
      cardConfig: `
        entity: weather.does_not_exist
      `,
      weather: { state: 'sunny' },
    })
    expect(await cardErrorMessage(page))
      .toContain('Referenced entity weather.does_not_exist does not exist')

    await updateCard(`
      entity: weather.mock_weather
    `)

    await expect(clockWeatherCard)
      .toContainText('Sunny')
  })
})

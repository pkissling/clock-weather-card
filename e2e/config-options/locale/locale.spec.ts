import { expect, test } from '../../utils/fixtures'
import { updateCard } from '../../utils/test-utils'

test.describe('locale', () => {

  test('controls default date format (en-GB renders UK day-first format)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        locale: en-GB
        time_zone: UTC
      `,
      date: new Date('2026-04-27T12:00:00Z'),
    })

    await expect(clockWeatherCard)
      .toContainText('27 April 2026')
  })

  test('controls default date format (en-US renders month-first format)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        locale: en-US
        time_zone: UTC
      `,
      date: new Date('2026-04-27T12:00:00Z'),
    })

    await expect(clockWeatherCard)
      .toContainText('April 27, 2026')
  })

  test('controls translated weather text', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        locale: es
        rows:
          - segments:
              - type: weather
      `,
      weather: { state: 'sunny' },
    })

    await expect(clockWeatherCard)
      .toContainText('Soleado')
  })

  test('uppercase language tag is normalized to the matching translation file', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        locale: DE
        rows:
          - segments:
              - type: weather
      `,
      weather: { state: 'sunny' },
    })

    await expect(clockWeatherCard)
      .toContainText('Sonnig')
  })

  test('falls back to HA language when locale is not configured', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      language: 'es',
      cardConfig: `
        rows:
          - segments:
              - type: weather
      `,
      weather: { state: 'sunny' },
    })

    await expect(clockWeatherCard)
      .toContainText('Soleado')
  })

  test('config locale overrides HA language', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      language: 'es',
      cardConfig: `
        locale: en
        rows:
          - segments:
              - type: weather
      `,
      weather: { state: 'sunny' },
    })

    await expect(clockWeatherCard)
      .toContainText('Sunny')
  })

  test('well-formed but unsupported locale renders English fallback (no crash)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        locale: xx-XX
        rows:
          - segments:
              - type: weather
      `,
      weather: { state: 'sunny' },
    })

    await expect(clockWeatherCard)
      .toContainText('Sunny')
  })

  test('malformed locale falls back to HA language', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      language: 'es',
      cardConfig: `
        locale: D
        rows:
          - segments:
              - type: weather
      `,
      weather: { state: 'sunny' },
    })

    await expect(clockWeatherCard)
      .toContainText('Soleado')
  })

  test('updates the locale at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        locale: en
        rows:
          - segments:
              - type: weather
      `,
      weather: { state: 'sunny' },
    })
    await expect(clockWeatherCard)
      .toContainText('Sunny')

    await updateCard(`
      locale: es
      rows:
        - segments:
            - type: weather
    `)

    await expect(clockWeatherCard)
      .toContainText('Soleado')
  })
})

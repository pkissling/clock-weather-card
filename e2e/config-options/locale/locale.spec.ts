import { expect, test } from '../../utils/fixtures'

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
        sections:
          header:
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
        sections:
          header:
            rows:
              - segments:
                  - type: weather
      `,
      weather: { state: 'sunny' },
    })

    await expect(clockWeatherCard)
      .toContainText('Sonnig')
  })

  test('renders Japanese translations', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        locale: ja
        sections:
          header:
            rows:
              - segments:
                  - type: weather
      `,
      weather: { state: 'sunny' },
    })

    await expect(clockWeatherCard)
      .toContainText('晴れ')
  })

  test('falls back to HA language when locale is not configured', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      language: 'es',
      cardConfig: `
        sections:
          header:
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
        sections:
          header:
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
        sections:
          header:
            rows:
              - segments:
                  - type: weather
      `,
      weather: { state: 'sunny' },
    })

    await expect(clockWeatherCard)
      .toContainText('Sunny')
  })

  test('renders an error card when configured locale is malformed', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      language: 'es',
      cardConfig: `
        locale: D
        sections:
          header:
            rows:
              - segments:
                  - type: weather
      `,
      weather: { state: 'sunny' },
    })

    await cardErrorMessage()
      .toContain('Config option "locale" has invalid value "D", expected a BCP 47 language tag such as "en-US"')
  })

  test('updates the locale at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        locale: en
        sections:
          header:
            rows:
              - segments:
                  - type: weather
      `,
      weather: { state: 'sunny' },
    })
    await expect(clockWeatherCard)
      .toContainText('Sunny')

    await setupCard({
      cardConfig: `
        locale: es
        sections:
          header:
            rows:
              - segments:
                  - type: weather
      `,
    })

    await expect(clockWeatherCard)
      .toContainText('Soleado')
  })
})

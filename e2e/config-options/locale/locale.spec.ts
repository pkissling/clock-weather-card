import { readdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { expect, test } from '../../utils/fixtures'

const LOCALES = readdirSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../src/locales'))
  .map(file => file.replace('.json', ''))
const FORECAST_LABELS = 'clock-weather-card-forecast-list-item .label, clock-weather-card-forecast-strip-item .time'

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

  test('forecast labels fit their column in every bundled language', async ({ setupCard, clockWeatherCard }) => {
    for (const locale of LOCALES) {
      await setupCard({ cardConfig: `locale: ${locale}` })
      const truncated = await clockWeatherCard.locator(FORECAST_LABELS)
        .evaluateAll(els => els.filter(el => el.scrollWidth > el.clientWidth)
          .map(el => el.textContent))
      expect(truncated, locale)
        .toEqual([])
    }
  })

  test('truncates an overlong forecast label with an ellipsis and keeps the full text in its title', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: 'locale: fr' })
    const label = clockWeatherCard.locator('clock-weather-card-forecast-list-item .label')
      .first()
    await expect(label)
      .toHaveAttribute('title', 'Auj.')

    const overflow = await label.evaluate((el) => {
      el.textContent = 'Aujourd\'hui et demain'
      return { overflows: el.scrollWidth > el.clientWidth, textOverflow: getComputedStyle(el).textOverflow }
    })
    expect(overflow)
      .toEqual({ overflows: true, textOverflow: 'ellipsis' })
  })

  test('follows the language when the Home Assistant profile time format is "language"', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ language: 'en', timeFormat: 'language' })

    await expect(clockWeatherCard.locator('clock-weather-card-time-segment'))
      .toHaveText('4:20 PM')
  })

  test('follows the 24-hour time format of the Home Assistant profile', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ language: 'en', timeFormat: '24' })

    await expect(clockWeatherCard.locator('clock-weather-card-time-segment'))
      .toHaveText('16:20')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .time')
      .nth(1))
      .toHaveText('17:00')
  })

  test('follows the 12-hour time format of the Home Assistant profile over a 24-hour locale', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ timeFormat: '12' })

    await expect(clockWeatherCard.locator('clock-weather-card-time-segment'))
      .toHaveText('4:20 pm')
  })

  test('an explicit time_pattern wins over the time format of the Home Assistant profile', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      timeFormat: '24',
      cardConfig: `
        sections:
          header:
            rows:
              - segments:
                  - type: time
                    time_pattern: h:mm a
      `,
    })

    await expect(clockWeatherCard.locator('clock-weather-card-time-segment'))
      .toHaveText('4:20 pm')
  })

  test('keeps the translations when the Home Assistant profile sets a time format', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ language: 'zh-Hant', timeFormat: '24', weather: { state: 'sunny' } })

    await expect(clockWeatherCard)
      .toContainText('晴天')
  })

  for (const [language, sunny] of [['sr-Latn', 'Sunčano'], ['zh-Hans', '晴'], ['zh-Hant', '晴天']]) {
    test(`uses the ${language} translation for Home Assistant's ${language} language`, async ({ setupCard, clockWeatherCard }) => {
      await setupCard({ language, weather: { state: 'sunny' } })

      await expect(clockWeatherCard)
        .toContainText(sunny)
    })
  }
})

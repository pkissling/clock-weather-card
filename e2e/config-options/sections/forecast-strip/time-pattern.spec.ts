import { expect, test } from '../../../utils/fixtures'
import type { MockOptions } from '../../../utils/test-utils'
import { hourlyForecast } from '../../../utils/test-utils'

const NOW = new Date('2025-09-14T16:30:00+00:00')

const patternConfig = (pattern: string | null, locale = 'en-GB'): string => `
  entity: weather.mock_weather
  locale: ${locale}
${pattern === null ? '' : `  sections:\n    forecast_strip:\n      time_pattern: "${pattern}"`}
`

const setup = (cardConfig: string): MockOptions => ({
  date: NOW,
  timeZone: 'UTC',
  cardConfig,
  sun: { attributes: { next_setting: '2025-09-14T18:42:00+00:00', next_rising: '2025-09-15T05:13:00+00:00' } },
  weather: { forecast_hourly: hourlyForecast(NOW, ['sunny', 'sunny', 'sunny', 'sunny'], () => ({ temperature: 20, precipitation_probability: 0 })) },
})

test.describe('sections.forecast_strip.time_pattern', () => {
  test('shows the localized short time by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard(setup(patternConfig(null)))

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .time'))
      .toHaveText(['Now', '17:00', '18:00', '18:42', '19:00'])
  })

  test('follows the locale by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard(setup(patternConfig(null, 'en-US')))

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .time'))
      .toHaveText(['Now', '5:00 PM', '6:00 PM', '6:42 PM', '7:00 PM'])
  })

  test('formats hours and sun events with the configured pattern', async ({ setupCard, clockWeatherCard }) => {
    await setupCard(setup(patternConfig('H')))

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .time'))
      .toHaveText(['Now', '17', '18', '18', '19'])
  })

  test('swaps the pattern at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    const second = clockWeatherCard.locator('clock-weather-card-forecast-strip-item .time')
      .nth(1)
    await setupCard(setup(patternConfig('H')))
    await expect(second)
      .toHaveText('17')

    await setupCard(setup(patternConfig('HH:mm')))

    await expect(second)
      .toHaveText('17:00')
  })

  test('rejects an empty pattern', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'sections:\n  forecast_strip:\n    time_pattern: ""' })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_strip.time_pattern" has invalid value ""')
  })
})

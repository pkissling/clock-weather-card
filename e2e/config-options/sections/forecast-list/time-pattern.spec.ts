import { expect, test } from '../../../utils/fixtures'
import type { MockOptions } from '../../../utils/test-utils'
import { hourlyForecast } from '../../../utils/test-utils'

const NOW = new Date('2025-09-14T16:30:00+00:00')

const setup = (listConfig: string, locale = 'en-GB'): MockOptions => ({
  date: NOW,
  timeZone: 'UTC',
  cardConfig: `
    locale: ${locale}
    sections:
      forecast_list:
        forecast_type: hourly
        ${listConfig}
  `,
  weather: { forecast_hourly: hourlyForecast(NOW, ['sunny', 'sunny', 'sunny'], () => ({ temperature: 20, precipitation_probability: 0 })) },
})

test.describe('sections.forecast_list.time_pattern', () => {
  test('shows the localized short time by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard(setup('count: 3'))

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item .label'))
      .toHaveText(['Now', '17:00', '18:00'])
  })

  test('follows the locale by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard(setup('count: 3', 'en-US'))

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item .label'))
      .toHaveText(['Now', '5:00 PM', '6:00 PM'])
  })

  test('formats hours with the configured pattern', async ({ setupCard, clockWeatherCard }) => {
    await setupCard(setup('count: 3\n        time_pattern: "H"'))

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item .label'))
      .toHaveText(['Now', '17', '18'])
  })

  test('swaps the pattern at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    const second = clockWeatherCard.locator('clock-weather-card-forecast-list-item .label')
      .nth(1)
    await setupCard(setup('time_pattern: "H"'))
    await expect(second)
      .toHaveText('17')

    await setupCard(setup('time_pattern: "HH:mm"'))

    await expect(second)
      .toHaveText('17:00')
  })

  test('rejects an empty pattern', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'sections:\n  forecast_list:\n    time_pattern: ""' })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_list.time_pattern" has invalid value ""')
  })
})

import { expect, test } from '../../utils/fixtures'

test.describe('time_zone', () => {

  test('displays time in configured time_zone', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: 'time_zone: America/New_York',
      date: new Date('2025-06-15T12:00:00Z'),
    })

    // UTC 12:00 → New York 08:00 EDT → en TIME_SIMPLE "8:00 AM"
    await expect(clockWeatherCard)
      .toContainText('8:00 AM')
  })

  test('falls back to HA time zone when time_zone is not configured', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      timeZone: 'Asia/Tokyo',
      date: new Date('2025-06-15T12:00:00Z'),
    })

    // No card time_zone → uses HA's Tokyo. UTC 12:00 → Tokyo 21:00 → "9:00 PM"
    await expect(clockWeatherCard)
      .toContainText('9:00 PM')
  })

  test('falls back to HA time zone when configured time_zone is empty', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      timeZone: 'Europe/Berlin',
      cardConfig: 'time_zone: \'\'',
      date: new Date('2025-06-15T12:00:00Z'),
    })

    // Empty → uses HA's Europe/Berlin (CEST, UTC+2). UTC 12:00 → 14:00 → "2:00 PM"
    await expect(clockWeatherCard)
      .toContainText('2:00 PM')
  })

  test('renders an error card when configured time_zone is invalid', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      timeZone: 'Europe/Berlin',
      cardConfig: 'time_zone: NotARealTimeZone',
      date: new Date('2025-06-15T12:00:00Z'),
    })

    expect(await cardErrorMessage())
      .toContain('Config option "time_zone" has invalid value "NotARealTimeZone"')
  })

  test('date segment respects configured time_zone', async ({ setupCard, clockWeatherCard }) => {
    // 2025-01-15T23:30:00Z = 2025-01-16T12:30:00 NZDT (Auckland +13)
    await setupCard({
      cardConfig: 'time_zone: Pacific/Auckland',
      date: new Date('2025-01-15T23:30:00Z'),
    })

    // In Auckland it's already the 16th. en DATE_FULL: "January 16, 2025"
    await expect(clockWeatherCard)
      .toContainText('January 16, 2025')
  })

  test('updates time_zone at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: 'time_zone: America/New_York',
      date: new Date('2025-06-15T12:00:00Z'),
    })
    // UTC 12:00 → New York 08:00 EDT
    await expect(clockWeatherCard)
      .toContainText('8:00 AM')

    await setupCard({ cardConfig: 'time_zone: Asia/Tokyo' })

    // UTC 12:00 → Tokyo 21:00
    await expect(clockWeatherCard)
      .toContainText('9:00 PM')
  })

})

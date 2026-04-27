import { expect, test } from './utils/fixtures'

test('displays time in configured time_zone', async ({ setupCard, clockWeatherCard }) => {
  await setupCard({
    cardConfig: `
      time_zone: America/New_York
      rows:
        - segments:
            - type: time
              time_pattern: HH:mm z
    `,
    date: new Date('2025-06-15T12:00:00Z'),
  })

  // UTC 12:00 = New York 08:00 (EDT)
  await expect(clockWeatherCard)
    .toContainText('08:00')
})

test('falls back to HA time zone when time_zone is not configured', async ({ setupCard, clockWeatherCard }) => {
  await setupCard({
    cardConfig: `
      rows:
        - segments:
            - type: time
              time_pattern: HH:mm
    `,
    date: new Date('2025-06-15T12:00:00Z'),
  })

  // Should render a valid time (uses HA's configured timezone)
  await expect(clockWeatherCard)
    .toContainText(/\d{2}:\d{2}/)
})

test('displays time with seconds when pattern includes ss', async ({ setupCard, clockWeatherCard }) => {
  await setupCard({
    cardConfig: `
      rows:
        - segments:
            - type: time
              time_pattern: HH:mm:ss
    `,
    date: new Date('2025-06-15T12:00:30Z'),
  })

  await expect(clockWeatherCard)
    .toContainText(/\d{2}:\d{2}:\d{2}/)
})

test('date segment respects configured time_zone', async ({ setupCard, clockWeatherCard }) => {
  // Use a time that's on different dates in UTC vs Pacific/Auckland
  // 2025-01-15T23:30:00Z = 2025-01-16T12:30:00 NZDT (+13)
  await setupCard({
    cardConfig: `
      time_zone: Pacific/Auckland
      rows:
        - segments:
            - type: date
              date_pattern: dd
    `,
    date: new Date('2025-01-15T23:30:00Z'),
  })

  // In Auckland it's already the 16th
  await expect(clockWeatherCard)
    .toContainText('16')
})

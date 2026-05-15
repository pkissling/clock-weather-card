import type { WeatherForecast } from '../../src/types'
import { expect, test } from '../utils/fixtures'

test.describe('hourly_forecast section', () => {
  test('labels the entry immediately before "now" as the "Now" column and sources its data from that forecast', async ({ setupCard, clockWeatherCard }) => {
    // Forecast entry at 19:00 sits just before the mocked clock (19:07). It feeds the "Now" column.
    const forecasts: WeatherForecast[] = [
      { datetime: '2025-09-14T19:00:00+00:00', condition: 'pouring', temperature: 15, precipitation_probability: 90 },
      { datetime: '2025-09-14T20:00:00+00:00', condition: 'cloudy', temperature: 17, precipitation_probability: 30 },
    ]
    await setupCard({
      date: new Date('2025-09-14T19:07:00+00:00'),
      timeZone: 'UTC',
      weather: { state: 'sunny', temperature: 30, forecast_hourly: forecasts },
    })

    const items = clockWeatherCard.locator('clock-weather-card-hourly-forecast-item')
    await expect(items)
      .toHaveCount(2)
    await expect(items.nth(0)
      .locator('.time'))
      .toHaveText('Now')
    // 19:00 forecast temp (15), not the entity's 30°C.
    await expect(items.nth(0)
      .locator('.temperature'))
      .toHaveText('15°C')
    await expect(items.nth(0)
      .locator('.precipitation'))
      .toContainText('90%')
  })

  test('omits the "Now" column when no forecast entry sits before "now"', async ({ setupCard, clockWeatherCard }) => {
    const future: WeatherForecast[] = [
      { datetime: '2025-09-14T20:00:00+00:00', condition: 'sunny', temperature: 18, precipitation_probability: 0 },
      { datetime: '2025-09-14T21:00:00+00:00', condition: 'cloudy', temperature: 17, precipitation_probability: 0 },
    ]
    await setupCard({
      date: new Date('2025-09-14T19:00:00+00:00'),
      timeZone: 'UTC',
      weather: { state: 'rainy', temperature: 22, forecast_hourly: future },
    })

    const items = clockWeatherCard.locator('clock-weather-card-hourly-forecast-item')
    await expect(items)
      .toHaveCount(future.length)
    await expect(items.nth(0)
      .locator('.time'))
      .not.toHaveText('Now')
  })

  test('drops forecast entries older than the one immediately before "now"', async ({ setupCard, clockWeatherCard }) => {
    // Browser clock fixed at 19:07. The 19:00 entry is the most-recent past → "Now". 17:00 and 18:00 are dropped.
    const forecasts: WeatherForecast[] = [
      { datetime: '2025-09-14T17:00:00+00:00', condition: 'sunny', temperature: 24, precipitation_probability: 0 },
      { datetime: '2025-09-14T18:00:00+00:00', condition: 'sunny', temperature: 23, precipitation_probability: 0 },
      { datetime: '2025-09-14T19:00:00+00:00', condition: 'sunny', temperature: 22, precipitation_probability: 0 },
      { datetime: '2025-09-14T20:00:00+00:00', condition: 'sunny', temperature: 21, precipitation_probability: 0 },
      { datetime: '2025-09-14T21:00:00+00:00', condition: 'cloudy', temperature: 20, precipitation_probability: 10 },
    ]
    await setupCard({
      date: new Date('2025-09-14T19:07:00+00:00'),
      timeZone: 'UTC',
      weather: { temperature: 22, forecast_hourly: forecasts },
    })

    const items = clockWeatherCard.locator('clock-weather-card-hourly-forecast-item')
    // 19:00 (Now) + 20:00 + 21:00 = 3 items.
    await expect(items)
      .toHaveCount(3)
    await expect(items.nth(0)
      .locator('.time'))
      .toHaveText('Now')

    const itemTexts = await items.allTextContents()
    expect(itemTexts.every(t => !/\b17\b/.test(t)))
      .toBe(true)
    expect(itemTexts.every(t => !/\b18\b/.test(t)))
      .toBe(true)
  })

  test('renders a horizontal divider between the today section and the hourly strip', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      weather: {
        forecast_hourly: [
          { datetime: '2099-01-01T00:00:00+00:00', condition: 'sunny', temperature: 20, precipitation_probability: 0 },
        ],
      },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-divider[orientation="horizontal"]'))
      .toHaveCount(1)
  })

  test('treats forecast entries with missing precipitation_probability as no-precipitation (no precipitation row)', async ({ setupCard, clockWeatherCard }) => {
    // Some HA integrations omit precipitation_probability entirely — the field arrives as undefined.
    // The card boundary should coerce undefined → null, and the row stays hidden when every visible
    // entry lacks a probability > 0.
    const forecasts: WeatherForecast[] = [
      { datetime: '2025-09-14T13:00:00+00:00', condition: 'sunny', temperature: 20 },
      { datetime: '2025-09-14T14:00:00+00:00', condition: 'sunny', temperature: 21 },
    ]
    await setupCard({
      date: new Date('2025-09-14T13:30:00+00:00'),
      timeZone: 'UTC',
      weather: { forecast_hourly: forecasts },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(2)
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item .precipitation'))
      .toHaveCount(0)
  })

  test('hides every .precipitation span when no visible item has a precipitation probability > 0', async ({ setupCard, clockWeatherCard }) => {
    const forecasts: WeatherForecast[] = [
      { datetime: '2025-09-14T13:00:00+00:00', condition: 'sunny', temperature: 20, precipitation_probability: 0 },
      { datetime: '2025-09-14T14:00:00+00:00', condition: 'sunny', temperature: 21, precipitation_probability: null },
      { datetime: '2025-09-14T15:00:00+00:00', condition: 'sunny', temperature: 22, precipitation_probability: 0 },
    ]
    await setupCard({
      date: new Date('2025-09-14T13:30:00+00:00'),
      timeZone: 'UTC',
      weather: { forecast_hourly: forecasts },
    })

    const items = clockWeatherCard.locator('clock-weather-card-hourly-forecast-item')
    await expect(items)
      .toHaveCount(3)
    // None of the columns should render a .precipitation span at all.
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item .precipitation'))
      .toHaveCount(0)
  })

  test('renders the .precipitation span on every item when at least one has a precipitation probability > 0', async ({ setupCard, clockWeatherCard }) => {
    const forecasts: WeatherForecast[] = [
      { datetime: '2025-09-14T13:00:00+00:00', condition: 'sunny', temperature: 20, precipitation_probability: 0 },
      { datetime: '2025-09-14T14:00:00+00:00', condition: 'rainy', temperature: 19, precipitation_probability: 70 },
      { datetime: '2025-09-14T15:00:00+00:00', condition: 'sunny', temperature: 20, precipitation_probability: 0 },
    ]
    await setupCard({
      date: new Date('2025-09-14T13:30:00+00:00'),
      timeZone: 'UTC',
      weather: { forecast_hourly: forecasts },
    })

    const items = clockWeatherCard.locator('clock-weather-card-hourly-forecast-item')
    await expect(items)
      .toHaveCount(3)
    // Span exists on every column — empty for the 0% entries, filled for the 70% entry.
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item .precipitation'))
      .toHaveCount(3)
  })

  test('formats hourly time labels in the configured locale (en-US shows "2 PM", not "14")', async ({ setupCard, clockWeatherCard }) => {
    const forecasts: WeatherForecast[] = [
      { datetime: '2025-09-14T13:00:00+00:00', condition: 'sunny', temperature: 20, precipitation_probability: 0 },
      { datetime: '2025-09-14T14:00:00+00:00', condition: 'sunny', temperature: 21, precipitation_probability: 0 },
    ]
    await setupCard({
      date: new Date('2025-09-14T13:30:00+00:00'),
      timeZone: 'UTC',
      cardConfig: `
        entity: weather.mock_weather
        locale: en-US
      `,
      weather: { forecast_hourly: forecasts },
    })

    const items = clockWeatherCard.locator('clock-weather-card-hourly-forecast-item')
    await expect(items)
      .toHaveCount(2)
    await expect(items.nth(0)
      .locator('.time'))
      .toHaveText('Now')
    // The 14:00 future column renders in en-US 12-hour format with a PM suffix.
    await expect(items.nth(1)
      .locator('.time'))
      .toHaveText('2 PM')
  })
})

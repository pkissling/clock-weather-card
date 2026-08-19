import type { DailyWeatherForecast } from '../../src/types'
import { WeatherEntityFeature } from '../../src/types'
import { expect, test } from '../utils/fixtures'

const TODAY = new Date('2025-09-14T14:20:59+00:00')

const DAILY: DailyWeatherForecast[] = [
  { datetime: '2025-09-14T00:00:00+00:00', condition: 'sunny',        templow: 5,  temperature: 14, precipitation_probability: 10 },
  { datetime: '2025-09-15T00:00:00+00:00', condition: 'cloudy',       templow: 4,  temperature: 12, precipitation_probability: 20 },
  { datetime: '2025-09-16T00:00:00+00:00', condition: 'partlycloudy', templow: 5,  temperature: 17, precipitation_probability: 30 },
  { datetime: '2025-09-17T00:00:00+00:00', condition: 'rainy',        templow: 8,  temperature: 19, precipitation_probability: 70 },
  { datetime: '2025-09-18T00:00:00+00:00', condition: 'sunny',        templow: 10, temperature: 19, precipitation_probability: 5 },
]

test.describe('daily_forecast section', () => {
  test('renders one row per forecast day with low/high temperatures', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      weather: { temperature: 9, forecast_daily: DAILY },
    })

    const items = clockWeatherCard.locator('clock-weather-card-daily-forecast-item')
    await expect(items)
      .toHaveCount(DAILY.length)
    await expect(items.nth(0)
      .locator('.temperature-low'))
      .toHaveText('5°C')
    await expect(items.nth(0)
      .locator('.temperature-high'))
      .toHaveText('14°C')
    await expect(items.nth(4)
      .locator('.temperature-low'))
      .toHaveText('10°C')
    await expect(items.nth(4)
      .locator('.temperature-high'))
      .toHaveText('19°C')
  })

  test('labels today\'s row with the localized "Today" string and uses weekday names for the rest', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      weather: { forecast_daily: DAILY },
    })

    const items = clockWeatherCard.locator('clock-weather-card-daily-forecast-item')
    // 2025-09-14 is a Sunday, but the first row is "today" regardless of weekday.
    await expect(items.nth(0)
      .locator('.day-label'))
      .toHaveText('Today')
    // Subsequent rows show weekday abbreviations from the locale.
    await expect(items.nth(1)
      .locator('.day-label'))
      .toHaveText('Mon')
    await expect(items.nth(2)
      .locator('.day-label'))
      .toHaveText('Tue')
  })

  test('renders the current-temperature dot only on today\'s row', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      weather: { temperature: 9, forecast_daily: DAILY },
    })

    const items = clockWeatherCard.locator('clock-weather-card-daily-forecast-item')
    await expect(items.nth(0)
      .locator('.dot'))
      .toHaveCount(1)
    await expect(items.nth(1)
      .locator('.dot'))
      .toHaveCount(0)
    await expect(items.nth(4)
      .locator('.dot'))
      .toHaveCount(0)
  })

  test('positions the current-temperature dot proportionally to the global min/max range', async ({ setupCard, clockWeatherCard }) => {
    // Global range across visible days: low = 4°C, high = 19°C → 15°C span.
    // Current temp 11.5°C is exactly the midpoint → 50%.
    await setupCard({
      date: TODAY,
      weather: { temperature: 11.5, forecast_daily: DAILY },
    })

    const dot = clockWeatherCard.locator('clock-weather-card-daily-forecast-item')
      .first()
      .locator('.dot')
    const leftStyle = await dot.getAttribute('style')
    expect(leftStyle)
      .toMatch(/left:\s*50%/)
  })

  test('clamps the current-temperature dot to 0% when it sits below the global low', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      weather: { temperature: -100, forecast_daily: DAILY },
    })

    const dot = clockWeatherCard.locator('clock-weather-card-daily-forecast-item')
      .first()
      .locator('.dot')
    expect(await dot.getAttribute('style'))
      .toMatch(/left:\s*0%/)
  })

  test('clamps the current-temperature dot to 100% when it sits above the global high', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      weather: { temperature: 100, forecast_daily: DAILY },
    })

    const dot = clockWeatherCard.locator('clock-weather-card-daily-forecast-item')
      .first()
      .locator('.dot')
    expect(await dot.getAttribute('style'))
      .toMatch(/left:\s*100%/)
  })

  test('positions each bar proportionally to the global low/high (visible) range', async ({ setupCard, clockWeatherCard }) => {
    // Set current temp inside today's forecast range so today's bar isn't extended by the dot.
    await setupCard({
      date: TODAY,
      weather: { temperature: 9, forecast_daily: DAILY },
    })

    // Global range: low = 4°C, high = 19°C, span = 15°C. First row: low 5 → (1/15)*100 ≈ 6.67%, high 14 → (10/15)*100 ≈ 66.67%.
    const firstFill = await clockWeatherCard.locator('clock-weather-card-daily-forecast-item')
      .first()
      .locator('.bar-fill')
      .getAttribute('style')
    expect(firstFill)
      .toMatch(/left:\s*6\.6/)
    // right = 100 - 66.67 ≈ 33.33%
    expect(firstFill)
      .toMatch(/right:\s*33\.3/)
  })

  test('extends today\'s bar to include the current temperature when it is outside the forecast range', async ({ setupCard, clockWeatherCard }) => {
    // Today's forecast says 5..14°C but the entity reports 20°C now (e.g. integration's daily
    // high hasn't caught up). The bar should expand to 5..20 so the dot sits ON the bar.
    await setupCard({
      date: TODAY,
      weather: { temperature: 20, forecast_daily: DAILY },
    })

    const items = clockWeatherCard.locator('clock-weather-card-daily-forecast-item')
    await expect(items.first()
      .locator('.temperature-high'))
      .toHaveText('20°C')
    await expect(items.first()
      .locator('.temperature-low'))
      .toHaveText('5°C')
  })

  test('renders a horizontal divider above the daily section', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      weather: { forecast_daily: DAILY },
    })

    // One divider per "section under today" — hourly + daily = 2.
    await expect(clockWeatherCard.locator('clock-weather-card-divider[orientation="horizontal"]'))
      .toHaveCount(2)
  })

  test('renders an inline warning when the resolved entity does not advertise FORECAST_DAILY', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      weather: {
        forecast_daily: DAILY,
        supportedFeatures: [WeatherEntityFeature.FORECAST_HOURLY],
      },
    })

    const section = clockWeatherCard.locator('clock-weather-card-daily-forecast')
    await expect(section)
      .toBeVisible()
    await expect(section)
      .toContainText('Entity "weather.mock_weather" does not support daily forecasts')
    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item'))
      .toHaveCount(0)
    await expect(clockWeatherCard.locator('clock-weather-card-today'))
      .toHaveCount(1)
  })

  test('skips forecast entries dated before today', async ({ setupCard, clockWeatherCard }) => {
    const withPast: DailyWeatherForecast[] = [
      { datetime: '2025-09-13T00:00:00+00:00', condition: 'cloudy', templow: 0, temperature: 5, precipitation_probability: 0 },
      ...DAILY,
    ]
    await setupCard({
      date: TODAY,
      weather: { forecast_daily: withPast },
    })

    // Past entry is filtered out; we still see 5 rows (today + 4 future).
    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item'))
      .toHaveCount(5)
    await expect(clockWeatherCard.locator('clock-weather-card-daily-forecast-item')
      .first()
      .locator('.day-label'))
      .toHaveText('Today')
  })
})

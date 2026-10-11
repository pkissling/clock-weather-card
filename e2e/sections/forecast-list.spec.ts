import type { Locator } from '@playwright/test'

import type { DailyWeatherForecast } from '../../src/types'
import { WeatherEntityFeature } from '../../src/types'
import { expect, test } from '../utils/fixtures'
import api from '../utils/ha-api'

const TODAY = new Date('2025-09-14T14:20:59+00:00')

const DAILY: DailyWeatherForecast[] = [
  { datetime: '2025-09-14T00:00:00+00:00', condition: 'sunny',        templow: 5,  temperature: 14, precipitation_probability: 10 },
  { datetime: '2025-09-15T00:00:00+00:00', condition: 'cloudy',       templow: 4,  temperature: 12, precipitation_probability: 20 },
  { datetime: '2025-09-16T00:00:00+00:00', condition: 'partlycloudy', templow: 5,  temperature: 17, precipitation_probability: 30 },
  { datetime: '2025-09-17T00:00:00+00:00', condition: 'rainy',        templow: 8,  temperature: 19, precipitation_probability: 70 },
  { datetime: '2025-09-18T00:00:00+00:00', condition: 'sunny',        templow: 10, temperature: 19, precipitation_probability: 5 },
]

test.describe('forecast_list section', () => {
  test('renders one row per forecast day with low/high temperatures', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      weather: { temperature: 9, forecast_daily: DAILY },
    })

    const items = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
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

    const items = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
    // 2025-09-14 is a Sunday, but the first row is "today" regardless of weekday.
    await expect(items.nth(0)
      .locator('.label'))
      .toHaveText('Today')
    // Subsequent rows show weekday abbreviations from the locale.
    await expect(items.nth(1)
      .locator('.label'))
      .toHaveText('Mon')
    await expect(items.nth(2)
      .locator('.label'))
      .toHaveText('Tue')
  })

  test('renders the current-temperature dot only on today\'s row', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      weather: { temperature: 9, forecast_daily: DAILY },
    })

    const items = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
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

    const dot = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
      .first()
      .locator('.dot')
    const leftStyle = await dot.getAttribute('style')
    expect(leftStyle)
      .toMatch(/--_dot-left:\s*50%/)
  })

  test('clamps the current-temperature dot to 0% when it sits below the global low', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      weather: { temperature: -100, forecast_daily: DAILY },
    })

    const dot = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
      .first()
      .locator('.dot')
    expect(await dot.getAttribute('style'))
      .toMatch(/--_dot-left:\s*0%/)
  })

  test('clamps the current-temperature dot to 100% when it sits above the global high', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      weather: { temperature: 100, forecast_daily: DAILY },
    })

    const dot = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
      .first()
      .locator('.dot')
    expect(await dot.getAttribute('style'))
      .toMatch(/--_dot-left:\s*100%/)
  })

  for (const { temperature, label } of [{ temperature: -100, label: '.temperature-low' }, { temperature: 100, label: '.temperature-high' }]) {
    test(`keeps the dot clamped to the bar end inside the bar, clear of ${label}`, async ({ setupCard, clockWeatherCard }) => {
      await setupCard({
        date: TODAY,
        weather: { temperature, forecast_daily: DAILY },
      })

      const item = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
        .first()
      const dot = (await item.locator('.dot')
        .boundingBox())!
      const track = (await item.locator('.bar-track')
        .boundingBox())!
      const text = (await item.locator(label)
        .boundingBox())!
      expect(dot.x)
        .toBeGreaterThanOrEqual(track.x - 0.5)
      expect(dot.x + dot.width)
        .toBeLessThanOrEqual(track.x + track.width + 0.5)
      expect(dot.x + dot.width <= text.x || text.x + text.width <= dot.x)
        .toBe(true)
    })
  }

  test('positions each bar proportionally to the global low/high (visible) range', async ({ setupCard, clockWeatherCard }) => {
    // Set current temp inside today's forecast range so today's bar isn't extended by the dot.
    await setupCard({
      date: TODAY,
      weather: { temperature: 9, forecast_daily: DAILY },
    })

    // Global range: low = 4°C, high = 19°C, span = 15°C. First row: low 5 → (1/15)*100 ≈ 6.67%, high 14 → (10/15)*100 ≈ 66.67%.
    const firstFill = await clockWeatherCard.locator('clock-weather-card-forecast-list-item')
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

    const items = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
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

    // One divider per "section under today" - hourly + daily = 2.
    await expect(clockWeatherCard.locator('clock-weather-card-divider[orientation="horizontal"]'))
      .toHaveCount(2)
  })

  test('renders an inline warning when the resolved entity does not advertise FORECAST_DAILY', async ({ cardErrorMessage, setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      weather: {
        forecast_daily: DAILY,
        supportedFeatures: [WeatherEntityFeature.FORECAST_HOURLY],
      },
    })

    const section = clockWeatherCard.locator('clock-weather-card-forecast-list')
    await expect(section)
      .toBeVisible()
    await cardErrorMessage(section)
      .toBe('Entity "weather.mock_weather" does not support daily forecasts')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item'))
      .toHaveCount(0)
    await expect(clockWeatherCard.locator('clock-weather-card-header'))
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
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item'))
      .toHaveCount(5)
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item')
      .first()
      .locator('.label'))
      .toHaveText('Today')
  })

  test('uses the night icon only on today\'s row, driven by the live sun entity state', async ({ setupCard, clockWeatherCard }) => {
    const allSunny: DailyWeatherForecast[] = DAILY.slice(0, 3)
      .map(f => ({ ...f, condition: 'sunny' }))
    await setupCard({
      date: TODAY,
      sun: { state: 'above_horizon' },
      weather: { state: 'sunny', forecast_daily: allSunny },
    })

    // The inlined meteocons SVGs carry their icon name as an element id.
    const rows = clockWeatherCard.locator('clock-weather-card-forecast-list-item clock-weather-card-icon img')
    await expect(rows)
      .toHaveCount(3)
    await expect(rows.nth(0))
      .toHaveAttribute('src', /clear-day/)
    await expect(rows.nth(1))
      .toHaveAttribute('src', /clear-day/)
    await expect(rows.nth(2))
      .toHaveAttribute('src', /clear-day/)

    await api.setEntityState('sun.sun', 'below_horizon', { elevation: -10 })
    await expect(rows.nth(0))
      .toHaveAttribute('src', /clear-night/)
    await expect(rows.nth(1))
      .toHaveAttribute('src', /clear-day/)
    await expect(rows.nth(2))
      .toHaveAttribute('src', /clear-day/)
  })
  test('mirrors the bar and low/high temperatures in an RTL language', async ({ setupCard, clockWeatherCard }) => {
    // Global range 4..19°C; today 5..14°C at 9°C, measured in degrees from the track's right edge.
    await setupCard({
      language: 'he',
      date: TODAY,
      weather: { temperature: 9, forecast_daily: DAILY },
    })

    const item = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
      .first()
    await expect.poll(() => item.evaluate((el) => {
      const rect = (selector: string): DOMRect => el.querySelector(selector)!.getBoundingClientRect()
      const track = rect('.bar-track')
      const fromRight = (x: number): number => Math.round((track.right - x) / track.width * 15)
      const fill = rect('.bar-fill')
      const dot = rect('.dot')
      return {
        lowRightOfHigh: rect('.temperature-low').left > rect('.temperature-high').left,
        fillStart: fromRight(fill.right),
        fillEnd: fromRight(fill.left),
        dot: fromRight(dot.left + dot.width / 2),
      }
    }))
      .toEqual({ lowRightOfHigh: true, fillStart: 1, fillEnd: 10, dot: 5 })
  })
})

// Every text column (label, low, high) must be exactly as wide as its widest cell: no fixed
// width that either wastes space for short text or clips long text.
test.describe('forecast_list column sizing', () => {
  const LIST_ITEM = 'clock-weather-card-forecast-list-item'

  // Cell width and intrinsic text width of every cell in a column.
  const measureColumn = (cells: Locator): Promise<{ cell: number, text: number }[]> => cells.evaluateAll(els => els.map(el => {
    const range = document.createRange()
    range.selectNodeContents(el)
    return { cell: el.getBoundingClientRect().width, text: range.getBoundingClientRect().width }
  }))

  for (const column of ['.label', '.temperature-low', '.temperature-high']) {
    test(`sizes the ${column} column to its widest text`, async ({ setupCard, clockWeatherCard }) => {
      await setupCard({
        date: TODAY,
        // "Aujourd'hui" is far wider than any weekday abbreviation; -10 / 105 make wide temperatures.
        language: 'fr',
        weather: {
          temperature: 9,
          forecast_daily: [
            { ...DAILY[0], templow: -10, temperature: 105 },
            ...DAILY.slice(1),
          ],
        },
      })

      const widths = await measureColumn(clockWeatherCard.locator(`${LIST_ITEM} ${column}`))
      const widest = Math.max(...widths.map(w => w.text))
      expect(widest)
        .toBeGreaterThan(0)
      for (const { cell, text } of widths) {
        // Column is shared across rows, so every cell is as wide as the widest text ...
        expect(Math.abs(cell - widest))
          .toBeLessThan(1)
        // ... and no cell's text is clipped.
        expect(text)
          .toBeLessThanOrEqual(cell + 0.5)
      }
    })
  }

  test('keeps icons and bars vertically aligned across rows', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: TODAY,
      language: 'fr',
      weather: { temperature: 9, forecast_daily: DAILY },
    })

    for (const selector of ['clock-weather-card-icon', '.bar-track']) {
      const lefts = await clockWeatherCard.locator(`${LIST_ITEM} ${selector}`)
        .evaluateAll(els => els.map(el => el.getBoundingClientRect().left))
      expect(lefts)
        .toHaveLength(DAILY.length)
      for (const left of lefts) {
        expect(Math.abs(left - lefts[0]))
          .toBeLessThan(1)
      }
    }
  })

})

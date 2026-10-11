import type { WeatherForecast } from '../../src/types'
import { WeatherEntityFeature } from '../../src/types'
import { expect, test } from '../utils/fixtures'
import api from '../utils/ha-api'
import { hourlyForecast } from '../utils/test-utils'

test.describe('forecast_strip section', () => {
  test('labels the entry immediately before "now" as the "Now" column and sources its data from that forecast', async ({ setupCard, clockWeatherCard }) => {
    // Forecast entry at 19:00 sits just before the mocked clock (19:07). It feeds the "Now" column.
    const forecasts: WeatherForecast[] = [
      { datetime: '2025-09-14T19:00:00+00:00', condition: 'pouring', temperature: 15, precipitation_probability: 90 },
      { datetime: '2025-09-14T20:00:00+00:00', condition: 'cloudy', temperature: 17, precipitation_probability: 30 },
    ]
    await setupCard({
      date: new Date('2025-09-14T19:07:00+00:00'),
      timeZone: 'UTC',
      weather: { temperature: 30, forecast_hourly: forecasts },
    })

    const items = clockWeatherCard.locator('clock-weather-card-forecast-strip-item')
    await expect(items)
      .toHaveCount(2)
    await expect(items.nth(0)
      .locator('.time'))
      .toHaveText('Now')
    // 19:00 forecast temp (15), not the entity's 30°C.
    await expect(items.nth(0)
      .locator('.label'))
      .toHaveText('15°C')
    await expect(items.nth(0)
      .locator('.attribute'))
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

    const items = clockWeatherCard.locator('clock-weather-card-forecast-strip-item')
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

    const items = clockWeatherCard.locator('clock-weather-card-forecast-strip-item')
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

  test('widens columns for attribute values up to a cap, truncating longer ones', async ({ setupCard, clockWeatherCard }) => {
    const config = (unit: string): string => `
      sections:
        forecast_strip:
          attribute: precipitation_probability
          attribute_icon: mdi:gauge
          attribute_unit: "${unit}"
    `
    const value = clockWeatherCard.locator('clock-weather-card-forecast-strip-item .attribute-value')
      .first()
    const isTruncated = (): Promise<boolean> => value.evaluate(el => el.scrollWidth > el.clientWidth)

    await setupCard({ cardConfig: config('00.0 hPa') })
    expect(await isTruncated())
      .toBe(false)

    await setupCard({ cardConfig: config(' percent chance of rain') })
    expect(await isTruncated())
      .toBe(true)
    expect(await value.evaluate(el => getComputedStyle(el).textOverflow))
      .toBe('ellipsis')
  })

  test('rounds precipitation probabilities to the nearest 10', async ({ setupCard, clockWeatherCard }) => {
    const forecasts: WeatherForecast[] = [
      { datetime: '2025-09-14T13:00:00+00:00', condition: 'rainy', temperature: 20, precipitation_probability: 34 },
      { datetime: '2025-09-14T14:00:00+00:00', condition: 'cloudy', temperature: 19, precipitation_probability: 45 },
    ]
    await setupCard({
      date: new Date('2025-09-14T13:30:00+00:00'),
      timeZone: 'UTC',
      weather: { forecast_hourly: forecasts },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .attribute'))
      .toHaveText(['30%', '50%'])
  })

  test('renders an inline warning when the resolved entity does not advertise FORECAST_HOURLY', async ({ cardErrorMessage, setupCard, clockWeatherCard }) => {
    await setupCard({
      weather: {
        forecast_hourly: [
          { datetime: '2025-09-14T15:00:00+00:00', condition: 'sunny', temperature: 20, precipitation_probability: 0 },
        ],
        supportedFeatures: [WeatherEntityFeature.FORECAST_DAILY],
      },
    })

    const section = clockWeatherCard.locator('clock-weather-card-forecast-strip')
    await expect(section)
      .toBeVisible()
    await cardErrorMessage(section)
      .toBe('Entity "weather.mock_weather" does not support hourly forecasts')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item'))
      .toHaveCount(0)
    await expect(clockWeatherCard.locator('clock-weather-card-header'))
      .toHaveCount(1)
  })

  test('scrolls horizontally when the hours exceed the card width', async ({ setupCard, clockWeatherCard, page }) => {
    await setupCard({ expectedIcons: 20 })
    const strip = clockWeatherCard.locator('clock-weather-card-forecast-strip .strip')
    const metrics = await strip.evaluate(el => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }))
    expect(metrics.scrollWidth)
      .toBeGreaterThan(metrics.clientWidth)

    await strip.hover()
    await page.mouse.wheel(120, 0)
    await expect.poll(() => strip.evaluate(el => el.scrollLeft))
      .toBeGreaterThan(0)
  })

  test('packs hourly columns tightly (at most 58px per column for typical content)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({})

    const items = clockWeatherCard.locator('clock-weather-card-forecast-strip-item')
    // Distance between the left edges of two neighbouring non-"Now" columns (the "Now" column has no left padding).
    const second = await items.nth(1)
      .boundingBox()
    const third = await items.nth(2)
      .boundingBox()
    expect(third!.x - second!.x)
      .toBeLessThanOrEqual(58)
  })

  test('keeps the sunset column through its minute and drops it afterwards', async ({ page, setupCard, clockWeatherCard }) => {
    const now = new Date('2025-09-14T18:40:00Z')
    await setupCard({
      date: now,
      timeZone: 'UTC',
      sun: { attributes: { next_setting: '2025-09-14T18:41:00+00:00', next_rising: '2025-09-15T05:13:00+00:00' } },
      cardConfig: `
        locale: en-GB
      `,
      weather: {
        forecast_hourly: hourlyForecast(now, ['sunny', 'clear-night', 'clear-night'], () => ({ temperature: 18, precipitation_probability: 0 })),
      },
    })

    const columns = clockWeatherCard.locator('clock-weather-card-forecast-strip-item')
    const sunset = clockWeatherCard.locator('clock-weather-card-forecast-strip-item:has(.label ha-icon)')
    await expect(columns.nth(0)
      .locator('.time'))
      .toHaveText('Now')
    await expect(columns.nth(1)
      .locator('.time'))
      .toHaveText('18:41')
    await expect(columns.nth(1)
      .locator('.label ha-icon'))
      .toHaveAttribute('icon', 'mdi:arrow-down')

    await page.clock.setFixedTime(new Date('2025-09-14T18:41:00Z'))
    await page.clock.runFor('01:00')
    await expect(sunset)
      .toHaveCount(1)

    await page.clock.setFixedTime(new Date('2025-09-14T18:42:00Z'))
    await page.clock.runFor('01:00')
    await expect(sunset)
      .toHaveCount(0)
  })

  test.describe('when subscribing to the forecast fails', () => {
    test.use({ freshPage: true })

    test('retries once the weather entity updates', async ({ page, setupCard, clockWeatherCard }) => {
      // HA rejects the subscription while the weather integration is still loading, e.g. right after a restart.
      let integrationLoaded = false
      await page.routeWebSocket(/\/api\/websocket$/, (ws) => {
        const server = ws.connectToServer()
        ws.onMessage((message) => {
          const parsed = JSON.parse(message.toString()) as { id: number, type: string, forecast_type?: string }
          if (!integrationLoaded && parsed.type === 'weather/subscribe_forecast' && parsed.forecast_type === 'hourly') {
            ws.send(JSON.stringify({ id: parsed.id, type: 'result', success: false, error: { code: 'invalid_entity_id', message: 'Weather entity not found' } }))
            return
          }
          server.send(message)
        })
      })
      await setupCard({})
      const items = clockWeatherCard.locator('clock-weather-card-forecast-strip-item')
      await expect(items)
        .toHaveCount(0)

      integrationLoaded = true
      await api.setMockWeather({ temperature: 22 })

      await expect(items)
        .not.toHaveCount(0)
    })
  })
})

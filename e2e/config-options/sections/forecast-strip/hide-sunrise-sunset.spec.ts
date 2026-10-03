import type { Locator } from '@playwright/test'

import type { WeatherForecast } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'
import { hourlyForecast } from '../../../utils/test-utils'

const NOW = new Date('2025-09-14T16:30:00+00:00')
const SUN = {
  attributes: {
    next_setting: '2025-09-14T18:42:00+00:00',
    next_rising: '2025-09-15T05:13:00+00:00',
  },
}
const sunnyHours = (now: Date, count: number): WeatherForecast[] =>
  hourlyForecast(now, Array<string>(count)
    .fill('sunny'), () => ({ temperature: 20, precipitation_probability: 0 }))
const FORECAST_HOURLY = sunnyHours(NOW, 5)

const columnTimes = (strip: Locator): Promise<string[]> =>
  strip.locator('.time')
    .allTextContents()

test.describe('sections.forecast_strip.hide_sunrise_sunset', () => {
  test('inserts a sunset column at its exact time between the surrounding hours by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: NOW,
      timeZone: 'UTC',
      sun: SUN,
      cardConfig: `
        entity: weather.mock_weather
        locale: en-GB
      `,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })

    const strip = clockWeatherCard.locator('clock-weather-card-hourly-forecast .strip')
    const sunset = strip.locator('clock-weather-card-hourly-forecast-item:has(.label ha-icon)')
    await expect(sunset)
      .toHaveCount(1)
    await expect(sunset.locator('.time'))
      .toHaveText('18:42')
    await expect(sunset.locator('.label ha-icon'))
      .toHaveAttribute('icon', 'mdi:arrow-down')
    await expect(sunset.locator('.label ha-icon'))
      .toHaveAttribute('aria-label', 'Sunset')
    expect(await columnTimes(strip))
      .toEqual(['Now', '17', '18', '18:42', '19', '20'])
  })

  test('inserts a sunrise column when the next rising falls within the visible hours', async ({ setupCard, clockWeatherCard }) => {
    const date = new Date('2025-09-15T04:30:00+00:00')
    await setupCard({
      date,
      timeZone: 'UTC',
      sun: { state: 'below_horizon', ...SUN },
      cardConfig: `
        entity: weather.mock_weather
        locale: en-GB
      `,
      weather: { forecast_hourly: sunnyHours(date, 3) },
    })

    const sunrise = clockWeatherCard.locator('clock-weather-card-hourly-forecast-item:has(.label ha-icon)')
    await expect(sunrise)
      .toHaveCount(1)
    await expect(sunrise.locator('.time'))
      .toHaveText('05:13')
    await expect(sunrise.locator('.label ha-icon'))
      .toHaveAttribute('icon', 'mdi:arrow-up')
    await expect(sunrise.locator('.label ha-icon'))
      .toHaveAttribute('aria-label', 'Sunrise')
  })

  test('omits sun events after the last visible hour', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: NOW,
      sun: SUN,
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_strip:
            count: 2
      `,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(2)
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item:has(.label ha-icon)'))
      .toHaveCount(0)
  })

  test('counts sun events toward count, dropping the last hour instead', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: NOW,
      timeZone: 'UTC',
      sun: SUN,
      cardConfig: `
        entity: weather.mock_weather
        locale: en-GB
        sections:
          forecast_strip:
            count: 4
      `,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })

    const strip = clockWeatherCard.locator('clock-weather-card-hourly-forecast .strip')
    await expect(strip.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(4)
    expect(await columnTimes(strip))
      .toEqual(['Now', '17', '18', '18:42'])
  })

  test('hides sun events when hide_sunrise_sunset: true', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: NOW,
      sun: SUN,
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_strip:
            hide_sunrise_sunset: true
      `,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })

    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item'))
      .toHaveCount(FORECAST_HOURLY.length)
    await expect(clockWeatherCard.locator('clock-weather-card-hourly-forecast-item:has(.label ha-icon)'))
      .toHaveCount(0)
  })

  test('toggles sun events at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      date: NOW,
      sun: SUN,
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_strip:
            hide_sunrise_sunset: true
      `,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })
    const sunEvents = clockWeatherCard.locator('clock-weather-card-hourly-forecast-item:has(.label ha-icon)')
    await expect(sunEvents)
      .toHaveCount(0)

    await setupCard({
      date: NOW,
      sun: SUN,
      weather: { forecast_hourly: FORECAST_HOURLY },
    })

    await expect(sunEvents)
      .toHaveCount(1)
  })

  test('rejects hide_sunrise_sunset: true for a non-hourly forecast_type', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sections:
          forecast_strip:
            forecast_type: daily
            hide_sunrise_sunset: true
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.forecast_strip.hide_sunrise_sunset" requires "sections.forecast_strip.forecast_type" to be "hourly"')
  })

  test('rejects a non-boolean value', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            hide_sunrise_sunset: fals
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Config option "sections.forecast_strip.hide_sunrise_sunset" has invalid value "fals", expected true or false')
  })
})

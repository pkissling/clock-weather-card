import { expect, test } from '../../utils/fixtures'
import api from '../../utils/ha-api'

test.describe('sun_entity', () => {
  test('icon switches between day and night based on the configured sun entity state', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      sun: { state: 'above_horizon' },
      weather: { state: 'sunny' },
    })
    const daySrc = await clockWeatherCard.locator('clock-weather-card-today clock-weather-card-icon img')
      .getAttribute('src')

    await setupCard({
      sun: { state: 'below_horizon' },
      weather: { state: 'sunny' },
    })
    const nightSrc = await clockWeatherCard.locator('clock-weather-card-today clock-weather-card-icon img')
      .getAttribute('src')

    expect(daySrc)
      .toBeTruthy()
    expect(nightSrc)
      .toBeTruthy()
    expect(nightSrc).not.toBe(daySrc)
  })

  test('icon swaps live when the sun entity state changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      sun: { state: 'above_horizon' },
      weather: { state: 'sunny' },
    })
    const icon = clockWeatherCard.locator('clock-weather-card-today clock-weather-card-icon img')
    const daySrc = await icon.getAttribute('src')
    expect(daySrc)
      .toBeTruthy()

    // Push a state change directly to HA — no setupCard rebuild, no page reload.
    // The card subscribes to hass updates via WS, so the icon should swap on the fly.
    await api.setEntityState('sun.sun', 'below_horizon', { elevation: -10 })

    await expect(icon)
      .not.toHaveAttribute('src', daySrc!)
  })

  test('renders an error card when the configured sun_entity does not exist', async ({ setupCard, clockWeatherCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        entity: weather.mock_weather
        sun_entity: sun.does_not_exist
      `,
    })

    expect(await cardErrorMessage())
      .toContain('Referenced entity sun.does_not_exist does not exist')
    await expect(clockWeatherCard.locator('clock-weather-card-today'))
      .toHaveCount(0)
  })

  test('hourly forecast icons pick day/night variants per item using the sun entity attributes', async ({ setupCard, clockWeatherCard }) => {
    // Fix "now" at 12:00 UTC. Sunset is at 18:00 UTC, sunrise the following morning at 06:00 UTC.
    // We stage two forecast hours that straddle the sunset boundary.
    await setupCard({
      date: new Date('2025-09-14T12:00:00Z'),
      sun: {
        state: 'above_horizon',
        attributes: {
          next_setting: '2025-09-14T18:00:00+00:00',
          next_rising: '2025-09-15T06:00:00+00:00',
        },
      },
      weather: {
        state: 'sunny',
        forecast_hourly: [
          { datetime: '2025-09-14T12:00:00+00:00', condition: 'sunny', temperature: 24, precipitation_probability: 0 },
          { datetime: '2025-09-14T17:00:00+00:00', condition: 'sunny', temperature: 22, precipitation_probability: 0 },
          { datetime: '2025-09-14T19:00:00+00:00', condition: 'sunny', temperature: 19, precipitation_probability: 0 },
        ],
      },
    })

    const items = clockWeatherCard.locator('clock-weather-card-hourly-forecast-item')
    // "Now" (12:00) + two future forecasts (17:00 pre-sunset, 19:00 post-sunset).
    await expect(items)
      .toHaveCount(3)

    // Index 0 is "Now" (12:00 — day); indexes 1 and 2 are the future forecasts straddling sunset.
    const preSunset = await items.nth(1)
      .locator('clock-weather-card-icon img')
      .getAttribute('src')
    const postSunset = await items.nth(2)
      .locator('clock-weather-card-icon img')
      .getAttribute('src')

    expect(preSunset)
      .toBeTruthy()
    expect(postSunset)
      .toBeTruthy()
    expect(preSunset).not.toBe(postSunset)
  })
})

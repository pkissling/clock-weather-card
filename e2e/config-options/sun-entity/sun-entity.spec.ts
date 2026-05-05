import { expect, test } from '../../utils/fixtures'
import api from '../../utils/ha-api'

test.describe('sun_entity', () => {
  test('icon switches between day and night based on the configured sun entity state', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      sunState: 'above_horizon',
      weather: { state: 'sunny' },
    })
    const daySrc = await clockWeatherCard.locator('clock-weather-card-icon img')
      .getAttribute('src')

    await setupCard({
      sunState: 'below_horizon',
      weather: { state: 'sunny' },
    })
    const nightSrc = await clockWeatherCard.locator('clock-weather-card-icon img')
      .getAttribute('src')

    expect(daySrc)
      .toBeTruthy()
    expect(nightSrc)
      .toBeTruthy()
    expect(nightSrc).not.toBe(daySrc)
  })

  test('icon swaps live when the sun entity state changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      sunState: 'above_horizon',
      weather: { state: 'sunny' },
    })
    const icon = clockWeatherCard.locator('clock-weather-card-icon img')
    const daySrc = await icon.getAttribute('src')
    expect(daySrc)
      .toBeTruthy()

    // Push a state change directly to HA — no setupCard rebuild, no page reload.
    // The card subscribes to hass updates via WS, so the icon should swap on the fly.
    await api.setEntityState('sun.sun', 'below_horizon', { elevation: -10 })

    await expect(icon)
      .not.toHaveAttribute('src', daySrc!)
  })
})

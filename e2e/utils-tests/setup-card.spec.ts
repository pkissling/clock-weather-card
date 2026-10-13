import { expect, test } from '../utils/fixtures'

test.describe('setupCard', () => {
  test.use({ freshPage: true })

  test.beforeEach(async ({ page, setupCard }) => {
    let delayMs = 0
    await page.routeWebSocket(/\/api\/websocket/, ws => {
      const server = ws.connectToServer()
      server.onMessage(message => {
        setTimeout(() => ws.send(message), delayMs)
      })
    })
    // Delaying the frontend's boot would only slow the test down; the late pushes matter for follow-up calls.
    await setupCard()
    delayMs = 300
  })

  test('returns only after a follow-up config has rendered, even when HA pushes arrive late', async ({ setupCard, clockWeatherCard }) => {
    const icon = clockWeatherCard.locator('clock-weather-card-forecast-strip-item clock-weather-card-icon img')
      .first()

    const srcs: (string | null)[] = []
    for (const type of ['line', 'fill', 'line', 'fill']) {
      await setupCard({ cardConfig: `weather_icon_type: ${type}` })
      srcs.push(await icon.getAttribute('src'))
    }

    expect(srcs[0]).not.toBe(srcs[1])
    expect(srcs[0])
      .toBe(srcs[2])
    expect(srcs[1])
      .toBe(srcs[3])
  })

  test('returns only after follow-up forecasts have rendered, even when HA pushes arrive late', async ({ setupCard, clockWeatherCard }) => {
    const precip = clockWeatherCard.locator('clock-weather-card-forecast-strip-item .attribute')
      .first()

    const texts: (string | null)[] = []
    for (const probability of [10, 50, 10, 50]) {
      await setupCard({
        date: new Date('2025-09-14T13:30:00+00:00'),
        weather: {
          forecast_hourly: [
            { datetime: '2025-09-14T13:00:00+00:00', condition: 'rainy', temperature: 20, precipitation_probability: probability },
            { datetime: '2025-09-14T14:00:00+00:00', condition: 'rainy', temperature: 20, precipitation_probability: 0 },
          ],
        },
      })
      texts.push(await precip.textContent())
    }

    expect(texts)
      .toEqual(['10%', '50%', '10%', '50%'])
  })
})

test.describe('setupCard entities', () => {
  test('removes entities of the previous setup that a follow-up call does not list', async ({ setupCard, clockWeatherCard }) => {
    const hassEntity = (entityId: string): Promise<{ state?: string, displayPrecision?: number }> => clockWeatherCard.evaluate((el, id) => {
      const hass = (el as unknown as { hass: { states: Record<string, { state: string }>, entities: Record<string, { display_precision?: number }> } }).hass
      return { state: hass.states[id]?.state, displayPrecision: hass.entities[id]?.display_precision }
    }, entityId)

    await setupCard({
      entities: {
        'sensor.e2e_leftover': { state: '42' },
        'sensor.mock_sensor': { state: 1.5, attributes: { unit_of_measurement: 'W' }, displayPrecision: 2 },
      },
    })
    await expect.poll(() => hassEntity('sensor.e2e_leftover'))
      .toEqual({ state: '42' })
    await expect.poll(() => hassEntity('sensor.mock_sensor'))
      .toEqual({ state: '1.5', displayPrecision: 2 })

    await setupCard({})

    await expect.poll(() => hassEntity('sensor.e2e_leftover'))
      .toEqual({})
    await expect.poll(() => hassEntity('sensor.mock_sensor'))
      .toEqual({ state: 'unknown' })
  })
})

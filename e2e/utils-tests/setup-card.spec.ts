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
    const precip = clockWeatherCard.locator('clock-weather-card-forecast-strip-item .precipitation')
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

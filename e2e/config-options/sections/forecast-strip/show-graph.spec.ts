import type { Locator } from '@playwright/test'

import type { WeatherForecast } from '../../../../src/types'
import { expect, test } from '../../../utils/fixtures'

const graphConfig = `
  sections:
    forecast_strip:
      show_graph: true
`

const forecast = (temperatures: (number | null)[]): WeatherForecast[] => temperatures.map((temperature, i) => ({
  datetime: `2025-09-14T${String(19 + i)
    .padStart(2, '0')}:00:00+00:00`,
  condition: 'cloudy',
  temperature,
}))

// y of each column's curve at its left edge, centre and right edge, as "0,y 50,y 100,y"
const points = (strip: Locator): Promise<string[]> => strip.locator('.graph .line')
  .evaluateAll(lines => lines.map(l => {
    const n = (l.getAttribute('d') ?? '').match(/-?[\d.]+/g)!.map(Number)
    return `0,${n[1]} 50,${n[7]} 100,${n[13]}`
  }))

test.describe('sections.forecast_strip.show_graph', () => {
  test('toggles the graph at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    const graphs = clockWeatherCard.locator('clock-weather-card-forecast-strip-item .graph')
    await setupCard({ cardConfig: graphConfig })
    await expect(graphs)
      .not.toHaveCount(0)

    await setupCard({})

    await expect(graphs)
      .toHaveCount(0)
  })

  test('draws one segment per column that joins its neighbours, scaled to the visible temperatures', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: graphConfig,
      date: new Date('2025-09-14T19:07:00+00:00'),
      weather: { forecast_hourly: forecast([10, 20, 30]) },
    })

    expect(await points(clockWeatherCard))
      .toEqual(['0,90 50,90 100,70', '0,70 50,50 100,30', '0,30 50,10 100,10'])
  })

  test('bridges a missing temperature straight between its neighbours', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: graphConfig,
      date: new Date('2025-09-14T19:07:00+00:00'),
      weather: { forecast_hourly: forecast([10, null, 30]) },
    })

    expect(await points(clockWeatherCard))
      .toEqual(['0,90 50,90 100,70', '0,70 50,50 100,30', '0,30 50,10 100,10'])
  })

  test('bridges a sunset column, which has no temperature, between its neighbours', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: graphConfig,
      date: new Date('2025-09-14T19:07:00+00:00'),
      sun: { attributes: { next_setting: '2025-09-14T20:30:00+00:00' } },
      weather: { forecast_hourly: forecast([10, 20, 30]) },
    })

    const items = clockWeatherCard.locator('clock-weather-card-forecast-strip-item')
    await expect(items)
      .toHaveCount(4)
    await expect(items.nth(2)
      .locator('.label ha-icon'))
      .toHaveAttribute('icon', 'mdi:arrow-down')
    expect(await points(clockWeatherCard))
      .toEqual(['0,90 50,90 100,70', '0,70 50,50 100,40', '0,40 50,30 100,20', '0,20 50,10 100,10'])
  })

  test('colours the line with the forecast list gradient over the visible temperature range', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            show_graph: true
          forecast_list:
            gradient:
              0: "#0000ff"
              20: "#ff0000"
      `,
      date: new Date('2025-09-14T19:07:00+00:00'),
      weather: { forecast_hourly: forecast([10, 20]) },
    })

    const stops = clockWeatherCard.locator('clock-weather-card-forecast-strip-item')
      .first()
      .locator('.graph stop')
    expect(await stops.evaluateAll(s => s.map(stop => [stop.getAttribute('offset'), stop.getAttribute('stop-color')])))
      .toEqual([['0%', '#800080'], ['100%', '#ff0000']])
  })

  test('follows the high temperature in a daily strip', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            show_graph: true
            forecast_type: daily
            count: 2
      `,
      weather: {
        forecast_daily: [
          { datetime: '2025-09-14T00:00:00+00:00', condition: 'sunny', temperature: 30, templow: 0 },
          { datetime: '2025-09-15T00:00:00+00:00', condition: 'sunny', temperature: 20, templow: 10 },
        ],
      },
      date: new Date('2025-09-14T12:00:00+00:00'),
    })

    expect(await points(clockWeatherCard))
      .toEqual(['0,10 50,10 100,50', '0,50 50,90 100,90'])
  })

  test('joins the segments of adjacent columns without a gap', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: graphConfig })

    const boxes = await clockWeatherCard.locator('clock-weather-card-forecast-strip-item .graph svg')
      .evaluateAll(svgs => svgs.slice(0, 3)
        .map(s => s.getBoundingClientRect())
        .map(({ left, right }) => ({ left, right })))
    expect(boxes[1].left)
      .toBeCloseTo(boxes[0].right, 0)
    expect(boxes[2].left)
      .toBeCloseTo(boxes[1].right, 0)
  })

  test('rejects a non-boolean value', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({
      cardConfig: `
        sections:
          forecast_strip:
            show_graph: "yes"
      `,
    })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_strip.show_graph" has invalid value "yes", expected true or false')
  })
})

import { expect, test } from '../../../utils/fixtures'
import { dailyForecast, DEFAULT_DATE } from '../../../utils/test-utils'

const forecast_daily = dailyForecast(DEFAULT_DATE, ['rainy', 'sunny', 'cloudy', 'sunny'], i => ({
  templow: 10,
  temperature: 20,
  precipitation_probability: [64, 0, 4, undefined][i],
  humidity: [80, 0, 55, 40][i],
}))

const listConfig = (extra = ''): string => `
  sections:
    forecast_list:
      count: 4
${extra}`

test.describe('sections.forecast_list.secondary_attribute', () => {
  test('shows the rounded precipitation probability under the icon and hides 0 and missing values by default', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: listConfig(), weather: { forecast_daily } })

    const rows = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
    await expect(rows)
      .toHaveCount(4)
    await expect(rows.nth(0)
      .locator('.icon .secondary'))
      .toHaveText('60%')
    await expect(rows.nth(0)
      .locator('.secondary'))
      .toHaveCSS('color', 'rgb(57, 136, 239)')
    for (const i of [1, 2, 3]) {
      await expect(rows.nth(i)
        .locator('.secondary'))
        .toHaveCount(0)
    }
  })

  test('adds no column and no row height', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: listConfig('      secondary_attribute: none'), weather: { forecast_daily } })
    const rowsEl = clockWeatherCard.locator('clock-weather-card-forecast-list .rows')
    const columnsWithout = await rowsEl.evaluate(e => getComputedStyle(e).gridTemplateColumns)
    const heightWithout = await rowsEl.evaluate(e => e.getBoundingClientRect().height)

    await setupCard({ cardConfig: listConfig(), weather: { forecast_daily } })
    await expect(clockWeatherCard.locator('.secondary'))
      .toHaveCount(1)

    expect(await rowsEl.evaluate(e => getComputedStyle(e).gridTemplateColumns))
      .toBe(columnsWithout)
    expect(await rowsEl.evaluate(e => e.getBoundingClientRect().height))
      .toBe(heightWithout)
  })

  test('shows another attribute in the theme color', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: listConfig('      secondary_attribute: humidity'), weather: { forecast_daily } })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item .secondary'))
      .toHaveText(['80%', '0%', '55%', '40%'])
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item .secondary')
      .first())
      .not.toHaveAttribute('style', /color/)
  })

  test('uses the text color with monochrome icons', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: listConfig('      weather_icon_type: monochrome'), weather: { forecast_daily } })

    const value = clockWeatherCard.locator('clock-weather-card-forecast-list-item .secondary')
    await expect(value)
      .toHaveClass(/secondary--monochrome/)
    const textColor = await clockWeatherCard.locator('clock-weather-card-forecast-list-item .label')
      .first()
      .evaluate(e => getComputedStyle(e).color)
    await expect(value)
      .toHaveCSS('color', textColor)
  })

  test('switches the attribute at runtime when the config changes (no reload)', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: listConfig(), weather: { forecast_daily } })
    const first = clockWeatherCard.locator('clock-weather-card-forecast-list-item .secondary')
      .first()
    await expect(first)
      .toHaveText('60%')

    await setupCard({ cardConfig: listConfig('      secondary_attribute: humidity'), weather: { forecast_daily } })

    await expect(first)
      .toHaveText('80%')
  })

  test('is disabled with none', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ cardConfig: listConfig('      secondary_attribute: none'), weather: { forecast_daily } })

    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item'))
      .toHaveCount(4)
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item .secondary'))
      .toHaveCount(0)
  })

  test('rejects a non-string attribute', async ({ setupCard, cardErrorMessage }) => {
    await setupCard({ cardConfig: 'sections:\n  forecast_list:\n    secondary_attribute: 5' })

    await cardErrorMessage()
      .toContain('Config option "sections.forecast_list.secondary_attribute" has invalid value "5", expected a non-empty string')
  })
})

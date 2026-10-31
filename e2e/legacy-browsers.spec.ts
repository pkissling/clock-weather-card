import { expect, test } from './utils/fixtures'

// Playwright's Chromium supports every feature, so drop the card's @supports rules to render what Chrome 67 / Safari 15.4 get.
test.describe('legacy browser fallbacks', () => {
  test.use({ freshPage: true })

  test('keep the header icon, bar track, current temperature dot and list icons sized', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({
      cardConfig: `
        sections:
          header:
            weather_icon_size: 98px
          forecast_list:
            font_size: 20px
      `,
    })
    const removed = await clockWeatherCard.evaluate(el => {
      let count = 0
      for (const sheet of el.shadowRoot!.adoptedStyleSheets) {
        for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
          if (sheet.cssRules[i] instanceof CSSSupportsRule) {
            sheet.deleteRule(i)
            count++
          }
        }
      }
      return count
    })
    expect(removed)
      .toBeGreaterThan(0)

    await expect(clockWeatherCard.locator('clock-weather-card-header > clock-weather-card-icon'))
      .toHaveCSS('width', '96px')
    const item = clockWeatherCard.locator('clock-weather-card-forecast-list-item')
      .first()
    await expect(item.locator('.bar-track'))
      .toHaveCSS('background-color', 'rgba(114, 114, 114, 0.1)')
    await expect(item.locator('clock-weather-card-icon'))
      .toHaveCSS('width', '28px')

    const { dotLeft, dotWidth, expectedLeft } = await item.evaluate(el => {
      const track = el.querySelector('.bar-track')!.getBoundingClientRect()
      const dot = el.querySelector<HTMLElement>('.dot')!
      const box = dot.getBoundingClientRect()
      const percent = parseFloat(dot.style.getPropertyValue('--_dot-left'))
      return { dotLeft: box.left + box.width / 2, dotWidth: box.width, expectedLeft: track.left + track.width * percent / 100 }
    })
    expect(dotWidth)
      .toBeGreaterThan(0)
    expect(Math.abs(dotLeft - expectedLeft))
      .toBeLessThan(1)
  })
})

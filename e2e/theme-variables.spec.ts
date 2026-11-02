import { writeFileSync } from 'node:fs'
import path from 'node:path'

import { expect, test } from './utils/fixtures'
import haApi from './utils/ha-api'
import { readHaState } from './utils/ha-state'

const THEME = 'clock-weather-card-test'

test.describe('theme CSS variables', () => {
  test.beforeAll(async () => {
    writeFileSync(path.join(readHaState().tmpDir, 'themes', `${THEME}.yaml`), `
${THEME}:
  clock-weather-card-font-family: Courier New
  clock-weather-card-text-color: rgb(255, 0, 0)
  clock-weather-card-secondary-text-color: rgb(0, 128, 0)
  clock-weather-card-divider-color: rgb(0, 0, 255)
  clock-weather-card-accent-color: rgb(255, 165, 0)
`)
    await haApi.callService('frontend', 'reload_themes')
  })

  test('style the card when set in a Home Assistant theme', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({ theme: THEME, cardConfig: 'sections: { forecast_strip: { attribute: temperature } }' })

    await expect(clockWeatherCard.locator('ha-card'))
      .toHaveCSS('font-family', /Courier New/)
    await expect(clockWeatherCard.locator('clock-weather-card-time-segment'))
      .toHaveCSS('color', 'rgb(255, 0, 0)')
    const item = clockWeatherCard.locator('clock-weather-card-forecast-strip-item')
      .first()
    await expect(item.locator('.time'))
      .toHaveCSS('color', 'rgb(0, 128, 0)')
    await expect(item.locator('.attribute'))
      .toHaveCSS('color', 'rgb(255, 165, 0)')
    await expect(clockWeatherCard.locator('clock-weather-card-divider:visible')
      .first())
      .toHaveCSS('background-color', 'rgb(0, 0, 255)')
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item .dot')
      .first())
      .toHaveCSS('border-top-color', 'rgb(255, 0, 0)')
  })

  test('keep the theme colors of Home Assistant when unset', async ({ setupCard, clockWeatherCard }) => {
    await setupCard({})

    const haCard = clockWeatherCard.locator('ha-card')
    const primary = await haCard.evaluate(el => {
      const probe = document.createElement('div')
      probe.style.color = 'var(--primary-text-color)'
      el.append(probe)
      const color = getComputedStyle(probe).color
      probe.remove()
      return color
    })
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-strip-item .time')
      .first())
      .toHaveCSS('color', primary)
    await expect(clockWeatherCard.locator('clock-weather-card-forecast-list-item .dot')
      .first())
      .toHaveCSS('border-top-color', primary)
  })
})

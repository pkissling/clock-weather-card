import { expect, test } from '@playwright/test'

import { setupCardTest } from './utils/test-utils'

export const supportedWeatherStates = [
  'rainy',
  'partlycloudy',
  'cloudy',
  'clear-night',
  'fog',
  'hail',
  'lightning',
  'lightning-rainy',
  'pouring',
  'raindrop',
  'raindrops',
  'snowy',
  'snowy-rainy',
  'sunny',
  'windy',
  'windy-variant',
  'exceptional'
] as const

for (const day of ['day', 'night']) {
  for (const variant of ['fill', 'flat', 'line', 'monochrome']) {
    for (const state of supportedWeatherStates) {
      test(`${variant} ${state} ${day}`, async ({ page }) => {
        await setupCardTest(page, {
          weather: { state },
          sunState: day === 'day' ? 'above_horizon' : 'below_horizon',
          cardConfig: `weather_icon_type: ${variant}`
        })
        await expect(page.locator('clock-weather-card'))
          .toHaveScreenshot({ animations: 'disabled' })
      })
    }
  }
}

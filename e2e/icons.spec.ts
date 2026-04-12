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
  'windy-exceptional',
  'exceptional'
] as const

for (const state of supportedWeatherStates) {
  test(`line ${state} day`, async ({ page }) => {
    await setupCardTest(page, {
      weather: { state },
      sunState: 'above_horizon',
    })
    await expect(page.locator('clock-weather-card'))
      .toHaveScreenshot()
  })
}

for (const state of supportedWeatherStates) {
  test(`line ${state} night`, async ({ page }) => {
    await setupCardTest(page, {
      weather: { state },
      sunState: 'below_horizon',
    })
    await expect(page.locator('clock-weather-card'))
      .toHaveScreenshot()
  })
}

test('fill fog day', async ({ page }) => {
  await setupCardTest(page, {
    weather: { state: 'fog' },
    sunState: 'above_horizon',
    cardConfig: 'weather_icon_type: fill',
  })
  await expect(page.locator('clock-weather-card'))
    .toHaveScreenshot()
})

test('monochrome fog day', async ({ page }) => {
  await setupCardTest(page, {
    weather: { state: 'fog' },
    sunState: 'above_horizon',
    cardConfig: 'weather_icon_type: monochrome',
  })
  await expect(page.locator('clock-weather-card'))
    .toHaveScreenshot()
})

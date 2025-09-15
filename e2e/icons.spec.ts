import { test } from '@playwright/test'

import { mockClockWeatherCardState, toHaveScreenshot } from './test-utils'

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

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

for (const state of supportedWeatherStates) {
  test(`line ${state} day`, async ({ page }) => {
    await mockClockWeatherCardState(
      page, {
        weather: { state },
        sunState: 'above_horizon',
        cardConfig: { weather_icon_type: 'line' }
      },
    )
    await toHaveScreenshot(page)
  })
}

for (const state of supportedWeatherStates) {
  test(`line ${state} night`, async ({ page }) => {
    await mockClockWeatherCardState(
      page, {
        weather: { state },
        sunState: 'below_horizon',
        cardConfig: { weather_icon_type: 'line' }
      },
    )
    await toHaveScreenshot(page)
  })
}

test('fill fog day', async ({ page }) => {
  await mockClockWeatherCardState(
    page, {
      weather: { state: 'fog' },
      sunState: 'above_horizon',
      cardConfig: { weather_icon_type: 'fill' }
    },
  )
  await toHaveScreenshot(page)
})

test('monochrome fog day', async ({ page }) => {
  await mockClockWeatherCardState(
    page, {
      weather: { state: 'fog' },
      sunState: 'above_horizon',
      cardConfig: { weather_icon_type: 'monochrome' }
    },
  )
  await toHaveScreenshot(page)
})

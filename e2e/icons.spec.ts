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


const iconPermutations = (): { animated: string; daytime: string; iconVariant: string; state: typeof supportedWeatherStates[number] }[] =>
  ['animated', 'static'].flatMap(animated =>
    ['day', 'night'].flatMap(daytime =>
      ['fill', 'flat', 'line', 'monochrome'].flatMap(iconVariant =>
        supportedWeatherStates.map(state => ({ animated, daytime, iconVariant, state }))
      )
    )
  )

for (const { animated, daytime, iconVariant, state } of iconPermutations()) {
  test(`${animated} ${iconVariant} ${state} ${daytime}`, async ({ page }) => {
    await setupCardTest(page, {
      weather: { state },
      sunState: daytime === 'day' ? 'above_horizon' : 'below_horizon',
      cardConfig: `
        weather_icon_type: ${iconVariant}
        animated_icon: ${animated === 'animated' ? 'true' : 'false'}
      `
    })
    await expect(page.locator('clock-weather-card'))
      .toHaveScreenshot()
  })
}

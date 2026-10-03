import { describe, expect, it } from 'vitest'

import iconsService from '@/service/icons-service'

describe('getWeatherMdiIcon', () => {
  it.each([
    ['clear-night', 'mdi:weather-night'],
    ['sunny', 'mdi:weather-sunny'],
    ['clear', 'mdi:weather-sunny'],
    ['partlycloudy', 'mdi:weather-partly-cloudy'],
    ['rainy', 'mdi:weather-rainy'],
    ['RAINY', 'mdi:weather-rainy'],
    ['windy-exceptional', 'mdi:weather-windy'],
    ['exceptional', 'mdi:alert-circle-outline'],
    ['unknown', 'mdi:weather-cloudy-alert'],
  ])('maps %s by day to %s', (state, icon) => {
    expect(iconsService.getWeatherMdiIcon(state, false))
      .toBe(icon)
  })

  it.each([
    ['sunny', 'mdi:weather-night'],
    ['partlycloudy', 'mdi:weather-night-partly-cloudy'],
    ['rainy', 'mdi:weather-rainy'],
  ])('maps %s by night to %s', (state, icon) => {
    expect(iconsService.getWeatherMdiIcon(state, true))
      .toBe(icon)
  })
})
